const { Router } = require("express");
const router = Router();
const superAdminController = require("./super-admin.controller");
const {
  Authenticate,
} = require("../../../middlewares/authenticate.middleware");
const {
  VerifyActionOTP,
} = require("../../../middlewares/verify-action-otp.middleware");
const { Validate } = require("../../../middlewares/validate.middleware");
const {
  addSuperAdminValidation,
  updateSuperAdminValidation,
  deleteSuperAdminValidation,
  getSuperAdminByIdValidation,
} = require("./super-admin.validation");

router.post(
  "/",
  Authenticate,
  VerifyActionOTP("Create Super Admin"),
  Validate(addSuperAdminValidation),
  superAdminController.addSuperAdmin
);
router.patch(
  "/:id",
  Authenticate,
  VerifyActionOTP("Update Super Admin"),
  Validate(updateSuperAdminValidation),
  superAdminController.updateSuperAdmin
);
router.get("/", Authenticate, superAdminController.getSuperAdmins);
router.delete(
  "/",
  Authenticate,
  VerifyActionOTP("Delete Super Admin"),
  Validate(deleteSuperAdminValidation),
  superAdminController.deleteSuperAdmin
);
router.get(
  "/:id",
  Authenticate,
  Validate(getSuperAdminByIdValidation),
  superAdminController.getSuperAdminById
);

module.exports = router;
