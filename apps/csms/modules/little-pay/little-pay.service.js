const {
  PaymentAuthorizeModel,
  PaymentCaptureModel,
  PreauthCompleteLogsModel,
  PurchaseLogsModel,
} = require("@shared-libs/db/mongo-db");
const fs = require("fs");
const { default: axios } = require("axios");
const https = require("https");
const {
  generateLittlepayCertificates,
  downloadCertificates,
} = require("@shared-libs/littlepay-helper");
const { getConfigConstants } = require("@shared-libs/helpers");

const authorizeWebhook = async (payload, req, res) => {
  try {
    try {
      if (payload?.type == "charge.settlement.status") {
        const fundingSourceId = payload?.data_object?.funding_source_id;
        const transactionId = payload?.data_object?.transaction_id;

        if (fundingSourceId && transactionId) {
          await PreauthCompleteLogsModel.updateMany(
            { "providerResponse.transaction_id": transactionId },
            { $set: { "providerResponse.funding_source_id": fundingSourceId } }
          );

          await PurchaseLogsModel.updateMany(
            { "providerResponse.transaction_id": transactionId },
            { $set: { "providerResponse.funding_source_id": fundingSourceId } }
          );
        }
      }
    } catch (error) {}

    await PaymentAuthorizeModel.create({
      data: payload,
    });
  } catch (error) {}

  return res.status(200).json({ ok: true });
};

const captureWebhook = async (payload, req, res) => {
  try {
    try {
      if (payload?.type == "charge.settlement.status") {
        const fundingSourceId = payload?.data_object?.funding_source_id;
        const transactionId = payload?.data_object?.transaction_id;

        if (fundingSourceId && transactionId) {
          await PreauthCompleteLogsModel.updateMany(
            { "providerResponse.transaction_id": transactionId },
            { $set: { "providerResponse.funding_source_id": fundingSourceId } }
          );

          await PurchaseLogsModel.updateMany(
            { "providerResponse.transaction_id": transactionId },
            { $set: { "providerResponse.funding_source_id": fundingSourceId } }
          );
        }
      }
    } catch (error) {}

    await PaymentCaptureModel.create({
      data: payload,
    });
  } catch (error) {}

  return res.status(200).json({ ok: true });
};

const generateCertificates = async (payload, req, res) => {
  try {
    const { keyName } = payload;
    if (!keyName) {
      return res.status(400).json({ error: "Key name is required" });
    }

    const response = await generateLittlepayCertificates(keyName);

    return res.status(response.code).json(response.data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const createTransaction = async (payload, req, res) => {
  try {
    const { keyName } = payload;
    if (!keyName) {
      return res.status(400).json({ error: "Key name is required" });
    }

    delete payload.keyName;

    const { KEY_BASE_PATH, KEY_PATH, CRT_PATH } = await downloadCertificates(
      keyName,
      "keys"
    );

    // Load certificate and key
    const httpsAgent = new https.Agent({
      cert: fs.readFileSync(CRT_PATH), // Ensure this is the correct path
      key: fs.readFileSync(KEY_PATH),
      passphrase: "Trunexa@2024", // Add only if the key is encrypted
    });

    let littlePayBaseUrl = await getConfigConstants(["LittlePayBaseUrl"]);
    littlePayBaseUrl =
      littlePayBaseUrl ?? "https://qa.au.payments.littlepay.com";

    const url = `${littlePayBaseUrl}/device/v1/littlepay/${keyName}/transactions`;

    const response = await axios
      .post(url, payload, {
        httpsAgent,
        headers: { "Content-Type": "application/json" },
      })
      .then((response) => {
        fs.rmSync(KEY_BASE_PATH, { recursive: true, force: true });
        return res.json(response.data);
      })
      .catch((error) => {
        fs.rmSync(KEY_BASE_PATH, { recursive: true, force: true });

        return res
          .status(error?.response?.status ?? 400)
          .json({ error: error?.response?.statusText ?? "Error occurred" });
      });
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error:", error);
    console.log("🚀 -----------------🚀");
    return res.status(500).json({ error: error.message });
  }
};

const chargeTransaction = async (payload, req, res) => {
  try {
    const { keyName, transactionId } = payload;
    if (!keyName) {
      return res.status(400).json({ error: "Key name is required" });
    }
    if (!transactionId) {
      return res.status(400).json({ error: "transactionId is required" });
    }

    delete payload.keyName;
    delete payload.transactionId;

    const { KEY_BASE_PATH, KEY_PATH, CRT_PATH } = await downloadCertificates(
      keyName,
      "keys"
    );

    // Load certificate and key
    const httpsAgent = new https.Agent({
      cert: fs.readFileSync(CRT_PATH), // Ensure this is the correct path
      key: fs.readFileSync(KEY_PATH),
      passphrase: "Trunexa@2024", // Add only if the key is encrypted
    });

    let littlePayBaseUrl = await getConfigConstants(["LittlePayBaseUrl"]);
    littlePayBaseUrl =
      littlePayBaseUrl ?? "https://qa.au.payments.littlepay.com";

    const url = `${littlePayBaseUrl}/device/v1/littlepay/${keyName}/transactions/${transactionId}/charges`;

    await axios
      .post(url, payload, {
        httpsAgent,
        headers: { "Content-Type": "application/json" },
      })
      .then((response) => {
        fs.rmSync(KEY_BASE_PATH, { recursive: true, force: true });
        return res.json(response.data);
      })
      .catch((error) => {
        fs.rmSync(KEY_BASE_PATH, { recursive: true, force: true });
        return res
          .status(error?.response?.status ?? 400)
          .json({ error: error?.response?.statusText ?? "Error occurred" });
      });
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error:", error);
    console.log("🚀 -----------------🚀");
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  authorizeWebhook,
  captureWebhook,
  generateCertificates,
  createTransaction,
  chargeTransaction,
};
