const { Router } = require("express");
const router = Router();
const departmentController = require("./department.controller");
const {
  Authenticate,
  AuthenticatePartner,
} = require("../../middlewares/authenticate.middleware");
const {
  VerifyActionOTP,
} = require("../../middlewares/verify-action-otp.middleware");

router.post(
  "/",
  Authenticate,
  VerifyActionOTP("Create Department"),
  AuthenticatePartner,
  departmentController.addDepartment
);
router.patch(
  "/:departmentId",
  Authenticate,
  VerifyActionOTP("Update Department"),
  AuthenticatePartner,
  departmentController.updateDepartment
);
router.get(
  "/",
  Authenticate,
  AuthenticatePartner,
  departmentController.getDepartments
);
router.get(
  "/:departmentId",
  Authenticate,
  AuthenticatePartner,
  departmentController.getDepartmentById
);
router.delete(
  "/:departmentId",
  Authenticate,
  VerifyActionOTP("Delete Department"),
  AuthenticatePartner,
  departmentController.deleteDepartment
);
router.get(
  "/:departmentId/roles",
  Authenticate,
  AuthenticatePartner,
  departmentController.getDepartmentRoles
);
router.post(
  "/:departmentId/role",
  Authenticate,
  AuthenticatePartner,
  departmentController.addDepartmentRole
);

module.exports = router;
