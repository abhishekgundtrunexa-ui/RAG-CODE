const { IpDataModel } = require("@shared-libs/db/mongo-db");
const { getLocationInfo } = require("@shared-libs/helpers");
const axios = require("axios");

const getIpInfo = async (req, res) => {
  const ip = req.params.ip;

  try {
    let returnData = await getLocationInfo(ip);

    res.status(200).json(returnData);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Invalid IP Address" });
  }
};

module.exports = {
  getIpInfo,
};
