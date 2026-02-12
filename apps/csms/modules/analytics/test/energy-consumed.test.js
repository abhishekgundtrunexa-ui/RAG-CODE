const { getEnergyConsumed } = require("../analytics.service");

describe("Testing energy consumed service", () => {
  it("calculating energy consumed...", async () => {
    const req = {};
    req.loggedInUserData = {
      isCpo: true,
      user: {
        // make sure that cpoId is present in test DB
        cpoId: "1bcd16e6-5d86-4f45-a190-a9f0512292e9",
      },
    };
    req.query = {
      // make sure that evseStationId is present in test DB
      evseStationId: "bfd1867c-6792-4ef4-b7d1-778f3b866190",
      duration: 6,
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await getEnergyConsumed(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.any(Array));

    const responseData = res.json.mock.calls[0][0];
    responseData.forEach((entry, index) => {
      const requiredProperties = [
        "month",
        "year",
        "energyConsumed",
        "currency",
        "currencyName",
        "currencySymbol",
      ];
      requiredProperties.forEach((prop) => {
        expect(entry).toHaveProperty(prop);
      });

      // Validate property types
      expect(typeof entry.month).toBe("string");
      expect(typeof entry.year).toBe("number");
      expect(typeof entry.energyConsumed).toBe("string");
      expect(
        entry.currency === null || typeof entry.currency === "string"
      ).toBe(true);
      expect(
        entry.currencyName === null || typeof entry.currencyName === "string"
      ).toBe(true);
      expect(
        entry.currencySymbol === null ||
          typeof entry.currencySymbol === "string"
      ).toBe(true);

      if (entry.hasOwnProperty("month")) {
        const validMonths = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
        expect(validMonths).toContain(entry.month);
      }

      if (entry.hasOwnProperty("year")) {
        expect(entry.year).toBeGreaterThanOrEqual(2000);
        expect(entry.year).toBeLessThanOrEqual(new Date().getFullYear() + 1);
      }

      if (entry.hasOwnProperty("energyConsumed")) {
        expect(!isNaN(parseFloat(entry.energyConsumed))).toBe(true);
      }

      if (entry.currency !== null) {
        expect(typeof entry.currency).toBe("string");
        expect(entry.currency.length).toBeGreaterThan(0);
      }

      if (entry.currencyName !== null) {
        expect(typeof entry.currencyName).toBe("string");
        expect(entry.currencyName.length).toBeGreaterThan(0);
      }

      if (entry.currencySymbol !== null) {
        expect(typeof entry.currencySymbol).toBe("string");
        expect(entry.currencySymbol.length).toBeGreaterThan(0);
      }

      if (entry.energyConsumed !== "0.00") {
        expect(parseFloat(entry.energyConsumed)).toBeGreaterThan(0);
      }

      if (entry.month === "January" && entry.year === 2025) {
        expect(entry.currency).toBe("CAD");
        expect(entry.currencyName).toBe("Canadian Dollar");
        expect(entry.currencySymbol).toBe("CA$");
      }

      const allowedProperties = new Set(requiredProperties);
      Object.keys(entry).forEach((key) => {
        expect(allowedProperties.has(key)).toBe(true);
      });
    });
  });
});
