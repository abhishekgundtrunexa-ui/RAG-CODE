const cron = require("node-cron");
const { DateTime } = require("luxon");
const { LessThan, Not, In } = require("typeorm");
const {
  OcppTransactionsRepository,
  PaymentTransactionsRepository,
} = require("@shared-libs/db/mysql");
const {
  AutoCaptureLogsModel,
  OcppAllLogModel,
} = require("@shared-libs/db/mongo-db");
const {
  OcppStopTransactionQueue,
  OcppCalculateAvgChargingRateQueue,
} = require("@shared-libs/queues");
const { arrayObjStr, convertDateTimezone } = require("@shared-libs/helpers");
const { getAnalyticsFromDate } = require("@shared-libs/analytics-helper");

const AUTO_CAPTURE_INTERVAL = "*/15 * * * *"; // Runs every 15 minutes

/**
 * Schedules the Auto Capture Transactions cron job.
 */
const AutoCaptureTransactionsCron = () => {
  cron.schedule(AUTO_CAPTURE_INTERVAL, async () => {
    await autoCaptureTransactions();
  });
};

/**
 * Main function to automatically capture transactions.
 */
const autoCaptureTransactions = async () => {
  if (process.env.CGX_ENV !== "production") return; // Ensure it runs only in production

  try {
    // Get the UTC timestamp for 8 hours ago
    const dt = DateTime.utc()
      .minus({ hours: 8 })
      .toFormat("yyyy-MM-dd HH:mm:ss");

    // Fetch already processed transactions from logs to avoid duplication
    const autoCaptureLogsData = await AutoCaptureLogsModel.find();
    const processedTransactionIds = autoCaptureLogsData.map(
      ({ transactionId }) => transactionId,
    );

    // Fetch pending transactions that need processing
    const transactions = await fetchPendingTransactions(
      dt,
      processedTransactionIds,
    );

    if (transactions.length === 0) return; // Exit if no transactions found

    // Categorize transactions based on their statuses
    const categorizedTransactions = categorizeTransactions(transactions);

    // Process transactions based on categories
    await processTransactions(categorizedTransactions);

    try {
      const todayDate = DateTime.utc().toFormat("yyyy-MM-dd");
      await getAnalyticsFromDate(todayDate);

      const yesterdayDate = DateTime.utc()
        .minus({ day: 1 })
        .toFormat("yyyy-MM-dd");
      await getAnalyticsFromDate(yesterdayDate);
    } catch (error) {}
  } catch (error) {
    console.error("AutoCaptureTransactionsCron Failed:", error.message);
  }
};

/**
 * Fetches transactions that need processing.
 */
const fetchPendingTransactions = async (dt, processedTransactionIds) => {
  const commonWhere = { createdAt: LessThan(dt), purchaseOnly: false };

  // Exclude already processed transactions
  if (processedTransactionIds.length > 0) {
    commonWhere["transactionUuid"] = Not(In(processedTransactionIds));
  }

  return await OcppTransactionsRepository.find({
    where: [
      {
        ...commonWhere,
        transactionStatus: Not(In(["cancelled", "finished"])),
      },
      {
        ...commonWhere,
        transactionStatus: "finished",
        isFinished: false,
      },
    ],
    order: { createdAt: "DESC" },
  });
};

/**
 * Categorizes transactions into different processing groups..
 */
const categorizeTransactions = (transactions) => {
  let categorized = {
    toBeCancelled: [],
    toBeStoppedWithCapture: [],
    toBeStopped: [],
    toBeCaptured: [],
    autoCaptureLogsToInsert: [],
  };

  transactions.forEach((transaction) => {
    let { transactionUuid, transactionStatus, startTime, isFinished } =
      transaction;
    let logData = { transactionId: transactionUuid, before: transaction };

    // Determine action based on transaction status
    if (transactionStatus === "finished") {
      if (!startTime) {
        categorized.toBeCancelled.push(transactionUuid);
        logData.actionTaken = "Cancelled";
      } else {
        categorized.toBeStopped.push(transactionUuid);
        logData.actionTaken = "Stopped";
      }
    } else if (
      ["preauth", "authorized", "remote-started", "rfid"].includes(
        transactionStatus,
      )
    ) {
      categorized.toBeCancelled.push(transactionUuid);
      logData.actionTaken = "Cancelled";
    } else if (transactionStatus === "started") {
      if (!isFinished) {
        categorized.toBeStoppedWithCapture.push(transactionUuid);
        logData.actionTaken = "StoppedWithCapture";
      } else {
        categorized.toBeCaptured.push(transactionUuid);
        logData.actionTaken = "Captured";
      }
    }

    categorized.autoCaptureLogsToInsert.push(logData);
  });

  return categorized;
};

/**
 * Processes transactions by performing appropriate actions.
 */
const processTransactions = async (categorized) => {
  const {
    toBeCancelled,
    toBeStoppedWithCapture,
    toBeStopped,
    toBeCaptured,
    autoCaptureLogsToInsert,
  } = categorized;
  // TODO: BAKI

  // Log processed transactions
  if (autoCaptureLogsToInsert.length > 0) {
    await AutoCaptureLogsModel.insertMany(autoCaptureLogsToInsert);
  }

  // Cancel transactions if needed
  if (toBeCancelled.length > 0) {
    await cancelTransactions(toBeCancelled);
  }

  // Stop or capture transactions
  if (
    toBeStopped.length > 0 ||
    toBeStoppedWithCapture.length > 0 ||
    toBeCaptured.length > 0
  ) {
    await stopAndCaptureTransactions(
      toBeStopped,
      toBeStoppedWithCapture,
      toBeCaptured,
    );
  }
};

/**
 * Cancels transactions and updates logs.
 */
const cancelTransactions = async (transactionIds) => {
  await OcppTransactionsRepository.update(
    { transactionUuid: In(transactionIds) },
    {
      transactionStatus: "cancelled",
      endMethod: "Auto-Capture",
      remark: "Auto Captured",
    },
  );

  // Fetch updated transactions
  const cancelledTransactions = await OcppTransactionsRepository.find({
    where: { transactionUuid: In(transactionIds) },
  });

  // Update logs
  await AutoCaptureLogsModel.bulkWrite(
    cancelledTransactions.map((ct) => ({
      updateOne: {
        filter: { transactionId: ct.transactionUuid },
        update: { $set: { after: ct, status: "success" } },
      },
    })),
  );

  // Cancel associated payments
  await PaymentTransactionsRepository.update(
    { ocppTransactionId: In(transactionIds), status: "Pending" },
    { status: "Cancelled" },
  );
};

/**
 * Stops and/or captures transactions.
 */
const stopAndCaptureTransactions = async (
  toBeStopped,
  toBeStoppedWithCapture,
  toBeCaptured,
) => {
  let allTransactionIds = [
    ...toBeStopped,
    ...toBeStoppedWithCapture,
    ...toBeCaptured,
  ];

  // Fetch transactions
  let transactions = await OcppTransactionsRepository.find({
    where: { transactionUuid: In(allTransactionIds) },
  });

  let transactionMap = await arrayObjStr(transactions, "transactionUuid");
  let meterValues = await fetchMeterValues(allTransactionIds);

  // Prepare transaction update data
  let stopTransactionData = allTransactionIds.map((transactionUuid) => {
    let transaction = transactionMap[transactionUuid];
    let paymentStatus = transaction?.paymentStatus;
    let startTime = transaction?.startTime;
    let endTime = transaction?.updatedAt;

    if (meterValues[transactionUuid]) {
      endTime = meterValues[transactionUuid]?.createdAt;
    }

    const endTimeLocal = convertDateTimezone(
      DateTime.fromJSDate(endTime),
      transaction?.timezone ?? "UTC",
    );

    let meterStop =
      meterValues[transactionUuid]?.value || transaction?.meterStart;

    return {
      transactionUuid,
      meterStart: transaction?.meterStart,
      meterStop,
      startTime,
      endTime,
      endTimeLocal,
      paymentStatus,
      timezone: transaction?.timezone ?? "UTC",
      stopTransaction:
        toBeStopped.includes(transactionUuid) ||
        toBeStoppedWithCapture.includes(transactionUuid),
      makePayment:
        toBeCaptured.includes(transactionUuid) ||
        toBeStoppedWithCapture.includes(transactionUuid),
    };
  });

  await updateAndQueueStopTransactions(stopTransactionData);
};

/**
 * Fetches latest meter values for transactions.
 */
const fetchMeterValues = async (transactionIds) => {
  let meterData = await OcppAllLogModel.aggregate([
    {
      $match: {
        transactionUuid: { $in: transactionIds },
        eventName: "MeterValues",
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: { _id: "$transactionUuid", lastMeterValue: { $first: "$$ROOT" } },
    },
    { $replaceRoot: { newRoot: "$lastMeterValue" } },
    {
      $unwind: {
        path: "$ocppSchema.meterValue",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        transactionUuid: 1,
        createdAt: 1,
        value: {
          $let: {
            vars: {
              sampledValues: {
                $arrayElemAt: ["$ocppSchema.meterValue.sampledValue", 2],
              },
            },
            in: {
              $ifNull: ["$$sampledValues.value", null],
            },
          },
        },
      },
    },
  ]);

  return await arrayObjStr(meterData, "transactionUuid");
};

/**
 * Stops or Captures transactions.
 */
const updateAndQueueStopTransactions = async (transactions) => {
  for (const t of transactions) {
    try {
      await OcppTransactionsRepository.update(t.transactionUuid, {
        meterStart: t.meterStart,
        meterStop: t.meterStop,
        endTime: convertDateTimezone(DateTime.fromJSDate(t.endTime)),
        endTimeLocal: t.endTimeLocal,
        isFinished: true,
        endMethod: "Auto-Capture",
        remark: "Auto Captured",
      });

      await OcppStopTransactionQueue.add(
        {
          transactionUuid: t.transactionUuid,
          makePayment: t.makePayment,
          remoteStop: t.stopTransaction,
          isAutoCaptured: true,
        },
        { delay: 500 },
      );

      await OcppCalculateAvgChargingRateQueue.add(
        { transactionUuid: t.transactionUuid },
        { delay: 500 },
      );
    } catch (error) {
      console.error(
        `Failed to stop transaction ${t.transactionUuid}:`,
        error.message,
      );
    }
  }
};

module.exports = { AutoCaptureTransactionsCron, autoCaptureTransactions };
