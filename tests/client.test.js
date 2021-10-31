const { PoloDbClient } = require('../dist');

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

test('test serialize', async () => {
  const client = new PoloDbClient('/Users/duzhongchen/Workspace/polodb.js/test.db');
  await sleep(1000);
  const collection = client.collection('hello');
  try {
    await collection.insert({
      _id: 0,
      name: 'Vincent Chan',
      gentle: 'man',
    });
    expect(await collection.count()).toBe(1);
    const data = await collection.find();
    console.log(data);
  } finally {
    console.log('dispose');
    client.dispose();
  }
});
