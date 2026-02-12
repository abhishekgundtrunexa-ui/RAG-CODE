const { Router } = require("express");
const router = Router();
const guestCustomerController = require("./guest-customer.controller");

router.get("/get-token", guestCustomerController.getGuestToken);

module.exports = router;
