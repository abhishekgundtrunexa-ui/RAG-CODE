const { Router } = require("express");
const router = Router();
const cpoUserController = require("./cpo-user.controller");
const {
  Authenticate,
} = require("../../../middlewares/authenticate.middleware");
const { Upload } = require("../../../middlewares/upload.middleware");

router.post(
  "/update-profile",
  Authenticate,
  Upload.single("file"),
  cpoUserController.updateProfile
);
router.post(
  "/update-account-settings",
  Authenticate,
  Upload.single("file"),
  cpoUserController.updateAccountSettings
);

router.get(
  "/onboard",
  Authenticate,
  cpoUserController.onboard
);

router.post("/", Authenticate, cpoUserController.addCpoUser);
router.get("/", Authenticate, cpoUserController.getCpoUserList);
router.get("/:cpoUserId", Authenticate, cpoUserController.getCpoUserById);
router.patch("/:cpoUserId", Authenticate, cpoUserController.updateCpoUserById);
router.delete("/:cpoUserId", Authenticate, cpoUserController.deleteCpoUserById);
router.get(
  "/:cpoUserId/resend-invite-user",
  Authenticate,
  cpoUserController.resendCpoUserInvitation
);
router.post(
  "/:cpoUserId/enable",
  Authenticate,
  cpoUserController.enableCpoUserById
);

router.post(
  "/:cpoUserId/disable",
  Authenticate,
  cpoUserController.disableCpoUserById
);


router.post(
  "/check-endpoint-availability",
  Authenticate,
  cpoUserController.checkEndpointAvailability
);

router.post(
  "/set-endpoint",
  Authenticate,
  cpoUserController.setEndpoint
);

router.get(
  "/get-endpoint",
  Authenticate,
  cpoUserController.getEndpoint
);

module.exports = router;
