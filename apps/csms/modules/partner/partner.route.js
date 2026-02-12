const { Router } = require("express");
const router = Router();
const partnerController = require("./partner.controller");
const { Validate } = require("../../middlewares/validate.middleware");
const {
  Authenticate,
  AuthenticatePartner,
} = require("../../middlewares/authenticate.middleware");
const {
  VerifyActionOTP,
} = require("../../middlewares/verify-action-otp.middleware");
const {
  rejectBankVerificationValidation,
  approveBankVerificationValidation,
} = require("./partner.validation");

// Partner CRUD routes (only super admin access)
router.post("/", Authenticate, VerifyActionOTP("Create Partner"), partnerController.addPartner);
router.patch(
  "/:id",
  Authenticate,
  VerifyActionOTP("Update Partner"),
  partnerController.updatePartner
);
router.patch(
  "/:id/update-profile",
  Authenticate,
  VerifyActionOTP("Update Partner"),
  partnerController.updatePartnerProfile
);
router.get(
  "/",
  Authenticate,
  AuthenticatePartner,
  partnerController.getPartners
);
router.delete(
  "/",
  Authenticate,
  VerifyActionOTP("Delete Partner"),
  partnerController.deletePartner
);
router.get("/:id", Authenticate, partnerController.getPartnerById);
router.get(
  "/:id/resend-invite-user",
  Authenticate,
  partnerController.resendPartnerInvitation
);

// add bankVerificationStatus Reject API
router.patch(
  "/:id/reject-bank-verification",
  Authenticate,
  Validate(rejectBankVerificationValidation),
  partnerController.rejectBankVerification
);
// add bankVerificationStatus Approve API
router.patch(
  "/:id/approve-bank-verification",
  Authenticate,
  Validate(approveBankVerificationValidation),
  partnerController.approveBankVerification
);

module.exports = router;
