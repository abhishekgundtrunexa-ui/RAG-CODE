const { Router } = require("express");
const router = Router();
const userController = require("./user.controller");
const { Authenticate } = require("../../middlewares/authenticate.middleware");
const { Upload } = require("../../middlewares/upload.middleware");
const {
  VerifyActionOTP,
} = require("../../middlewares/verify-action-otp.middleware");
const { Validate } = require("../../middlewares/validate.middleware");
const {
  addUserValidation,
  getUserByIdValidation,
  updateUserByIdValidation,
  deleteUserBulkValidation,
  deleteUserByIdValidation,
  resendUserInvitationValidation,
  enableUserByIdValidation,
  disableUserByIdValidation,
} = require("./user.validation");

router.post(
  "/update-profile",
  Authenticate,
  VerifyActionOTP("Update Profile"),
  Upload.single("file"),
  userController.updateProfile
);
router.patch("/update-profile-photo", Authenticate, userController.updateProfilePhoto);
router.post(
  "/update-account-settings",
  Authenticate,
  Upload.single("file"),
  userController.updateAccountSettings
);
router.post("/", Authenticate, Validate(addUserValidation), userController.addUser);
router.get("/", Authenticate, userController.getUserList);
router.get("/filter-status", Authenticate, userController.getFilterStatus);
router.get("/info", userController.getUserInfo);
router.get("/for-deleted-chargers", userController.getUserListForDeletedChargers);
router.get("/:userId", Authenticate, Validate(getUserByIdValidation), userController.getUserById);
router.patch("/:userId", Authenticate, Validate(updateUserByIdValidation), userController.updateUserById);
router.delete("/delete-bulk", Authenticate, Validate(deleteUserBulkValidation), userController.deleteUserBulk);
router.delete("/:userId", Authenticate, Validate(deleteUserByIdValidation), userController.deleteUserById);
router.get(
  "/:userId/resend-invite-user",
  Authenticate,
  Validate(resendUserInvitationValidation),
  userController.resendUserInvitation
);
router.post("/:userId/enable", Authenticate, Validate(enableUserByIdValidation), userController.enableUserById);
router.post("/:userId/disable", Authenticate, Validate(disableUserByIdValidation), userController.disableUserById);

module.exports = router;
