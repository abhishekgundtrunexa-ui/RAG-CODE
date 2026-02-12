const Pusher = require("pusher");
const { PusherLogModel } = require("@shared-libs/db/mongo-db");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

const pusherTest = new Pusher({
  appId: "1927296",
  key: "58c2944fbfbd2e78ada3",
  secret: "d5803ae9f68ca64e8b56",
  cluster: "ap2",
  useTLS: true,
});

const savePusherErrorLog = async (params) => {
  try {
    const { channelName, eventName, data, isSent, errorMessage } = params;

    const pusherLog = new PusherLogModel({
      channelName,
      eventName,
      data,
      isSent,
      errorMessage,
    });
    await pusherLog.save();
  } catch (error) {}

  return true;
};

const sendDataToPusher = async (params) => {
  const { channelName, eventName, data } = params;

  let pusherResponse = null;
  let pusherResponseReturn = {};
  let errorMessage = null;
  let isSent = false;

  try {
    pusherResponse = await pusher.trigger(channelName, eventName, data);
    pusherResponseReturn = {
      status: pusherResponse?.status,
      statusText: pusherResponse?.statusText,
    };

    isSent = true;
  } catch (error) {
    pusherResponse = error?.message;
    pusherResponseReturn = {
      status: 400,
      statusText: error?.message,
    };
    isSent = false;
    errorMessage = error?.message;

    await savePusherErrorLog({ ...params, isSent, errorMessage });
  }

  return {
    pusherResponse: pusherResponseReturn,
    pusherCredentials: {
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    },
  };
};

const triggerChunked = async (channel, event, data) => {
  const chunkSize = 6000; // artificially small! Set it to more like 9000
  const str = data;
  const msgId = `${Math.random()}`;

  const chunkedEventType = `CHUNKED_${event}`;

  for (let i = 0; i * chunkSize < str.length; i++) {
    const eventData = {
      id: msgId,
      index: i,
      chunk: str.substr(i * chunkSize, chunkSize),
      final: chunkSize * (i + 1) >= str.length,
    };
    try {
      const pusherData = await pusher.trigger(
        channel,
        chunkedEventType,
        eventData
      );
    } catch (error) {
      await savePusherErrorLog({
        channelName: channel,
        eventName: chunkedEventType,
        data: eventData,
        isSent: false,
        errorMessage: error?.message,
      });
    }
  }
};

const triggerPusher = async (channel, event, data) => {
  try {
    await pusher.trigger(channel, event, data);
  } catch (error) {
    await savePusherErrorLog({
      channelName: channel,
      eventName: event,
      data,
      isSent: false,
      errorMessage: error?.message,
    });
  }
};

const authenticatePusherController = async (req, res) => {
  try {
    const { socket_id, channel_name } = req.body;

    if (!socket_id || !channel_name) {
      return res
        .status(400)
        .json({ message: "Missing socket_id or channel_name" });
    }

    const authResponse = pusherTest.authenticate(socket_id, channel_name);
    return res.status(200).send(authResponse);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return res.status(500).json({ message: "Pusher authentication failed" });
  }
};

module.exports = {
  sendDataToPusher,
  triggerChunked,
  triggerPusher,
  authenticatePusherController,
};
