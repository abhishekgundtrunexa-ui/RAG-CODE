const { Router } = require("express");
const router = Router();
const tenantController = require("./tenant.controller");
const { Authenticate } = require("../../middlewares/authenticate.middleware");

router.post("/add-tenant", Authenticate, tenantController.addTenant);

router.get("/", Authenticate, tenantController.getTenant);

module.exports = router;
