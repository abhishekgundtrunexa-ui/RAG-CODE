const { utilisationRateCalculation } = require("../analytics.service");

describe("calculate utilization rate testing..", () => {
  it("calculating utilization rate using mock data...", async () => {
    const req = {};
    req.query = {};
    req.query.clientId = "CGXINPRM20247B9102";
    req.query.pastDays = 30;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await utilisationRateCalculation(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith(expect.any(Object));

    const responseData = res.json.mock.calls[0][0];

    expect(responseData.success).toBe(true);
    const expectedUtilizationRates = [
      "Available",
      "Idle",
      "Offline",
      "In-Use",
      "Error",
      "Maintenance",
    ];
    expectedUtilizationRates.forEach((key) => {
      expect(responseData.utilizationRates).toHaveProperty(key);
    });

    Object.values(responseData.utilizationRates).forEach((rate) => {
      expect(rate).toMatch(/^(\d+\.\d+)%$/);
    });

    const expectedStatusDurations = [
      "Available",
      "Idle",
      "Offline",
      "In-Use",
      "Error",
      "Maintenance",
      "time_unit",
    ];
    expectedStatusDurations.forEach((key) => {
      expect(responseData.statusDurations).toHaveProperty(key);
    });

    expect(responseData.statusDurations.time_unit).toBe("Minute");
    Object.entries(responseData.statusDurations).forEach(([key, value]) => {
      if (key !== "time_unit") {
        expect(parseFloat(value)).not.toBeNaN();
      }
    });

    expect(parseFloat(responseData.totalDurationInMinutes)).not.toBeNaN();

    const calculatedSumOfDurations = Object.entries(
      responseData.statusDurations
    )
      .filter(([key]) => key !== "time_unit")
      .reduce((sum, [_, value]) => sum + parseFloat(value), 0);
  });
});
