const { Router } = require("express");
const router = Router();
const emspController = require("./emsp-user.controller");
const { Authenticate } = require("../../middlewares/authenticate.middleware");

router.post("/", Authenticate, emspController.addEmspUser);
router.patch("/:emspUserId", Authenticate, emspController.updateEmspUser);
router.delete("/:emspUserId", Authenticate, emspController.deleteEmspUser);

module.exports = router;
