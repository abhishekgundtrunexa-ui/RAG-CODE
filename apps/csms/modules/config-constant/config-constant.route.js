const { Router } = require("express");
const router = Router();
const configConstantController = require("./config-constant.controller");

router.post(
  "/set-mock-data-status",
  configConstantController.setMockDataStatus
);

router.get("/get-mock-data-status", configConstantController.getMockDataStatus);

module.exports = router;
