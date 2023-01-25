import path from "path";
import { EventEmitter } from "events";
import Collection from "./colleciton";
import os from "os";
import { encode } from "./encoding";

const nativeAddon: any = require("../build/Release/polodb");

class PoloDbClient extends EventEmitter {
  private addonWrapper: any;

  // public static version(config?: Partial<Config>): Promise<string> {
  //   const mergedConfig = {
  //     ...defaultConfig,
  //     ...config,
  //   };

  //   const params: string[] = ["--version"];

  //   return new Promise((resolve, reject) => {
  //     const process = child_process.spawn(mergedConfig.executablePath, params, {
  //       stdio: ["pipe"],
  //     });

  //     let stdOutBuffer = Buffer.alloc(0);

  //     process.stdout.on("data", (chunk: Buffer) => {
  //       const newBuffer = Buffer.alloc(stdOutBuffer.length + chunk.length);
  //       stdOutBuffer.copy(newBuffer, 0);
  //       chunk.copy(newBuffer, stdOutBuffer.length);
  //       stdOutBuffer = newBuffer;
  //     });

  //     process.on("error", (err: Error) => {
  //       reject(err);
  //     });

  //     process.stdout.on("close", () => {
  //       const decoder = new TextDecoder();
  //       let content = decoder.decode(stdOutBuffer);
  //       content = content.replace("\n", "");
  //       resolve(content);
  //     });
  //   });
  // }

  // public static async createConnection(
  //   dbPath: string,
  //   config?: Partial<Config>
  // ): Promise<PoloDbClient> {
  //   const client = new PoloDbClient(dbPath, config);

  //   await client.start();

  //   return client;
  // }

  constructor(dbPath: string) {
    super();
    this.addonWrapper = new nativeAddon.PoloDB(dbPath);
  }

  // public startTransaction(ty?: TransactionType): Promise<void> {
  //   if (typeof ty === "undefined") {
  //     ty = TransactionType.Auto;
  //   }
  //   return this.__state.sendRequest(MsgTy.StartTransaction, pack);
  // }

  // public commit(): Promise<void> {
  //   return this.writeEmptyBodyWithType(MsgTy.Commit);
  // }

  // public rollback(): Promise<void> {
  //   return this.writeEmptyBodyWithType(MsgTy.Rollback);
  // }

  // private writeEmptyBodyWithType(ty: MsgTy): Promise<void> {
  //   return this.__state.sendRequest(ty);
  // }

  // private start(): Promise<void> {
  //   return this.__state.start();
  // }

  public collection(name: string) {
    return new Collection(this.addonWrapper, name);
  }

  // public async createCollection(name: string): Promise<Collection> {
  //   const pack = encode({ name });
  //   await this.__state.sendRequest(MsgTy.CreateCollection, pack);
  //   return this.collection(name);
  // }

  // public dispose() {
  //   this.__shuttingDown = true;
  //   this.__state.dispose();
  // }

  // get config(): Config {
  //   return { ...this.__state.config };
  // }
}

export default PoloDbClient;
