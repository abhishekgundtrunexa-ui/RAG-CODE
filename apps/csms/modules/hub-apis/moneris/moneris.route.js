const { Router } = require("express");
const router = Router();
const monerisController = require("./moneris.controller");

router.get("/preauth", monerisController.preauth);
router.get("/emvdata-add", monerisController.emvDataAdd);
router.get("/emv-completion", monerisController.emvCompletion);

module.exports = router;
