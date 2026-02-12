const { Router } = require("express");
const router = Router();
const cardDetailsController = require("./cpo-card-details.controller");
const {
  Authenticate,
} = require("../../../middlewares/authenticate.middleware");

router.post("/", Authenticate, cardDetailsController.addCardDetails);
router.get("/:cardId", Authenticate, cardDetailsController.getCardDetailsById);
router.get("/", Authenticate, cardDetailsController.getCardDetails);
router.put("/:cardId", Authenticate, cardDetailsController.updateCardDetails);
router.delete(
  "/:cardId",
  Authenticate,
  cardDetailsController.removeCardDetails
);

module.exports = router;
