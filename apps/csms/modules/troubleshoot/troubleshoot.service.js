const {
  OcppAllLogModel,
  TransactionHistoryViewModel,
  TransactionErrorLogsModel,
  ApiErrorLogsModel,
} = require("@shared-libs/db/mongo-db");
const {
  getChargerByIdentity,
  ObjectDAO,
  getChargerDetailsData,
  arrayObjArr,
  arrayObjStr,
} = require("@shared-libs/helpers");
const { customErrorMsg } = require("@shared-libs/constants");
const { OcppTransactionsRepository } = require("@shared-libs/db/mysql");

const formatOcppLogs = async (ocppLogs, filterOcppLogs = false) => {
  let returnData = [];

  if (ocppLogs?.length > 0) {
    try {
      ocppLogs.map((logData, idx) => {
        const lgData = logData.toJSON();

        delete lgData?.dateByTimezone;
        const lData = { ...lgData };

        let skip = false;
        if (filterOcppLogs) {
          if (lData?.eventName === "MeterValues") {
            skip = true;
            if (lData?.ocppSchema?.meterValue?.length) {
              if (lData?.ocppSchema?.meterValue[0]?.sampledValue?.length > 0) {
                if (
                  lData?.ocppSchema?.meterValue[0]?.sampledValue[0]?.context ===
                    "Transaction.Begin" ||
                  lData?.ocppSchema?.meterValue[0]?.sampledValue[0]?.context ===
                    "Transaction.End"
                ) {
                  skip = false;
                }
              }
            }
          }
        }

        if (!skip) {
          returnData[idx] = ObjectDAO(lData);
        }
        return true;
      });
    } catch (error) {}
  }

  return returnData.filter((item) => item !== null);
};

const getChargerErrorLogs = async (params) => {
  const getWhere = (vl) => {
    return [
      { method: { $regex: vl, $options: "i" } },
      { url: { $regex: vl, $options: "i" } },
      { statusCode: { $regex: vl, $options: "i" } },
      { responseBody: { $regex: vl, $options: "i" } },
      { requestBody: { $regex: vl, $options: "i" } },
      { headers: { $regex: vl, $options: "i" } },
    ];
  };

  let chargerIdWhere = [];
  let serialNumberWhere = [];
  let chargeBoxIdWhere = [];

  if (params?.chargeBoxId) {
    chargeBoxIdWhere = getWhere(params?.chargeBoxId);
  }
  if (params?.chargerId) {
    chargerIdWhere = getWhere(params?.chargerId);
  }
  if (params?.serialNumber) {
    serialNumberWhere = getWhere(params?.serialNumber);
  }

  let logs = [];
  if (
    chargeBoxIdWhere?.length > 0 ||
    chargerIdWhere?.length > 0 ||
    serialNumberWhere?.length > 0
  ) {
    logs = await ApiErrorLogsModel.find({
      $or: [...chargeBoxIdWhere, ...chargerIdWhere, ...serialNumberWhere],
    })
      .sort({ createdAt: -1 })
      .limit(50);
  }

  return logs;
};

const getTransactions = async (
  chargeBoxId,
  filterOcppLogs,
  transactionId = null,
  isMulti = false
) => {
  let transactionsWhere = [];

  if (transactionId !== null) {
    transactionsWhere = [
      { transactionUuid: transactionId, chargeBoxId },
      { chargerTransactionId: transactionId, chargeBoxId },
      { orderId: transactionId, chargeBoxId },
    ];
  } else if (isMulti) {
    transactionsWhere = [{ chargeBoxId }];
  }

  const transactions = await OcppTransactionsRepository.find({
    where: transactionsWhere,
    order: { createdAt: "DESC" },
    take: 10,
  });

  const transactionsData = arrayObjStr(transactions, "transactionUuid");

  const transactionIds = transactions.map(
    ({ transactionUuid }) => transactionUuid
  );

  const ocppLogs = await OcppAllLogModel.find(
    { transactionUuid: { $in: transactionIds } },
    null,
    { createdAt: 1 }
  );
  const ocppLogsData = arrayObjArr(ocppLogs, "transactionUuid");

  const paymentLogs = await TransactionHistoryViewModel.find(
    { transactionId: { $in: transactionIds } },
    null,
    { createdAt: 1 }
  );
  const paymentLogsData = arrayObjArr(paymentLogs, "transactionId");

  const transactionErrorLogs = await TransactionErrorLogsModel.find(
    { transactionId: { $in: transactionIds } },
    null,
    { createdAt: 1 }
  );
  const transactionErrorLogsData = arrayObjArr(
    transactionErrorLogs,
    "transactionId"
  );

  const returnData = [];
  for (const t of transactionIds) {
    returnData.push({
      transaction: ObjectDAO(transactionsData[t]),
      ocppLogs: await formatOcppLogs(ocppLogsData[t] ?? [], filterOcppLogs),
      paymentLogs: paymentLogsData[t] ?? [],
      transactionErrorLogs: transactionErrorLogsData[t] ?? [],
    });
  }

  if (isMulti) {
    return { transactions: returnData };
  } else {
    if (returnData.length > 0) {
      return returnData[0];
    } else {
      return {
        transaction: {},
        ocppLogs: [],
        paymentLogs: [],
        transactionErrorLogs: [],
      };
    }
  }
};

const getTransactionTroubleshootData = async (
  transactionId,
  chargeBoxId,
  filterOcppLogs = false
) => {
  let returnData = { code: 404, data: {} };

  const charger = await getChargerByIdentity(chargeBoxId);
  if (!charger) {
    returnData = {
      code: 404,
      data: { message: customErrorMsg.charger.CHARGER_NOT_FOUND },
    };

    return returnData;
  }

  const chargerDetails = await getChargerDetailsData(charger.id);
  if (chargerDetails?.evseStation?.cpoId) {
    delete chargerDetails?.evseStation?.cpoId;
  }
  if (chargerDetails?.evseStation?.baseRateId) {
    delete chargerDetails?.evseStation?.baseRateId;
  }
  if (chargerDetails?.cpoId) {
    delete chargerDetails?.cpoId;
  }

  chargerDetails["chargingStatus"] = charger?.chargingStatus;

  const chargerErrorLogs = await getChargerErrorLogs({
    chargeBoxId: charger.chargeBoxId,
    serialNumber: charger.serialNumber,
    chargerId: charger.id,
  });

  let isMulti = false;

  if (transactionId === "last-10") {
    isMulti = true;
  }

  const transactions = await getTransactions(
    charger.chargeBoxId,
    filterOcppLogs,
    isMulti ? null : transactionId,
    isMulti
  );

  returnData = {
    code: 200,
    data: {
      charger: ObjectDAO(chargerDetails),
      chargerErrorLogs,
      ...transactions,
    },
  };

  return returnData;
};

const getTransactionTroubleshoot = async (req, res) => {
  const { transactionId, chargeBoxId } = req.params;

  const tsData = await getTransactionTroubleshootData(
    transactionId,
    chargeBoxId,
    true
  );

  return res.status(tsData.code).json(tsData.data);
};

const getTransactionTroubleshootV2 = async (req, res) => {
  const { transactionId } = req.params;
  const response = await OcppTransactionsRepository.findOne({ where: [{ orderId: transactionId }, { transactionUuid: transactionId }], select: ["chargeBoxId"] });
  if(!response){
    return res.status(400).json("Invalid Transaction ID.");
  }

  const tsData = await getTransactionTroubleshootData(
    transactionId,
    response.chargeBoxId,
    true
  );

  return res.status(tsData.code).json(tsData.data);
};

const getTransactionDebugLogs = async (req, res) => {
  const { transactionId, chargeBoxId } = req.params;

  const transactionData = await OcppTransactionsRepository.findOne({
    where: [{ transactionUuid: transactionId }, { orderId: transactionId }],
  });

  if (!transactionData) {
    return res.status(400).json("Invalid Transaction ID.");
  }

  const charger = await getChargerByIdentity(transactionData?.chargeBoxId);

  const [
    chargerErrorLogs,
    chargerDetails,
    ocppLogs,
    paymentLogs,
    transactionErrorLogs,
  ] = await Promise.all([
    getChargerErrorLogs({
      chargeBoxId: charger.chargeBoxId,
      serialNumber: charger.serialNumber,
      chargerId: charger.id,
    }),
    getChargerDetailsData(transactionData?.chargeBoxId),

    OcppAllLogModel.find(
      { transactionUuid: transactionData?.transactionUuid },
      null,
      { createdAt: 1 }
    ),

    TransactionHistoryViewModel.find(
      { transactionId: transactionData?.transactionUuid },
      null,
      { createdAt: 1 }
    ),

    TransactionErrorLogsModel.find(
      { transactionId: transactionData?.transactionUuid },
      null,
      { createdAt: 1 }
    ),
  ]);

  chargerDetails["chargingStatus"] = charger?.chargingStatus;

  return res.status(200).json({
    charger: ObjectDAO(chargerDetails),
    chargerErrorLogs,

    transaction: transactionData,
    ocppLogs,
    paymentLogs,
    transactionErrorLogs,
  });
};

const getChargerTroubleshoot = async (req, res) => {
  const { chargeBoxId } = req.params;

  const tsData = await getTransactionTroubleshootData(
    "last-10",
    chargeBoxId,
    true
  );

  return res.status(tsData.code).json(tsData.data);
};

const getTransactionLogsTroubleshoot = async (req, res) => {
  const { transactionId, chargeBoxId } = req.params;

  const tsData = await getTransactionTroubleshootData(
    transactionId,
    chargeBoxId,
    false
  );

  if (tsData.code === 200) {
    return res.status(tsData.code).json({ ocppLogs: tsData.data.ocppLogs });
  }
  return res.status(tsData.code).json(tsData.data);
};

const getTransactionLogsTroubleshootV2 = async (req, res) => {
  const { transactionId } = req.params;

  const response = await OcppTransactionsRepository.findOne({ where: [{ orderId: transactionId }, { transactionUuid: transactionId }], select: ["chargeBoxId"] });
  if(!response){
    return res.status(400).json("Invalid Transaction ID.");
  }

  const tsData = await getTransactionTroubleshootData(
    transactionId,
    response.chargeBoxId,
    false
  );

  if (tsData.code === 200) {
    return res.status(tsData.code).json({ ocppLogs: tsData.data.ocppLogs });
  }
  return res.status(tsData.code).json(tsData.data);
};

module.exports = {
  getTransactionTroubleshoot,
  getTransactionLogsTroubleshoot,
  getChargerTroubleshoot,
  getTransactionDebugLogs,
  getTransactionTroubleshootV2,
  getTransactionLogsTroubleshootV2
};
