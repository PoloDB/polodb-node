import path from 'path';
import { EventEmitter } from 'events';
import { REQUEST_HEAD } from './common';
import MsgTy from './msgTy';
import SharedState, { Config } from './sharedState';
import Collection from './colleciton';

const defaultConfig: Config = {
  executablePath: path.join(__dirname, '../bin/polodb'),
};

class PoloDbClient extends EventEmitter {

  private __state: SharedState;
  private __shuttingDown: boolean = false;

  public constructor(dbPath: string, config?: Partial<Config>) {
    super();

    const mergedConfig = {
      ...defaultConfig,
      ...config,
    };

    this.__state = new SharedState(dbPath, mergedConfig, (err) => {
      if (this.__shuttingDown) {
        this.__state.kill();
      }
      this.emit('error', err);
    });
  }

  public collection(name: string) {
    return new Collection(this.__state, name);
  }

  public dispose() {
    this.__shuttingDown = true;
    this.sendSafelyQuitMessage();
    this.__state.dispose();
  }

  private sendSafelyQuitMessage() {
    this.__state.socket.write(REQUEST_HEAD);

    const reqId = this.__state.reqidCounter++;
    this.__state.writeUint32(reqId);
    this.__state.writeInt32(MsgTy.SafelyQuit);
  }

  get config(): Config {
    return { ...this.__state.config };
  }

}

export default PoloDbClient;
