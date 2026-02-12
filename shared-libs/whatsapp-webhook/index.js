const axios = require("axios");
const { WhatsappWebhookLogsModel } = require("@shared-libs/db/mongo-db");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const webHookUrls = {
  RESERVATION: "/api/chargenex/reservation",
  SESSION_COMPLETED: "/api/chargenex/session",
  PAYMENT_STATUS: "/api/chargenex/payment",
  REFUND: "/api/notifications/refund",
};

const baseUrl = process.env.WHATSAPP_WEBHOOK_BASE_URL;
const TOKEN = process.env.WHATSAPP_WEBHOOK_TOKEN;

const sendWhatsappWebhook = async (url, webHookData) => {
  let isSent = true;
  try {
    await axios.post(url, webHookData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
    });
  } catch (e) {
    isSent = false;
    // console.log("Error sendWhatsappWebhook: ", e);
  }

  await WhatsappWebhookLogsModel.create({
    url,
    data: webHookData,
    isSent,
  });

  return true;
};

const sendReservationWebhook = async (webHookData) => {
  // EXAMPLE
  // {
  //   "mobileNumber": "919876543210",
  //   "chargeBoxId": "CB-123",
  //   "bookingId": "BID-456",
  //   "bookingTime": "2023-11-15 14:30",
  //   "evseStationAddress": "123 Green Street, Charge City"
  // }

  const url = `${baseUrl}${webHookUrls.RESERVATION}`;

  try {
    await sendWhatsappWebhook(url, webHookData);
  } catch (e) {
    console.log("Error sendReservationConfirmationWebhook: ", e);
  }

  return true;
};

const sendSessionStartWebhook = async (webHookData) => {
  // EXAMPLE
  // {
  //   "mobileNumber": "919876543210",
  //   "chargeBoxId": "CB-123",
  //   "sessionId": "SESS-101",
  //   "status": "started",
  //   "invoicePdfUrl": null,
  //   "refund": null
  // }

  const url = `${baseUrl}${webHookUrls.SESSION_COMPLETED}`;

  try {
    await sendWhatsappWebhook(url, webHookData);
  } catch (e) {
    console.log("Error sendSessionStartWebhook: ", e);
  }

  return true;
};

const sendSessionCompleteWebhook = async (webHookData) => {
  // EXAMPLE
  // {
  //   "mobileNumber": "919876543210",
  //   "chargeBoxId": "CB-123",
  //   "sessionId": "SESS-101",
  //   "status": "finished",
  //   "invoicePdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  //   "refund": null
  // }

  const url = `${baseUrl}${webHookUrls.SESSION_COMPLETED}`;

  try {
    await sendWhatsappWebhook(url, webHookData);
  } catch (e) {
    console.log("Error sendSessionCompleteWebhook: ", e);
  }

  return true;
};

const sendPaymentStatusWebhook = async (webHookData) => {
  // EXAMPLE
  // {
  //   "mobileNumber": "919876543210",
  //   "chargeBoxId": "CB-123",
  //   "amount": 500.00,
  //   "transactionId": "TXN-7890",
  //   "transactionDateTime": "2023-11-15 15:00:00",
  //   "paymentStatus": "Success",
  //   "sessionId": "SESS-101"
  // }
  const url = `${baseUrl}${webHookUrls.PAYMENT_STATUS}`;

  try {
    await sendWhatsappWebhook(url, webHookData);
  } catch (e) {
    console.log("Error sendSessionCompleteWebhook: ", e);
  }

  return true;
};

const sendRefundWebhook = async (webHookData) => {
  // EXAMPLE
  // {
  //   "phone": "919876543210",
  //   "amount": 500,
  //   "reason": "Charging session could not be started"
  // }

  const url = `${baseUrl}${webHookUrls.REFUND}`;

  try {
    await sendWhatsappWebhook(url, webHookData);
  } catch (e) {
    console.log("Error sendSessionCompleteWebhook: ", e);
  }

  return true;
};

module.exports = {
  sendReservationWebhook,
  sendSessionCompleteWebhook,
  sendSessionStartWebhook,
  sendPaymentStatusWebhook,
  sendRefundWebhook,
};
