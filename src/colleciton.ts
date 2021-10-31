import { encode } from './encoding';
import MsgTy from './msgTy';
import SharedState from './sharedState';

class Collection {

  private __state: SharedState;
  private __name :string;

  public constructor(state: SharedState, name: string) {
    this.__state = state;
    this.__name = name;
  }

  public find(query?: any): Promise<any[]> {
    const requestObj = {
      cl: this.__name,
      query,
    };
    const pack = encode(requestObj);
    return this.__state.sendRequest(MsgTy.Find, pack);
  }

  public findOne(query: any): Promise<any> {
    const requestObj = {
      cl: this.__name,
      query,
    };
    const pack = encode(requestObj);
    return this.__state.sendRequest(MsgTy.FindOne, pack);
  }

  public insert(data: any): Promise<any> {
    const requestObj = {
      cl: this.__name,
      data,
    };
    const pack = encode(requestObj);
    return this.__state.sendRequest(MsgTy.Insert, pack);
  }

  public update(query: any, update: any): Promise<number> {
    const request = {
      cl: this.__name,
      query,
      update
    };
    const pack = encode(request);
    return this.__state.sendRequest(MsgTy.Update, pack);
  }

  public delete(query: any): Promise<any> {
    const requestObj = {
      cl: this.__name,
      query,
    };
    const pack = encode(requestObj);
    return this.__state.sendRequest(MsgTy.Delete, pack);
  }

  public count(): Promise<number> {
    const requestObj = {
      cl: this.__name,
    };
    const pack = encode(requestObj);
    return this.__state.sendRequest(MsgTy.Count, pack);
  }

}

export default Collection;
