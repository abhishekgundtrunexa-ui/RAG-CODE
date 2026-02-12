const { Router } = require("express");
const router = Router();
const serviceRequestController = require("./service-request.controller");
const { Authenticate } = require("../../middlewares/authenticate.middleware");
const { Authorize } = require("../../middlewares/authorize.middleware");

router.post("/", Authenticate, serviceRequestController.addServiceRequest);
router.get(
  "/:serviceRequestId",
  Authenticate,
  Authorize("service_requests_view"),
  serviceRequestController.getServiceRequestById
);
router.get(
  "/",
  Authenticate,
  Authorize("service_requests_view"),
  serviceRequestController.getServiceRequestList
);
router.delete(
  "/:serviceRequestId",
  Authenticate,
  serviceRequestController.softDeleteServiceRequest
);
router.patch(
  "/:serviceRequestId/update-status",
  Authenticate,
  Authorize("modify_service_request"),
  serviceRequestController.updateServiceRequestStatus
);

module.exports = router;
