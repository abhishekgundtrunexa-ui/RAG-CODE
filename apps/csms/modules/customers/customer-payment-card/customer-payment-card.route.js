const { Router } = require("express");
const router = Router();
const paymentCardController = require("./customer-payment-card.controller");
const {
  CustomerAuthenticate,
} = require("../../../middlewares/customer-authenticate.middleware");

router.post("/", CustomerAuthenticate, paymentCardController.createPaymentCard);
router.get("/", CustomerAuthenticate, paymentCardController.getPaymentCards);
router.get(
  "/:id/check-token-expiry",
  CustomerAuthenticate,
  paymentCardController.checkTokenExpiry
);
router.get(
  "/:id",
  CustomerAuthenticate,
  paymentCardController.getPaymentCardById
);
router.put(
  "/:id",
  CustomerAuthenticate,
  paymentCardController.updatePaymentCard
);
router.delete(
  "/:id",
  CustomerAuthenticate,
  paymentCardController.deletePaymentCard
);

module.exports = router;
