const connectDB = require("./db/global-db-setup");
const closeDB = require("./db/global-db-tear-down");

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await closeDB();
});
