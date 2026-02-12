const { CustomerPaymentCardRepository } = require("@shared-libs/db/mysql");
const { saveCard, checkCardTokenExpiry } = require("@shared-libs/paynex-world");

exports.createPaymentCard = async (req, res) => {
  try {
    const {
      cardNumber,
      cardHolderName,
      expiryMonth,
      expiryYear,
      brand,
      isDefault,
    } = req.body;

    const loggedInUserData = req.loggedInUserData;
    const {
      customerId,
      customer: { email = null, mobile = null },
    } = loggedInUserData;

    if (!email) {
      return res.status(400).json({
        message:
          "Email is required to save card. Please add email from profile.",
      });
    }

    if (!cardNumber || !cardHolderName || !expiryMonth || !expiryYear) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    let expdate = "";
    if (`${expiryMonth}`?.length == 1) {
      expdate = `0${expiryMonth}`;
    } else if (`${expiryMonth}`?.length == 2) {
      expdate = `${expiryMonth}`;
    } else {
      return res.status(400).json({ message: "Invalid expiryMonth." });
    }

    if (`${expiryYear}`?.length == 2) {
      expdate = `${expiryYear}${expdate}`;
    } else if (`${expiryYear}`?.length == 4) {
      expdate = `${`${expiryYear}`.slice(-2)}${expdate}`;
    } else {
      return res.status(400).json({ message: "Invalid expiryYear." });
    }

    const savedCard = await saveCard({
      pan: cardNumber,
      expdate,
      phone: mobile,
      email,
    });

    if (!savedCard?.paymentTokenId) {
      return res.status(400).json({
        message:
          savedCard?.tokenInfo?.paymentStatusMessage ??
          "This card could not be saved.",
      });
    }

    // Mask card number and get last4
    const last4 = cardNumber.slice(-4);
    const maskedCardNumber = cardNumber.replace(/.(?=.{4})/g, "*");
    // If isDefault, unset previous default
    if (isDefault) {
      await CustomerPaymentCardRepository.update(
        { customerId, isDefault: true },
        { isDefault: false }
      );
    }
    const newCard = CustomerPaymentCardRepository.create({
      customerId,
      cardNumber: maskedCardNumber,
      cardHolderName,
      expiryMonth,
      expiryYear,
      brand,
      last4,
      paymentTokenId: savedCard?.paymentTokenId,
      isDefault: !!isDefault,
    });

    await CustomerPaymentCardRepository.save(newCard);

    res.status(201).json(newCard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPaymentCards = async (req, res) => {
  try {
    const customerId = req.loggedInUserData.customerId;
    const cards = await CustomerPaymentCardRepository.find({
      where: { customerId, isDeleted: false },
    });
    res.status(200).json(cards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.checkTokenExpiry = async (req, res) => {
  try {
    const customerId = req.loggedInUserData.customerId;
    const { id } = req.params;
    const card = await CustomerPaymentCardRepository.findOne({
      where: { id, customerId, isDeleted: false },
    });
    if (!card)
      return res.status(404).json({ message: "Payment card not found." });
		
    if (!card?.paymentTokenId)
      return res.status(404).json({ message: "Payment card token not found." });

		const expiryData = await checkCardTokenExpiry(card?.paymentTokenId)

    res.status(200).json(expiryData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPaymentCardById = async (req, res) => {
  try {
    const customerId = req.loggedInUserData.customerId;
    const { id } = req.params;
    const card = await CustomerPaymentCardRepository.findOne({
      where: { id, customerId, isDeleted: false },
    });
    if (!card)
      return res.status(404).json({ message: "Payment card not found." });
    res.status(200).json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePaymentCard = async (req, res) => {
  try {
    const customerId = req.loggedInUserData.customerId;
    const { id } = req.params;
    const { cardHolderName, expiryMonth, expiryYear, brand, isDefault } =
      req.body;
    const card = await CustomerPaymentCardRepository.findOne({
      where: { id, customerId, isDeleted: false },
    });
    if (!card)
      return res.status(404).json({ message: "Payment card not found." });
    if (isDefault) {
      await CustomerPaymentCardRepository.update(
        { customerId, isDefault: true },
        { isDefault: false }
      );
    }
    await CustomerPaymentCardRepository.update(id, {
      cardHolderName,
      expiryMonth,
      expiryYear,
      brand,
      isDefault: !!isDefault,
    });
    const updated = await CustomerPaymentCardRepository.findOne({
      where: { id },
    });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePaymentCard = async (req, res) => {
  try {
    const customerId = req.loggedInUserData.customerId;
    const { id } = req.params;
    const card = await CustomerPaymentCardRepository.findOne({
      where: { id, customerId, isDeleted: false },
    });
    if (!card)
      return res.status(404).json({ message: "Payment card not found." });
    await CustomerPaymentCardRepository.update(id, { isDeleted: true });
    res.status(200).json({ message: "Payment card deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
