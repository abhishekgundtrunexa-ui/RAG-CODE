const { Router } = require("express");
const router = Router();
const cgxTeamController = require("./cgx-team.controller");
const {
  Authenticate,
  AuthenticatePartner,
} = require("../../../middlewares/authenticate.middleware");
const {
  VerifyActionOTP,
} = require("../../../middlewares/verify-action-otp.middleware");
const { Validate } = require("../../../middlewares/validate.middleware");
const {
  addUserValidation,
  updateUserValidation,
  deleteUserValidation,
  getUserByIdValidation,
} = require("./cgx-team.validation");

router.post(
  "/",
  Authenticate,
  VerifyActionOTP("Create Team User"),
  Validate(addUserValidation),
  cgxTeamController.addUser
);
router.patch(
  "/:id",
  Authenticate,
  VerifyActionOTP("Update Team User"),
  Validate(updateUserValidation),
  cgxTeamController.updateUser
);
router.get("/", Authenticate, AuthenticatePartner, cgxTeamController.getUsers);
router.delete(
  "/",
  Authenticate,
  VerifyActionOTP("Delete Team User"),
  Validate(deleteUserValidation),
  cgxTeamController.deleteUser
);
router.get(
  "/:id",
  Authenticate,
  Validate(getUserByIdValidation),
  cgxTeamController.getUserById
);

module.exports = router;
