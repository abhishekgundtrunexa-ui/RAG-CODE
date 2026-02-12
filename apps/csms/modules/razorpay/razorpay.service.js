const { getPaymentQrCode } = require("@shared-libs/razorpay");

const generateQr = async (req, res) => {
  const { payment_amount, notes = {}, name = "My-QR" } = req?.body;

  const upiQrCodeLink = await getPaymentQrCode(
    {
      payment_amount: Number(payment_amount) * 100,
      notes,
    },
    name
  );

  return res.status(400).json(upiQrCodeLink);
};

module.exports = {
  generateQr,
};
