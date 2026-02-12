const { Router } = require("express");
const router = Router();
const emspController = require("./emsp.controller");
const { Authenticate } = require("../../middlewares/authenticate.middleware");
const {
  VerifyActionOTP,
} = require("../../middlewares/verify-action-otp.middleware");
const { Validate } = require("../../middlewares/validate.middleware");
const {
  rejectBankVerificationValidation,
  approveBankVerificationValidation,
  setSettlementScheduleValidation,
} = require("./emsp.validation");

// Required SuperAdmin (Owner Access)
router.post("/", Authenticate, emspController.addEmsp);
router.post(
  "/verify-otp",
  Authenticate,
  VerifyActionOTP("Create EMSP"),
  emspController.verifyOtp
);
router.post(
  "/business-tax",
  Authenticate,
  emspController.upsertBusinessTaxDetails
);
router.post("/bank-account", Authenticate, emspController.upsertBankAccount);
router.post(
  "/payment-config",
  Authenticate,
  emspController.upsertPaymentConfig
);
router.post(
  "/charger-config",
  Authenticate,
  emspController.upsertChargerConfig
);
router.get("/check-account", Authenticate, emspController.getEmspByQuery);
router.post(
  "/get-preauth-amount",
  Authenticate,
  emspController.getPreauthAmount
);
router.get("/", Authenticate, emspController.getEmspUserList);
router.get("/:emspId", Authenticate, emspController.getEmspById);
router.patch(
  "/:emspId",
  Authenticate,
  VerifyActionOTP("Update EMSP"),
  emspController.updateEmsp
);
// update only profile photo
router.patch("/:emspId/profile-photo", Authenticate, emspController.updateProfilePhoto);
router.delete(
  "/:emspId",
  Authenticate,
  VerifyActionOTP("Delete EMSP"),
  emspController.deleteEmsp
);

// add bankVerificationStatus Reject API
router.patch(
  "/:emspId/reject-bank-verification",
  Authenticate,
  Validate(rejectBankVerificationValidation),
  emspController.rejectBankVerification
);
// add bankVerificationStatus Approve API
router.patch(
  "/:emspId/approve-bank-verification",
  Authenticate,
  Validate(approveBankVerificationValidation),
  emspController.approveBankVerification
);

// set settlement schedule
router.put(
  "/:emspId/set-settlement-schedule",
  Authenticate,
  Validate(setSettlementScheduleValidation),
  emspController.setSettlementSchedule
);

module.exports = router;
