import { decode as decodeMsgPack, encode as encodeMsgPack, ExtensionCodec } from '@msgpack/msgpack';
import ObjectId from './objectId';

const extensionCodec = new ExtensionCodec();
extensionCodec.register({
  type: 0x07,
  encode: (obj: unknown): Uint8Array | null => {
    if (obj instanceof ObjectId) {
      const buffer = new ArrayBuffer(16);
      const view = new Uint8Array(buffer);
      view.set(obj.data, 0);
      return view;
    }
    return null;
  },
  decode: (data: Uint8Array) => {
    const bytes = data.subarray(0, 12);
    return new ObjectId(bytes);
  },
});

export function decode(buffer: Uint8Array) {
  return decodeMsgPack(buffer, {
    extensionCodec,
  });
}

export function encode(obj: unknown) {
  return encodeMsgPack(obj, {
    extensionCodec,
  });
}
