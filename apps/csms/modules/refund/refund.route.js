const { Router } = require("express");
const router = Router();
const refundController = require("./refund.controller");
const {
  Authenticate,
  AuthenticatePartner,
} = require("../../middlewares/authenticate.middleware");
const {
  AnalyticsFilterMiddleware,
} = require("../../middlewares/analytics-filter.middleware");

router.post("/", Authenticate, refundController.createRefund);

router.get("/", Authenticate, refundController.getRefunds);
router.get(
  "/overview",
  Authenticate,
  AuthenticatePartner,
  AnalyticsFilterMiddleware({ dateOnly: true }),
  refundController.getRefundOverview
);

router.get("/:refundId", Authenticate, refundController.getRefundById);

router.post(
  "/:refundId/add-comment",
  Authenticate,
  refundController.addRefundComment
);

router.post(
  "/:refundId/update-status",
  Authenticate,
  refundController.updateRefundStatus
);

router.post(
  "/:refundId/re-assign",
  Authenticate,
  refundController.reassignRefund
);

router.post(
  "/:refundId/process-refund",
  Authenticate,
  refundController.processRefund
);

module.exports = router;
