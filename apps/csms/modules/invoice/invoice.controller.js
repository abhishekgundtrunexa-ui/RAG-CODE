const cpoInvoiceService = require("./invoice.service");

exports.getCpoInvoiceList = async (req, res) => {
  try {
    await cpoInvoiceService.getInvoiceList(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCpoInvoiceById = async (req, res) => {
  try {
    const invoiceId = req.params.invoiceId;
    await cpoInvoiceService.getCpoInvoiceById(invoiceId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
