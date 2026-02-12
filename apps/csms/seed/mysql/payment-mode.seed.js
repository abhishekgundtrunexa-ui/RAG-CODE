const { PaymentModeRepository } = require("@shared-libs/db/mysql");

const SeedPaymentMode = async () => {
  const existingPaymentModes = await PaymentModeRepository.find();

  if (existingPaymentModes.length === 0) {
    const newPaymentMode = PaymentModeRepository.create({
      name: "Cash",
    });

    await PaymentModeRepository.save(newPaymentMode);
    console.log("Payment mode seeded.");
  }
};

module.exports = { SeedPaymentMode };
