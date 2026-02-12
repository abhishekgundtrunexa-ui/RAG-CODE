const { Router } = require("express");
const router = Router();
const troubleshootController = require("./troubleshoot.controller");

router.get(
  "/transaction/:chargeBoxId",
  troubleshootController.getChargerTroubleshoot
);
router.get(
  "/transaction/:chargeBoxId/:transactionId",
  troubleshootController.getTransactionTroubleshoot
);
router.get(
  "/transaction-v2/:transactionId",
  troubleshootController.getTransactionTroubleshootV2
);
router.get(
  "/transaction-logs/:chargeBoxId/:transactionId",
  troubleshootController.getTransactionLogsTroubleshoot
);
router.get(
  "/transaction-logs-v2/:transactionId",
  troubleshootController.getTransactionLogsTroubleshootV2
);
router.get(
  "/transaction-debug/logs/:transactionId",
  troubleshootController.getTransactionDebugLogs
);

module.exports = router;
