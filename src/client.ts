import path from 'path';
import net, { Socket } from 'net';
import MsgTy from './msgTy';
import { encode as encodeMsgPack, decode as decodeMsgPack } from '@msgpack/msgpack';
import { EventEmitter } from 'events';
import child_process from 'child_process';

export interface Config {
  executablePath: string;
}

const defaultConfig: Config = {
  executablePath: path.join(__dirname, '../bin/polodb'),
};

interface RequestItem {
  reqId: number,
  resolve: (result: any) => void,
  reject: (err: Error) => void,
}

const REQUEST_HEAD = new Uint8Array([0xFF, 0x00, 0xAA, 0xBB])

class PoloDbClient extends EventEmitter {

  private __socketPath: string;
  private __config: Config;
  private __process: child_process.ChildProcess;
  private __socket?: Socket;
  private __reqidCounter: number;
  private __promiseMap: Map<number, RequestItem> = new Map();

  public constructor(dbPath: string, config?: Partial<Config>) {
    super();
    this.__config = {
      ...defaultConfig,
      ...config,
    };

    const params: string[] = ['serve'];
    if (dbPath === 'memory') {
      params.push('--memory');
    } else {
      params.push('--path');
      params.push(dbPath);
    }

    this.__socketPath = `/tmp/polodb-${Math.round(Math.random() * 0xFFFFFF)}.sock`;

    params.push('--socket');
    params.push(this.__socketPath);

    this.__process = child_process.spawn(
      this.__config.executablePath,
      params,
      {
        stdio: 'inherit'
      }
    );

    this.__reqidCounter = Math.round(Math.random() * 0xFFFFFF);
  }

  private initSocketIfNotExist() {
    if (this.__socket) {
      return;
    }
    this.__socket = net.createConnection({
      path: this.__socketPath,
    });

    this.__socket.on('error', (err: Error) => {
      this.emit('error', err);
    });

    this.__socket.on('data', this.__handleData);

    this.__socket.on('close', () => {
      this.__socket = undefined;
    });
  }

  private __handleData = (buf: Buffer) => {
    console.log('receive data: ', buf.length);
    let head = buf.subarray(0, 4);
    for (let i = 0; i < 4; i++) {
      if (head[i] !== REQUEST_HEAD[i]) {
        this.__socket.destroy(new Error('response header not match'));
        this.__socket = undefined;
        return;
      }
    }

    let reqId = buf.readUInt32BE(4);
    const requestContext = this.__promiseMap.get(reqId);
    if (!requestContext) {
      this.__socket.destroy(new Error('request id not found, ' + reqId));
      this.__socket = undefined;
      return;
    }

    const msgTy = buf.readInt32BE(8);
    if (msgTy < 0) {  // error
      const textDecoder = new TextDecoder();
      const errString = textDecoder.decode(buf.subarray(12));
      requestContext.reject(new Error(errString));
      return;
    }

    try {
      const obj = decodeMsgPack(buf.subarray(12));
      requestContext.resolve(obj);
    } catch (err) {
      requestContext.reject(err);
    }
  }

  public find(collection: string, obj?: any): Promise<any> {
    this.initSocketIfNotExist();

    return new Promise((resolve, reject) => {
      const reqId = this.__reqidCounter++;
      this.__promiseMap.set(reqId, {
        reqId,
        resolve,
        reject,
      });

      const handleWrite = (err?: Error) => {
        if (!err) {
          return;
        }

        const item = this.__promiseMap.get(reqId);
        if (!item) {
          return;
        }

        this.__promiseMap.delete(reqId);

        item.reject(err);
      };

      this.__socket.write(REQUEST_HEAD, handleWrite);

      const reqIdBuffer = new ArrayBuffer(4);
      const reqIdView = new DataView(reqIdBuffer);
      reqIdView.setUint32(0, reqId);

      this.__socket.write(new Uint8Array(reqIdBuffer), handleWrite);

      const msgTyBuffer = new ArrayBuffer(4);
      const msgTyView = new DataView(msgTyBuffer);
      msgTyView.setInt32(0, MsgTy.Find);
      this.__socket.write(new Uint8Array(msgTyBuffer), handleWrite);

      const requestObj = {
        cl: collection,
        query: obj,
      };
      const pack = encodeMsgPack(requestObj);

      this.__socket.write(pack, handleWrite);

      const zero = new Uint8Array([0]);
      this.__socket.write(zero, handleWrite);
    });
  }

  public dispose() {
    if (this.__socket) {
      this.__socket.destroy();
      this.__socket = null;
    }
    this.__process.kill();
  }

  get config(): Config {
    return { ...this.__config };
  }

}

export default PoloDbClient;
