const { PaymentModeRepository } = require("@shared-libs/db/mysql");

const addPaymentMode = async (req, res) => {
  let bodyData = req.body;
  const newPaymentMode = await PaymentModeRepository.save(bodyData);

  res.status(201).json(newPaymentMode);
};

module.exports = {
  addPaymentMode,
};
