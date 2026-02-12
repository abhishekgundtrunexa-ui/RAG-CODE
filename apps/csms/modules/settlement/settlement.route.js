const { Router } = require("express");
const router = Router();
const settlementController = require("./settlement.controller");
const {
  Authenticate,
  AuthenticatePartner,
} = require("../../middlewares/authenticate.middleware");
const { Validate } = require("../../middlewares/validate.middleware");
const {
  getSettlementByIdValidation,
  getSettlementSessionsValidation,
  getSettlementSessionOverviewValidation,
  rejectSettlementValidation,
  updatePartnerTransferStatusValidation,
} = require("./settlement.validation");
const {
  AnalyticsFilterMiddleware,
} = require("../../middlewares/analytics-filter.middleware");

// Add Settlement and Add Settlement Partner
router.post(
  "/",
  Authenticate,
  AuthenticatePartner,
  settlementController.addSettlement
);

// Add Settlement and Add Settlement Partner
router.post(
  "/generate-settlement",
  // Authenticate,
  // AuthenticatePartner,
  settlementController.generateSettlement
);

router.post(
  "/:settlementId/partner",
  Authenticate,
  AuthenticatePartner,
  settlementController.addSettlementPartner
);

// List Settlements
router.get(
  "/",
  Authenticate,
  AuthenticatePartner,
  settlementController.getSettlements
);

// Settlement Overview
router.get(
  "/overview",
  Authenticate,
  AuthenticatePartner,
  AnalyticsFilterMiddleware(),
  settlementController.getSettlementOverview
);

// Get Settlement By ID
router.get(
  "/:settlementId",
  Authenticate,
  AuthenticatePartner,
  Validate(getSettlementByIdValidation),
  settlementController.getSettlementById
);

// Get Session List Settlement By ID
router.get(
  "/:settlementId/sessions",
  Authenticate,
  AuthenticatePartner,
  Validate(getSettlementSessionsValidation),
  settlementController.getSettlementSessions
);

// Get Session Overview Settlement By ID
router.get(
  "/:settlementId/sessions-overview",
  Authenticate,
  AuthenticatePartner,
  Validate(getSettlementSessionOverviewValidation),
  settlementController.getSettlementSessionOverview
);

// Reject Settlement By ID
router.post(
  "/:settlementId/reject",
  Authenticate,
  Validate(rejectSettlementValidation),
  settlementController.rejectSettlement
);

// Update Partner Transfer Status Settlement By ID & Partner ID
router.post(
  "/:settlementId/update-partner-transfer-status/:partnerId",
  Authenticate,
  Validate(updatePartnerTransferStatusValidation),
  settlementController.updatePartnerTransferStatus
);

module.exports = router;
