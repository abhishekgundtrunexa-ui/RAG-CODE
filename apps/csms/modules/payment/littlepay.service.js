const fs = require("fs");
const https = require("https");
const { default: axios } = require("axios");
const { parseTLV, getConfigConstants } = require("@shared-libs/helpers");
const { DateTime } = require("luxon");
const { downloadCertificates } = require("@shared-libs/littlepay-helper");

const callLittlePay = async (urlPath, keyName, payload) => {
  const { KEY_BASE_PATH, KEY_PATH, CRT_PATH } = await downloadCertificates(
    keyName,
    "keys"
  );

  let littlePayBaseUrl = await getConfigConstants(["LittlePayBaseUrl"]);
  littlePayBaseUrl = littlePayBaseUrl ?? "https://qa.au.payments.littlepay.com";

  const url = `${littlePayBaseUrl}${urlPath}`;

  let jsonResponse = null;
  let responseMessage = null;
  let responseCode = null;
  let transID = null;
  let preauthStatus = "Unauthorized";
  let preauthReturnStatus = "unauthorized";
  let preauthCompleteReturnStatus = "failure";
  let preauthCompleteStatus = "Rejected";

  try {
    // Load certificate and key
    const httpsAgent = new https.Agent({
      cert: fs.readFileSync(CRT_PATH), // Ensure this is the correct path
      key: fs.readFileSync(KEY_PATH),
      passphrase: "Trunexa@2024", // Add only if the key is encrypted
    });

    const response = await axios.post(url, payload, {
      httpsAgent,
      headers: { "Content-Type": "application/json" },
    });

    if (response.data) {
      jsonResponse = response.data;
      // console.log("🚀 -------------------------------🚀");
      // console.log("🚀 ~ LITTLEPAY url:", url);
      // console.log("🚀 ~ LITTLEPAY payload:", payload);
      // console.log("🚀 ~ LITTLEPAY jsonResponse:", jsonResponse);
      // console.log("🚀 -------------------------------🚀");

      if (jsonResponse?.error) {
        // console.log("🚀 -----------------🚀");
        // console.log("🚀 ~ LITTLEPAY url:", url);
        // console.log("🚀 ~ LITTLEPAY payload:", JSON.stringify(payload));
        // console.log("🚀 ---------------------------------------------------🚀");
        // console.log("🚀 ~ LITTLEPAY jsonResponse:", response);
        // console.log("🚀 -----------------🚀");

        responseMessage = jsonResponse?.error;
        responseCode = 409;
      } else if (jsonResponse?.transaction_id) {
        transID = jsonResponse?.transaction_id;
        responseMessage = jsonResponse?.authorisation_response_status;
        if (jsonResponse?.authorisation_response_status == "AUTHORISED") {
          responseCode = 200;
          preauthStatus = "Authorized";
          preauthReturnStatus = "authorized";
          preauthCompleteReturnStatus = "success";
          preauthCompleteStatus = "Approved";
        } else {
          responseCode = 400;
          preauthStatus = "Unauthorized";
          preauthReturnStatus = "unauthorized";
          preauthCompleteReturnStatus = "failure";
          preauthCompleteStatus = "Rejected";
        }
      }
    }
  } catch (error) {
    // console.log("🚀 -----------------🚀");
    // console.log("🚀 ~ LITTLEPAY url:", url);
    // console.log("🚀 ~ LITTLEPAY payload:", JSON.stringify(payload));
    // console.log("🚀 ---------------------------------------------------🚀");
    // console.log("🚀 ~ LITTLEPAY error:", error);
    // console.log("🚀 ~ LITTLEPAY error?.data:", error?.response?.data);
    // console.log("🚀 ~ LITTLEPAY error?.message:", error?.message);
    // console.log("🚀 -----------------🚀");

    responseMessage = error?.message ?? "Bad Request";
    responseCode = error?.status ?? 400;
  }

  try {
    fs.rmSync(KEY_BASE_PATH, { recursive: true, force: true });
  } catch (error) {}

  return {
    jsonResponse,
    responseMessage,
    responseCode,
    preauthStatus,
    preauthReturnStatus,
    preauthCompleteReturnStatus,
    preauthCompleteStatus,
    transID,
  };
};

const preauth = async (payload) => {
  let {
    cardInfo: { ksn: dukpt_ksn, track2: cipher_text, emvData: emv_data },
    device_id,
    order_id,
    amount,
  } = payload;

  const parsedEMV = await parseTLV(emv_data, false, true);

  const jsonPayload = {
    device_transaction_id: order_id,
    transaction_date_time: DateTime.utc().toISO(),
    emv: {
      outcome: {
        action: "approve",
        reason_code: "",
      },
      clear_tags: parsedEMV,
      encrypted_tags: {
        dukpt_ksn,
        cipher_text,
      },
    },
    point_of_sale: {
      capabilities: "contactless_only",
      authentication: "no_pin",
      environment: "unattended",
    },
    processing: {
      capture_method: "manual",
      authorisation_type: "pre_authorisation",
      allow_partial_approval: true,
    },
    purchase: {
      purchase_id: order_id,
      description: order_id,
      amount: Number(amount) * 100,
    },
  };

  const paymentRes = await callLittlePay(
    `/device/v1/littlepay/${device_id}/transactions`,
    device_id,
    jsonPayload
  );

  return { jsonPayload, ...paymentRes };
};

const preauthComplete = async (payload) => {
  let { comp_amount, device_id, orderId, description } = payload;

  const jsonPayload = {
    purchase_id: orderId,
    description: orderId,
    amount: parseFloat((Number(comp_amount) * 100).toFixed(2)),
    transaction_date_time: DateTime.utc().toISO(),
  };

  if (description) {
    jsonPayload["description"] = description;
  }

  const paymentRes = await callLittlePay(
    `/device/v1/littlepay/${device_id}/transactions/${orderId}/charges`,
    device_id,
    jsonPayload
  );

  return { jsonPayload, ...paymentRes };
};

const preauthCancel = async (payload) => {
  let { comp_amount, device_id, orderId } = payload;

  const jsonPayload = {
    amount: parseFloat((Number(comp_amount) * 100).toFixed(2)),
    transaction_date_time: DateTime.utc().toISO(),
  };

  const paymentRes = await callLittlePay(
    `/device/v1/littlepay/${device_id}/transactions/${orderId}/reversals`,
    device_id,
    jsonPayload
  );

  return { jsonPayload, ...paymentRes };
};

const refund = async (payload) => {
  let { funding_source_id, charge_id, amount } = payload;
  const baseUrl = "https://backoffice.qa.littlepay.com/api/v1";

  let jsonPayload = {
    funding_source_id,
    charge_id,
    amount: parseFloat((Number(amount) * 100).toFixed(2)),
    currency: "EUR",
    awaiting_approval: false,
    reason: "-",
  };

  let jsonResponse = null;
  let responseMessage = "Bad Request";
  let responseCode = 400;
  let transID = charge_id;
  let preauthCompleteReturnStatus = "failure";
  let preauthCompleteStatus = "Rejected";

  try {
    const tokenResponse = await axios.post(
      `${baseUrl}/oauth/token`,
      {
        client_id: "oypkRCpX69lVYIBlDuTpni9r3JpnAWeb",
        client_secret:
          "JVZ1MT0JKY21O4d-zd2jpH_wbtpy7NcJX5OlEOrJ18liNFkMgSN0bfEHh_LJUFQQ",
        audience:
          "backoffice.qa.littlepay.com/ba78db34-60f2-48f2-a84f-2ea2ef04402d",
        grant_type: "client_credentials",
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    let accessToken = null;
    if (tokenResponse?.data) {
      accessToken = tokenResponse?.data?.access_token;
    }

    if (accessToken) {
      const response = await axios.post(
        `${baseUrl}/refunds`,
        {
          funding_source_id,
          charge_id,
          amount: parseFloat((Number(amount) * 100).toFixed(2)),
          currency: "EUR",
          awaiting_approval: false,
          reason: "-",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: accessToken,
          },
        }
      );

      if (response.status == 202) {
        responseMessage = "Refund Approved.";
        responseCode = 202;

        preauthCompleteReturnStatus = "success";
        preauthCompleteStatus = "Approved";
      }
    }
  } catch (error) {
    if (error?.response?.data?.errors?.length > 0) {
      responseMessage =
        error?.response?.data?.errors[0]?.detail ?? "Bad Request";
      responseCode = error?.status ?? 400;
    }
  }

  const returnData = {
    jsonResponse,
    responseMessage,
    responseCode,
    preauthCompleteReturnStatus,
    preauthCompleteStatus,
    transID,
    jsonPayload,
  };

  return returnData;
};

module.exports = {
  preauth,
  preauthComplete,
  preauthCancel,
  refund,
};
