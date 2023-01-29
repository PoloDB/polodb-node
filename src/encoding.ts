import { deserialize, serialize, type Document } from "bson";

export function decode(buffer: Uint8Array): Document {
  return deserialize(buffer);
}

export function encode(doc: Document) {
  return serialize(doc);
}
