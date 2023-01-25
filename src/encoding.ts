import { type Document, serialize, deserialize } from "bson";

export function decode(buffer: Uint8Array): any {
  return deserialize(buffer);
}

export function encode(obj: Document) {
  return serialize(obj);
}
