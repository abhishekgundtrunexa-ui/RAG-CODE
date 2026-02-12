module.exports = {
  setupFilesAfterEnv: ["./test-setup/jest.setup.js"],
  globalSetup: "./test-setup/db/global-db-setup.js",
  globalTeardown: "./test-setup/db/global-db-tear-down.js",
};
