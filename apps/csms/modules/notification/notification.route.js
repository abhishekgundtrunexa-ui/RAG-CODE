const { Router } = require("express");
const router = Router();
const notificationController = require("./notification.controller");
const { Authenticate } = require("../../middlewares/authenticate.middleware");

router.get("/", Authenticate, notificationController.getNotificationList);
router.post("/read-all", Authenticate, notificationController.readAll);
router.post("/clear-all", Authenticate, notificationController.clearAll);
router.post("/:notificationId/read", Authenticate, notificationController.readById);
router.post("/:notificationId/clear", Authenticate, notificationController.clearById);

module.exports = router;
