const { Router } = require("express");
const router = Router();
const customerTransactionController = require("./customer-transaction.controller");
const {
  CustomerAuthenticate,
} = require("../../../middlewares/customer-authenticate.middleware");

router.get(
  "/",
  CustomerAuthenticate,
  customerTransactionController.getCustomerTransactions
);

router.get(
  "/current",
  CustomerAuthenticate,
  customerTransactionController.getCustomerCurrentTransaction
);

router.get(
  "/:transaction_id",
  CustomerAuthenticate,
  customerTransactionController.getCustomerTransactionById
);

module.exports = router;
