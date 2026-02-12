const { Router } = require("express");
const router = Router();
const chargerController = require("./charger.controller");

router.post("/register", chargerController.registerCharger);
router.get("/", chargerController.getChargerList);
router.get("/:chargerId", chargerController.getChargerById);

module.exports = router;
