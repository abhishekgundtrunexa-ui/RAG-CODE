const { RedisConfig } = require("@shared-libs/constants");
const { removeEmpty } = require("@shared-libs/helpers");
const Queue = require("bull");

const QueueConfig = {
  redis: removeEmpty(RedisConfig),
  defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
};

const CreateQueue = (name, processor) => {
  const queue = new Queue(name, QueueConfig);
  queue.process(async (job) => {
    try {
      await processor(job.data);
    } catch (error) {
      console.error(`Error processing ${name}:`, error?.message);
    }
  });
  return queue;
};

module.exports = { QueueConfig, CreateQueue };
