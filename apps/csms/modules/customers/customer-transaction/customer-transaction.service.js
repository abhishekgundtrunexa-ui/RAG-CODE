const { ObjectDAO, arrayObjStr } = require("@shared-libs/helpers");
const {
  OcppTransactionsRepository,
  EvseStationRepository,
} = require("@shared-libs/db/mysql");
const { HandleMySqlList } = require("@shared-libs/db");
const { In } = require("typeorm");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const getTransactionById = async (transactionId, customerId) => {
  let returnData = {
    code: 400,
    data: { message: "Transaction Not Found." },
  };

  const transaction = await OcppTransactionsRepository.findOne({
    where: [
      { transactionUuid: transactionId, customerId },
      { orderId: transactionId, customerId },
    ],
  });

  if (transaction?.evseStationId) {
    const evseStation = await EvseStationRepository.findOne({
      where: { id: transaction?.evseStationId },
      select: ["name", "id"],
    });

    const { startTime, endTime } = transaction;
    let sessionTime = null;

    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (!isNaN(start) && !isNaN(end)) {
        const diffMs = end - start;
        const totalSeconds = Math.floor(diffMs / 1000);

        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
          2,
          "0",
        );
        const seconds = String(totalSeconds % 60).padStart(2, "0");
        sessionTime = `${hours}:${minutes}:${seconds}`;
      }
    }
    transaction["sessionTime"] = sessionTime;
    transaction["evseStationName"] = evseStation?.name ?? "-";

    transaction["endMethod"] = transaction?.endMethod ?? "-";
    transaction["remark"] = transaction?.remark ?? "-";
    transaction["paymentProvider"] = transaction?.paymentProvider ?? "-";
    transaction["paymentType"] = transaction?.paymentType ?? "-";

    const returnTransaction = ObjectDAO(transaction);

    returnData = {
      code: 200,
      data: returnTransaction,
    };
  }

  return returnData;
};

const getCustomerTransactionById = async (req, res) => {
  const loggedInUser = req.loggedInUserData;

  const customerId = loggedInUser?.customer?.id;

  if (!customerId) {
    return res.status(400).json({ message: `Customer is not logged-in.` });
  }

  let transaction_id = req.params.transaction_id;

  const { code, data } = await getTransactionById(transaction_id, customerId);

  return res.status(code).json(data);
};

const getCustomerCurrentTransaction = async (req, res) => {
  const loggedInUser = req.loggedInUserData;

  const customerId = loggedInUser?.customer?.id;

  if (!customerId) {
    return res.status(400).json({
      message: `Customer is not logged-in.`,
    });
  }

  try {
    const transaction = await OcppTransactionsRepository.findOne({
      where: { customerId, transactionStatus: "started" },
      order: { createdAt: "DESC" },
    });

    if (transaction?.transactionUuid) {
      const { code, data } = await getTransactionById(
        transaction?.transactionUuid,
        customerId,
      );

      return res.status(code).json(data);
    }
  } catch (error) {}

  return res.status(400).json({ message: "No Ongoing Transaction Found." });
};

const getCustomerTransactions = async (req, res) => {
  const loggedInUser = req.loggedInUserData;

  const customerId = loggedInUser?.customer?.id;

  if (!customerId) {
    return res.status(400).json({
      message: `Customer is not logged-in.`,
    });
  }

  let baseQuery = { isDeleted: false, customerId };

  const listParams = {
    entityName: "OcppTransactions",
    baseQuery,
    req,
  };
  const chargerListResponse = await HandleMySqlList(listParams);

  if (chargerListResponse.list && chargerListResponse.list.length > 0) {
    const evseStationIds = chargerListResponse.list.map(
      ({ evseStationId }) => evseStationId,
    );
    const evseStations = await EvseStationRepository.find({
      where: { id: In(evseStationIds) },
      select: ["name", "id"],
    });

    const evseStationIdData = arrayObjStr(evseStations, "id", "name");

    const newList = chargerListResponse.list.map((transaction) => {
      const { startTime, endTime } = transaction;
      let sessionTime = null;

      if (startTime && endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (!isNaN(start) && !isNaN(end)) {
          const diffMs = end - start;
          const totalSeconds = Math.floor(diffMs / 1000);

          const hours = String(Math.floor(totalSeconds / 3600)).padStart(
            2,
            "0",
          );
          const minutes = String(
            Math.floor((totalSeconds % 3600) / 60),
          ).padStart(2, "0");
          const seconds = String(totalSeconds % 60).padStart(2, "0");
          sessionTime = `${hours}:${minutes}:${seconds}`;
        }
      }
      transaction["sessionTime"] = sessionTime;
      transaction["evseStationName"] =
        evseStationIdData[transaction.evseStationId] ?? "-";

      transaction["endMethod"] = transaction?.endMethod ?? "-";
      transaction["remark"] = transaction?.remark ?? "-";
      transaction["paymentProvider"] = transaction?.paymentProvider ?? "-";
      transaction["paymentType"] = transaction?.paymentType ?? "-";

      return ObjectDAO(transaction);
    });

    chargerListResponse.list = newList;
  }

  return res.status(200).json(chargerListResponse);
};

module.exports = {
  getCustomerTransactions,
  getCustomerTransactionById,
  getCustomerCurrentTransaction,
};
