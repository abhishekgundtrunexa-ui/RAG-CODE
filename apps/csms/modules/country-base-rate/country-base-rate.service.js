const { CountryModel } = require("@shared-libs/db/mongo-db");

const setCountryBaseRate = async (req, res) => {
  try {
    const isoCode = req.params?.country;
    const baseRateData = req.body;

    if (!isoCode || !baseRateData) {
      return res
        .status(400)
        .json({ message: "Country ISO code and baseRate data are required" });
    }

    const country = await CountryModel.findOne({ isoCode });

    if (!country) {
      return res.status(404).json({ message: "Country not found" });
    }

    const updatedBaseRate = { ...country?.baseRate, ...baseRateData };

    const updatedCountry = await CountryModel.findOneAndUpdate(
      { isoCode },
      { $set: { baseRate: updatedBaseRate } },
      { new: true }
    );

    res.status(200).json({
      message: "Base rate updated successfully",
      baseRate: updatedCountry.baseRate,
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while updating the base rate.",
      error: error.message,
    });
  }
};

module.exports = {
  setCountryBaseRate,
};
