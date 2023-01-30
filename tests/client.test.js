const { PoloDbClient } = require("../dist");
const { prepareTestPath } = require("./testUtils");
const { ObjectId } = require("bson");
const { performance } = require("perf_hooks");

describe("version", function () {
  test("test version", async () => {
    const version = await PoloDbClient.version();
    expect(version).toBe("PoloDB 3.3.3");
  });
});

describe("Database", function () {
  /**
   * @type {PoloDbClient}
   */
  let client;
  beforeAll(async function () {
    const p = prepareTestPath("test.db");
    client = await PoloDbClient.createConnection(p);
  });

  afterAll(function () {
    if (client) {
      client.dispose();
    }
  });

  test("test serialize", async () => {
    const collection = client.collection("test1");
    const result = await collection.insertOne({
      name: "Vincent Chan",
      gentle: "man",
    });
    const { insertedId } = result;
    expect(insertedId).toBeInstanceOf(ObjectId);
    expect(await collection.countDocuments()).toBe(1);
    const data = await collection.findAll();
    console.log(data);
  });

  const TEST_COUNT = 1000;
  test("insert 1000 elements", async () => {
    const collection = client.collection("test2");
    const documents = [];
    for (let i = 0; i < TEST_COUNT; i++) {
      documents.push({
        _id: i,
        hello: i.toString(),
      });
    }
    const before = performance.now();
    await collection.insertMany(documents);
    console.log("cost:", performance.now() - before);
    expect(await collection.countDocuments()).toBe(TEST_COUNT);
  });

  test("find 1000 elements", async () => {
    const collection = client.collection("test2");
    for (let i = 0; i < TEST_COUNT; i++) {
      const result = await collection.findAll({
        _id: i,
      });
      expect(result.length).toBe(1);
      const first = result[0];
      expect(parseInt(first.hello, 10)).toBe(i);
    }
  });

  test("findOne 1000 elements", async () => {
    const collection = client.collection("test2");
    for (let i = 0; i < TEST_COUNT; i++) {
      const result = await collection.findOne({
        _id: i,
      });
      expect(typeof result).toBe("object");
    }
  });

  test("delete 1000 elements", async () => {
    const collection = client.collection("test2");
    for (let i = 0; i < TEST_COUNT; i++) {
      await collection.deleteOne({
        _id: i,
      });
      const result = await collection.findAll({
        _id: i,
      });
      expect(result.length).toBe(0);
    }
  });

  test("array", async () => {
    const collection = client.collection("test3");
    const arr = [];
    for (let i = 0; i < 1000; i++) {
      arr.push(i);
    }
    await collection.insertOne({
      data: arr,
    });
    const result = await collection.findAll();
    expect(result.length).toBe(1);
    const first = result[0];
    expect(Array.isArray(first.data)).toBe(true);
    for (let i = 0; i < 1000; i++) {
      expect(first.data[i]).toBe(i);
    }
  });

  test("datetime", async () => {
    const colDateTime = client.collection("test4");
    const now = new Date();
    await colDateTime.insertOne({
      created: now,
    });
    const result = await colDateTime.findAll();
    expect(result.length).toBe(1);
    const first = result[0];
    expect(first.created.getTime()).toBe(now.getTime());
  });

  test("drop collection", async () => {
    await client.collection("test3").drop();
    const collection = client.collection("test3");
    const result = await collection.findAll({
      _id: 2,
    });
    expect(result.length).toBe(0);
  });
});

describe("logic $or and $and", function () {
  /**
   * @type {PoloDbClient}
   */
  let client;
  beforeAll(async function () {
    const p = prepareTestPath("test-update.db");
    client = await PoloDbClient.createConnection(p);
  });

  afterAll(function () {
    if (client) {
      client.dispose();
    }
  });
  const suite = [
    {
      name: "test1",
      age: 10,
    },
    {
      name: "test2",
      age: 11,
    },
    {
      name: "test3",
      age: 12,
    },
    {
      name: "test3",
      age: 14,
    },
  ];

  test("test $or", async () => {
    const collection = client.collection("test");
    await collection.insertMany(suite);

    const twoItems = await collection.findAll({
      $or: [
        {
          age: 11,
        },
        {
          age: 12,
        },
      ],
    });

    expect(twoItems.length).toBe(2);
  });

  test("test $and", async () => {
    const collection = client.collection("test");
    const items = await collection.findAll({
      $and: [
        {
          name: "test2",
        },
        {
          age: 11,
        },
      ],
    });

    expect(items.length).toBe(1);
    expect(items[0].name).toBe("test2");
    expect(items[0].age).toBe(11);
  });
});
