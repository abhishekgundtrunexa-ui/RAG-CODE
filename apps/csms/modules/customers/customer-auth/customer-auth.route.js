const { Router } = require("express");
const router = Router();
const { Upload } = require("../../../middlewares/upload.middleware");
const customerAuthController = require("./customer-auth.controller");
const {
  CustomerAuthenticate,
} = require("../../../middlewares/customer-authenticate.middleware");

router.post("/get-login-otp", customerAuthController.getLoginOtp);
router.post("/get-token-for-wa", customerAuthController.getTokenForWa);
router.post("/verify-login-otp", customerAuthController.verifyLoginOtp);
router.get("/who-am-i", CustomerAuthenticate, customerAuthController.whoAmI);
router.get("/logout", CustomerAuthenticate, customerAuthController.logout);
router.post(
  "/update-profile",
  CustomerAuthenticate,
  Upload.single("file"),
  customerAuthController.updateProfile
);
router.post(
  "/refresh-token",
  customerAuthController.refreshToken
);

module.exports = router;