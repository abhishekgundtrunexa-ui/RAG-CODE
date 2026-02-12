const { DiscoverChargerLogModel } = require("@shared-libs/db/mongo-db");
const { OcppTransactionsRepository } = require("@shared-libs/db/mysql");
const { getConfigConstants } = require("@shared-libs/helpers");
const { calculatePeakHours } = require("../analytics.service");
const DiscoverChargerLogModelMockData = require("../../../jest-mock-data/DiscoverChargerLogModel.json");
const GetConfigConstantData = require("../../../jest-mock-data/GetConfigConstant.json");
const OcppTransactionsRepositoryData = require("../../../jest-mock-data/OcppTransactionModel.json");

jest.mock("@shared-libs/helpers", () => ({
  getConfigConstants: jest.fn(),
}));

jest.mock("@shared-libs/db/mongo-db", () => ({
  DiscoverChargerLogModel: {
    find: jest.fn(),
  },
}));

jest.mock("@shared-libs/db/mysql", () => ({
  OcppTransactionsRepository: {
    find: jest.fn(),
  },
}));

describe("calculatePeakHours", () => {
  it("calculating peak data with Mock payload...", async () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock all required function to isolate the testing enviroment
    DiscoverChargerLogModel.find.mockResolvedValue(
      DiscoverChargerLogModelMockData
    );
    getConfigConstants.mockResolvedValue(GetConfigConstantData);
    OcppTransactionsRepository.find.mockResolvedValue(
      OcppTransactionsRepositoryData
    );

    await calculatePeakHours(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.any(Array));

    const responseData = res.json.mock.calls[0][0];

    responseData.forEach((item, index) => {
      // Validate startHour
      expect(item.startHour).toBeGreaterThanOrEqual(0);
      expect(item.startHour).toBeLessThanOrEqual(23);

      // Validate endHour
      expect(item.endHour).toBeGreaterThanOrEqual(0);
      expect(item.endHour).toBeLessThanOrEqual(23);

      // Validate discoverCount
      expect(item.discoverCount).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(item.discoverCount)).toBe(true);

      // Validate transactionCount
      expect(item.transactionCount).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(item.transactionCount)).toBe(true);

      // Validate peakStatus
      const validPeakStatuses = ["offpeak", "peak", "standard"];
      expect(validPeakStatuses).toContain(item.peakStatus);

      // Validate rate
      expect(Number(item.rate)).not.toBeNaN();
      expect(Number(item.rate)).toBeGreaterThan(0);
      expect(Number(item.rate)).toBeLessThanOrEqual(2);
    });
  });
});
