const { Router } = require("express");
const router = Router();
const manageDataController = require("./manage-data.controller");

router.get(
  "/delete-cancelled-transactions",
  manageDataController.deleteCancelledTransactions,
);
router.get("/hard-delete-contracts", manageDataController.hardDeleteContracts);
router.post("/run-analytics", manageDataController.runCron);
router.post("/onboard-charger", manageDataController.onboardCharger);
router.get("/sync-settlement", manageDataController.syncSettlement);
router.get("/sync-country-iso-3", manageDataController.syncCountryIso3);
router.get("/update-meter-values", manageDataController.updateMeterValues);
router.get("/delete-charger/:chargerId", manageDataController.deleteCharger);
router.get("/delete-cpo/:cpoId", manageDataController.deleteCpo);
router.get(
  "/delete-evse-station/:evseStationId",
  manageDataController.deleteEvseStation,
);
router.get("/date-test", manageDataController.dateTest);
router.get(
  "/re-generate-invoice/:transactionId",
  manageDataController.reGenerateInvoice,
);
router.get(
  "/re-calculate-and-generate-invoice/:transactionId",
  manageDataController.reCalculateAndGenerateInvoice,
);
router.get("/check-storage", manageDataController.checkStorage);
router.get("/check-email", manageDataController.checkEmail);
router.get("/seed-app-language", manageDataController.seedAppLanguage);
router.get(
  "/get-transaction-invoice/:transactionId",
  manageDataController.getTransactionInvoice,
);
router.get(
  "/re-call-payment-api/:transactionId",
  manageDataController.reCallPaymentApi,
);
router.get("/get-ip-details", manageDataController.getIpDetails);
router.get(
  "/sync-emsp-rates-to-station",
  manageDataController.syncEmspRatesToStation,
);
router.get("/sync-revenue", manageDataController.syncRevenue);
router.get("/sync-ocpp-logs", manageDataController.syncOcppLogs);
router.get(
  "/sync-transaction-contract",
  manageDataController.syncTransactionContract,
);
router.get(
  "/view-transaction-log/:transactionId",
  manageDataController.viewTransactionLog,
);
router.post("/test-pusher-msg", manageDataController.testPusherMsg);

module.exports = router;
