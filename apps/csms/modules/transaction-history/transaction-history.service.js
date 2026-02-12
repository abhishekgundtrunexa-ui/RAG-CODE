const { In } = require("typeorm");
const {
  TransactionHistoryViewModel,
  PreauthLogsModel,
  PreauthCompleteLogsModel,
} = require("@shared-libs/db/mongo-db");
const {
  ChargerViewRepository,
  PaymentTransactionsRepository,
  OcppTransactionsRepository,
  ChargingInvoiceRepository,
  ChargerRepository,
  CpoRepository,
} = require("@shared-libs/db/mysql");
const { HandleMySqlList } = require("@shared-libs/db");
const { arrayObjStr, getUtcIsoStr } = require("@shared-libs/helpers");
const { customErrorMsg } = require("@shared-libs/constants");

const getTransactionList = async (req, res) => {
  try {
    const limit = Number(req.query?.limit) || 10;
    const page = Number(req.query?.page) || 0;
    const skip = limit * page;
    let filter = req.query?.filter ? JSON.parse(req.query.filter) : {};
    let dateFrom = filter?.dateFrom ? new Date(filter.dateFrom) : null;
    let paymentStatus = filter?.paymentStatus ? filter?.paymentStatus : null;
    let sort = filter?.sort ? filter.sort : "desc";
    if (dateFrom && isNaN(dateFrom.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    const pipeline = [];

    // Apply date filter if dateFrom is available
    if (dateFrom) {
      pipeline.push({
        $match: {
          createdAt: { $gte: dateFrom },
        },
      });
    }
    if (paymentStatus) {
      pipeline.push({
        $match: {
          "response.transactionInfo.paymentStatus": paymentStatus,
        },
      });
    }
    // Count total grouped documents
    const countResult = await TransactionHistoryViewModel.aggregate([
      ...pipeline,
      { $group: { _id: "$transactionId" } },
      { $count: "totalDocs" },
    ]);

    pipeline.push(
      {
        $group: {
          _id: "$transactionId",
          data: { $push: "$$ROOT" },
        },
      },
      { $sort: { createdAt: sort == "asc" ? 1 : -1 } },
      { $skip: skip },
      { $limit: limit }
    );

    const totalCount = countResult.length > 0 ? countResult[0].totalDocs : 0;

    // Fetch paginated transactions
    const listResponse = await TransactionHistoryViewModel.aggregate(pipeline);

    // Process transactions
    const finalTransactionsPromises = await listResponse.map(
      async (session) => {
        let sessionData = {};

        session.data?.forEach((transaction) => {
          const transactionInfo = {
            sessionId: session._id,
            chargeBoxId: transaction.request?.chargerInfo?.chargeboxId,
            transactionType: transaction.type,
            amount: transaction.request?.sessionInfo?.totalAmount,
            currencySymbol:
              transaction?.response?.transactionInfo?.currencySymbol,
            pan: transaction?.providerResponse?.response?.receipt?.MaskedPan,
            result: transaction?.response?.transactionInfo?.paymentStatus,
            transactionDate: transaction?.response?.transactionInfo?.timestamp,
          };
          if (transaction.type === "Capture") {
            transactionInfo["transactionType"] == "Capture";
            transactionInfo["result"] =
              transactionInfo["result"] == "authorized" ? "success" : "failed";
            sessionData = transactionInfo;
            return sessionData;
          }
          sessionData = transactionInfo;
        });
        const chargerData = await ChargerRepository.findOne({
          where: {
            chargeBoxId: sessionData["chargeBoxId"],
          },
          select: ["cpoId"],
        });
        const cpoData = await CpoRepository.findOne({
          where: {
            id: chargerData?.cpoId,
          },
          select: ["name"],
        });
        sessionData["cpoName"] = cpoData["name"];
        return sessionData;
      }
    );
    const finalTransactions = await Promise.all(finalTransactionsPromises);

    // Prepare response
    const response = {
      list: sortByTransactionDate(finalTransactions, sort),
      currentPage: page == 0 ? 1 : page,
      totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
      totalCount,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getTransactionListNew = async (req, res) => {
  try {
    let baseQuery = { isDeleted: false };
    const { payment_status, orderId } = req.query; // NEW: Added orderId to the request query
    const loggedInUserData = req.loggedInUserData;

    const { isPartner, isPartnerTeam } = req?.loggedInUserData;

    let ocppTransactionWhere = [];
    if (orderId) {
      ocppTransactionWhere = [{ orderId }, { chargeBoxId: orderId }];
    }

    if (isPartner || isPartnerTeam) {
      let { chargeBoxIds = [], contractIds = [] } = req?.allowedIds;

      if (contractIds.length === 0) {
        return res.status(200).json({
          list: [],
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
        });
      } else {
        ocppTransactionWhere = [
          {
            contractId: In(contractIds),
            ...(orderId && { orderId }),
          },
          {
            contractId: In(contractIds),
            ...(orderId && { chargeBoxId: orderId }),
          },
        ];
      }

      if (chargeBoxIds.length === 0) {
        return res.status(200).json({
          list: [],
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
        });
      }

      baseQuery["chargeBoxId"] = {
        custom: true,
        value: `in("${chargeBoxIds.join('", "')}")`,
      };
    } else if (loggedInUserData.isCpo) {
      baseQuery["cpoId"] = loggedInUserData.user.cpoId;
    }

    if (ocppTransactionWhere?.length > 0) {
      const ocppTransactions = await OcppTransactionsRepository.find({
        where: ocppTransactionWhere,
        select: ["transactionUuid"],
      });

      const ocppTransactionIds = ocppTransactions.map((t) => t.transactionUuid);

      if (ocppTransactionIds.length === 0) {
        return res.status(200).json({
          list: [],
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
        });
      }

      baseQuery["ocppTransactionId"] = {
        custom: true,
        value: `in("${ocppTransactionIds.join('", "')}")`,
      };
    }

    if (payment_status == "Authorized") {
      baseQuery["ALL_FIELDS"] = {
        custom: true,
        value: `entity.preauthStatus='Authorized' AND entity.preauthCompleteStatus IS NULL AND entity.purchaseStatus IS NULL`,
      };
    } else if (payment_status == "Unauthorized") {
      baseQuery["ALL_FIELDS"] = {
        custom: true,
        value: `entity.preauthStatus='Unauthorized' AND entity.preauthCompleteStatus IS NULL AND entity.purchaseStatus IS NULL`,
      };
    } else if (payment_status == "Success") {
      baseQuery["ALL_FIELDS"] = {
        custom: true,
        value: `entity.preauthCompleteStatus='Approved'`,
      };
    } else if (payment_status == "Failed") {
      baseQuery["ALL_FIELDS"] = {
        custom: true,
        value: `entity.preauthCompleteStatus='Rejected'`,
      };
    }

    const params = {
      entityName: "PaymentTransactions",
      baseQuery,
      req,
    };

    const listResponse = await HandleMySqlList(params);
    if (listResponse && listResponse.list.length > 0) {
      const ocppTransactionIds = listResponse.list.map(
        ({ ocppTransactionId }) => ocppTransactionId
      );
      const cpoIds = listResponse.list.map(({ cpoId }) => cpoId);

      const [
        ocppTransactionData,
        transactionReceiptData,
        cpoData,
        preAuthData,
        captureData,
      ] = await Promise.all([
        OcppTransactionsRepository.find({
          where: { transactionUuid: In(ocppTransactionIds) },
        }),
        ChargingInvoiceRepository.find({
          where: { transactionId: In(ocppTransactionIds) },
        }),
        CpoRepository.find({
          where: { id: In(cpoIds) },
        }),
        PreauthLogsModel.find({
          transactionId: { $in: ocppTransactionIds },
        }).lean(),
        PreauthCompleteLogsModel.find({
          transactionId: { $in: ocppTransactionIds },
        }).lean(),
      ]);

      const [
        ocppTransactionIdData,
        transactionReceiptIdData,
        cpoIdData,
        preAuthIdData,
        captureIdData,
      ] = await Promise.all([
        arrayObjStr(ocppTransactionData, "transactionUuid"),
        arrayObjStr(transactionReceiptData, "transactionId"),
        arrayObjStr(cpoData, "id", "name"),
        arrayObjStr(preAuthData, "transactionId"),
        arrayObjStr(captureData, "transactionId"),
      ]);

      const finalTransactions = await Promise.all(
        listResponse.list.map(async (transaction) => {
          const cpoName = cpoIdData[transaction.cpoId] ?? "-";

          const tnxReceiptData =
            transactionReceiptIdData[transaction.ocppTransactionId] ?? null;
          const ocppTnxData =
            ocppTransactionIdData[transaction.ocppTransactionId] ?? null;

          const chargeBoxId = ocppTnxData["chargeBoxId"] ?? "-";
          const orderId = ocppTnxData["orderId"] ?? "-";
          const invoiceNumber = tnxReceiptData?.invoiceNumber ?? "-";

          const sessionId = transaction.ocppTransactionId;

          const preAuthData =
            preAuthIdData[transaction.ocppTransactionId] ?? null;
          const captureData =
            captureIdData[transaction.ocppTransactionId] ?? null;

          let preAuthCardNo = "-";

          if (preAuthData) {
            preAuthCardNo =
              preAuthData?.providerResponse?.response?.receipt?.MaskedPan ??
              "-";

            if (preAuthData?.request?.cardInfo?.maskedPan) {
              preAuthCardNo =
                preAuthData?.request?.cardInfo?.maskedPan?.replace(/C/g, "*");
            }
          }

          const returnData = {
            sessionId,
            orderId,
            chargeBoxId,
            cpoName,
            pan: transaction?.hashedPan,

            invoiceNumber,

            transactionDate: ocppTnxData?.createdAt,
            transactionDateLocal: ocppTnxData?.createdAtLocal,
            paymentProvider: ocppTnxData?.paymentProvider,
            endMethod: ocppTnxData?.endMethod,
            currency: ocppTnxData?.currency,
            currencyName: ocppTnxData?.currencyName,
            currencySymbol: ocppTnxData?.currencySymbol,
            invoicePdfUrl: ocppTnxData?.invoicePdfUrl,
            tax: ocppTnxData?.tax,
            taxRate: ocppTnxData?.taxRate,
            taxableAmount: ocppTnxData?.taxableAmount,
            baseFare: ocppTnxData?.baseFare,
            discount: ocppTnxData?.discount,
            discountedAmount: ocppTnxData?.discountedAmount,
            paymentMessage: ocppTnxData?.paymentMessage,
            paymentStatus: ocppTnxData?.paymentStatus,
            effectiveBaseRate: ocppTnxData?.effectiveBaseRate,
            grossAmount: ocppTnxData?.grossAmount,
            netAmount: ocppTnxData?.netAmount,

            preAuthTransactionId: transaction?.preauthRefId,
            preAuthAmount: transaction?.preauthAmount,
            preAuthCardNo,
            preAuthCardType: preAuthData?.request?.cardInfo?.cardType,

            captureTransactionId: transaction?.preauthCompleteRefId,
          };

          if (preAuthData) {
            returnData["paymentMessage"] =
              preAuthData?.response?.transactionInfo?.paymentStatusMessage;
            returnData["paymentStatus"] =
              preAuthData?.response?.transactionInfo?.paymentStatus;
          }

          if (captureData) {
            returnData["paymentMessage"] =
              captureData?.response?.transactionInfo?.paymentStatusMessage;
            returnData["paymentStatus"] =
              captureData?.response?.transactionInfo?.paymentStatus;
          }

          returnData["paymentStatus"] = "Failed";
          if (
            transaction?.preauthStatus == "Authorized" &&
            transaction?.preauthCompleteStatus == null &&
            transaction?.purchaseStatus == null
          ) {
            returnData["paymentStatus"] = "Authorized";
          } else if (
            transaction?.preauthStatus == "Unauthorized" &&
            transaction?.preauthCompleteStatus == null &&
            transaction?.purchaseStatus == null
          ) {
            returnData["paymentStatus"] = "Unauthorized";
          } else if (transaction?.preauthCompleteStatus == "Approved") {
            returnData["paymentStatus"] = "Success";
          }

          return returnData;

          if (captureData) {
            let captureCardNo =
              captureData?.providerResponse?.response?.receipt?.MaskedPan ??
              "-";

            if (captureData?.request?.cardInfo?.maskedPan) {
              captureCardNo =
                captureData?.request?.cardInfo?.maskedPan?.replace(/C/g, "*");
            }

            if (captureCardNo === "-") {
              if (
                captureData?.response?.transactionInfo?.paymentStatus ===
                "success"
              ) {
                captureCardNo = preAuthCardNo;
              }
            }

            return {
              sessionId,
              orderId,
              chargeBoxId,
              cpoName,
              transactionType: captureData.type,
              amount: captureData.request?.sessionInfo?.totalAmount,
              currencySymbol:
                captureData?.response?.transactionInfo?.currencySymbol,
              pan: transaction?.hashedPan,
              result:
                captureData?.response?.transactionInfo?.paymentStatus ===
                "success"
                  ? "Success"
                  : "Failed",
              transactionDate: getUtcIsoStr(
                captureData?.response?.transactionInfo?.timestamp
              ),
              transactionDateLocal: getUtcIsoStr(
                captureData?.response?.transactionInfo?.timestampLocal
              ),
              timezone: captureData?.response?.transactionInfo?.timezone,
              country: captureData?.response?.transactionInfo?.country,
              cardNo: captureCardNo,
            };
          }

          if (preAuthData) {
            return {
              sessionId,
              orderId,
              chargeBoxId,
              cpoName,
              transactionType: preAuthData.type,
              amount: preAuthData.request?.sessionInfo?.totalAmount,
              currencySymbol:
                preAuthData?.response?.transactionInfo?.currencySymbol,
              pan: transaction?.hashedPan,
              result:
                preAuthData?.response?.transactionInfo?.paymentStatus ===
                "authorized"
                  ? "Authorized"
                  : "Unauthorized",
              transactionDate: getUtcIsoStr(
                preAuthData?.response?.transactionInfo?.timestamp
              ),
              transactionDateLocal: getUtcIsoStr(
                preAuthData?.response?.transactionInfo?.timestampLocal
              ),
              timezone: preAuthData?.response?.transactionInfo?.timezone,
              country: preAuthData?.response?.transactionInfo?.country,
              cardNo: preAuthCardNo,
            };
          }

          return null;
        })
      );

      listResponse.list = finalTransactions.filter(Boolean);
    }

    return res.status(200).json(listResponse);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

function sortByTransactionDate(arr, order = "asc") {
  return arr.sort((a, b) => {
    const dateA = new Date(a.transactionDate);
    const dateB = new Date(b.transactionDate);

    return order === "asc" ? dateA - dateB : dateB - dateA;
  });
}

const getSessionDetails = async (req, res) => {
  try {
    const sessionId = req.params?.sessionId;

    const transactions = await TransactionHistoryViewModel.find({
      transactionId: sessionId,
    }).lean();
    if (!transactions) {
      return res.status(400).json({
        success: false,
        message: "Transaction History not found!",
      });
    }
    const chargeBoxId = transactions[0].request?.chargerInfo?.chargeboxId;
    const serialNumber = transactions[0].request?.chargerInfo?.serialNumber;
    const connectorId = transactions[0].request?.chargerInfo?.connectorId;

    let chargerInfo = await ChargerViewRepository.findOne({
      where: {
        chargeBoxId: chargeBoxId,
        serialNumber: serialNumber,
      },
      select: ["chargerModel", "evseStationName"],
    });
    if (!chargerInfo) {
      return res.status(400).json({
        success: false,
        message: "Charger Info Not Found!",
      });
    }
    chargerInfo = {
      chargerModel: chargerInfo["chargerModel"],
      evseStationName: chargerInfo["evseStationName"],
      connectorId,
      chargeBoxId,
      serialNumber,
    };
    const responsePayload = {};
    responsePayload["chargerInfo"] = chargerInfo;

    await Promise.all(
      transactions.map(async (transaction) => {
        let transactionInfo = await PaymentTransactionsRepository.findOne({
          where: {
            ocppTransactionId: sessionId,
          },
          select: ["preauthAmount", "country"],
        });
        let ocpp_transactionInfo = await OcppTransactionsRepository.findOne({
          where: {
            transactionUuid: sessionId,
          },
          select: ["currency"],
        });
        const invoiceInfo = await ChargingInvoiceRepository.findOne({
          where: {
            transactionId: sessionId,
          },
          select: ["invoiceNumber"],
        });
        if (!transactionInfo) {
          return res.status(400).json({
            success: false,
            message: "Charger Info Not Found!",
          });
        }
        if (!ocpp_transactionInfo) {
          ocpp_transactionInfo = {
            currency: transaction?.response?.transactionInfo?.currency,
          };
        }
        transactionInfo = {
          transactionDate: transaction?.response?.transactionInfo?.timestamp,
          authAmount: transactionInfo["preauthAmount"],
          country: transactionInfo["country"],
          currency: ocpp_transactionInfo["currency"],
          cardType:
            transaction?.providerResponse?.response?.receipt["CardType"],
          authId: transaction?.response?.transactionInfo["transactionId"],
          cardNo: transaction?.request?.cardInfo?.maskedPan || null,
          invoiceNo: invoiceInfo ? invoiceInfo["invoiceNumber"] : null,
          responseText: transaction?.response?.transactionInfo?.paymentStatus,
        };
        if (transaction.type == "Capture") {
          transactionInfo["responseText"] =
            transactionInfo["result"] == "authorized" ? "success" : "failed";
          responsePayload["captureTransansactionInfo"] = transactionInfo;
        } else {
          responsePayload["preauthTransansactionInfo"] = transactionInfo;
        }
      })
    );
    responsePayload["sessionId"] = sessionId;

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getSessionDetailsNew = async (req, res) => {
  try {
    const sessionId = req.params?.sessionId;
    const paymentTransaction = await PaymentTransactionsRepository.findOne({
      where: { ocppTransactionId: sessionId },
    });

    if (!paymentTransaction) {
      return res.status(404).json({ message: "Transaction Not Found" });
    }

    const chargeBoxId = paymentTransaction?.chargeBoxId;
    const connectorId = paymentTransaction?.connectorId;
    const cpoId = paymentTransaction?.cpoId;

    let charger = await ChargerViewRepository.findOne({
      where: { chargeBoxId },
      select: ["serialNumber", "chargerModel", "evseStationName"],
    });

    if (!charger) {
      return res
        .status(404)
        .json({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    const serialNumber = charger?.serialNumber;
    const chargerModel = charger?.chargerModel ?? "Prime";
    const evseStationName = charger?.evseStationName;

    const chargerInfo = {
      chargerModel,
      evseStationName,
      connectorId,
      chargeBoxId,
      serialNumber,
    };

    const cardTypeMapping = {
      visa: "V",
      mastercard: "M",
      amex: "AX",
      americanexpress: "AX",
      jcb: "C1",
      discover: "NO",
      interac: "P",
      interacflash: "P",
    };

    const [
      ocppTransactionData,
      cpoData,
      preAuthData,
      captureData,
      invoiceData,
    ] = await Promise.all([
      OcppTransactionsRepository.findOne({
        where: { transactionUuid: sessionId },
      }),
      CpoRepository.findOne({
        where: { id: cpoId },
      }),
      PreauthLogsModel.findOne({
        transactionId: sessionId,
      }).lean(),
      PreauthCompleteLogsModel.find({
        transactionId: sessionId,
      }).lean(),
      ChargingInvoiceRepository.findOne({
        where: { transactionId: sessionId },
      }),
    ]);

    let preAuthCardNo =
      preAuthData?.providerResponse?.response?.receipt?.MaskedPan ?? "-";

    if (preAuthData?.request?.cardInfo?.maskedPan) {
      preAuthCardNo = preAuthData?.request?.cardInfo?.maskedPan?.replace(
        /C/g,
        "*"
      );
    }

    let preAuthCardType = preAuthData?.request?.cardInfo?.cardType;
    if (preAuthCardType) {
      preAuthCardType = preAuthCardType.replace(/\s/g, "").toLowerCase();
      if (cardTypeMapping[preAuthCardType]) {
        preAuthCardType = cardTypeMapping[preAuthCardType];
      } else {
        preAuthCardType =
          preAuthData?.providerResponse?.response?.receipt?.CardType;
      }
    } else {
      preAuthCardType =
        preAuthData?.providerResponse?.response?.receipt?.CardType;
    }

    const preAuthInfo = {
      transactionDate: getUtcIsoStr(
        preAuthData?.response?.transactionInfo?.timestamp
      ),
      transactionDateLocal: getUtcIsoStr(
        preAuthData?.response?.transactionInfo?.timestampLocal
      ),
      timezone: preAuthData?.response?.transactionInfo?.timezone,
      country: preAuthData?.response?.transactionInfo?.country,
      authAmount: preAuthData?.request?.sessionInfo?.totalAmount,
      currency: preAuthData?.request?.sessionInfo?.currency,
      currencySymbol: preAuthData?.response?.transactionInfo?.currencySymbol,
      cardType: preAuthCardType ?? "-",
      authId: preAuthData?.response?.transactionInfo?.transactionId ?? "-",
      cardNo: preAuthCardNo,
      invoiceNo: invoiceData ? invoiceData["invoiceNumber"] : "-",
      responseText: preAuthData?.response?.transactionInfo?.paymentStatus,
      result:
        preAuthData?.response?.transactionInfo?.paymentStatus === "authorized"
          ? "Authorized"
          : "Unauthorized",
    };

    const captureInfo = captureData.map((cData) => {
      let captureCardNo =
        cData?.providerResponse?.response?.receipt?.MaskedPan ?? "-";

      if (cData?.request?.cardInfo?.maskedPan) {
        captureCardNo = cData?.request?.cardInfo?.maskedPan?.replace(/C/g, "*");
      }

      if (captureCardNo === "-") {
        if (cData?.response?.transactionInfo?.paymentStatus === "success") {
          captureCardNo = preAuthCardNo;
        }
      }

      let captureCardType = cData?.request?.cardInfo?.cardType;
      if (captureCardType) {
        captureCardType = captureCardType.replace(/\s/g, "").toLowerCase();
        if (cardTypeMapping[captureCardType]) {
          captureCardType = cardTypeMapping[captureCardType];
        } else {
          captureCardType =
            cData?.providerResponse?.response?.receipt?.CardType;
        }
      } else {
        captureCardType = cData?.providerResponse?.response?.receipt?.CardType;
      }

      return {
        transactionDate: getUtcIsoStr(
          cData?.response?.transactionInfo?.timestamp
        ),
        transactionDateLocal: getUtcIsoStr(
          cData?.response?.transactionInfo?.timestampLocal
        ),
        timezone: cData?.response?.transactionInfo?.timezone,
        country: cData?.response?.transactionInfo?.country,
        authAmount: cData?.request?.sessionInfo?.totalAmount,
        currency: cData?.request?.sessionInfo?.currency,
        currencySymbol: cData?.response?.transactionInfo?.currencySymbol,
        cardType: captureCardType ?? "-",
        authId: cData?.response?.transactionInfo?.transactionId ?? "-",
        cardNo: captureCardNo,
        invoiceNo: invoiceData ? invoiceData["invoiceNumber"] : "-",
        responseText: cData?.response?.transactionInfo?.paymentStatus,
        result:
          cData?.response?.transactionInfo?.paymentStatus === "success"
            ? "Success"
            : "Failed",
      };
    });

    const responsePayload = {
      sessionId,
      orderId: ocppTransactionData?.orderId,
      cpoName: cpoData?.name,
      chargerInfo,
      preAuthInfo,
      captureInfo,
    };

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getTransactionList,
  getTransactionListNew,
  getSessionDetails,
  getSessionDetailsNew,
};
