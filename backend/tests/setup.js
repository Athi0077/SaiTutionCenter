const mongoose = require('mongoose');
require('dotenv').config();

process.env.NODE_ENV = 'test';
process.env.PORT = 0;

beforeAll(async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studymate_test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
}, 30000);

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
}, 30000);

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
}, 30000);
