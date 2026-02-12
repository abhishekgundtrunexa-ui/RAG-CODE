const { DateTime } = require("luxon");
const {
  OcppTransactionsRepository,
  ChargerRepository,
  PaymentTransactionsRepository,
} = require("@shared-libs/db/mysql");
const { customErrorMsg } = require("@shared-libs/constants");
const {
  getChargerByIdentity,
  getOcppIdTag,
  getOrderId,
  convertDateTimezone,
  getPaymentTransaction,
  getOcppTransactionCalculation,
  roundToNextFigure,
} = require("@shared-libs/helpers");
const {
  PreauthLogsModel,
  EmvDataAddLogsModel,
  PreauthCompleteLogsModel,
} = require("@shared-libs/db/mongo-db");
const { generateInvoice } = require("@shared-libs/pdf");
const { SyncRevenueQueue } = require("@shared-libs/queues");

const addTransactionTestData = async (payload, req, res) => {
  let {
    chargeBoxId = null,
    connectorId = null,
    startTime = null,
    endTime = null,
    meterStart = null,
    meterStop = null,
    paymentProvider = "moneris",
    cardType = "visa",
    maskedPan = null,
  } = payload;

  if (
    chargeBoxId === null ||
    connectorId === null ||
    startTime === null ||
    endTime === null ||
    meterStart === null ||
    meterStop === null ||
    maskedPan === null
  ) {
    return res.status(400).json({ message: "Please provide a valid data." });
  }

  const cardTypeKey = cardType.replace(/\s/g, "").toLowerCase();

  const cardTypeObj = {
    visa: "V",
    mastercard: "M",
    amex: "AX",
    americanexpress: "AX",
    jcb: "C1",
    discover: "NO",
    interac: "P",
    interacflash: "P",
  };

  const cardTypeData = cardTypeObj[cardTypeKey] ?? "V";

  const charger = await getChargerByIdentity(chargeBoxId);
  if (!charger) {
    return res
      .status(400)
      .json({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
  }

  // ==============

  const timezone = charger?.timezone ?? "UTC";
  const idTag = await getOcppIdTag();

  const transactionCount = Number(charger?.latestTransactionId ?? 0);

  const createTransactionData = {
    orderId: getOrderId(),
    cpoId: charger?.cpoId,
    chargerTransactionId: transactionCount + 1,
    connectorId,
    chargeBoxId,
    evseStationId: charger?.evseStationId,
    idTag,
    hashedPan: idTag,
    timezone,
    country: charger?.country,
    meterStart,
    meterStop,
    startTime,
    endTime,
    paymentStatus: "Accepted",
    transactionStatus: "finished",
    paymentMessage: "APPROVED",
    paymentType: "Capture",
    isPaid: true,
    isFinished: true,
    isTestTransaction: true,
    chargingSessionDate: convertDateTimezone(
      DateTime.fromFormat(startTime, "yyyy-MM-dd HH:mm:ss", { zone: "utc" }),
      "UTC",
      "yyyy-MM-dd"
    ),
  };

  if (timezone) {
    try {
      createTransactionData["createdAtLocal"] = convertDateTimezone(
        DateTime.utc(),
        timezone
      );

      createTransactionData["startTimeLocal"] = convertDateTimezone(
        DateTime.fromFormat(startTime, "yyyy-MM-dd HH:mm:ss", { zone: "utc" }),
        timezone
      );

      createTransactionData["endTimeLocal"] = convertDateTimezone(
        DateTime.fromFormat(endTime, "yyyy-MM-dd HH:mm:ss", { zone: "utc" }),
        timezone
      );
    } catch (error) {}
  }

  let ocppTransactionData = await OcppTransactionsRepository.save(
    createTransactionData
  );

  if (charger) {
    await ChargerRepository.update(charger.id, {
      latestTransactionId: transactionCount + 1,
    });
  }

  const transactionUuid = ocppTransactionData?.transactionUuid;

  const {
    data: { netAmount, currency, currencyName, currencySymbol },
  } = await getOcppTransactionCalculation(transactionUuid);

  const preAuthAmount = roundToNextFigure(netAmount);

  const paymentTransactionData = await getPaymentTransaction({
    ocppTransactionData,
    amount: preAuthAmount,
    currency,
    hashedPan: idTag,
    idTag,
    deviceId: "TEST001",
    deviceType: "TEST001",
    posCode: "TEST001",
    paymentProvider,
  });

  const paymentTransactionId = paymentTransactionData?.paymentTransactionId;

  await PaymentTransactionsRepository.update(paymentTransactionId, {
    preauthStatus: "Authorized",
    preauthRefId: "TEST001",
    preauthResponse: "Authorized",
    preauthResponseCode: "200",
    evmDataAddResponse: "Authorized",
    evmDataAddResponseCode: "200",
    status: "Processed",
    preauthCompleteAmount: netAmount,
    preauthCompleteCurrency: currency,
    preauthCompleteStatus: "Approved",
    preauthCompleteRefId: "TEST001",
    preauthCompleteResponse: "Approved",
    preauthCompleteResponseCode: "200",
  });

  // ============================

  const preAuthRequest = {
    $schema: "http://json-schema.org/draft-04/schema#",
    id: "cgx:pay:0.1:2025:1:PeauthRequest",
    title: "PeauthRequest",
    paymentProvider,
    cardInfo: {
      encryptedTrack2: "true",
      pan: ocppTransactionData?.hashedPan,
      maskedPan,
      cardType,
    },
    chargerInfo: {
      serialNumber: charger?.serialNumber,
      chargeboxId: charger?.chargeBoxId,
      connectorId: ocppTransactionData?.connectorId,
    },
    sessionInfo: {
      sessionId: ocppTransactionData?.transactionUuid,
      totalAmount: preAuthAmount,
      currency,
    },
  };
  const paymentResponse = {
    $schema: "http://json-schema.org/draft-04/schema#",
    id: "cgx:pay:0.1:2025:1:PreauthResponse",
    title: "PreauthResponse",
    chargerInfo: {
      serialNumber: charger?.serialNumber,
      chargeboxId: charger?.chargeBoxId,
      connectorId: ocppTransactionData?.connectorId,
    },
    transactionInfo: {
      transactionId: "TEST001",
      sessionId: ocppTransactionData?.transactionUuid,
      idTag: ocppTransactionData?.hashedPan,
      amount: preAuthAmount,
      paymentStatus: "authorized",
      paymentStatusMessage: "APPROVED",
      timestamp: ocppTransactionData?.createdAt,
      timestampLocal: ocppTransactionData?.createdAtLocal,
      timezone: ocppTransactionData?.timezone,
      country: ocppTransactionData?.country,
      currency: currency,
      currencyName: currencyName,
      currencySymbol: currencySymbol,
    },
  };
  const providerRequest = {
    request: {
      store_id: "monca10504",
      api_token: "xJUqtSJX7F0KToUFO96l",
      enc_contactless_preauth: {
        order_id: ocppTransactionData?.orderId,
        amount: preAuthAmount,
        enc_track2: "",
        emv_data: "",
        device_type: "idtech_bdk_ctls",
        pos_code: "27",
        device_id: "N0000013",
        entry_method: "H",
        status_check: false,
      },
    },
  };
  const providerResponse = {
    response: {
      receipt: {
        ReceiptId: ocppTransactionData?.orderId,
        ReferenceNum: "TEST001",
        Complete: "true",
        Message: "APPROVED",
        TransAmount: preAuthAmount,
        CardType: cardTypeData,
        TransID: "TEST001",
        MaskedPan: maskedPan,
      },
    },
  };

  await PreauthLogsModel.create({
    paymentProvider,
    transactionId: ocppTransactionData?.transactionUuid,
    request: preAuthRequest,
    response: paymentResponse,
    providerRequest,
    providerResponse,
  });

  const emvAddRequest = { ...preAuthRequest };
  emvAddRequest["id"] = "cgx:pay:0.1:2025:1:EmvDataAddRequest";
  emvAddRequest["title"] = "EmvDataAddRequest";

  await EmvDataAddLogsModel.create({
    paymentProvider,
    transactionId: ocppTransactionData?.transactionUuid,
    request: emvAddRequest,
    response: paymentResponse,
    providerRequest,
    providerResponse,
  });

  const captureRequest = { ...preAuthRequest };
  captureRequest["id"] = "cgx:pay:0.1:2025:1:PreauthCompleteRequest";
  captureRequest["title"] = "PreauthCompleteRequest";
  captureRequest["sessionInfo"]["totalAmount"] = netAmount;

  const captureResponse = { ...paymentResponse };
  captureResponse["id"] = "cgx:pay:0.1:2025:1:PurchaseResponse";
  captureResponse["title"] = "cgx:pay:0.1:2025:1:PurchaseResponse";
  captureResponse["transactionInfo"]["paymentStatus"] = "success";
  captureResponse["transactionInfo"]["amount"] = netAmount;

  const captureProviderRequest = {
    request: {
      store_id: "monca10504",
      api_token: "xJUqtSJX7F0KToUFO96l",
      emv_completion: {
        order_id: ocppTransactionData?.orderId,
        txn_number: "TEST001",
        comp_amount: netAmount,
      },
    },
  };
  const captureProviderResponse = {
    response: {
      receipt: {
        ReceiptId: ocppTransactionData?.orderId,
        ReferenceNum: "TEST001",
        Complete: "true",
        Message: "APPROVED",
        TransAmount: netAmount,
        CardType: cardTypeData,
        TransID: "TEST001",
        MaskedPan: maskedPan,
      },
    },
  };
  await PreauthCompleteLogsModel.create({
    paymentProvider,
    transactionId: ocppTransactionData?.transactionUuid,
    request: captureRequest,
    response: captureResponse,
    providerRequest: captureProviderRequest,
    providerResponse: captureProviderResponse,
  });

  // Updating Charger Revenue.
  try {
    await SyncRevenueQueue.add(
      {
        transactionUuid: ocppTransactionData?.transactionUuid,
      },
      { delay: 500 }
    );
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ REV error:", error);
    console.log("🚀 -----------------🚀");
  }

  try {
    await generateInvoice(ocppTransactionData?.transactionUuid);
  } catch (error) {}

  res.status(200).json(ocppTransactionData);
};

module.exports = {
  addTransactionTestData,
};
