import path from 'path';
import { EventEmitter } from 'events';
import { REQUEST_HEAD } from './common';
import MsgTy from './msgTy';
import SharedState, { Config } from './sharedState';
import Collection from './colleciton';
import child_process from 'child_process';

const defaultConfig: Config = {
  executablePath: path.join(__dirname, '../bin/polodb'),
};

class PoloDbClient extends EventEmitter {

  private __state: SharedState;
  private __shuttingDown: boolean = false;

  public static version(config?: Partial<Config>): Promise<string> {
    const mergedConfig = {
      ...defaultConfig,
      ...config,
    };

    const params: string[] = ['--version'];

    return new Promise((resolve, reject) => {
      const process = child_process.spawn(
        mergedConfig.executablePath,
        params,
        {
          stdio: ['pipe']
        }
      );

      let stdOutBuffer = Buffer.alloc(0);

      process.stdout.on('data', (chunk: Buffer) => {
        const newBuffer = Buffer.alloc(stdOutBuffer.length + chunk.length);
        stdOutBuffer.copy(newBuffer, 0);
        chunk.copy(newBuffer, stdOutBuffer.length);
        stdOutBuffer = newBuffer;
      });

      process.on('error', (err: Error) => {
        reject(err);
      });

      process.stdout.on('close', () => {
        const decoder = new TextDecoder();
        let content = decoder.decode(stdOutBuffer);
        content = content.replace('\n', '');
        resolve(content)
      });
    });
  }

  public static async createConnection(dbPath: string, config?: Partial<Config>): Promise<PoloDbClient> {
    const client = new PoloDbClient(dbPath, config);

    await client.start();

    return client;
  }

  private constructor(dbPath: string, config?: Partial<Config>) {
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

  private start(): Promise<void> {
    return this.__state.start();
  }

  public collection(name: string) {
    return new Collection(this.__state, name);
  }

  public dispose() {
    this.__shuttingDown = true;
    this.sendSafelyQuitMessageAsync().finally(() => {
      this.__state.dispose();
    });
  }

  private sendSafelyQuitMessageAsync(): Promise<any> {
    return new Promise((resolve, reject) => {
      const reqId = this.__state.reqidCounter++;
      this.__state.promiseMap.set(reqId, {
        reqId,
        resolve,
        reject,
      });
      this.__state.socket.write(REQUEST_HEAD);

      this.__state.writeUint32(reqId);
      this.__state.writeInt32(MsgTy.SafelyQuit);
    });
  }

  get config(): Config {
    return { ...this.__state.config };
  }

}

export default PoloDbClient;
