const { UniversalBaseRateRepository } = require("@shared-libs/db/mysql");

const setUniversalBaseRate = async (req, res) => {
  try {
    const payload = req.body;
    const { baseRateKWH, parkingRate, taxRate, discount, penalty } = payload;
    const existingCpoBaseRate = await UniversalBaseRateRepository.findOne({
      where: { isDeleted: false },
    });

    let createdOrUpdatedCpoBaseRate;

    if (existingCpoBaseRate) {
      existingCpoBaseRate.baseRateKWH =
        baseRateKWH !== undefined
          ? baseRateKWH
          : existingCpoBaseRate.baseRateKWH;

      existingCpoBaseRate.parkingRate =
        parkingRate !== undefined
          ? parkingRate
          : existingCpoBaseRate.parkingRate;

      existingCpoBaseRate.taxRate =
        taxRate !== undefined ? taxRate : existingCpoBaseRate.taxRate;

      existingCpoBaseRate.discount =
        discount !== undefined ? discount : existingCpoBaseRate.discount;

      existingCpoBaseRate.penalty =
        penalty !== undefined ? penalty : existingCpoBaseRate.penalty;

      createdOrUpdatedCpoBaseRate = await UniversalBaseRateRepository.save(
        existingCpoBaseRate
      );
    } else {
      createdOrUpdatedCpoBaseRate = await UniversalBaseRateRepository.save({
        baseRateKWH,
        parkingRate,
        taxRate,
        discount,
        penalty,
      });
    }

    res.status(200).json(createdOrUpdatedCpoBaseRate);
  } catch (error) {
    res.status(500).json({
      message:
        "An error occurred while creating/updating the universal base rate.",
      error,
    });
  }
};

module.exports = {
  setUniversalBaseRate,
};
