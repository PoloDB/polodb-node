
enum MsgTy {
	Undefined = 0,
  Find = 1,
  FindOne = 2,
  Count = 3,
  Insert = 8,
  Update = 16,
  Delete = 32,
  CreateCollection = 64,
  Drop = 65,
  StartTransaction = 128,
  Commit,
  Rollback,
  SafelyQuit = 255,
}

export default MsgTy;
