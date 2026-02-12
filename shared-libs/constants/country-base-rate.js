const CountryBaseRateData = {
  // FORMAT: key: countryIsoCode
  //         value: Object { baseRateKWH, parkingRate, taxRate, discount, penalty, currency, currencyName, currencySymbol }
  IN: {
    baseRateKWH: 10,
    parkingRate: 20,
    taxRate: 5,
    discount: 2,
    penalty: 0,
    currency: "INR",
    currencyName: "Indian Rupee",
    currencySymbol: "₹",
  },
  CA: {
    baseRateKWH: 0.56,
    parkingRate: 10,
    taxRate: 6,
    discount: 2,
    penalty: 0,
    currency: "CAD",
    currencyName: "Canadian Dollar",
    currencySymbol: "CAD$",
  },
  US: {
    baseRateKWH: 0.35,
    parkingRate: 5,
    taxRate: 13,
    discount: 2,
    penalty: 0,
    currency: "USD",
    currencyName: "United States Dollar",
    currencySymbol: "$",
  },
};

module.exports = { CountryBaseRateData };
