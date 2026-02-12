const { Router } = require("express");
const { Authenticate } = require("../../middlewares/authenticate.middleware");
const chargerCardsController = require("./charger-cards.controller");

const router = Router();
router.get(
  "/get-charger-card/:serial_number",
  Authenticate,
  chargerCardsController.getChargerCard
);
router.post(
  "/set-charger-card/:serial_number",
  Authenticate,
  chargerCardsController.setChargerCard
);

router.post(
  "/set-charger-card-auth-list/:serial_number",
  Authenticate,
  chargerCardsController.setChargerCardAuthList
);

router.put(
  "/update-charger-card-auth-list/:serial_number/:card_id",
  Authenticate,
  chargerCardsController.updateChargerCardAuthList
);

router.post(
  "/sync-auth-list/:serial_number",
  Authenticate,
  chargerCardsController.syncAuthList
);

router.delete(
  "/delete-charger-card/:serial_number/:card_id",
  Authenticate,
  chargerCardsController.deleteChargerCard
);

module.exports = router;