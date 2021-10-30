import { encode as encodeMsgPack } from '@msgpack/msgpack';
import MsgTy from './msgTy';
import SharedState from './sharedState';
import { REQUEST_HEAD } from './common';

class Collection {

  private __state: SharedState;
  private __name :string;

  public constructor(state: SharedState, name: string) {
    this.__state = state;
    this.__name = name;
  }

  private generateHandleWrite(reqId: number): (err?: Error) => void {
    return (err?: Error) => {
      if (!err) {
        return;
      }

      const item = this.__state.promiseMap.get(reqId);
      if (!item) {
        return;
      }

      this.__state.promiseMap.delete(reqId);

      item.reject(err);
    };
  }

  public find(query?: any): Promise<any[]> {
    this.__state.initSocketIfNotExist();
    return new Promise((resolve, reject) => {
      const reqId = this.__state.reqidCounter++;
      this.__state.promiseMap.set(reqId, {
        reqId,
        resolve,
        reject,
      });

      const handleWrite = this.generateHandleWrite(reqId);

      this.__state.socket.write(REQUEST_HEAD, handleWrite);

      this.__state.writeUint32(reqId, handleWrite);
      this.__state.writeInt32(MsgTy.Find, handleWrite)

      const requestObj = {
        cl: this.__name,
        query,
      };
      const pack = encodeMsgPack(requestObj);

      this.__state.socket.write(pack, handleWrite);
    });

  }

  public findOne(query: any): Promise<any> {
    this.__state.initSocketIfNotExist();
    return new Promise((resolve, reject) => {
      const reqId = this.__state.reqidCounter++;
      this.__state.promiseMap.set(reqId, {
        reqId,
        resolve,
        reject,
      });

      const handleWrite = this.generateHandleWrite(reqId);

      this.__state.socket.write(REQUEST_HEAD, handleWrite);

      this.__state.writeUint32(reqId, handleWrite);
      this.__state.writeInt32(MsgTy.FindOne, handleWrite)

      const requestObj = {
        cl: this.__name,
        query,
      };
      const pack = encodeMsgPack(requestObj);

      this.__state.socket.write(pack, handleWrite);
    })
  }

}

export default Collection;
