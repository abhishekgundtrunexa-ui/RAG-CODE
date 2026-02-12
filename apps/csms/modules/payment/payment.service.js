const {
  PreauthLogsModel,
  PurchaseLogsModel,
  PreauthCompleteLogsModel,
  EmvDataAddLogsModel,
  RefundLogsModel,
  PreauthCancelLogsModel,
  PendingCancellationLogsModel,
} = require("@shared-libs/db/mongo-db");
const crypto = require("crypto");
const aesCmac = require("node-aes-cmac").aesCmac;
const monerisService = require("./moneris.service");
const littlepayService = require("./littlepay.service");
const {
  convertDateTimezone,
  getChargingLookup,
  parseTLV,
  getChargerByIdentity,
  getTransResponse,
  getChargerLanguageByConnectorId,
  getChargerPaymentConfig,
  getOcppTransaction,
  getPaymentTransaction,
  hexToAscii,
  getUtcIsoStr,
  getTranslation,
  getOcppTransactionCalculation,
  getOrderId,
} = require("@shared-libs/helpers");
const {
  PaymentTransactionsRepository,
  OcppTransactionsRepository,
  ChargerEtTestingRepository,
  TestingConfigurationRepository,
  ChargerEtTestingTransactionsRepository,
  ChargerViewRepository,
} = require("@shared-libs/db/mysql");
const { DateTime } = require("luxon");
const { PusherConstants } = require("@shared-libs/constants");
const { sendDataToPusher } = require("@shared-libs/pusher");
const {
  generateInvoice,
  generateTransactionInvoice,
} = require("@shared-libs/pdf");
const { SyncRevenueQueue } = require("@shared-libs/queues");

const calculateAmount = async (payload, req, res) => {
  const { ocppTransactionId, meterStop = null } = payload;

  const { code, data } = await getChargingLookup(ocppTransactionId, meterStop);

  res.status(code).json(data);
};

const cleanupExpiredPendingCancellations = async (
  chargeBoxId,
  connectorId,
  hashedPan,
) => {
  try {
    await PendingCancellationLogsModel.deleteMany({
      chargeBoxId,
      connectorId,
      hashedPan,
      status: "pending",
    });
  } catch (error) {}
};

const preauth = async (payload, req, res) => {
  let {
    chargerInfo,
    paymentProvider = null,
    sessionInfo: {
      totalAmount: amount,
      currency,
      language = null,
      langCode = null,
    },
    cardInfo: { emvData: emv_data, pan: hashedPan },
    readyToCapture = false,
  } = payload;

  if (langCode) {
    if (!language) {
      language = langCode;
    }
  }

  if (!paymentProvider) {
    return res.status(400).json({
      message: await getTranslation(
        language ?? "en",
        "Payment provider is required.",
      ),
    });
  }

  if (paymentProvider != "moneris" && paymentProvider != "littlepay") {
    return res.status(400).json({
      message: await getTranslation(
        language ?? "en",
        "Invalid payment provider.",
      ),
    });
  }

  const errParams = {
    hasError: "true",
    type: "Preauth",
    chargerInfo,
    paymentStatus: "unauthorized",
    request: payload,
    paymentProvider,
    language: language ?? "en",
  };

  const { chargeboxId: chargeBoxId, connectorId } = chargerInfo;

  try {
    await cleanupExpiredPendingCancellations(
      chargeBoxId,
      connectorId,
      hashedPan,
    );
  } catch (error) {}

  const charger = await getChargerByIdentity(chargeBoxId, {}, true);
  if (!charger) {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage: "Charger not found.",
    });

    return res.status(200).json(errRes);
  }

  if (!language) {
    language = await getChargerLanguageByConnectorId(
      charger.id,
      connectorId,
      true,
    );

    errParams["language"] = language;
  }

  const {
    device_type,
    pos_code,
    device_id,
    paymentMfgId,
    paymentProvider: paymentProviderFromConfig,
  } = await getChargerPaymentConfig(charger.id);

  if (!device_id) {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage:
        "PaymentDeviceId not found in payment configuration.",
    });

    return res.status(200).json(errRes);
  }

  if (paymentProvider !== paymentProviderFromConfig) {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage:
        "Payment provider does not match the payment configuration.",
    });

    return res.status(200).json(errRes);
  }

  if (payload?.readerConfig?.mfg_Id) {
    if (payload?.readerConfig?.mfg_Id !== paymentMfgId) {
      let errRes = await getTransResponse({
        ...errParams,
        paymentStatusMessage:
          "mfg_Id from readerConfig does not match paymentMfgId from payment configuration.",
      });

      return res.status(200).json(errRes);
    }
  }

  const etTestingData = await ChargerEtTestingRepository.findOne({
    where: { chargeBoxId },
  });

  let isEtTestingEnabled = false;
  let isPurchaseOnly = false;
  if (etTestingData?.preAuthAmount && paymentProvider == "moneris") {
    isEtTestingEnabled = true;
    amount = etTestingData?.preAuthAmount;
    isPurchaseOnly = etTestingData?.purchaseOnly ?? false;
  } else {
    const testConfig = await TestingConfigurationRepository.findOne({
      where: { chargeBoxId },
      select: ["preAuthAmount"],
    });
    if (testConfig) {
      amount = testConfig["preAuthAmount"];
    }
  }

  const chargerViewData = await ChargerViewRepository.findOne({
    where: { chargeBoxId },
  });

  const contractId = chargerViewData?.contractId ?? null;

  const ocppTransactionData = await getOcppTransaction({
    chargeBoxId,
    connectorId,
    hashedPan,
    charger,
    currency,
    language,
    isPurchaseOnly,
    paymentProvider,
    contractId,
  });

  if (isEtTestingEnabled) {
    const etTestingTransactionData =
      await ChargerEtTestingTransactionsRepository.findOne({
        where: { ocppTransactionId: ocppTransactionData?.transactionUuid },
      });

    if (!etTestingTransactionData) {
      await ChargerEtTestingTransactionsRepository.save({
        ocppTransactionId: ocppTransactionData?.transactionUuid,
        chargeBoxId,
        testCaseId: etTestingData?.testCaseId,
        preAuthAmount: etTestingData?.preAuthAmount,
        purchaseAmount: etTestingData?.purchaseAmount,
        purchaseOnly: etTestingData?.purchaseOnly,
        country: charger?.country,
        timezone: charger?.timezone,
        createdAtLocal: charger?.jsLocalDateTime,
      });
    }
  }

  const order_id = ocppTransactionData?.orderId;
  const idTag = ocppTransactionData?.idTag;

  const paymentTransactionData = await getPaymentTransaction({
    ocppTransactionData,
    amount,
    currency,
    hashedPan,
    idTag,
    deviceId: device_id,
    deviceType: device_type,
    posCode: pos_code,
    paymentProvider,
  });

  const paymentTransactionId = paymentTransactionData?.paymentTransactionId;

  let createdPreAuthLog = {};
  let emvDataAddLogId = null;

  if (isPurchaseOnly) {
    if (payload?.id) {
      payload.id = "cgx:pay:0.1:2025:1:purchase";
    }
    if (payload?.title) {
      payload.title = "purchase";
    }
    createdPreAuthLog = await PurchaseLogsModel.create({
      paymentProvider,
      request: payload,
    });
    payload["preAuthLogId"] = createdPreAuthLog?._id;
  } else {
    createdPreAuthLog = await PreauthLogsModel.create({
      paymentProvider,
      request: payload,
    });

    payload["preAuthLogId"] = createdPreAuthLog?._id;

    if (paymentProvider == "moneris") {
      const createdEmvDataAddLog = await EmvDataAddLogsModel.create({
        paymentProvider,
        request: payload,
      });

      emvDataAddLogId = createdEmvDataAddLog?._id;
    }

    payload["emvDataAddLogId"] = emvDataAddLogId;
  }

  const preAuthLogId = createdPreAuthLog?._id;

  payload["language"] = language;
  payload["device_type"] = device_type;
  payload["pos_code"] = pos_code;
  payload["device_id"] = device_id;
  payload["order_id"] = order_id;
  payload["amount"] = amount;

  let preAuthResponse = null;
  if (paymentProvider == "moneris") {
    if (isPurchaseOnly) {
      preAuthResponse = await monerisService.purchase(payload);
    } else {
      preAuthResponse = await monerisService.preauth(payload);
    }
  } else if (paymentProvider == "littlepay") {
    preAuthResponse = await littlepayService.preauth(payload);
  }

  if (preAuthResponse) {
    const {
      jsonResponse,
      preauthStatus,
      preauthReturnStatus,
      responseCode,
      responseMessage,
      transID,
      jsonPayload,
    } = preAuthResponse;

    if (paymentProvider == "moneris") {
      const paymentMessageTmp = await getTranslation(
        language,
        jsonResponse?.response?.receipt?.Message ?? null,
      );

      await OcppTransactionsRepository.update(
        ocppTransactionData?.transactionUuid,
        { paymentMessage: paymentMessageTmp },
      );
    }

    const returnResponseData = await getTransResponse({
      type: isPurchaseOnly ? "Purchase" : "Preauth",
      chargerInfo,
      currency,
      transactionId: transID ?? null,
      sessionId: ocppTransactionData?.transactionUuid,
      idTag,
      amount,
      paymentStatus: preauthReturnStatus ?? "unauthorized",
      paymentStatusMessage: responseMessage ?? "Request failed.",
      timezone: ocppTransactionData?.timezone,
      country: ocppTransactionData?.country,
      language,
    });

    await PaymentTransactionsRepository.update(paymentTransactionId, {
      preauthStatus,
      preauthRefId: transID,
      preauthResponse: responseMessage,
      preauthResponseCode: responseCode,
    });

    try {
      if (returnResponseData?.transactionInfo?.paymentStatusMessage) {
        if (jsonResponse?.response?.receipt) {
          jsonResponse.response.receipt["Message"] =
            returnResponseData?.transactionInfo?.paymentStatusMessage;
        }
      }
    } catch (error) {}

    if (isPurchaseOnly) {
      await PurchaseLogsModel.findByIdAndUpdate(preAuthLogId, {
        response: returnResponseData,
        providerResponse: jsonResponse,
        providerRequest: jsonPayload,
        paymentProvider,
        transactionId: ocppTransactionData?.transactionUuid,
        hasError: preauthReturnStatus !== "authorized",
      });
    } else {
      await PreauthLogsModel.findByIdAndUpdate(preAuthLogId, {
        response: returnResponseData,
        providerResponse: jsonResponse,
        providerRequest: jsonPayload,
        paymentProvider,
        transactionId: ocppTransactionData?.transactionUuid,
        hasError: preauthReturnStatus !== "authorized",
      });
    }

    // send pusher event to FE
    try {
      let preauthData = {};
      if (isPurchaseOnly) {
        preauthData = await PurchaseLogsModel.findOne({
          transactionId: ocppTransactionData?.transactionUuid,
        }).lean();
      } else {
        preauthData = await PreauthLogsModel.findOne({
          transactionId: ocppTransactionData?.transactionUuid,
        }).lean();
      }

      const params = {
        channelName: PusherConstants.channels.PUSHER_NODE_APP,
        eventName: PusherConstants.events.transaction.PREAUTH_CREATED,
        data: {
          sessionId: ocppTransactionData?.transactionUuid,
          chargeBoxId: preauthData?.response?.chargerInfo?.chargeboxId,
          transactionType: isPurchaseOnly ? "Purchase" : "Pre-Auth",
          amount: preauthData?.request?.sessionInfo?.totalAmount,
          currencySymbol:
            preauthData?.response?.transactionInfo?.currencySymbol,
          pan: preauthData?.providerResponse?.response?.receipt?.MaskedPan,
          result: preauthData?.response?.transactionInfo?.paymentStatus,
          transactionDate: getUtcIsoStr(
            preauthData?.response?.transactionInfo?.timestamp,
          ),
          transactionDateLocal: getUtcIsoStr(
            preauthData?.response?.transactionInfo?.timestampLocal,
          ),
        },
      };
      await sendDataToPusher(params);
    } catch (error) {}

    let transactionReceipt = null;

    try {
      if (!isPurchaseOnly || preauthReturnStatus !== "authorized") {
        returnResponseData["receiptInfo"] =
          await generateTransactionInvoice(preAuthLogId);

        transactionReceipt =
          returnResponseData?.receiptInfo?.invoicePdfUrl ?? null;
      }
    } catch (error) {}

    const parsedEMV = await parseTLV(emv_data, true);
    try {
      const app_label = parsedEMV["50"] ? hexToAscii(parsedEMV["50"]) : "";
      const app_preferred_name = parsedEMV["9F12"]
        ? hexToAscii(parsedEMV["9F12"])
        : "";

      let aidData = parsedEMV["84"]
        ? parsedEMV["84"]
        : parsedEMV["4F"]
          ? parsedEMV["4F"]
          : ""; // 84 or 4F
      let tvrData = parsedEMV["95"] ? parsedEMV["95"] : "";
      let tsiData = parsedEMV["9B"] ? parsedEMV["9B"] : "";
      let appLabel =
        app_preferred_name && app_preferred_name != ""
          ? app_preferred_name
          : null;
      if (appLabel == null || appLabel == "") {
        appLabel = app_label && app_label != "" ? app_label : null;
      }

      await OcppTransactionsRepository.update(
        ocppTransactionData?.transactionUuid,
        {
          aid: aidData,
          tvr: tvrData,
          tsi: tsiData,
          appLabel: appLabel ?? null,
          invoicePdfUrl: transactionReceipt,
          maxAmount: amount,
        },
      );
    } catch (error) {}

    if (paymentProvider == "moneris" && !isPurchaseOnly) {
      payload["txn_number"] = transID;
      payload["parsedEMV"] = parsedEMV;

      const emvDataAddResponse = await monerisService.emvDataAdd(payload);
      if (emvDataAddResponse) {
        const {
          jsonResponseAddEmv,
          responseCodeAddEmv,
          responseMessageAddEmv,
          transIDAddEmv,
          emvAddReturnStatus,
          jsonPayloadAddEmv,
        } = emvDataAddResponse;

        const returnResponseDataAddEmv = await getTransResponse({
          type: "EmvDataAdd",
          chargerInfo,
          currency,
          transactionId: transIDAddEmv,
          sessionId: ocppTransactionData?.transactionUuid,
          idTag,
          paymentStatus: emvAddReturnStatus ?? "failure",
          paymentStatusMessage: responseMessageAddEmv ?? "Request failed.",
          amount: null,
          timezone: ocppTransactionData?.timezone,
          country: ocppTransactionData?.country,
          language,
        });

        await PaymentTransactionsRepository.update(paymentTransactionId, {
          evmDataAddResponse: responseMessageAddEmv,
          evmDataAddResponseCode: responseCodeAddEmv,
        });

        try {
          if (returnResponseDataAddEmv?.transactionInfo?.paymentStatusMessage) {
            if (jsonResponseAddEmv?.response?.receipt) {
              jsonResponseAddEmv.response.receipt["Message"] =
                returnResponseDataAddEmv?.transactionInfo?.paymentStatusMessage;
            }
          }
        } catch (error) {}

        await EmvDataAddLogsModel.findByIdAndUpdate(emvDataAddLogId, {
          response: returnResponseDataAddEmv,
          providerResponse: jsonResponseAddEmv,
          providerRequest: jsonPayloadAddEmv,
          paymentProvider,
          transactionId: ocppTransactionData?.transactionUuid,
          hasError: emvAddReturnStatus !== "success",
        });

        try {
          returnResponseDataAddEmv["receiptInfo"] =
            await generateTransactionInvoice(emvDataAddLogId);
        } catch (error) {}
      }
    }

    if (preauthReturnStatus == "authorized" && !isPurchaseOnly) {
      // Check for pending cancellation requests before processing response
      const pendingCancellation = await PendingCancellationLogsModel.findOne({
        chargeBoxId,
        connectorId,
        hashedPan,
        status: "pending",
      });

      if (pendingCancellation) {
        try {
          const cancelPayload = pendingCancellation["request"];
          cancelPayload["sessionInfo"]["sessionId"] =
            returnResponseData["transactionInfo"]["sessionId"];

          const { code, data } = await processPreauthCancel(cancelPayload);
          // Mark the pending cancellation as processed
          await PendingCancellationLogsModel.findByIdAndUpdate(
            pendingCancellation._id,
            {
              status: "processed",
              processedAt: new Date(),
              processedTransactionId: ocppTransactionData?.transactionUuid,
            },
          );
        } catch (error) {}

        returnResponseData["transactionInfo"]["paymentStatus"] = "cancelled";
      }
    }

    if (preauthReturnStatus !== "authorized") {
      await OcppTransactionsRepository.update(
        ocppTransactionData?.transactionUuid,
        {
          paymentStatus: "Rejected",
          isFinished: true,
        },
      );
    }

    // This is for testing only
    if (readyToCapture === true && preauthReturnStatus == "authorized") {
      const tz = ocppTransactionData?.timezone ?? "UTC";
      const meterStart = 1;
      const meterStop = 5;
      const startTime = convertDateTimezone(DateTime.utc());
      const startTimeLocal = convertDateTimezone(
        DateTime.fromFormat(startTime, "yyyy-MM-dd HH:mm:ss", { zone: "utc" }),
        tz,
      );
      const endTime = convertDateTimezone(DateTime.utc().plus({ seconds: 30 }));
      const endTimeLocal = convertDateTimezone(
        DateTime.fromFormat(endTime, "yyyy-MM-dd HH:mm:ss", { zone: "utc" }),
        tz,
      );

      const createTransactionData = {
        transactionStatus: "authorized",
        meterStart,
        meterStop,
        startTime,
        startTimeLocal,
        endTime,
        endTimeLocal,
        chargingSessionDate: convertDateTimezone(
          DateTime.utc(),
          "UTC",
          "yyyy-MM-dd",
        ),
      };

      await OcppTransactionsRepository.update(
        ocppTransactionData?.transactionUuid,
        createTransactionData,
      );
    }

    return res.status(200).json(returnResponseData);
  }
  return res.status(400).json({
    message: await getTranslation(
      language ?? "en",
      "Invalid payment provider.",
    ),
  });
};

const preauthComplete = async (payload, req, res) => {
  let {
    chargerInfo,
    paymentProvider,
    sessionInfo: {
      sessionId: order_id,
      totalAmount: comp_amount,
      currency,
      description = null,
      language = null,
      langCode = null,
    },
    cardInfo: { pan: hashedPan },
    readyToCapture = false,
  } = payload;

  if (langCode) {
    if (!language) {
      language = langCode;
    }
  }

  if (!language) {
    const ocppTransactionDataTmp = await OcppTransactionsRepository.findOne({
      where: { transactionUuid: order_id, isTestTransaction: false },
    });
    language = ocppTransactionDataTmp?.language ?? "en";
  }

  if (!paymentProvider) {
    return res.status(400).json({
      message: await getTranslation(
        language ?? "en",
        "Payment provider is required.",
      ),
    });
  }

  if (paymentProvider != "moneris" && paymentProvider != "littlepay") {
    return res.status(400).json({
      message: await getTranslation(
        language ?? "en",
        "Invalid payment provider.",
      ),
    });
  }

  const { chargeboxId: chargeBoxId, connectorId } = chargerInfo;

  const errParams = {
    hasError: "true",
    type: "Capture",
    chargerInfo,
    paymentStatus: "failure",
    sessionId: order_id,
    request: payload,
    paymentProvider,
    language: language ?? "en",
  };

  const charger = await getChargerByIdentity(chargeBoxId);
  if (!charger) {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage: "Charger not found.",
    });

    return res.status(200).json(errRes);
  }

  const etTestingData = await ChargerEtTestingRepository.findOne({
    where: { chargeBoxId },
  });

  if (etTestingData?.purchaseAmount && paymentProvider == "moneris") {
    comp_amount = etTestingData?.purchaseAmount;
  } else {
    const testConfig = await TestingConfigurationRepository.findOne({
      where: { chargeBoxId },
      select: ["captureAmount"],
    });
    if (testConfig) {
      comp_amount = testConfig["captureAmount"];
    }
  }

  const ocppTransactionData = await getOcppTransaction({
    transactionUuid: order_id,
    chargeBoxId,
    connectorId,
    hashedPan,
    charger,
  });

  if (!ocppTransactionData) {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage: "OCPP Transaction not found.",
    });

    return res.status(200).json(errRes);
  }

  const paymentTransactionData = await PaymentTransactionsRepository.findOne({
    where: {
      ocppTransactionId: order_id,
      hashedPan,
      status: "Pending",
    },
  });

  if (!paymentTransactionData) {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage: "Invalid PAN or order ID.",
    });

    return res.status(200).json(errRes);
  }
  if (!paymentTransactionData?.preauthRefId) {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage: "PreauthRefId not found.",
    });
    return res.status(200).json(errRes);
  }

  const paymentTransactionId = paymentTransactionData?.paymentTransactionId;

  if (ocppTransactionData?.purchaseOnly == true) {
    const purchaseTransaction = await PurchaseLogsModel.findOne({
      transactionId: ocppTransactionData?.transactionUuid,
    }).lean();

    const purchaseReturnResponseData = purchaseTransaction?.response;

    purchaseReturnResponseData["receiptInfo"] =
      await generateTransactionInvoice(purchaseTransaction?._id);

    let transactionPurchaseReceipt =
      purchaseReturnResponseData?.receiptInfo?.invoicePdfUrl ?? null;

    if (
      purchaseReturnResponseData?.transactionInfo?.paymentStatus == "authorized"
    ) {
      await OcppTransactionsRepository.update(
        ocppTransactionData?.transactionUuid,
        { paymentStatus: "Accepted" },
      );
    } else {
      await OcppTransactionsRepository.update(
        ocppTransactionData?.transactionUuid,
        {
          paymentStatus: "Rejected",
          isFinished: true,
          invoicePdfUrl: transactionPurchaseReceipt,
        },
      );
    }

    await PaymentTransactionsRepository.update(paymentTransactionId, {
      status:
        paymentTransactionData["preauthStatus"] === "Authorized"
          ? "Processed"
          : "Pending",
      purchaseAmount: paymentTransactionData["preauthAmount"],
      purchaseCurrency: paymentTransactionData["preauthCurrency"],
      purchaseStatus: paymentTransactionData["preauthStatus"],
      purchaseRefId: paymentTransactionData["preauthRefId"],
      purchaseResponse: paymentTransactionData["preauthResponse"],
      purchaseResponseCode: paymentTransactionData["preauthResponseCode"],

      preauthCompleteAmount: paymentTransactionData["preauthAmount"],
      preauthCompleteCurrency: paymentTransactionData["preauthCurrency"],
      preauthCompleteStatus:
        paymentTransactionData["preauthStatus"] === "Authorized"
          ? "Approved"
          : "Rejected",
      preauthCompleteRefId: paymentTransactionData["preauthRefId"],
      preauthCompleteResponse: paymentTransactionData["preauthResponse"],
      preauthCompleteResponseCode:
        paymentTransactionData["preauthResponseCode"],
    });

    return res.status(200).json(purchaseReturnResponseData);
  }

  const {
    paymentMfgId,
    paymentProvider: paymentProviderFromConfig,
    upperLimit = 0,
    lowerLimit = 0,
  } = await getChargerPaymentConfig(charger.id);

  if (paymentProvider !== paymentProviderFromConfig) {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage:
        "Payment provider does not match the payment configuration.",
    });

    return res.status(200).json(errRes);
  }

  if (payload?.readerConfig?.mfg_Id) {
    if (payload?.readerConfig?.mfg_Id !== paymentMfgId) {
      let errRes = await getTransResponse({
        ...errParams,
        paymentStatusMessage:
          "mfg_Id from readerConfig does not match paymentMfgId from payment configuration.",
      });

      return res.status(200).json(errRes);
    }
  }

  if (!etTestingData) {
    if (upperLimit > 0 && Number(comp_amount ?? 0) > upperLimit) {
      comp_amount = Number(upperLimit ?? 0).toFixed(2);
    } else if (lowerLimit > 0 && Number(comp_amount ?? 0) < lowerLimit) {
      comp_amount = Number(lowerLimit ?? 0).toFixed(2);
    }
  }

  const txn_number = paymentTransactionData?.preauthRefId;
  const device_id = paymentTransactionData?.deviceId;
  const idTag = ocppTransactionData?.idTag;
  const orderId = ocppTransactionData?.orderId;

  // ==========================================

  const createdPreAuthCompleteLog = await PreauthCompleteLogsModel.create({
    paymentProvider,
    request: payload,
  });
  const preAuthCompleteLogId = createdPreAuthCompleteLog?._id;
  payload["preAuthCompleteLogId"] = preAuthCompleteLogId;

  payload["language"] = language;
  payload["comp_amount"] = comp_amount;
  payload["txn_number"] = txn_number;
  payload["device_id"] = device_id;
  payload["orderId"] = orderId;
  payload["description"] = description;

  let preAuthCompleteResponse = null;
  if (paymentProvider == "moneris") {
    preAuthCompleteResponse = await monerisService.preauthComplete(payload);
  } else if (paymentProvider == "littlepay") {
    preAuthCompleteResponse = await littlepayService.preauthComplete(payload);
  }

  if (preAuthCompleteResponse) {
    const {
      jsonResponse,
      responseCode,
      responseMessage,
      transID,
      preauthCompleteReturnStatus,
      preauthCompleteStatus,
      jsonPayload,
    } = preAuthCompleteResponse;

    const returnResponseData = await getTransResponse({
      type: "Capture",
      chargerInfo,
      currency,
      transactionId: transID,
      sessionId: ocppTransactionData?.transactionUuid,
      idTag,
      amount: comp_amount,
      paymentStatus: preauthCompleteReturnStatus ?? "failure",
      paymentStatusMessage: responseMessage ?? "Request failed.",
      timezone: ocppTransactionData?.timezone,
      country: ocppTransactionData?.country,
      language,
    });

    await PaymentTransactionsRepository.update(paymentTransactionId, {
      status:
        returnResponseData?.transactionInfo?.paymentStatus === "failure"
          ? "Pending"
          : "Processed",
      preauthCompleteAmount: comp_amount,
      preauthCompleteCurrency: currency,
      preauthCompleteStatus,
      preauthCompleteRefId: transID,
      preauthCompleteResponse: responseMessage,
      preauthCompleteResponseCode: responseCode,
    });

    // Updating Charger Revenue.
    try {
      if (returnResponseData?.transactionInfo?.paymentStatus === "success") {
        await SyncRevenueQueue.add(
          {
            transactionUuid: ocppTransactionData?.transactionUuid,
          },
          { delay: 500 },
        );
      }
    } catch (error) {
      console.log("🚀 -----------------🚀");
      console.log("🚀 ~ REV error:", error);
      console.log("🚀 -----------------🚀");
    }

    try {
      if (returnResponseData?.transactionInfo?.paymentStatusMessage) {
        if (jsonResponse?.response?.receipt) {
          jsonResponse.response.receipt["Message"] =
            returnResponseData?.transactionInfo?.paymentStatusMessage;
        }
      }
    } catch (error) {}

    await PreauthCompleteLogsModel.findByIdAndUpdate(preAuthCompleteLogId, {
      response: returnResponseData,
      providerResponse: jsonResponse,
      providerRequest: jsonPayload,
      paymentProvider,
      transactionId: ocppTransactionData?.transactionUuid,
      hasError: preauthCompleteReturnStatus !== "success",
    });

    let transactionReceipt = null;
    try {
      returnResponseData["receiptInfo"] =
        await generateTransactionInvoice(preAuthCompleteLogId);

      transactionReceipt =
        returnResponseData?.receiptInfo?.invoicePdfUrl ?? null;
    } catch (error) {}

    if (preauthCompleteStatus == "Approved") {
      const transactionUpdateData = {
        transactionStatus: "finished",
        paymentReferenceId: transID,
        paymentAuthCode: jsonResponse?.response?.receipt?.AuthCode ?? transID,
        isPaid: true,
        paymentMessage: responseMessage ?? null,
        paymentType: "Capture",
        paymentStatus: "Accepted",
      };

      if (paymentProvider == "moneris") {
        transactionUpdateData["paymentReference"] = jsonResponse?.response
          ?.receipt?.ReferenceNum
          ? `${jsonResponse?.response?.receipt?.ReferenceNum} H`
          : null;
        transactionUpdateData["paymentResponseCode"] =
          jsonResponse?.response?.receipt?.ResponseCode ?? null;
        transactionUpdateData["paymentIsoCode"] =
          jsonResponse?.response?.receipt?.ISO ?? null;
        transactionUpdateData["paymentMessage"] = await getTranslation(
          language,
          jsonResponse?.response?.receipt?.Message ?? null,
        );
      }

      await OcppTransactionsRepository.update(
        ocppTransactionData?.transactionUuid,
        transactionUpdateData,
      );

      try {
        if (readyToCapture === true) {
          await getOcppTransactionCalculation(
            ocppTransactionData?.transactionUuid,
          );
        }
        await generateInvoice(ocppTransactionData?.transactionUuid);
      } catch (error) {}
    } else {
      await OcppTransactionsRepository.update(
        ocppTransactionData?.transactionUuid,
        {
          paymentStatus: "Rejected",
          isFinished: true,
          invoicePdfUrl: transactionReceipt,
        },
      );
    }

    // update the transaction to the FE by Pusher
    try {
      const captureData = await PreauthCompleteLogsModel.findOne({
        transactionId: ocppTransactionData?.transactionUuid,
      })
        .select("request")
        .lean();

      const params = {
        channelName: PusherConstants.channels.PUSHER_NODE_APP,
        eventName: PusherConstants.events.transaction.CAPTURE_CREATED,
        data: {
          transactionId: ocppTransactionData?.transactionUuid,
          transactionDate: getUtcIsoStr(
            returnResponseData?.transactionInfo?.timestamp,
          ),
          transactionDateLocal: getUtcIsoStr(
            returnResponseData?.transactionInfo?.timestampLocal,
          ),
          transactionType: "Capture",
          result:
            returnResponseData?.transactionInfo?.paymentStatus == "authorized"
              ? "success"
              : "failed",
          amount: captureData?.request?.sessionInfo?.totalAmount,
        },
      };

      await sendDataToPusher(params);
    } catch (error) {}

    return res.status(200).json(returnResponseData);
  } else {
    await OcppTransactionsRepository.update(
      ocppTransactionData?.transactionUuid,
      { paymentStatus: "Rejected", isFinished: true },
    );
  }

  return res.status(400).json({
    message: await getTranslation(
      language ?? "en",
      "Invalid payment provider.",
    ),
  });
};

const preauthCancel = async (payload, req, res) => {
  const { code, data } = await processPreauthCancel(payload);
  return res.status(code).json(data);
};

const processPreauthCancel = async (payload) => {
  let {
    chargerInfo,
    paymentProvider,
    sessionInfo: {
      sessionId: order_id,
      totalAmount: comp_amount,
      currency,
      language = null,
      langCode = null,
    },
    cardInfo: { pan: hashedPan },
  } = payload;

  if (langCode) {
    if (!language) {
      language = langCode;
    }
  }

  // If no sessionId is provided, store as pending cancellation
  if (!order_id) {
    const { chargeboxId: chargeBoxId, connectorId } = chargerInfo;

    if (!paymentProvider) {
      return {
        code: 400,
        data: {
          message: await getTranslation(
            language ?? "en",
            "Payment provider is required.",
          ),
        },
      };
    }

    if (paymentProvider != "moneris" && paymentProvider != "littlepay") {
      return {
        code: 400,
        data: {
          message: await getTranslation(
            language ?? "en",
            "Invalid payment provider.",
          ),
        },
      };
    }

    // Create pending cancellation entry
    await PendingCancellationLogsModel.create({
      paymentProvider,
      chargeBoxId,
      connectorId,
      hashedPan,
      status: "pending",
      request: payload,
    });

    return {
      code: 200,
      data: {
        message: await getTranslation(
          language ?? "en",
          "Cancellation request stored. Will be processed when preauth completes.",
        ),
      },
    };
  }

  const ocppTransactionData = await OcppTransactionsRepository.findOne({
    where: { transactionUuid: order_id, isTestTransaction: false },
  });

  if (!language) {
    language = ocppTransactionData?.language ?? "en";
  }

  if (!paymentProvider) {
    return {
      code: 200,
      data: {
        message: await getTranslation(
          language ?? "en",
          "Payment provider is required.",
        ),
      },
    };
  }

  if (paymentProvider != "moneris" && paymentProvider != "littlepay") {
    return {
      code: 400,
      data: {
        message: await getTranslation(
          language ?? "en",
          "Invalid payment provider.",
        ),
      },
    };
  }

  const { chargeboxId: chargeBoxId } = chargerInfo;

  const errParams = {
    hasError: "true",
    type: "Cancel",
    chargerInfo,
    paymentStatus: "failure",
    sessionId: order_id,
    request: payload,
    paymentProvider,
    language: language ?? "en",
  };

  const charger = await getChargerByIdentity(chargeBoxId);
  if (!charger) {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage: "Charger not found.",
    });

    return { code: 200, data: errRes };
  }

  const etTestingData = await ChargerEtTestingRepository.findOne({
    where: { chargeBoxId },
  });

  if (etTestingData?.purchaseAmount && paymentProvider == "moneris") {
    comp_amount = etTestingData?.purchaseAmount;
  } else {
    const testConfig = await TestingConfigurationRepository.findOne({
      where: { chargeBoxId },
      select: ["captureAmount"],
    });
    if (testConfig) {
      comp_amount = testConfig["captureAmount"];
    }
  }

  if (!ocppTransactionData) {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage: "OCPP Transaction not found.",
    });

    return { code: 200, data: errRes };
  }

  if (ocppTransactionData?.transactionStatus == "finished") {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage: "This Transaction is Captured.",
    });

    return { code: 200, data: errRes };
  }

  const paymentTransactionData = await PaymentTransactionsRepository.findOne({
    where: { ocppTransactionId: order_id },
  });

  if (!paymentTransactionData) {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage: "Invalid PAN or order ID.",
    });

    return { code: 200, data: errRes };
  }

  if (paymentTransactionData?.status == "Cancelled") {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage:
        "Preauth for this transaction is already cancelled.",
    });

    return { code: 200, data: errRes };
  }

  if (paymentTransactionData?.status == "Processed") {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage:
        "The payment for this transaction has been processed.",
    });

    return { code: 200, data: errRes };
  }

  if (paymentTransactionData?.status == "Refunded") {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage: "The payment for this transaction is refunded.",
    });

    return { code: 200, data: errRes };
  }

  if (!paymentTransactionData?.preauthRefId) {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage: "PreauthRefId not found.",
    });

    return { code: 200, data: errRes };
  }

  const { paymentMfgId, paymentProvider: paymentProviderFromConfig } =
    await getChargerPaymentConfig(charger.id);

  if (paymentProvider !== paymentProviderFromConfig) {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage:
        "Payment provider does not match the payment configuration.",
    });

    return { code: 200, data: errRes };
  }

  if (payload?.readerConfig?.mfg_Id) {
    if (payload?.readerConfig?.mfg_Id !== paymentMfgId) {
      let errRes = await getTransResponse({
        ...errParams,
        paymentStatusMessage:
          "mfg_Id from readerConfig does not match paymentMfgId from payment configuration.",
      });

      return { code: 200, data: errRes };
    }
  }

  const txn_number = paymentTransactionData?.preauthRefId;
  const paymentTransactionId = paymentTransactionData?.paymentTransactionId;
  const device_id = paymentTransactionData?.deviceId;
  const idTag = ocppTransactionData?.idTag;
  const orderId = ocppTransactionData?.orderId;

  const createdPreAuthCancelLog = await PreauthCancelLogsModel.create({
    paymentProvider,
    request: payload,
  });
  const preAuthCancelLogId = createdPreAuthCancelLog?._id;
  payload["preAuthCancelLogId"] = preAuthCancelLogId;

  payload["comp_amount"] = comp_amount;
  payload["device_id"] = device_id;
  payload["orderId"] = orderId;
  payload["txn_number"] = txn_number;

  let preAuthCancelResponse = null;
  if (paymentProvider == "moneris") {
    preAuthCancelResponse = await monerisService.preauthCancel(payload);
  } else if (paymentProvider == "littlepay") {
    preAuthCancelResponse = await littlepayService.preauthCancel(payload);
  }

  if (preAuthCancelResponse) {
    const {
      jsonResponse,
      responseCode,
      responseMessage,
      transID,
      preauthCompleteReturnStatus,
      preauthCompleteStatus,
      jsonPayload,
    } = preAuthCancelResponse;

    const returnResponseData = await getTransResponse({
      type: "Cancel",
      chargerInfo,
      currency,
      transactionId: transID,
      sessionId: ocppTransactionData?.transactionUuid,
      idTag,
      amount: comp_amount,
      paymentStatus: preauthCompleteReturnStatus ?? "failure",
      paymentStatusMessage: responseMessage ?? "Request failed.",
      timezone: ocppTransactionData?.timezone,
      country: ocppTransactionData?.country,
      language,
    });

    await PaymentTransactionsRepository.update(paymentTransactionId, {
      status:
        returnResponseData?.transactionInfo?.paymentStatus === "failure"
          ? paymentTransactionData?.status
          : "Cancelled",
    });

    try {
      if (returnResponseData?.transactionInfo?.paymentStatusMessage) {
        if (jsonResponse?.response?.receipt) {
          jsonResponse.response.receipt["Message"] =
            returnResponseData?.transactionInfo?.paymentStatusMessage;
        }
      }
    } catch (error) {}

    await PreauthCancelLogsModel.findByIdAndUpdate(preAuthCancelLogId, {
      response: returnResponseData,
      providerResponse: jsonResponse,
      providerRequest: jsonPayload,
      paymentProvider,
      transactionId: ocppTransactionData?.transactionUuid,
      hasError: preauthCompleteReturnStatus !== "success",
    });

    try {
      returnResponseData["receiptInfo"] =
        await generateTransactionInvoice(preAuthCancelLogId);
    } catch (error) {}

    if (preauthCompleteStatus == "Approved") {
      await OcppTransactionsRepository.update(
        ocppTransactionData?.transactionUuid,
        { transactionStatus: "cancelled", isFinished: true },
      );
    }

    return { code: 200, data: returnResponseData };
  }

  return {
    code: 400,
    data: {
      message: await getTranslation(
        language ?? "en",
        "Invalid payment provider.",
      ),
    },
  };
};

const refund = async (payload, req, res) => {
  let {
    chargerInfo,
    paymentProvider,
    sessionInfo: {
      sessionId: order_id,
      refundAmount: comp_amount,
      currency,
      language = null,
      langCode = null,
    },
  } = payload;

  if (langCode) {
    if (!language) {
      language = langCode;
    }
  }

  if (!language) {
    const ocppTransactionDataTmp = await OcppTransactionsRepository.findOne({
      where: { transactionUuid: order_id, isTestTransaction: false },
    });
    language = ocppTransactionDataTmp?.language ?? "en";
  }

  if (!paymentProvider) {
    return res.status(400).json({
      message: await getTranslation(
        language ?? "en",
        "Payment provider is required.",
      ),
    });
  }

  if (paymentProvider != "moneris" && paymentProvider != "littlepay") {
    return res.status(400).json({
      message: await getTranslation(
        language ?? "en",
        "Invalid payment provider.",
      ),
    });
  }

  const { chargeboxId: chargeBoxId } = chargerInfo;

  const errParams = {
    hasError: "true",
    type: "Refund",
    chargerInfo,
    paymentStatus: "failure",
    sessionId: order_id,
    request: payload,
    paymentProvider,
    language: language ?? "en",
  };

  const charger = await getChargerByIdentity(chargeBoxId);
  if (!charger) {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage: "Charger not found.",
    });

    return res.status(200).json(errRes);
  }

  // const etTestingData = await ChargerEtTestingRepository.findOne({
  //   where: { chargeBoxId },
  // });

  // if (etTestingData?.purchaseAmount && paymentProvider == "moneris") {
  //   comp_amount = etTestingData?.purchaseAmount;
  // } else {
  //   const testConfig = await TestingConfigurationRepository.findOne({
  //     where: { chargeBoxId },
  //     select: ["captureAmount"],
  //   });
  //   if (testConfig) {
  //     comp_amount = testConfig["captureAmount"];
  //   }
  // }

  const ocppTransactionData = await OcppTransactionsRepository.findOne({
    where: { transactionUuid: order_id, isTestTransaction: false },
  });

  if (!ocppTransactionData) {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage: "OCPP Transaction not found.",
    });

    return res.status(200).json(errRes);
  }

  if (ocppTransactionData?.transactionStatus != "finished") {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage:
        "The amount for this transaction has not yet been captured.",
    });

    return res.status(200).json(errRes);
  }

  const paymentTransactionData = await PaymentTransactionsRepository.findOne({
    where: { ocppTransactionId: order_id },
  });

  if (!paymentTransactionData) {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage:
        "The payment for this transaction is not processed yet.",
    });

    return res.status(200).json(errRes);
  }

  if (paymentTransactionData?.status == "Refunded") {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage:
        "The refund for this transaction has already been processed.",
    });

    return res.status(200).json(errRes);
  }

  if (paymentTransactionData?.status != "Processed") {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage:
        "The payment for this transaction is not processed yet.",
    });

    return res.status(200).json(errRes);
  }

  if (!paymentTransactionData?.preauthCompleteRefId) {
    let errRes = await getTransResponse({
      ...errParams,
      paymentStatusMessage: "PreauthCompleteRefId not found.",
    });
    return res.status(200).json(errRes);
  }

  if (paymentTransactionData?.preauthCompleteAmount) {
    const amt1 = Number(paymentTransactionData?.preauthCompleteAmount ?? 0);
    const amt2 = Number(comp_amount);
    if (amt2 > amt1) {
      let errRes = await getTransResponse({
        ...errParams,
        paymentStatusMessage:
          "The refund amount cannot exceed the captured amount.",
      });
      return res.status(200).json(errRes);
    }
  }

  paymentProvider = paymentTransactionData?.paymentProvider ?? paymentProvider;
  payload["paymentProvider"] = paymentProvider;

  let fundingSourceId = null;
  let chargeId = null;
  if (paymentProvider == "littlepay") {
    let captureData = await PreauthCompleteLogsModel.findOne({
      transactionId: ocppTransactionData?.transactionUuid,
    }).lean();

    if (!captureData) {
      captureData = await PurchaseLogsModel.findOne({
        transactionId: ocppTransactionData?.transactionUuid,
      }).lean();
    }

    fundingSourceId = captureData?.providerResponse?.funding_source_id;
    chargeId = captureData?.providerResponse?.transaction_id;

    if (!fundingSourceId) {
      let errRes = await getTransResponse({
        ...errParams,
        paymentStatusMessage:
          "Missing 'funding_source_id'. Try refund after some time.",
      });

      return res.status(200).json(errRes);
    }
  }

  const txn_number = paymentTransactionData?.preauthCompleteRefId;
  const paymentTransactionId = paymentTransactionData?.paymentTransactionId;
  const idTag = ocppTransactionData?.idTag;
  const orderId = ocppTransactionData?.orderId;

  // ==========================================

  const createdRefundLog = await RefundLogsModel.create({
    paymentProvider,
    request: payload,
  });
  const refundLogId = createdRefundLog?._id;
  payload["refundLogId"] = refundLogId;

  payload["language"] = language;
  payload["amount"] = comp_amount;
  payload["txn_number"] = txn_number;
  payload["order_id"] = orderId;
  payload["funding_source_id"] = fundingSourceId;
  payload["charge_id"] = chargeId;

  let refundResponse = null;
  if (paymentProvider == "moneris") {
    refundResponse = await monerisService.refund(payload);
  } else if (paymentProvider == "littlepay") {
    refundResponse = await littlepayService.refund(payload);
  }

  if (refundResponse) {
    const {
      jsonResponse,
      responseCode,
      responseMessage,
      transID,
      preauthCompleteReturnStatus,
      preauthCompleteStatus,
      jsonPayload,
    } = refundResponse;

    const returnResponseData = await getTransResponse({
      type: "Refund",
      chargerInfo,
      currency,
      transactionId: transID,
      sessionId: ocppTransactionData?.transactionUuid,
      idTag,
      amount: comp_amount,
      paymentStatus: preauthCompleteReturnStatus ?? "failure",
      paymentStatusMessage: responseMessage ?? "Request failed.",
      timezone: ocppTransactionData?.timezone,
      country: ocppTransactionData?.country,
      language,
    });

    await PaymentTransactionsRepository.update(paymentTransactionId, {
      status:
        returnResponseData?.transactionInfo?.paymentStatus === "failure"
          ? paymentTransactionData?.status
          : "Refunded",
      refundAmount: comp_amount,
      refundCurrency: currency,
      refundStatus: preauthCompleteStatus,
      refundRefId: transID,
      refundResponse: responseMessage,
      refundResponseCode: responseCode,
    });

    try {
      if (returnResponseData?.transactionInfo?.paymentStatusMessage) {
        if (jsonResponse?.response?.receipt) {
          jsonResponse.response.receipt["Message"] =
            returnResponseData?.transactionInfo?.paymentStatusMessage;
        }
      }
    } catch (error) {}

    await RefundLogsModel.findByIdAndUpdate(refundLogId, {
      response: returnResponseData,
      providerResponse: jsonResponse,
      providerRequest: jsonPayload,
      paymentProvider,
      transactionId: ocppTransactionData?.transactionUuid,
      hasError: preauthCompleteReturnStatus !== "success",
    });

    try {
      returnResponseData["receiptInfo"] =
        await generateTransactionInvoice(refundLogId);
    } catch (error) {}

    return res.status(200).json(returnResponseData);
  }
  return res.status(400).json({
    message: await getTranslation(
      language ?? "en",
      "Invalid payment provider.",
    ),
  });
};

const purchase2 = async (payload, req, res) => {
  const {
    paymentProvider = null,
    sessionInfo: { totalAmount: amount, currency },
    cardInfo: { pan: hashedPan },
  } = payload;

  let deviceId = "N0000013";
  let deviceType = "idtech_bdk_ctls";
  let posCode = "27";

  const purchasePayload = {
    ...payload,
    device_type: deviceType,
    pos_code: posCode,
    device_id: deviceId,
    order_id: `${getOrderId()}-UMB`,
    amount,
  };

  // ==================================

  let preAuthResponse = null;
  if (paymentProvider == "moneris") {
    preAuthResponse = await monerisService.purchase2(purchasePayload);

    const { preauthReturnStatus, responseMessage, transID } = preAuthResponse;

    const returnResponseData = await getTransResponse({
      type: "Purchase",
      chargerInfo: {},
      currency,
      transactionId: transID ?? null,
      sessionId: null,
      idTag: hashedPan,
      amount,
      paymentStatus: preauthReturnStatus ?? "unauthorized",
      paymentStatusMessage: responseMessage ?? "Request failed.",
    });

    return res.status(200).json(returnResponseData);
  } else if (paymentProvider == "littlepay") {
    return res.status(400).json({ message: "Invalid payment provider." });
  }
};

const purchase = async (payload, req, res) => {
  const {
    paymentProvider = null,
    sessionInfo: {
      sessionId: ocppTransactionId,
      currency,
      totalAmount: amount,
    },
    cardInfo: { pan: hashedPan },
    readerInfo: { deviceId, deviceType = "idtech_bdk_ctls", posCode = "27" },
  } = payload;

  if (!paymentProvider) {
    return res.status(400).json({ message: "Payment provider is required." });
  }

  const createdPurchaseLog = await PurchaseLogsModel.create({
    request: payload,
  });

  const purchaseLogId = createdPurchaseLog?._id;
  payload["purchaseLogId"] = purchaseLogId;

  // ==================================

  const ocppTransactionData = await OcppTransactionsRepository.findOne({
    where: { transactionUuid: ocppTransactionId },
  });

  const pendingPayment = await PaymentTransactionsRepository.findOne({
    where: { ocppTransactionId, status: "Pending" },
  });

  const transactionData = {
    ocppTransactionId,
    cpoId: ocppTransactionData?.cpoId,
    chargeBoxId: ocppTransactionData?.chargeBoxId,
    connectorId: ocppTransactionData?.connectorId,
    paymentProvider,
    timezone: ocppTransactionData?.timezone,
    country: ocppTransactionData?.country,
    dateTime: convertDateTimezone(DateTime.utc()),
    dateTimeLocal: convertDateTimezone(
      DateTime.utc(),
      ocppTransactionData?.timezone,
    ),
    purchaseAmount,
    purchaseCurrency,
    hashedPan,
    deviceId,
    deviceType,
    posCode,
    createdAtLocal: convertDateTimezone(
      DateTime.utc(),
      ocppTransactionData?.timezone,
    ),
  };

  let paymentTransactionId = null;

  if (pendingPayment) {
    await PaymentTransactionsRepository.update(
      pendingPayment.paymentTransactionId,
      transactionData,
    );
    paymentTransactionId = pendingPayment.paymentTransactionId;
  } else {
    const createdPaymentTransaction =
      await PaymentTransactionsRepository.save(transactionData);
    paymentTransactionId = createdPaymentTransaction?.paymentTransactionId;
  }

  payload["paymentTransactionId"] = paymentTransactionId;

  // ==================================

  if (paymentProvider == "moneris") {
    await monerisService.purchase(payload, req, res);
  } else {
    return res.status(400).json({ message: "Invalid payment provider." });
  }
};

const encHmac = async (payload, req, res) => {
  const key = "my-secure-key";
  const message = JSON.stringify(payload);

  const hmac = crypto.createHmac("sha256", key);
  hmac.update(message);
  const digest = hmac.digest("hex");

  res.status(200).json({ encryptedData: digest });
};

const encCmac = async (payload, req, res) => {
  const key = Buffer.from("1234567890abcdef", "utf8"); // 16 bytes key
  const message = JSON.stringify(payload);

  const cmac = aesCmac(key, message);

  res.status(200).json({ encryptedData: cmac.toString("hex") });
};

const parseEmvDataService = async (req, res) => {
  try {
    const { emv_data } = req.query;
    if (!emv_data) {
      return res.status(400).json({
        success: false,
        message: "Required EMV data",
      });
    }

    // now parse the emv data
    const parsedData = await parseTLV(emv_data);
    return res.status(200).json({ clear_tags: parsedData });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  calculateAmount,
  preauth,
  preauthComplete,
  preauthCancel,
  purchase,
  purchase2,
  encHmac,
  encCmac,
  parseEmvDataService,
  refund,
};
