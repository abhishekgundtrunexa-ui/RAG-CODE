const razorpayService = require("./razorpay.service");

exports.generateQr = async (req, res) => {
  try {
    await razorpayService.generateQr(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
