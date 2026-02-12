const { ConfigConstantsRepository } = require("@shared-libs/db/mysql");

const setMockDataStatus = async (payload, req, res) => {
  const { status } = payload;

  if (!status) {
    return res.status(400).json({ message: "status is required." });
  }
  if (!["0", "1"].includes(status)) {
    return res
      .status(400)
      .json({ message: "Only '0' or '1' is supported for status." });
  }

  const check = await ConfigConstantsRepository.findOne({
    where: { key: "mockDataStatus" },
  });

  if (check) {
    await ConfigConstantsRepository.update(check?.id, {
      key: "mockDataStatus",
      value: status,
    });
  } else {
    await ConfigConstantsRepository.save({
      key: "mockDataStatus",
      value: status,
    });
  }

  return res.status(200).json({ message: "Mock Data Status Saved." });
};

const getMockDataStatus = async (req, res) => {
  let returnData = await ConfigConstantsRepository.findOne({
    where: { key: "mockDataStatus" },
  });

  if (!returnData) {
    await ConfigConstantsRepository.save({
      key: "mockDataStatus",
      value: "0",
    });

    returnData = await ConfigConstantsRepository.findOne({
      where: { key: "mockDataStatus" },
    });
  }

  return res.status(200).json(returnData);
};

module.exports = {
  setMockDataStatus,
  getMockDataStatus,
};
