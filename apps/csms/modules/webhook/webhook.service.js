const { WebhookModel, WebhookLogModel } = require("@shared-libs/db/mongo-db");
const { customErrorMsg, WebhookEvents } = require("@shared-libs/constants");
const { default: axios } = require("axios");
const { HandleMongoDBList } = require("@shared-libs/db");
const { ObjectDAO } = require("@shared-libs/helpers");

const addWebhook = async (payload, req, res) => {
  const { url, events } = payload;

  const isValidEvents = events.every((e) =>
    Object.values(WebhookEvents).includes(e)
  );
  if (!isValidEvents) {
    return res
      .status(400)
      .json({ message: customErrorMsg.webhook.INVALID_WEBHOOK_EVENTS });
  }

  const isUrlExist = await WebhookModel.find({
    url,
  });

  if (isUrlExist.length > 0) {
    return res
      .status(400)
      .json({ message: customErrorMsg.webhook.WEBHOOK_ALREADY_EXIST });
  }

  const createdWebhook = await WebhookModel.create({
    ...payload,
    createdBy: "660d6e80bfa6e0cef7648bfd",
  });

  res.status(200).json(createdWebhook);
};

const updateWebhook = async (webhookId, payload, req, res) => {
  const { events } = payload;

  const webhook = await WebhookModel.findById(webhookId);
  if (!webhook) {
    return res
      .status(404)
      .json({ message: customErrorMsg.webhook.WEBHOOK_NOT_FOUND });
  }

  if (payload.events && payload.events.length > 0) {
    const isValidEvents = events.every((e) =>
      Object.values(WebhookEvents).includes(e)
    );
    if (!isValidEvents) {
      return res
        .status(400)
        .json({ message: customErrorMsg.webhook.INVALID_WEBHOOK_EVENTS });
    }
  }

  const updatedWebhook = await WebhookModel.findByIdAndUpdate(
    webhookId,
    {
      ...payload,
      updatedBy: "660d6e80bfa6e0cef7648bfd",
    },
    {
      new: true,
    }
  );

  res.status(200).json(updatedWebhook);
};

const changeStatus = async (webhookId, status, req, res) => {
  const webhook = await WebhookModel.findById(webhookId);
  if (!webhook) {
    return res
      .status(404)
      .json({ message: customErrorMsg.webhook.WEBHOOK_NOT_FOUND });
  }

  if (webhook.isEnabled === status) {
    if (status === true) {
      return res
        .status(400)
        .json({ message: customErrorMsg.webhook.WEBHOOK_ALREADY_ENABLED });
    } else {
      return res
        .status(400)
        .json({ message: customErrorMsg.webhook.WEBHOOK_ALREADY_DISABLED });
    }
  }

  const updatedWebhook = await WebhookModel.findByIdAndUpdate(
    webhookId,
    {
      isEnabled: status,
      updatedBy: "660d6e80bfa6e0cef7648bfd",
    },
    {
      new: true,
    }
  );

  res.status(200).json(updatedWebhook);
};

const getWebhookList = async (req, res) => {
  const listParams = {
    model: WebhookModel,
    req,
  };
  const webhookListResponse = await HandleMongoDBList(listParams);
  if (webhookListResponse.list && webhookListResponse.list.length > 0) {
    const newList = webhookListResponse.list.map((webhook) => {
      return ObjectDAO(webhook);
    });
    webhookListResponse.list = newList;
  }
  res.status(200).json(webhookListResponse);
};

const getWebhookById = async (webhookId, req, res) => {
  const webhook = await WebhookModel.findById(webhookId).lean();
  if (!webhook) {
    return res
      .status(404)
      .json({ message: customErrorMsg.webhook.WEBHOOK_NOT_FOUND });
  }
  res.status(200).json(ObjectDAO(webhook));
};

const sendWebhook = async (data) => {
  const { event, payload } = data;
  const webhooks = await WebhookModel.find({
    events: {
      $in: [event],
    },
    isEnabled: true,
  });
  if (webhooks.length > 0) {
    let webhookData = { event, data: payload };
    const webhookRequests = webhooks.map(async (wh) => {
      try {
        const headers = { ...wh.headers };
        const axiosResponse = await axios.post(wh.url, webhookData, {
          headers,
        });
        await createWebhookLog({
          webhookId: wh._id,
          endpoint: wh.url,
          requestData: webhookData,
          responseStatus: axiosResponse.status ? axiosResponse.status : 200,
          errorMessage: null,
        });
      } catch (error) {
        const responseStatus =
          error && error.response && error.response.status
            ? error.response.status
            : 500;
        const errorMessage =
          error &&
          error.errors &&
          error.errors.length > 0 &&
          error.errors[0] &&
          error.errors[0].message
            ? error.errors[0].message
            : null;
        await createWebhookLog({
          webhookId: wh._id,
          endpoint: wh.url,
          requestData: webhookData,
          responseStatus,
          errorMessage,
        });
        console.error("Failed to send webhook:", errorMessage);
      }
    });
    await Promise.all(webhookRequests);
  }
};

const createWebhookLog = async (data) => {
  try {
    const { webhookId, endpoint, requestData, responseStatus, errorMessage } =
      data;

    const webhookLog = new WebhookLogModel({
      webhookId,
      endpoint,
      requestData,
      responseStatus,
      errorMessage,
    });
    await webhookLog.save();
  } catch (error) {
    console.error("Failed to log webhook request:", error);
  }
};

module.exports = {
  addWebhook,
  updateWebhook,
  changeStatus,
  getWebhookList,
  getWebhookById,
  sendWebhook,
};
