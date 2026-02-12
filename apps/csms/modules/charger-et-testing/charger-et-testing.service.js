const { customErrorMsg } = require("@shared-libs/constants");
const {
  ChargerEtTestingRepository,
  ChargerEtTestingTransactionsRepository,
} = require("@shared-libs/db/mysql");
const { getChargerByIdentity } = require("@shared-libs/helpers");

const set = async (payload, req, res) => {
  try {
    const {
      chargeBoxId,
      testCaseId,
      preAuthAmount,
      purchaseAmount,
      purchaseOnly,
    } = payload;

    const charger = await getChargerByIdentity(chargeBoxId, {}, true);
    if (!charger) {
      return res
        .status(404)
        .send({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    const etTestingData = await ChargerEtTestingRepository.findOne({
      where: { chargeBoxId },
    });

    const addData = {
      chargeBoxId,
      testCaseId,
      preAuthAmount,
      purchaseAmount,
      purchaseOnly,
      country: charger?.country,
      timezone: charger?.timezone,
      createdAtLocal: charger?.jsLocalDateTime,
    };

    if (!etTestingData) {
      await ChargerEtTestingRepository.save(addData);
    } else {
      await ChargerEtTestingRepository.update(etTestingData.id, addData);
    }

    const createdEtTestingData = await ChargerEtTestingRepository.findOne({
      where: { chargeBoxId },
    });

    res.status(200).json(createdEtTestingData);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const reset = async (payload, req, res) => {
  try {
    const { chargeBoxId } = payload;

    const charger = await getChargerByIdentity(chargeBoxId);
    if (!charger) {
      return res
        .status(404)
        .send({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    const etTestingData = await ChargerEtTestingRepository.findOne({
      where: { chargeBoxId },
    });

    if (!etTestingData) {
      return res
        .status(404)
        .send({ message: "No ET Testing data found for this charger." });
    }

    await ChargerEtTestingRepository.delete({ chargeBoxId });

    res.status(200).json({ deleted: true });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getTransactions = async (req, res) => {
  try {
    const chargeBoxId = req?.params?.chargeBoxId;

    const charger = await getChargerByIdentity(chargeBoxId, {}, true);
    if (!charger) {
      return res
        .status(404)
        .send({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    const etTestingTransactions =
      await ChargerEtTestingTransactionsRepository.findOne({
        where: { chargeBoxId },
      });

    if (!etTestingTransactions) {
      return res
        .status(404)
        .send({ message: "No ET Testing transactions found." });
    }

    res.status(200).json({ deleted: true });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  set,
  reset,
  getTransactions,
};
