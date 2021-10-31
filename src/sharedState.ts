import net, { Socket } from 'net';
import child_process from 'child_process';
import { decode as decodeMsgPack } from '@msgpack/msgpack';
import fs from 'fs';
import { REQUEST_HEAD } from './common';

export interface Config {
  executablePath: string;
}

export interface RequestItem {
  reqId: number,
  resolve: (result: any) => void,
  reject: (err: Error) => void,
}

const HEADER_SIZE = 16;

class SharedState {

  private __socketPath: string;
  public socket?: Socket;
  public reqidCounter: number;
  private __process: child_process.ChildProcess;
  private __buffer: Buffer = Buffer.from("");
  public promiseMap: Map<number, RequestItem> = new Map();

  constructor(
    public dbPath: string,
    public config: Config,
    public errorHandler: (err: Error) => void,
  ) {
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
      this.config.executablePath,
      params,
      {
        stdio: 'inherit'
      }
    );

    this.reqidCounter = Math.round(Math.random() * 0xFFFFFF);
  }

  private appendData(buf: Buffer) {
    const totalSize = this.__buffer.length + buf.length;
    const newBuffer = Buffer.alloc(totalSize);

    this.__buffer.copy(newBuffer, 0);
    buf.copy(newBuffer, this.__buffer.length);

    this.__buffer = newBuffer;
  }

  private tryParseBuffer() {
    const buf = this.__buffer;

    if (buf.length < HEADER_SIZE) {
      return;
    }

    let head = buf.subarray(0, 4);
    for (let i = 0; i < 4; i++) {
      if (head[i] !== REQUEST_HEAD[i]) {
        this.socket.destroy(new Error('response header not match'));
        this.socket = undefined;
        return;
      }
    }

    let reqId = buf.readUInt32BE(4);
    const requestContext = this.promiseMap.get(reqId);
    if (!requestContext) {
      this.socket.destroy(new Error('request id not found, ' + reqId));
      this.socket = undefined;
      this.__buffer = Buffer.alloc(0);
      return;
    }

    const msgTy = buf.readInt32BE(8);
    if (msgTy < 0) {  // error
      this.tryParseErrorMessage(requestContext);
      return;
    }

    const bodySize = buf.readUInt32BE(12);
    if (bodySize === 0) {
      requestContext.resolve(undefined);
      this.__buffer = buf.subarray(HEADER_SIZE);
      return 0;
    }

    const endSize = HEADER_SIZE + bodySize;
    if (buf.length < endSize) {  // body not enough
      return;
    }

    const body = buf.subarray(HEADER_SIZE, endSize);
    try {
      const obj = decodeMsgPack(body);
      requestContext.resolve(obj);
      this.__buffer = buf.subarray(endSize);
    } catch (err) {
      requestContext.reject(err);
      this.socket.destroy();
      this.socket = null;
    }
  }

  private tryParseErrorMessage(ctx: RequestItem) {
    const buf = this.__buffer;

    const errorMsgSize = buf.readUInt32BE(12);

    const endSize = HEADER_SIZE + errorMsgSize;
    if (buf.length < endSize) {  // body not enough
      return;
    }

    const errorMsgBuffer = buf.subarray(HEADER_SIZE, HEADER_SIZE + errorMsgSize);
    const textDecoder = new TextDecoder();
    const errString = textDecoder.decode(errorMsgBuffer);
    ctx.reject(new Error(errString));
    this.__buffer = buf.subarray(endSize);
  }

  private __handleData = (buf: Buffer) => {
    this.appendData(buf);
    this.tryParseBuffer();
  }

  public initSocketIfNotExist() {
    if (this.socket) {
      return;
    }
    this.socket = net.createConnection({
      path: this.__socketPath,
    });

    this.socket.on('error', this.errorHandler);

    this.socket.on('data', this.__handleData);

    this.socket.on('close', () => {
      this.socket = undefined;
    });
  }

  public writeUint32(num: number, cb?: (err: Error) => void): boolean {
    num = (num|0);
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, num);
    return this.socket.write(new Uint8Array(buffer), cb);
  }

  public writeInt32(num: number, cb?: (err: Error) => void): boolean {
    num = (num|0);
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setInt32(0, num);
    return this.socket.write(new Uint8Array(buffer), cb);
  }

  public kill() {
    this.__process.kill();
  }

  public dispose() {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
  }

}

export default SharedState
