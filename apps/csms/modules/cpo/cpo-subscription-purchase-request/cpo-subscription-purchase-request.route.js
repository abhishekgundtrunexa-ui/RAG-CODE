const { Router } = require("express");
const router = Router();
const subscriptionPurchaseReqController = require("./cpo-subscription-purchase-request.controller");
const {
  Authenticate,
} = require("../../../middlewares/authenticate.middleware");

router.post(
  "/initiate-subscription-purchase",
  Authenticate,
  subscriptionPurchaseReqController.initiateSubscriptionPurchase
);

router.put(
  "/update-subscription-purchase/:subscriptionPurchaseReqId",
  Authenticate,
  subscriptionPurchaseReqController.updateSubscriptionPurchase
);

router.get(
  "/",
  Authenticate,
  subscriptionPurchaseReqController.getSubscription
);

router.get(
  "/list-subscription-invoices",
  Authenticate,
  subscriptionPurchaseReqController.listSubscriptionInvoices
);

module.exports = router;
