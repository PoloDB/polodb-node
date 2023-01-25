import { type Document, serialize, deserialize } from "bson";

export function decode(buffer: Uint8Array) {
  return deserialize(buffer);
}

export function encode(obj: Document) {
  return serialize(obj);
}
