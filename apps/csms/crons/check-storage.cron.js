const cron = require("node-cron");
const os = require("os");
const checkDiskSpace = require("check-disk-space").default;

const CheckStorageCron = () => {
  cron.schedule("0 2 * * *", async () => {
    // await checkAndCleanStorage();
  });
};

const checkAndCleanStorage = async () => {
  try {
    const diskPath = "/"; // root partition on Ubuntu

    const { free, size } = await checkDiskSpace(diskPath);
    const freeGB = (free / 1024 ** 3).toFixed(2);
    const totalGB = (size / 1024 ** 3).toFixed(2);
    console.log(`💽 Disk Space: ${freeGB} GB free / ${totalGB} GB total`);

    const memoryUsage = {
      totalMemory: `${(os.totalmem() / 1024 ** 3).toFixed(2)} GB`,
      freeMemory: `${(os.freemem() / 1024 ** 3).toFixed(2)} GB`,
      usedMemory: `${((os.totalmem() - os.freemem()) / 1024 ** 3).toFixed(
        2
      )} GB`,
      memoryUsagePercentage: `${(
        (1 - os.freemem() / os.totalmem()) *
        100
      ).toFixed(2)}%`,
    };

    console.log(`💽 memoryUsage: `, memoryUsage);
  } catch (err) {
    console.error("❌ Error checking disk space:", err.message);
  }
};

module.exports = { CheckStorageCron, checkAndCleanStorage };
