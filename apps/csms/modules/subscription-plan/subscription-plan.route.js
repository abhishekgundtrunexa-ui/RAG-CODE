const { Router } = require("express");
const router = Router();
const subscriptionPlanController = require("./subscription-plan.controller");
const { Authenticate } = require("../../middlewares/authenticate.middleware");

router.post(
  "/add-subscription-plan",
  Authenticate,
  subscriptionPlanController.addSubscriptionPlan
);

router.get(
  "/:subscriptionPlanId/",
  Authenticate,
  subscriptionPlanController.getSubscriptionPlanById
);

router.get("/", Authenticate, subscriptionPlanController.getSubscriptionPlan);

module.exports = router;
