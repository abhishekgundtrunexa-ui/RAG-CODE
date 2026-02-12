const { Router } = require("express");
const router = Router();
const chargerEtTestingController = require("./charger-et-testing.controller");

router.post("/set", chargerEtTestingController.set);
router.post("/reset", chargerEtTestingController.reset);
router.get("/:chargeBoxId/transactions", chargerEtTestingController.getTransactions);

module.exports = router;
