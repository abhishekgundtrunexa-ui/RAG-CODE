const { getRevenueGenerated } = require("../analytics.service");

describe("calculating revenue generated", () => {
  it("using mock payload", async () => {
    const req = {};
    req.loggedInUserData = {
      isCpo: true,
      user: {
        // make sure below cpoId is present in DB
        cpoId: "1bcd16e6-5d86-4f45-a190-a9f0512292e9",
      },
    };
    req.query = {
      startDate: null,
      endDate: null,
      duration: null,
      evseStationId: null,
      chargerId: null,
      cpoId: null,
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await getRevenueGenerated(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.any(Array));

    const responseData = res.json.mock.calls[0][0];
    responseData.forEach((entry) => {
      expect(entry).toHaveProperty("month");
      expect(entry).toHaveProperty("year");
      expect(entry).toHaveProperty("totalNetAmount");
      expect(entry).toHaveProperty("totalTax");
      expect(entry).toHaveProperty("totalDiscountedAmount");
      expect(entry).toHaveProperty("totalParkingFee");
      expect(entry).toHaveProperty("totalBaseFare");
      expect(entry).toHaveProperty("currency");
      expect(entry).toHaveProperty("currencyName");
      expect(entry).toHaveProperty("currencySymbol");
      expect(typeof entry.month).toBe("string");
      expect(typeof entry.year).toBe("number");
      expect(typeof entry.totalNetAmount).toBe("string");
      expect(typeof entry.totalTax).toBe("string");
      expect(typeof entry.totalDiscountedAmount).toBe("string");
      expect(typeof entry.totalParkingFee).toBe("string");
      expect(typeof entry.totalBaseFare).toBe("string");
    });
  });
});
