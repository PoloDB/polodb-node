
class ObjectId {

  private __data: Uint8Array;

  public constructor(data: Uint8Array) {
    this.__data = data;
  }

  public get data() {
    return this.__data;
  }

  public toString() {
    return Buffer.from(this.__data).toString('hex');
  }

}

export default ObjectId;
