const { Router } = require("express");
const router = Router();
const transactionController = require("./transaction.controller");
const {
  Authenticate,
  AuthenticatePartner,
} = require("../../middlewares/authenticate.middleware");
const { Validate } = require("../../middlewares/validate.middleware");
const {
  getTransactionByIdValidation,
  addTransactionTestDataValidation,
} = require("./transaction.validation");

router.get(
  "/",
  Authenticate,
  AuthenticatePartner,
  transactionController.getTransactionList
);
router.get("/list-status", transactionController.getStatusList);
router.post(
  "/add-test-transaction",
  Validate(addTransactionTestDataValidation),
  transactionController.addTransactionTestData
);

router.get(
  "/:transactionId",
  Authenticate,
  Validate(getTransactionByIdValidation),
  transactionController.getTransactionById
);

router.get(
  "/:transactionId/session-list",
  Authenticate,
  transactionController.getTransactionSessionList
);

router.get(
  "/:chargeBoxId/session-list-by-charger",
  Authenticate,
  AuthenticatePartner,
  transactionController.getTransactionSessionListByCharger
);

module.exports = router;
