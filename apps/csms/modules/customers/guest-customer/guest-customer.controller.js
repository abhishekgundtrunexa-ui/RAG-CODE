const guestCustomerService = require("./guest-customer.service");

exports.getGuestToken = async (req, res) => {
  try {
    await guestCustomerService.getGuestToken(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
