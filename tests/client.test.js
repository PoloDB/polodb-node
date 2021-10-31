const { PoloDbClient } = require('../dist');
const fs = require('fs');

describe('Database', function () {
  beforeEach(function() {
    try {
      fs.unlinkSync('/Users/duzhongchen/Workspace/polodb.js/test.db');
      fs.unlinkSync('/Users/duzhongchen/Workspace/polodb.js/test.db.journal');
    } catch (err) {}
  });

  test('test serialize', async () => {
    let client;
    try {
      client = await PoloDbClient.createConnection('/Users/duzhongchen/Workspace/polodb.js/test.db');
      const collection = client.collection('hello');
      await collection.insert({
        _id: 0,
        name: 'Vincent Chan',
        gentle: 'man',
      });
      expect(await collection.count()).toBe(1);
      const data = await collection.find();
      console.log(data);
    } finally {
      if (client) {
        client.dispose();
      }
    }
  });

});

describe('version', function () {

  test('test version', async () => {
    const version = await PoloDbClient.version();
    expect(version).toBe('PoloDB 2.0.0');
  });

});
