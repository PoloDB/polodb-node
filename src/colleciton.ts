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

  public async insertMany(documents: Document[]): Promise<any> {
    const pack = encode({
      command: Commands.Insert,
      ns: this.name,
      documents,
    });
    const result = await this.addonWrapper.handleMessage(pack);
    return decode(result);
  }

  public async updateOne(filter: Document, update: Document): Promise<any> {
    const pack = encode({
      command: Commands.Update,
      ns: this.name,
      filter,
      update,
      multi: false,
    });
    const result = await this.addonWrapper.handleMessage(pack);
    return decode(result);
  }

  public async updateMany(filter: Document, update: Document): Promise<any> {
    const pack = encode({
      command: Commands.Update,
      ns: this.name,
      filter,
      update,
      multi: true,
    });
    const result = await this.addonWrapper.handleMessage(pack);
    return decode(result);
  }

  public async deleteOne(filter: Document): Promise<any> {
    const pack = encode({
      command: Commands.Delete,
      ns: this.name,
      filter,
      multi: false,
    });
    const result = await this.addonWrapper.handleMessage(pack);
    return decode(result);
  }

  public async deleteMany(filter: Document): Promise<any> {
    const pack = encode({
      command: Commands.Delete,
      ns: this.name,
      filter,
      multi: true,
    });
    const result = await this.addonWrapper.handleMessage(pack);
    return decode(result);
  }

  public async countDocuments(): Promise<number> {
    const pack = encode({
      command: Commands.CountDocuments,
      ns: this.name,
    });
    const result = await this.addonWrapper.handleMessage(pack);
    return decode(result);
  }
}

export default Collection;
