const cron = require("node-cron");
const { DateTime } = require("luxon");
const {
  CronSchedulerModel,
} = require("@shared-libs/db/mongo-db/models/cron-scheduler/cron-scheduler.model");
const taskFunctions = require("./auto-cron.tasks");

const AutoCronSchedulerCron = () => {
  cron.schedule("*/30 * * * * *", async () => {
    await autoCronScheduler();
  });
};

const autoCronScheduler = async () => {
  try {
    const now = DateTime.utc().startOf("second"); // Normalize to full second

    const jobs = await CronSchedulerModel.find({ isActive: true });

    for (const job of jobs) {
      const { frequencyType, frequencyData, lastRun, script, name } = job;
      const taskFn = taskFunctions[script];

      if (!taskFn) {
        console.warn(`Task function not found: ${script}`);
        continue;
      }

      if (!shouldRunNow(frequencyType, frequencyData, lastRun, now)) {
        continue;
      }

      try {
        // console.log(`Running job: ${name}`);
        await taskFn();
        await CronSchedulerModel.findByIdAndUpdate(job._id, {
          lastRun: now.toJSDate(),
        });
      } catch (err) {
        console.error(`Error running job ${name}:`, err);
      }
    }
  } catch (error) {
    console.log("AutoCronSchedulerCron Failed: ", error?.message);
  }
};

const shouldRunNow = (type, data, lastRun, now) => {
  const last = lastRun ? DateTime.fromJSDate(lastRun).toUTC() : null;

  switch (type) {
    case "interval": {
      const { unit, value } = data;

      if (unit === "second") {
        return now.second % value === 0;
      }

      if (unit === "minute") {
        return now.minute % value === 0 && now.second === 0;
      }

      if (unit === "hour") {
        return now.hour % value === 0 && now.minute === 0 && now.second === 0;
      }

      return false;
    }

    case "daily": {
      const times = data.value || [];
      return times.some((time) => {
        const [hour, minute, second] = time.split(":").map(Number);
        const target = now.set({ hour, minute, second, millisecond: 0 });
        return now.equals(target) && (!last || last < target);
      });
    }

    case "weekly": {
      const currentWeekday = now.toFormat("ccc");
      if (!data.day.includes(currentWeekday)) return false;

      const times = data.value || [];
      const weekGap = data.week || 1;

      return times.some((time) => {
        const [hour, minute, second] = time.split(":").map(Number);
        const target = now.set({ hour, minute, second, millisecond: 0 });

        if (!last) {
          return now.equals(target); // Allow exact match for first-time run
        }

        // Only block execution if we've already run this specific time recently
        if (target <= last) return false;

        const weeksSinceLastRun = Math.floor(now.diff(last, "weeks").weeks);
        return now.equals(target) && weeksSinceLastRun >= weekGap;
      });
    }

    case "monthly": {
      if (!last) return true;

      const monthsSinceLastRun = Math.floor(now.diff(last, "months").months);
      if (monthsSinceLastRun < (data.month || 1)) return false;

      if (now.day !== data.day) return false;

      const times = data.value || [];
      return times.some((time) => {
        const [hour, minute, second] = time.split(":").map(Number);
        const target = now.set({ hour, minute, second, millisecond: 0 });
        return now.equals(target) && last < target;
      });
    }

    default:
      return false;
  }
};

module.exports = { AutoCronSchedulerCron };
