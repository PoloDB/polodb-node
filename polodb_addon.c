#include <node_api.h>
#include <stdlib.h>
#include <stdio.h>
#include "headers/polodb.h"

#define NAPI_CALL(env, call)                                      \
  do {                                                            \
    napi_status status = (call);                                  \
    if (status != napi_ok) {                                      \
      const napi_extended_error_info* error_info = NULL;          \
      napi_get_last_error_info((env), &error_info);               \
      const char* err_message = error_info->error_message;        \
      bool is_pending;                                            \
      napi_is_exception_pending((env), &is_pending);              \
      if (!is_pending) {                                          \
        const char* message = (err_message == NULL)               \
            ? "empty error message"                               \
            : err_message;                                        \
        napi_throw_error((env), NULL, message);                   \
        return NULL;                                              \
      }                                                           \
    }                                                             \
  } while(0)

static void db_finalize(napi_env env, void* finalize_data, void* finalize_hint) {
  Database* db = (Database*)finalize_data;
  PLDB_close(db);
}

static napi_value
polodb_ctor(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value this_arg;
  napi_value argv[1];
  napi_status st = napi_get_cb_info(env, info, &argc, argv, &this_arg, NULL);
  if (st != napi_ok) {
    return NULL;
  }

  size_t str_len = 0;
  napi_value result = NULL;
  char* buf = NULL;
  Database* db = NULL;
  PLDBError* db_err = NULL;

  st = napi_get_value_string_utf8(env, argv[0], NULL, 0, &str_len);
  if (st != napi_ok) {
    goto clean;
  }

  buf = malloc(str_len + 1);
  buf[str_len] = 0;

  st = napi_get_value_string_utf8(env, argv[0], buf, str_len + 1, NULL);
  if (st != napi_ok) {
    goto clean;
  }

  db_err = PLDB_open(buf, &db);
  if (db_err != NULL) {
    napi_throw_error(env, NULL, db_err->message);
    // TODO: throw error
    goto clean;
  }

  st = napi_create_external(env, db, db_finalize, NULL, &result);
  if (st != napi_ok) {
    goto clean;
  }

  st = napi_set_named_property(env, this_arg, "__internal", result);
  if (st != napi_ok) {
    goto clean;
  }

clean:
  if (buf != NULL) {
    free(buf);
    buf = NULL;
  }
  if (db_err != NULL) {
    PLDB_free_error(db_err);
  }
  // Do something useful.
  return NULL;
}

static napi_value
polodb_handle_message(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value argv[1];
  napi_value this_arg;
  napi_value internal;
  napi_status st = napi_get_cb_info(env, info, &argc, argv, &this_arg, NULL);
  if (st != napi_ok) {
    return NULL;
  }

  st = napi_get_named_property(env, this_arg, "__internal", &internal);
  if (st != napi_ok) {
    return NULL;
  }

  Database* db = NULL;
  PLDBError* db_err = NULL;
  st = napi_get_value_external(env, internal, (void**)&db);
  if (st != napi_ok) {
    return NULL;
  }

  void* data = NULL;
  size_t data_len = 0;

  st = napi_get_buffer_info(env, argv[0], NULL, &data_len);
  if (st != napi_ok) {
    goto clean;
  }

  data = malloc(data_len);
  st = napi_get_buffer_info(env, argv[0], &data, &data_len);
  if (st != napi_ok) {
    goto clean;
  }

  unsigned char* result_data = NULL;
  uint64_t result_size;
  napi_value result = NULL;
  db_err = PLDB_handle_message(db, (unsigned char*)data, data_len, &result_data, &result_size);

  if (db_err != NULL) {
    napi_throw_error(env, NULL, db_err->message);
    // TODO: throw error
    goto clean;
  }

  st = napi_create_buffer_copy(env, result_size, result_data, NULL, &result);
  if (st != napi_ok) {
    goto clean;
  }

clean:
  if (data != NULL) {
    free(data);
    data = NULL;
  }
  if (db_err != NULL) {
    PLDB_free_error(db_err);
  }
  if (result_data != NULL) {
    PLDB_free_result(result_data);
  }

  return result;
}

typedef struct {
  napi_env env;
  napi_deferred deferred;
} MessageData ;

void polodb_async_message_handler(PLDBError* err, const unsigned char* result_data, uint64_t result_size, void* data) {
  MessageData* raw_data = (MessageData*)data;
  if (err != NULL) {
    napi_reject_deferred(raw_data->env, raw_data->deferred, NULL);

    PLDB_free_error(err);
    free(raw_data);
    return;
  }

  napi_resolve_deferred(raw_data->env, raw_data->deferred, NULL);

  PLDB_free_result(result_data);
  free(raw_data);
}

static napi_value
polodb_handle_message_async(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value argv[1];
  napi_value this_arg;
  napi_value internal;
  napi_status st = napi_get_cb_info(env, info, &argc, argv, &this_arg, NULL);
  if (st != napi_ok) {
    return NULL;
  }

  st = napi_get_named_property(env, this_arg, "__internal", &internal);
  if (st != napi_ok) {
    return NULL;
  }

  Database* db = NULL;
  st = napi_get_value_external(env, internal, (void**)&db);
  if (st != napi_ok) {
    return NULL;
  }

  void* data = NULL;
  size_t data_len = 0;

  st = napi_get_buffer_info(env, argv[0], NULL, &data_len);
  if (st != napi_ok) {
    goto clean;
  }

  data = malloc(data_len);
  st = napi_get_buffer_info(env, argv[0], &data, &data_len);
  if (st != napi_ok) {
    goto clean;
  }

  napi_value promise = NULL;
  napi_deferred deferred = NULL;
  st = napi_create_promise(env, &deferred, &promise);
  if (st != napi_ok) {
    goto clean;
  }

  MessageData* raw_data = (MessageData*)malloc(sizeof(MessageData));
  raw_data->env = env;
  raw_data->deferred = deferred;

  PLDB_handle_message_async(db, (unsigned char*)data, data_len, polodb_async_message_handler, raw_data);

clean:
  if (data != NULL) {
    free(data);
    data = NULL;
  }

  return promise;
}


#define BUFFER_SIZE 512

static napi_value
polodb_version(napi_env env, napi_callback_info info) {
  static char buffer[BUFFER_SIZE];
  napi_value result = NULL;

  unsigned int size = PLDB_version(buffer, BUFFER_SIZE);
  napi_create_string_utf8(env, buffer, size, &result);

  return result;
}

#define DECLARE_NAPI_METHOD(name, func)                          \
  { name, 0, func, 0, 0, 0, napi_default, 0 }

static napi_property_descriptor polodb_properties[] = {
  DECLARE_NAPI_METHOD("handleMessageSync", polodb_handle_message),
  DECLARE_NAPI_METHOD("handleMessage", polodb_handle_message_async),
};

#define LENGTH_OF(ARR) (sizeof(ARR) / sizeof(ARR[0]))

napi_value create_addon(napi_env env) {
  napi_value result;
  NAPI_CALL(env, napi_create_object(env, &result));

  napi_value cls;
  NAPI_CALL(env, napi_define_class(
    env,
    "PoloDB",
    NAPI_AUTO_LENGTH,
    polodb_ctor,
    NULL,
    LENGTH_OF(polodb_properties),
    polodb_properties,
    &cls
  ));

  NAPI_CALL(env, napi_set_named_property(
    env,
    result,
    "PoloDB",
    cls
  ));

  napi_value exported_function;
  NAPI_CALL(env, napi_create_function(env,
    "version",
    NAPI_AUTO_LENGTH,
    polodb_version,
    NULL,
    &exported_function
  ));

  NAPI_CALL(env, napi_set_named_property(
    env,
    result,
    "version",
    exported_function
  ));

  return result;
}

NAPI_MODULE_INIT() {
  // This function body is expected to return a `napi_value`.
  // The variables `napi_env env` and `napi_value exports` may be used within
  // the body, as they are provided by the definition of `NAPI_MODULE_INIT()`.
  return create_addon(env);
}
