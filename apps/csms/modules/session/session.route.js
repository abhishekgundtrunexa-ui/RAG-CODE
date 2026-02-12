const { Router } = require("express");
const router = Router();
const sessionController = require("./session.controller");
const { Authenticate } = require("../../middlewares/authenticate.middleware");

router.post("/", Authenticate, sessionController.addSession);
router.get("/:sessionId", Authenticate, sessionController.getSessionById);
router.patch("/:sessionId", Authenticate, sessionController.updateSession);
router.get("/:chargerId/list", Authenticate, sessionController.getSessionList);
router.delete("/:sessionId", Authenticate, sessionController.deleteSession);

module.exports = router;
