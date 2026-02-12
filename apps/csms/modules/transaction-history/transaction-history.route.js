const { Router } = require("express");
const router = Router();
const transactionController = require("./transaction-history.controller");
const {
  Authenticate,
  AuthenticatePartner,
} = require("../../middlewares/authenticate.middleware");

router.get(
  "/",
  Authenticate,
  AuthenticatePartner,
  transactionController.getTransactionList
);
router.get(
  "/:sessionId",
  Authenticate,
  transactionController.getSessionDetails
);

module.exports = router;
