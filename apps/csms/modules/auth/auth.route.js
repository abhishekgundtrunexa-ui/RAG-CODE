const { Router } = require("express");
const router = Router();
const authController = require("./auth.controller");
const { Authenticate } = require("../../middlewares/authenticate.middleware");
const { Validate } = require("../../middlewares/validate.middleware");
const {
  loginValidation,
  checkLoginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require("./auth.validation");

router.post("/send-mail", authController.sendMail);
router.post(
  "/check-login",
  Validate(checkLoginValidation),
  authController.checkLogin
);
router.post("/login", Validate(loginValidation), authController.login);
router.get("/who-am-i", Authenticate, authController.whoAmI);
router.get("/country-config", Authenticate, authController.getProfileConfiguration);
router.get("/logout", Authenticate, authController.logout);
router.post(
  "/forgot-password",
  Validate(forgotPasswordValidation),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  Validate(resetPasswordValidation),
  authController.resetPassword
);
router.post("/send-action-otp", Authenticate, authController.sendActionOtp);
router.post("/onboard-user", Authenticate, authController.onboardUser);
router.get("/skip-onboarding", Authenticate, authController.skipOnboarding);
router.post("/set-profile-configuration", Authenticate, authController.setProfileConfiguration);

module.exports = router;
