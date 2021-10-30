const { PoloDbClient } = require('../dist');

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

test('test serialize', async () => {
  const client = new PoloDbClient('/Users/duzhongchen/Workspace/polodb.js/test.db');
  await sleep(1000);
  await client.find('hello');
  client.dispose();
});
