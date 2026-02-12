const notificationService = require("./notification.service");

exports.getNotificationList = async (req, res) => {
  try {
    await notificationService.getNotificationList(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.readAll = async (req, res) => {
  try {
    await notificationService.readAll(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.clearAll = async (req, res) => {
  try {
    await notificationService.clearAll(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.readById = async (req, res) => {
  try {
    await notificationService.readById(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.clearById = async (req, res) => {
  try {
    await notificationService.clearById(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
