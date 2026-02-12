const { AuropayWebhookModel } = require("@shared-libs/db/mongo-db");
const { hitAuropayApi } = require("@shared-libs/paynex");

const webhook = async (payload, req, res) => {
  // try {
  //   await AuropayWebhookModel.create({
  //     data: payload,
  //   });
  // } catch (error) {}

  return res.status(200).json({ ok: true });
};

const getTransaction = async (req, res) => {
  try {
    const transactionId = req?.body?.transactionId;
    if (transactionId) {
      const auropayRes = await hitAuropayApi({
        method: "GET",
        endpoint: `payments/${transactionId}`,
      });

      return res.status(auropayRes.code).json(auropayRes.data);
    }
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ AuroPay getTransaction error:", error);
    console.log("🚀 -----------------🚀");
  }

  return res
    .status(400)
    .json({ message: "Invalid Transaction ID (Not from AuroPay)" });
};

const refund = async (req, res) => {
  try {
    const {
      transactionId,
      amount = 0,
      remarks = "Charging Completed",
    } = req?.body;

    if (transactionId) {
      const auropayRes = await hitAuropayApi({
        method: "POST",
        endpoint: `refunds`,
        body: {
          orderId: transactionId,
          userType: 1,
          amount: parseFloat(amount),
          remarks,
        },
      });

      return res.status(auropayRes.code).json(auropayRes.data);
    }
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ AuroPay refund error:", error);
    console.log("🚀 -----------------🚀");
  }

  return res.status(400).json({ message: "Refund Failed." });
};

module.exports = {
  webhook,
  getTransaction,
  refund,
};
