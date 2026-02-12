const { NotificationModel } = require("@shared-libs/db/mongo-db");
const { ObjectDAO } = require("@shared-libs/helpers");
const { HandleMongoDBList } = require("@shared-libs/db");
const { sendDataToPusher } = require("@shared-libs/pusher");

const getNotificationList = async (req, res) => {
  let baseQuery = { isDeleted: false };

  const loggedInUserData = req.loggedInUserData;
  if (loggedInUserData.isCpo) {
    baseQuery = {
      cpoId: loggedInUserData.user.cpoId,
      isDeletedForCpo: false,
    };
  }

  req.query["sort"] = "createdAt:desc";
  const listParams = {
    model: NotificationModel,
    req,
    baseQuery,
  };
  const notificationListResponse = await HandleMongoDBList(listParams);
  if (
    notificationListResponse.list &&
    notificationListResponse.list.length > 0
  ) {
    const newList = notificationListResponse.list.map((notification) => {
      return ObjectDAO(notification);
    });
    notificationListResponse.list = newList;
  }
  res.status(200).json(notificationListResponse);
};

const readAll = async (req, res) => {
  let where = { isDeleted: false };
  let data = { isRead: true };

  const loggedInUserData = req.loggedInUserData;
  if (loggedInUserData.isCpo) {
    where = {
      cpoId: loggedInUserData.user.cpoId,
      isDeletedForCpo: false,
    };
    data = { isReadForCpo: true };
  }

  await NotificationModel.updateMany(where, data);

  await sendDataToPusher({
    channelName: `NOTIFICATIONS`,
    eventName: "NOTIFICATION_UPDATED",
    data: { actions: "readAll" },
  });

  if (loggedInUserData.isCpo) {
    await sendDataToPusher({
      channelName: `NOTIFICATIONS_${loggedInUserData.user.cpoId}`,
      eventName: "NOTIFICATION_UPDATED",
      data: { cpoId: loggedInUserData.user.cpoId, actions: "readAll" },
    });
  }

  res.status(200).json({ message: "Notifications Are Updated." });
};

const clearAll = async (req, res) => {
  let where = { isDeleted: false };
  let data = { isDeleted: true };

  const loggedInUserData = req.loggedInUserData;
  if (loggedInUserData.isCpo) {
    where = {
      cpoId: loggedInUserData.user.cpoId,
      isDeletedForCpo: false,
    };
    data = { isDeletedForCpo: true };
  }

  await NotificationModel.updateMany(where, data);

  await sendDataToPusher({
    channelName: `NOTIFICATIONS`,
    eventName: "NOTIFICATION_UPDATED",
    data: { actions: "clearAll" },
  });

  if (loggedInUserData.isCpo) {
    await sendDataToPusher({
      channelName: `NOTIFICATIONS_${loggedInUserData.user.cpoId}`,
      eventName: "NOTIFICATION_UPDATED",
      data: { cpoId: loggedInUserData.user.cpoId, actions: "clearAll" },
    });
  }

  res.status(200).json({ message: "Notifications Are Updated." });
};

const readById = async (req, res) => {
  const notificationId = req.params.notificationId;

  let where = { isDeleted: false, _id: notificationId };
  let data = { isRead: true };

  const loggedInUserData = req.loggedInUserData;
  if (loggedInUserData.isCpo) {
    where = {
      _id: notificationId,
      cpoId: loggedInUserData.user.cpoId,
      isDeletedForCpo: false,
    };
    data = { isReadForCpo: true };
  }

  await NotificationModel.findOneAndUpdate(where, data);

  await sendDataToPusher({
    channelName: `NOTIFICATIONS`,
    eventName: "NOTIFICATION_UPDATED",
    data: { notificationId, actions: "read" },
  });

  if (loggedInUserData.isCpo) {
    await sendDataToPusher({
      channelName: `NOTIFICATIONS_${loggedInUserData.user.cpoId}`,
      eventName: "NOTIFICATION_UPDATED",
      data: {
        cpoId: loggedInUserData.user.cpoId,
        notificationId,
        actions: "read",
      },
    });
  }

  res.status(200).json({ message: "Notification Is Updated." });
};

const clearById = async (req, res) => {
  const notificationId = req.params.notificationId;

  let where = { isDeleted: false, _id: notificationId };
  let data = { isDeleted: true };

  const loggedInUserData = req.loggedInUserData;
  if (loggedInUserData.isCpo) {
    where = {
      _id: notificationId,
      cpoId: loggedInUserData.user.cpoId,
      isDeletedForCpo: false,
    };
    data = { isDeletedForCpo: true };
  }

  await NotificationModel.findOneAndUpdate(where, data);

  await sendDataToPusher({
    channelName: `NOTIFICATIONS`,
    eventName: "NOTIFICATION_UPDATED",
    data: { notificationId, actions: "clear" },
  });

  if (loggedInUserData.isCpo) {
    await sendDataToPusher({
      channelName: `NOTIFICATIONS_${loggedInUserData.user.cpoId}`,
      eventName: "NOTIFICATION_UPDATED",
      data: {
        cpoId: loggedInUserData.user.cpoId,
        notificationId,
        actions: "clear",
      },
    });
  }

  res.status(200).json({ message: "Notification Is Updated." });
};

module.exports = {
  getNotificationList,
  readAll,
  clearAll,
  readById,
  clearById,
};
