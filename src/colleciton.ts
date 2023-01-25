import { encode, decode } from "./encoding";
import { Commands } from "./commands";
import type { Document } from "bson";

class Collection {
  private addonWrapper: any;
  public name: string;

  public constructor(addonWrapper: any, name: string) {
    this.addonWrapper = addonWrapper;
    this.name = name;
  }

  public async findAll(filter?: Document): Promise<any[]> {
    const pack = encode({
      command: Commands.Find,
      ns: this.name,
      multi: true,
      filter,
    });
    const data = await this.addonWrapper.handleMessage(pack);
    return decode(data);
  }

  public async findOne(filter?: Document): Promise<any> {
    const pack = encode({
      command: Commands.Find,
      ns: this.name,
      multi: false,
      filter,
    });
    const data = await this.addonWrapper.handleMessage(pack);
    return decode(data);
  }

  public async insertOne(data: Document): Promise<any> {
    const pack = encode({
      command: Commands.Insert,
      ns: this.name,
      documents: [data],
    });
    const result = await this.addonWrapper.handleMessage(pack);
    return decode(result);
  }

  // public update(query: any, update: any): Promise<number> {
  //   const request = {
  //     cl: this.__name,
  //     query,
  //     update,
  //   };
  //   const pack = encode(request);
  //   return this.__state.sendRequest(MsgTy.Update, pack);
  // }

  // public delete(query: any): Promise<any> {
  //   const requestObj = {
  //     cl: this.__name,
  //     query,
  //   };
  //   const pack = encode(requestObj);
  //   return this.__state.sendRequest(MsgTy.Delete, pack);
  // }

  // public count(): Promise<number> {
  //   const requestObj = {
  //     cl: this.__name,
  //   };
  //   const pack = encode(requestObj);
  //   return this.__state.sendRequest(MsgTy.Count, pack);
  // }
}

export default Collection;
