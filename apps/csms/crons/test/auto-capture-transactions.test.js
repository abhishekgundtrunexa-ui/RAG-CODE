const cron = require("node-cron");
const { DateTime } = require("luxon");
const {
  OcppTransactionsRepository,
  PaymentTransactionsRepository,
} = require("@shared-libs/db/mysql");
const {
  AutoCaptureLogsModel,
  OcppAllLogModel,
} = require("@shared-libs/db/mongo-db");
const { OcppStopTransactionQueue } = require("@shared-libs/queues");
const { arrayObjStr, convertDateTimezone } = require("@shared-libs/helpers");
const {
  AutoCaptureTransactionsCron,
} = require("../auto-capture-transactions.cron");

jest.mock("node-cron", () => ({ schedule: jest.fn() }));
jest.mock("luxon");
jest.mock("@shared-libs/db/mysql", () => ({
  OcppTransactionsRepository: { find: jest.fn(), update: jest.fn() },
  PaymentTransactionsRepository: { update: jest.fn() },
}));
jest.mock("@shared-libs/db/mongo-db", () => ({
  AutoCaptureLogsModel: {
    find: jest.fn(),
    insertMany: jest.fn(),
    bulkWrite: jest.fn(),
  },
  OcppAllLogModel: { aggregate: jest.fn() },
}));
jest.mock("@shared-libs/queues", () => ({
  OcppStopTransactionQueue: { add: jest.fn() },
}));
jest.mock("@shared-libs/helpers", () => ({
  arrayObjStr: jest.fn(),
  convertDateTimezone: jest.fn(),
}));

describe("AutoCaptureTransactionsCron", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CGX_ENV = "production";

    // Fix: Properly mock DateTime.utc()
    const mockDateTime = {
      minus: jest.fn().mockReturnThis(),
      toFormat: jest.fn().mockReturnValue("2024-03-17 12:00:00"),
    };
    DateTime.utc.mockReturnValue(mockDateTime);
  });

  it("should schedule the cron job", () => {
    AutoCaptureTransactionsCron();
    expect(cron.schedule).toHaveBeenCalledWith(
      "*/15 * * * *",
      expect.any(Function)
    );
  });

  it("should fetch and process transactions successfully", async () => {
    const transactions = [
      {
        transactionUuid: "tx1",
        transactionStatus: "authorized",
        startTime: new Date(),
        isFinished: false,
        timezone: "UTC",
      },
    ];
    const categorizedTransactions = {
      toBeCancelled: [],
      toBeStoppedWithCapture: ["tx1"],
      toBeStopped: [],
      toBeCaptured: [],
      autoCaptureLogsToInsert: [
        { transactionId: "tx1", actionTaken: "StoppedWithCapture" },
      ],
    };

    AutoCaptureLogsModel.find.mockResolvedValue([]);
    OcppTransactionsRepository.find.mockResolvedValue(transactions);
    AutoCaptureLogsModel.insertMany.mockResolvedValue();
    arrayObjStr.mockResolvedValue({ tx1: transactions[0] });
    convertDateTimezone.mockReturnValue("convertedTime");
    OcppAllLogModel.aggregate.mockResolvedValue([]);

    const {
      autoCaptureTransactions,
    } = require("../auto-capture-transactions.cron");
    await autoCaptureTransactions();

    expect(OcppTransactionsRepository.find).toHaveBeenCalled();
    expect(AutoCaptureLogsModel.insertMany).toHaveBeenCalledWith([
      {
        transactionId: "tx1",
        actionTaken: "StoppedWithCapture",
        before: transactions[0], // Include the full transaction object
      },
    ]);
    expect(OcppStopTransactionQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionUuid: "tx1",
        makePayment: true,
        remoteStop: true,
        isAutoCaptured: true,
      }),
      { delay: 500 }
    );
  });

  it("should exit if no transactions are found", async () => {
    AutoCaptureLogsModel.find.mockResolvedValue([]);
    OcppTransactionsRepository.find.mockResolvedValue([]);

    const {
      autoCaptureTransactions,
    } = require("../auto-capture-transactions.cron");
    await autoCaptureTransactions();

    expect(OcppTransactionsRepository.find).toHaveBeenCalled();
    expect(AutoCaptureLogsModel.insertMany).not.toHaveBeenCalled();
  });
});
