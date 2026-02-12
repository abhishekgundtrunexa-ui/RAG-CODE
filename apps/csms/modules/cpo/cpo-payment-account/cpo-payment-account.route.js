const { Router } = require("express");
const router = Router();
const cpoPaymentAccountController = require("./cpo-payment-account.controller");
const {
  Authenticate,
} = require("../../../middlewares/authenticate.middleware");

router.get(
  "/",
  Authenticate,
  cpoPaymentAccountController.listCpoPaymentAccount
);
router.post(
  "/",
  Authenticate,
  cpoPaymentAccountController.addCpoPaymentAccount
);
router.get(
  "/:cpoPaymentAccountId",
  Authenticate,
  cpoPaymentAccountController.getCpoPaymentAccountById
);
router.patch(
  "/:cpoPaymentAccountId",
  Authenticate,
  cpoPaymentAccountController.updateCpoPaymentAccountById
);
router.delete(
  "/:cpoPaymentAccountId",
  Authenticate,
  cpoPaymentAccountController.deleteCpoPaymentAccountById
);
router.post(
  "/:cpoPaymentAccountId/make-default",
  Authenticate,
  cpoPaymentAccountController.makeDefaultCpoPaymentAccountById
);

module.exports = router;
