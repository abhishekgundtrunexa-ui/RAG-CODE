const {
  PurchaseLogsModel,
  PreauthLogsModel,
} = require("@shared-libs/db/mongo-db");
const xml2js = require("xml2js");
const { default: axios } = require("axios");
const {
  PaymentTransactionsRepository,
  OcppTransactionsRepository,
} = require("@shared-libs/db/mysql");
const { sendDataToPusher } = require("@shared-libs/pusher");
const {
  PusherConstants,
  customErrorMsg,
  OcppEvents,
} = require("@shared-libs/constants");
const { OcppGenerateInvoiceQueue } = require("@shared-libs/queues");
const {
  convertDateTimezone,
  getChargerByIdentity,
  deepClone,
  getChargerPaymentConfig,
  hexToAscii,
  sendOcppEvent,
} = require("@shared-libs/helpers");
const { DateTime } = require("luxon");
const { v4: uuidv4 } = require("uuid");
const { CurrencyData } = require("@shared-libs/constants/country-currency");

const callMoneris = async (payload) => {
  const xmlBuilder = new xml2js.Builder({ rootName: "request" });
  const xmlPayload = xmlBuilder.buildObject(payload.request);

  const response = await axios.request({
    method: "post",
    maxBodyLength: Infinity,
    url: "https://esqa.moneris.com/gateway2/servlet/MpgRequest",
    headers: { "Content-Type": "application/xml" },
    data: xmlPayload,
  });

  let jsonResponse = null;
  let responseMessage = null;
  let responseCode = null;
  let transID = null;
  let preauthStatus = "Unauthorized";
  let preauthReturnStatus = "unauthorized";
  let emvAddReturnStatus = "failure";
  let preauthCompleteReturnStatus = "failure";
  let preauthCompleteStatus = "Rejected";

  if (response.data) {
    const xmlResponse = response.data;
    // Parse XML to JSON
    const xmlParser = new xml2js.Parser({
      explicitArray: false,
    });

    await xmlParser.parseString(xmlResponse, (err, result) => {
      if (err) {
        console.error("Error parsing XML:", err);
      } else {
        jsonResponse = result;
      }
    });

    if (jsonResponse?.response?.receipt) {
      const receiptData = jsonResponse?.response?.receipt;
      if (receiptData?.Message) {
        responseMessage = receiptData?.Message;
      }

      if (receiptData?.ResponseCode) {
        if (receiptData?.ResponseCode !== "null") {
          responseCode = receiptData?.ResponseCode;
          // Check if ResponseCode is less than or equal to 050
          if (
            !isNaN(receiptData?.ResponseCode) &&
            parseInt(receiptData?.ResponseCode, 10) < 50
          ) {
            preauthReturnStatus = "authorized";
            emvAddReturnStatus = "success";
            preauthCompleteReturnStatus = "success";
            preauthStatus = "Authorized";
            preauthCompleteStatus = "Approved";
          }
        }
      }
      if (receiptData?.TransID) {
        if (receiptData?.TransID !== "null") {
          transID = receiptData?.TransID;
        }
      }
    }
  }

  try {
    if (responseMessage) {
      if (responseMessage?.includes("APPROVED")) {
        responseMessage = "APPROVED";
      } else if (responseMessage?.includes("DECLINED")) {
        responseMessage = "DECLINED";
      } else if (responseMessage?.includes("Timed Out")) {
        responseMessage = "Transaction Not Completed";
      }
    }

    if (jsonResponse?.response?.receipt?.Message) {
      if (jsonResponse?.response?.receipt?.Message?.includes("APPROVED")) {
        jsonResponse.response.receipt.Message = "APPROVED";
      } else if (
        jsonResponse?.response?.receipt?.Message?.includes("DECLINED")
      ) {
        jsonResponse.response.receipt.Message = "DECLINED";
      } else if (
        jsonResponse?.response?.receipt?.Message?.includes("Timed Out")
      ) {
        jsonResponse.response.receipt.Message = "Transaction Not Completed";
      }
    }
  } catch (error) {}

  return {
    jsonResponse,
    responseMessage,
    responseCode,
    preauthStatus,
    preauthReturnStatus,
    emvAddReturnStatus,
    preauthCompleteReturnStatus,
    preauthCompleteStatus,
    transID,
  };
};

const reversal = async (payload) => {
  let {
    storeId: store_id = "monca10504",
    apiToken: api_token = "xJUqtSJX7F0KToUFO96l",
    cardInfo: { emvData: emv_data },

    pos_code,
    device_id,
    order_id,
    amount,
  } = payload;

  const jsonPayload = {
    request: {
      $: {
        time: new Date()
          .toISOString()
          .replace(/T/, "_")
          .replace(/:/g, "")
          .split(".")[0],
      },
      store_id,
      api_token,
      emv_purchase_reversal: {
        order_id,
        amount,
        emv_data,
        pos_code,
        device_id,
        reversal_type: "2",
      },
    },
  };

  const reversalRes = await callMoneris(jsonPayload);

  return { jsonPayload, ...reversalRes };
};

const purchase = async (payload) => {
  let {
    storeId: store_id = "monca10504",
    apiToken: api_token = "xJUqtSJX7F0KToUFO96l",
    cardInfo: { ksn, track2: track2Data, emvData: emv_data },

    device_type,
    pos_code,
    device_id,
    order_id,
    amount,
  } = payload;

  const entry_method = "H";
  const enc_track2 = `000000FF${ksn}${track2Data}`;

  const jsonPayload = {
    request: {
      $: {
        time: new Date()
          .toISOString()
          .replace(/T/, "_")
          .replace(/:/g, "")
          .split(".")[0],
      },
      store_id,
      api_token,
      enc_contactless_purchase: {
        order_id,
        amount,
        enc_track2,
        emv_data,
        device_type,
        pos_code,
        device_id,
        entry_method,
        status_check: false,
      },
    },
  };

  const paymentRes = await callMoneris(jsonPayload);

  try {
    if (paymentRes?.responseMessage === "Transaction Not Completed") {
      const reversalRes = await reversal(payload);

      if (paymentRes?.jsonResponse) {
        paymentRes.jsonResponse["reversalResponse"] = reversalRes;
      }
    }
  } catch (error) {}

  return { jsonPayload, ...paymentRes };
};

const purchase2 = async (payload) => {
  let {
    storeId: store_id = "monca10504",
    apiToken: api_token = "xJUqtSJX7F0KToUFO96l",
    cardInfo: { ksn, track2: track2Data, emvData: emv_data },

    device_type,
    pos_code,
    device_id,
    order_id,
    amount,
  } = payload;

  const entry_method = "H";
  const enc_track2 = `000000FF${ksn}${track2Data}`;

  const jsonPayload = {
    request: {
      $: {
        time: new Date()
          .toISOString()
          .replace(/T/, "_")
          .replace(/:/g, "")
          .split(".")[0],
      },
      store_id,
      api_token,
      enc_contactless_purchase: {
        order_id,
        amount,
        enc_track2,
        emv_data,
        device_type,
        pos_code,
        device_id,
        entry_method,
        status_check: false,
      },
    },
  };

  const paymentRes = await callMoneris(jsonPayload);

  return { jsonPayload, ...paymentRes };
};

const preauth = async (payload) => {
  let {
    storeId: store_id = "monca10504",
    apiToken: api_token = "xJUqtSJX7F0KToUFO96l",
    cardInfo: { ksn, track2: track2Data, emvData: emv_data },

    device_type,
    pos_code,
    device_id,
    order_id,
    amount,
  } = payload;

  const entry_method = "H";
  const enc_track2 = `000000FF${ksn}${track2Data}`;

  const jsonPayload = {
    request: {
      $: {
        time: new Date()
          .toISOString()
          .replace(/T/, "_")
          .replace(/:/g, "")
          .split(".")[0],
      },
      store_id,
      api_token,
      enc_contactless_preauth: {
        order_id,
        amount,
        enc_track2,
        emv_data,
        device_type,
        pos_code,
        device_id,
        entry_method,
        status_check: false,
      },
    },
  };

  const paymentRes = await callMoneris(jsonPayload);

  if (paymentRes?.responseMessage === "Transaction Not Completed") {
    try {
      if (paymentRes?.responseMessage === "Transaction Not Completed") {
        const reversalRes = await reversal(payload);

        if (paymentRes?.jsonResponse) {
          paymentRes.jsonResponse["reversalResponse"] = reversalRes;
        }
      }
    } catch (error) {}
  }

  return { jsonPayload, ...paymentRes };
};

const emvDataAdd = async (payload) => {
  let {
    storeId: store_id = "monca10504",
    apiToken: api_token = "xJUqtSJX7F0KToUFO96l",
    cardInfo: { emvData: emv_data },
    order_id,
    parsedEMV,
    txn_number,
  } = payload;

  let aid = parsedEMV["84"] ? parsedEMV["84"] : "";
  if (aid == "") {
    aid = parsedEMV["4F"] ? parsedEMV["4F"] : "";
  }

  const app_label = parsedEMV["50"] ? hexToAscii(parsedEMV["50"]) : "";
  const tvr_arqc = parsedEMV["95"] ? parsedEMV["95"] : "";
  const arqc = parsedEMV["9F26"] ? parsedEMV["9F26"] : "";
  const app_preferred_name = parsedEMV["9F12"]
    ? hexToAscii(parsedEMV["9F12"])
    : "";
  const tsi = parsedEMV["9B"] ? parsedEMV["9B"] : "";
  const service_code = parsedEMV["5F30"] ? parsedEMV["5F30"] : "";

  const jsonPayloadAddEmvSchema = {
    request: {
      $: {
        time: new Date()
          .toISOString()
          .replace(/T/, "_")
          .replace(/:/g, "")
          .split(".")[0],
      },
      store_id,
      api_token,
      emvdata_add: {
        order_id,
        txn_number,
        pan_entry: "H",
        cvm_indicator: "N",
        completion_data: btoa(emv_data),
      },
    },
  };

  let jsonPayloadAddEmv = deepClone(jsonPayloadAddEmvSchema);
  jsonPayloadAddEmv["request"]["emvdata_add"]["aid"] = aid;
  jsonPayloadAddEmv["request"]["emvdata_add"]["app_label"] = app_label;
  jsonPayloadAddEmv["request"]["emvdata_add"]["app_preferred_name"] =
    app_preferred_name;
  jsonPayloadAddEmv["request"]["emvdata_add"]["tvr_arqc"] = tvr_arqc;
  jsonPayloadAddEmv["request"]["emvdata_add"]["arqc"] = arqc;
  jsonPayloadAddEmv["request"]["emvdata_add"]["tsi"] = tsi;
  jsonPayloadAddEmv["request"]["emvdata_add"]["service_code"] = service_code;

  let {
    jsonResponse: jsonResponseAddEmv,
    responseCode: responseCodeAddEmv,
    responseMessage: responseMessageAddEmv,
    transID: transIDAddEmv,
    emvAddReturnStatus,
  } = await callMoneris(jsonPayloadAddEmv);

  if (emvAddReturnStatus === "failure") {
    jsonPayloadAddEmv = deepClone(jsonPayloadAddEmvSchema);
    let emvDataAddResTemp = await callMoneris(jsonPayloadAddEmv);

    jsonResponseAddEmv = emvDataAddResTemp.jsonResponse;
    responseCodeAddEmv = emvDataAddResTemp.responseCode;
    responseMessageAddEmv = emvDataAddResTemp.responseMessage;
    transIDAddEmv = emvDataAddResTemp.transID;
    emvAddReturnStatus = emvDataAddResTemp.emvAddReturnStatus;
  }

  return {
    jsonPayloadAddEmv,
    jsonResponseAddEmv,
    responseCodeAddEmv,
    responseMessageAddEmv,
    transIDAddEmv,
    emvAddReturnStatus,
  };
};

const preauthComplete = async (payload) => {
  let {
    storeId: store_id = "monca10504",
    apiToken: api_token = "xJUqtSJX7F0KToUFO96l",
    comp_amount,
    txn_number,
    orderId,
    description = null,
  } = payload;

  const jsonPayload = {
    request: {
      $: {
        time: new Date()
          .toISOString()
          .replace(/T/, "_")
          .replace(/:/g, "")
          .split(".")[0],
      },
      store_id,
      api_token,
      emv_completion: {
        order_id: orderId,
        txn_number,
        comp_amount,
      },
    },
  };

  if (description) {
    jsonPayload.request.emv_completion["dynamic_descriptor"] = description;
  }

  const paymentRes = await callMoneris(jsonPayload);

  return { jsonPayload, ...paymentRes };
};

const preauthCancel = async (payload) => {
  let {
    storeId: store_id = "monca10504",
    apiToken: api_token = "xJUqtSJX7F0KToUFO96l",
    comp_amount,
    txn_number,
    orderId,
  } = payload;

  comp_amount = "0.00";

  const jsonPayload = {
    request: {
      $: {
        time: new Date()
          .toISOString()
          .replace(/T/, "_")
          .replace(/:/g, "")
          .split(".")[0],
      },
      store_id,
      api_token,
      emv_completion: {
        order_id: orderId,
        txn_number,
        comp_amount,
        dynamic_descriptor: "Cancel",
      },
    },
  };

  const paymentRes = await callMoneris(jsonPayload);

  return { jsonPayload, ...paymentRes };
};

const refund = async (payload) => {
  let {
    storeId: store_id = "monca10504",
    apiToken: api_token = "xJUqtSJX7F0KToUFO96l",
    amount,
    txn_number,
    order_id,
  } = payload;

  const jsonPayload = {
    request: {
      $: {
        time: new Date()
          .toISOString()
          .replace(/T/, "_")
          .replace(/:/g, "")
          .split(".")[0],
      },
      store_id,
      api_token,
      refund: {
        order_id,
        amount,
        txn_number,
        crypt_type: "5",
      },
    },
  };

  const paymentRes = await callMoneris(jsonPayload);

  return { jsonPayload, ...paymentRes };
};

const purchase_old = async (payload, req, res) => {
  const {
    chargerInfo,
    paymentProvider,
    purchaseLogId,
    paymentTransactionId,
    storeId: store_id = "monca10504",
    apiToken: api_token = "xJUqtSJX7F0KToUFO96l",
    sessionInfo: { sessionId: order_id, totalAmount: amount, currency },
    cardInfo: { ksn, track2: track2Data, emvData: emv_data },
  } = payload;

  const entry_method = "H";

  const enc_track2 = `000000FF${ksn}${track2Data}`;

  const { chargeboxId: chargeBoxId } = chargerInfo;
  const charger = await getChargerByIdentity(chargeBoxId);
  if (!charger) {
    return res
      .status(404)
      .json({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
  }

  const { device_type, pos_code, device_id } = await getChargerPaymentConfig(
    charger.id
  );
  if (!device_id) {
    return res
      .status(400)
      .json({ message: "PaymentDeviceId Not Found From Payment Config." });
  }

  const jsonPayload = {
    request: {
      $: {
        time: new Date()
          .toISOString()
          .replace(/T/, "_")
          .replace(/:/g, "")
          .split(".")[0],
      },
      store_id,
      api_token,
      enc_contactless_purchase: {
        order_id,
        amount,
        enc_track2,
        emv_data,
        device_type,
        pos_code,
        entry_method,
        device_id,
        status_check: false,
      },
    },
  };

  const xmlBuilder = new xml2js.Builder({ rootName: "request" });
  const xmlPayload = xmlBuilder.buildObject(jsonPayload.request);

  const response = await axios.request({
    method: "post",
    maxBodyLength: Infinity,
    url: "https://esqa.moneris.com/gateway2/servlet/MpgRequest",
    headers: { "Content-Type": "application/xml" },
    data: xmlPayload,
  });

  // const returnResponseData = {
  //   paymentProvider,
  //   cgxTransactionId: order_id,
  //   providerTransactionId: null,
  //   cgxPaymentResponse: "Could not process the payment.",
  //   providerResponse: null,
  //   providerResponseCode: null,
  // };

  let currencyName = null;
  let currencySymbol = null;
  if (currency) {
    const currencyDetails = CurrencyData[currency] ?? null;

    if (currencyDetails) {
      currencyName = currencyDetails.name;
      currencySymbol = currencyDetails.symbol;
    }
  }

  const returnResponseData = {
    $schema: "http://json-schema.org/draft-04/schema#",
    id: "cgx:pay:0.1:2025:1:PurchaseResponse",
    title: "PurchaseResponse",
    chargerInfo,
    transactionInfo: {
      transactionId: null,
      sessionId: order_id,
      amount,
      paymentStatus: "failure",
      paymentStatusMessage: "Request Failed",
      timestamp: convertDateTimezone(DateTime.utc()),
      currency,
      currencyName,
      currencySymbol,
    },
  };

  let jsonResponse = null;
  let purchaseStatus = "Rejected";
  let purchaseRefId = null;
  let purchaseResponse = null;
  let purchaseResponseCode = null;

  if (response.data) {
    const xmlResponse = response.data;
    // Parse XML to JSON
    const xmlParser = new xml2js.Parser({
      explicitArray: false,
    });

    await xmlParser.parseString(xmlResponse, (err, result) => {
      if (err) {
        console.error("Error parsing XML:", err);
      } else {
        jsonResponse = result;
      }
    });

    if (jsonResponse?.response?.receipt) {
      const receiptData = jsonResponse?.response?.receipt;
      if (receiptData?.Message) {
        // returnResponseData.providerResponse = receiptData?.Message;
        purchaseResponse = receiptData?.Message;
        returnResponseData.transactionInfo.paymentStatusMessage =
          receiptData?.Message;
      }
      if (receiptData?.ResponseCode) {
        if (receiptData?.ResponseCode !== "null") {
          // returnResponseData.providerResponseCode = receiptData?.ResponseCode;
          purchaseResponseCode = receiptData?.ResponseCode;

          // Check if ResponseCode is less than or equal to 050
          if (
            !isNaN(receiptData?.ResponseCode) &&
            parseInt(receiptData?.ResponseCode, 10) < 50
          ) {
            returnResponseData.transactionInfo.paymentStatus = "success";
            // returnResponseData.cgxPaymentResponse = "Transaction is accepted.";
            purchaseStatus = "Accepted";
          } else {
            returnResponseData.transactionInfo.paymentStatus = "failure";
            // returnResponseData.cgxPaymentResponse = "Transaction is declined.";
          }
        }
      }
      if (receiptData?.TransID) {
        if (receiptData?.TransID !== "null") {
          returnResponseData.transactionInfo.transactionId =
            receiptData?.TransID;
          purchaseRefId = receiptData?.TransID;
          // returnResponseData.providerTransactionId = receiptData?.TransID;
        }
      }
    }
  }

  await PurchaseLogsModel.findByIdAndUpdate(purchaseLogId, {
    response: returnResponseData,
    providerResponse: jsonResponse,
    providerRequest: jsonPayload,
    paymentProvider,
    transactionId: order_id,
  });

  if (paymentTransactionId) {
    await PaymentTransactionsRepository.update(paymentTransactionId, {
      purchaseStatus,
      status: "Processed",
      purchaseRefId,
      purchaseResponse,
      purchaseResponseCode,
    });

    const updatedPaymentTransaction =
      await PaymentTransactionsRepository.findOne({
        where: { paymentTransactionId },
      });

    try {
      await sendOcppEvent(
        updatedPaymentTransaction.chargeBoxId,
        OcppEvents.DataTransfer,
        {
          vendorId: "chargnex",
          messageId: "paymentStatus",
          data: JSON.stringify({
            ocppTransactionId: updatedPaymentTransaction?.ocppTransactionId,
            status: purchaseStatus,
          }),
        }
      );
    } catch (error) {
      console.log("🚀 -----------------🚀");
      console.log("🚀 ~ error:", error);
      console.log("🚀 -----------------🚀");
    }

    if (purchaseStatus === "Accepted") {
      const transactionData = await OcppTransactionsRepository.findOne({
        where: {
          transactionUuid: updatedPaymentTransaction?.ocppTransactionId,
        },
      });

      await OcppTransactionsRepository.update(
        updatedPaymentTransaction?.ocppTransactionId,
        {
          meterStop: updatedPaymentTransaction?.meterStop,
          endTime: updatedPaymentTransaction?.requestedAt,
          endTimeLocal: convertDateTimezone(
            DateTime.fromJSDate(updatedPaymentTransaction?.requestedAt),
            transactionData?.timezone ?? "UTC"
          ),
          paymentStatus: "Accepted",
        }
      );

      const updatedTransaction = await OcppTransactionsRepository.findOne({
        where: {
          transactionUuid: updatedPaymentTransaction?.ocppTransactionId,
        },
      });

      await sendDataToPusher({
        channelName: PusherConstants.channels.PUSHER_NODE_APP,
        eventName: PusherConstants.events.transaction.TRANSACTION_UPDATED,
        data: { transactionUuid: updatedPaymentTransaction?.ocppTransactionId },
      });

      if (updatedTransaction?.cpoId) {
        await sendDataToPusher({
          channelName: updatedTransaction.cpoId,
          eventName: PusherConstants.events.transaction.TRANSACTION_UPDATED,
          data: {
            transactionUuid: updatedPaymentTransaction?.ocppTransactionId,
          },
        });
      }

      await OcppGenerateInvoiceQueue.add(
        {
          transactionUuid: updatedTransaction.transactionUuid,
          sendDataTransfer: true,
        },
        { delay: 500 }
      );

      try {
        await sendOcppEvent(
          updatedPaymentTransaction.chargeBoxId,
          OcppEvents.RemoteStopTransaction,
          { transactionId: Number(updatedTransaction?.chargerTransactionId) }
        );
      } catch (error) {}
    }
  }

  res.status(200).json(returnResponseData);
};

module.exports = {
  preauth,
  emvDataAdd,
  preauthComplete,
  preauthCancel,
  refund,
  purchase,
  purchase2,
};
