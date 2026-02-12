const { In } = require("typeorm");
const {
  EvseStationRepository,
  ChargerRepository,
  OcppTransactionsRepository,
} = require("@shared-libs/db/mysql");
const { HandleMySqlList } = require("@shared-libs/db");
const { ObjectDAO } = require("@shared-libs/helpers");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const getInvoiceList = async (req, res) => {
  try {
    let baseQuery = { isDeleted: false };

    const loggedInUserData = req["loggedInUserData"]["user"];
    if (loggedInUserData?.cpoId) {
      let allowedChargeBoxIds = [];
      const evseStations = await EvseStationRepository.find({
        where: { cpoId: loggedInUserData.cpoId, isDeleted: false },
        select: ["id"],
      });

      const evseStationIds = evseStations.map(({ id }) => id);
      const tmpWhere = [];
      if (evseStationIds.length > 0) {
        tmpWhere.push({ evseStationId: In(evseStationIds), isDeleted: false });
      }
      tmpWhere.push({ cpoId: loggedInUserData.cpoId, isDeleted: false });

      const loggedInUserChargers = await ChargerRepository.find({
        where: tmpWhere,
        select: ["chargeBoxId"],
      });

      allowedChargeBoxIds = loggedInUserChargers.map(
        ({ chargeBoxId }) => chargeBoxId
      );

      if (allowedChargeBoxIds.length === 0) {
        return res.status(200).json({
          list: [],
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
        });
      }

      const transactionData = await OcppTransactionsRepository.find({
        where: { chargeBoxId: In(allowedChargeBoxIds), isDeleted: false },
        select: ["transactionUuid"],
      });

      const transactionUuids = transactionData.map(
        ({ transactionUuid }) => transactionUuid
      );

      baseQuery["transactionId"] = {
        custom: true,
        value: `in("${transactionUuids.join('", "')}")`,
      };
    }

    const listParams = {
      entityName: "ChargingInvoice",
      baseQuery,
      req,
    };

    const listResponse = await HandleMySqlList(listParams);

    if (listResponse.list && listResponse.list.length > 0) {
      const newList = listResponse.list.map((invoice) => {
        return ObjectDAO(invoice);
      });
      listResponse.list = newList;
    }

    res.status(200).json(listResponse);
  } catch (error) {
    console.error("Error fetching CPO Role list:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getCpoInvoiceById = async (invoiceId, req, res) => {
  try {
    let baseQuery = { isDeleted: false, id: invoiceId };

    const loggedInUserData = req["loggedInUserData"]["user"];
    if (loggedInUserData?.cpoId) {
      let allowedChargeBoxIds = [];
      const evseStations = await EvseStationRepository.find({
        where: { cpoId: loggedInUserData.cpoId, isDeleted: false },
        select: ["id"],
      });

      const evseStationIds = evseStations.map(({ id }) => id);
      const tmpWhere = [];
      if (evseStationIds.length > 0) {
        tmpWhere.push({ evseStationId: In(evseStationIds), isDeleted: false });
      }
      tmpWhere.push({ cpoId: loggedInUserData.cpoId, isDeleted: false });

      const loggedInUserChargers = await ChargerRepository.find({
        where: tmpWhere,
        select: ["chargeBoxId"],
      });

      allowedChargeBoxIds = loggedInUserChargers.map(
        ({ chargeBoxId }) => chargeBoxId
      );

      if (allowedChargeBoxIds.length === 0) {
        return res.status(200).json({
          list: [],
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
        });
      }

      const transactionData = await OcppTransactionsRepository.find({
        where: { chargeBoxId: In(allowedChargeBoxIds), isDeleted: false },
        select: ["transactionUuid"],
      });

      const transactionUuids = transactionData.map(
        ({ transactionUuid }) => transactionUuid
      );

      baseQuery["transactionId"] = {
        custom: true,
        value: `in("${transactionUuids.join('", "')}")`,
      };
    }

    const listParams = {
      entityName: "ChargingInvoice",
      baseQuery,
      req,
    };

    const listResponse = await HandleMySqlList(listParams);

    if (listResponse.list[0]) {
      res.status(200).json(ObjectDAO(listResponse.list[0]));
    } else {
      res.status(404).json({ message: "Invoice Not Found." });
    }
  } catch (error) {
    console.error("Error fetching CPO Role list:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getInvoiceList,
  getCpoInvoiceById,
};
