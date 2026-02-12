const { CronSchedulerModel } = require("@shared-libs/db/mongo-db");

const SeedCronSchedulers = async () => {
  try {
    const cronInDb = await CronSchedulerModel.find({});
    if (cronInDb.length === 0) {
      let cronData = [
        // {
        //   name: "Every 30 Seconds",
        //   script: "logTime",
        //   frequencyType: "interval",
        //   frequencyData: {
        //     unit: "second",
        //     value: 30,
        //   },
        // },
        // {
        //   name: "Every 5 Minutes",
        //   script: "logTime",
        //   frequencyType: "interval",
        //   frequencyData: {
        //     unit: "minute",
        //     value: 5,
        //   },
        // },
        // {
        //   name: "Every 1 Minute",
        //   script: "logTime",
        //   frequencyType: "interval",
        //   frequencyData: {
        //     unit: "minute",
        //     value: 1,
        //   },
        // },
        // {
        //   name: "Daily at 07:30 AM",
        //   script: "logTime",
        //   frequencyType: "daily",
        //   frequencyData: {
        //     value: ["07:35:00"],
        //   },
        // },
        {
          name: "weekly Wed at 09:29 AM & 09:31 AM",
          script: "logTime",
          frequencyType: "weekly",
          frequencyData: {
            week: 1,
            day: ["Mon", "Wed", "Fri"],
            value: ["09:29:00", "09:31:00"],
          },
        },
      ];

      await CronSchedulerModel.insertMany(cronData);
      console.log("Cron seeding done.");
    }
  } catch (error) {
    console.error("Error seeding cron in database:", error);
  }
};

module.exports = { SeedCronSchedulers };
