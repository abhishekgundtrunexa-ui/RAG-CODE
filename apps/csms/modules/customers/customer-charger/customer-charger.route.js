const { Router } = require("express");
const router = Router();
const chargerController = require("./customer-charger.controller");
const {
  CustomerAuthenticate,
} = require("../../../middlewares/customer-authenticate.middleware");

router.get(
  "/discovery",
  CustomerAuthenticate,
  chargerController.getNearbyChargers,
);

router.get(
  "/:chargeBoxId/get-details",
  CustomerAuthenticate,
  chargerController.getChargerDetails,
);

router.post(
  "/:chargeBoxId/remote-start-transaction",
  CustomerAuthenticate,
  chargerController.remoteStartTransaction,
);

router.post(
  "/:chargeBoxId/remote-stop-transaction",
  CustomerAuthenticate,
  chargerController.remoteStopTransaction,
);

router.post(
  "/:chargeBoxId/reserve-now",
  CustomerAuthenticate,
  chargerController.reserveNow,
);

router.post(
  "/:chargeBoxId/cancel-reservation",
  CustomerAuthenticate,
  chargerController.cancelReservation,
);

router.post(
  "/:evseStationId/reserve-by-station",
  CustomerAuthenticate,
  chargerController.reserveByStation,
);

router.post(
  "/:chargeBoxId/charger-experience-feedback",
  CustomerAuthenticate,
  chargerController.chargingExperienceFeedback,
);

router.get(
  "/:chargeBoxId/get-payable-amount",
  CustomerAuthenticate,
  chargerController.getPayableAmount,
);

router.get(
  "/:chargeBoxId/payment-status-update/:token",
  chargerController.paymentStatusUpdate,
);

module.exports = router;
