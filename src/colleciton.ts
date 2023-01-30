import SharedState from "./sharedState";
import { Commands } from "./commands";
import type { Document } from "bson";

export interface InsertOneResult {
  insertedId: any;
}

export interface InsertManyResult {
  insertedIds: Document;
}

class Collection {
  private __state: SharedState;
  private __name: string;

  constructor(state: SharedState, name: string) {
    this.__state = state;
    this.__name = name;
  }

  findAll(filter?: any): Promise<any[]> {
    return this.__state.sendRequest({
      command: Commands.Find,
      ns: this.__name,
      multi: true,
      filter,
    });
  }

  async findOne(filter?: any): Promise<any> {
    const arr = await this.__state.sendRequest({
      command: Commands.Find,
      ns: this.__name,
      multi: true,
      filter,
    });
    return arr[0];
  }

  async insertOne(document: Document): Promise<InsertOneResult> {
    const result: InsertManyResult = await this.__state.sendRequest({
      command: Commands.Insert,
      ns: this.__name,
      documents: [document],
    });
    return {
      insertedId: result.insertedIds["0"]
    };
  }

  insertMany(documents: Document[]): Promise<InsertManyResult> {
    return this.__state.sendRequest({
      command: Commands.Insert,
      ns: this.__name,
      documents,
    });
  }

  updateOne(filter: Document, update: Document): Promise<any> {
    return this.__state.sendRequest({
      command: Commands.Update,
      ns: this.__name,
      filter,
      update,
      multi: false,
    });
  }

  updateMany(filter: Document, update: Document): Promise<any> {
    return this.__state.sendRequest({
      command: Commands.Update,
      ns: this.__name,
      filter,
      update,
      multi: true,
    });
  }

  deleteOne(filter: Document): Promise<any> {
    return this.__state.sendRequest({
      command: Commands.Delete,
      ns: this.__name,
      filter,
      multi: false,
    });
  }

  deleteMany(filter: Document): Promise<any> {
    return this.__state.sendRequest({
      command: Commands.Delete,
      ns: this.__name,
      filter,
      multi: true,
    });
  }

  countDocuments(): Promise<number> {
    return this.__state.sendRequest({
      command: Commands.CountDocuments,
      ns: this.__name,
    });
  }

  drop(): Promise<void> {
    return this.__state.sendRequest({
      command: Commands.DropCollection,
      ns: this.__name,
    });
  }
}

export default Collection;
