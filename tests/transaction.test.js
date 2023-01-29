const { PoloDbClient } = require("../dist");
const { prepareTestPath } = require("./testUtils");

describe("transaction", function () {
  /**
   * @type {PoloDbClient}
   */
  let client;
  let p;
  beforeAll(async function () {
    p = prepareTestPath("test-transaction.db");
    client = await PoloDbClient.createConnection(p);
  });

  afterAll(function () {
    if (client) {
      client.dispose();
    }
  });

  test("test commit transaction", async () => {
    await client.startTransaction();
    // let collection = client.collection("test-trans");
    // await collection.insertOne({
    //   _id: 3,
    //   name: "2333",
    // });
    await client.commit();
    client.dispose();

    client = await PoloDbClient.createConnection(p);
    collection = client.collection("test-trans");
    const result = await collection.findAll({
      name: "2333",
    });
    expect(result.length).toBe(1);
  });

  test("rollback", async () => {
    await client.createCollection("test-trans-2");
    await client.startTransaction();
    const collection = client.collection("test-trans-2");
    let result;
    result = await collection.findAll({
      name: "rollback",
    });
    expect(result.length).toBe(0);
    await collection.insertOne({
      _id: 4,
      name: "rollback",
    });
    result = await collection.findAll({
      name: "rollback",
    });
    expect(result.length).toBe(1);
    await client.rollback();
    result = await collection.findAll({
      name: "rollback",
    });
    expect(result.length).toBe(0);
  });
});

describe("abandon uncommited changes", function () {
  /**
   * @type {PoloDbClient}
   */
  let db;
  let dbPath;

  beforeAll(async function () {
    dbPath = prepareTestPath("test-transaction.db");
    db = await PoloDbClient.createConnection(dbPath);
  });

  afterAll(function () {
    if (db) {
      db.dispose();
    }
  });

  test("run", async () => {
    let collection = db.collection("test");

    const documents = []
    for (let i = 0; i < 10; i++) {
      documents.push({
        _id: i,
        hello: "world",
      })
      await collection.insertOne({
        _id: i,
        hello: "world",
      });
    }
    await collection.insertMany(documents);

    expect(await collection.countDocument()).toBe(10);

    await db.startTransaction();

    for (let i = 10; i < 20; i++) {
      await collection.insertOne({
        _id: i,
        hello: "world",
      });
    }

    db.dispose();

    db = await PoloDbClient.createConnection(dbPath);

    collection = db.collection("test");
    expect(await collection.countDocuments()).toBe(10);
  });
});
