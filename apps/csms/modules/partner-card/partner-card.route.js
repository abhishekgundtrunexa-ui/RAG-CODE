const { Router } = require("express");
const router = Router();
const partnerCardController = require("./partner-card.controller");
const { Authenticate, AuthenticatePartner } = require("../../middlewares/authenticate.middleware");
const {
  createPartnerCardValidation,
} = require("./partner-card.validation");
const { Validate } = require("../../middlewares/validate.middleware");

router.post("/create", Authenticate, AuthenticatePartner, Validate(createPartnerCardValidation), partnerCardController.createPartnerCard);

router.post("/update-primary/:id", Authenticate, AuthenticatePartner, partnerCardController.updatePrimaryCard);

router.delete("/:id", Authenticate, AuthenticatePartner, partnerCardController.removeCard);

router.get("/", Authenticate, AuthenticatePartner, partnerCardController.getCards);

module.exports = router;
