const { Router } = require("express");
const router = Router();
const cpoBaseRateController = require("./cpo-base-rate.controller");
const {
  Authenticate,
} = require("../../../middlewares/authenticate.middleware");

router.post("/", Authenticate, cpoBaseRateController.addCpoBaseRate);
router.get("/", Authenticate, cpoBaseRateController.getCpoBaseRateList);
router.get(
  "/:cpoBaseRateId",
  Authenticate,
  cpoBaseRateController.getCpoBaseRateById
);
router.patch(
  "/:cpoBaseRateId",
  Authenticate,
  cpoBaseRateController.updateCpoBaseRateById
);
router.delete(
  "/delete-bulk",
  Authenticate,
  cpoBaseRateController.deleteCpoBaseRateBulk
);
router.delete(
  "/:cpoBaseRateId",
  Authenticate,
  cpoBaseRateController.deleteCpoBaseRateById
);
router.post(
  "/:cpoBaseRateId/make-default",
  Authenticate,
  cpoBaseRateController.makeDefaultCpoBaseRateById
);

module.exports = router;
