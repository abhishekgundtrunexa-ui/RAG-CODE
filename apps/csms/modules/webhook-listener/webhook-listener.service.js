const {
  PaynexWebhookModel,
  AuropayWebhookModel,
} = require("@shared-libs/db/mongo-db");

const paynexWebhook = async (payload, req, res) => {
  try {
    await PaynexWebhookModel.create({
      data: payload,
    });
  } catch (error) {}

  return res.status(200).json({ ok: true });
};

const auropayWebhook = async (payload, req, res) => {
  // try {
  //   const eventName = req?.params?.eventName ?? "NO EVENT";
  //   await AuropayWebhookModel.create({
  //     data: { eventName, ...payload },
  //   });
  // } catch (error) {}

  return res.status(200).json({ ok: true });
};

module.exports = {
  paynexWebhook,
  auropayWebhook,
};
