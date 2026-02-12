const { NotificationModel } = require("@shared-libs/db/mongo-db");
const { sendDataToPusher } = require("@shared-libs/pusher");

const saveNotification = async (params) => {
  const notification = new NotificationModel({
    ...params,
  });
  const createdNotification = await notification.save();

  await sendDataToPusher({
    channelName: "NOTIFICATIONS",
    eventName: "NOTIFICATION_ADDED",
    data: { id: createdNotification._id, ...params },
  });

  return createdNotification;
};

module.exports = {
  saveNotification,
};
