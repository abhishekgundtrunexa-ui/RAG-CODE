const { Router } = require("express");
const router = Router();
const cpoInvoiceController = require("./invoice.controller");
const { Authenticate } = require("../../middlewares/authenticate.middleware");

router.get("/", Authenticate, cpoInvoiceController.getCpoInvoiceList);
router.get("/:invoiceId", Authenticate, cpoInvoiceController.getCpoInvoiceById);

module.exports = router;
