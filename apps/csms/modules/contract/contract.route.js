const { Router } = require("express");
const router = Router();
const contractController = require("./contract.controller");
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
  VerifyActionOTP("Create Contract"),
  contractController.createContract
);
router.get(
  "/",
  Authenticate,
  AuthenticatePartner,
  contractController.getContracts
);
router.post(
  "/verify",
  Authenticate,
  AuthenticatePartner,
  contractController.verifyContract
);
router.get(
  "/:id",
  Authenticate,
  AuthenticatePartner,
  contractController.getContractById
);
router.patch(
  "/:id",
  Authenticate,
  VerifyActionOTP("Update Contract"),

  AuthenticatePartner,
  contractController.updateContract
);
router.delete(
  "/:id",
  Authenticate,
  VerifyActionOTP("Delete Contract"),

  AuthenticatePartner,
  contractController.deleteContract
);
router.post(
  "/search-evse-station",
  Authenticate,
  AuthenticatePartner,
  contractController.searchEvseStation
);
router.post(
  "/search-partner",
  Authenticate,
  AuthenticatePartner,
  contractController.searchPartner
);

module.exports = router;
