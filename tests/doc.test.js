const fs = require('fs');
const path = require('path');
const bson = require('../dist/cjs');

test('test serialize', () => {
  const doc = {
    "avatar_utl": "https://doc.rust-lang.org/std/iter/trait.Iterator.html",
    "name": "嘻嘻哈哈",
    "group_id": "70xxx80057ba0bba964fxxx1ca3d7252fe075a8b",
    "user_id": "6500xxx139040719xxx",
    "time": 6662496067319235000n,
    "can_do_a": true,
    "can_do_b": false,
    "can_do_c": false,
    "permissions": [ 1, 2, 3 ],
  };
  const bytes = bson.serializeObject(doc);
  console.log('len: ', bytes.length);

  const expectData = fs.readFileSync(path.join(__dirname, './fixtures/serialize.bson'));
  // fs.writeFileSync(path.join(__dirname, './fixtures/serialize.2.bson'), bytes);

  expect(bytes.length).toBe(expectData.length);

  for (let i = 0; i < bytes.length; i++) {
    expect(bytes[i]).toBe(expectData[i]);
  }
})
