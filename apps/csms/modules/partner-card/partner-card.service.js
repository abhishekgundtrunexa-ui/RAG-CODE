const {
  PartnerCardRepository,
  UserRepository,
} = require("@shared-libs/db/mysql");
const { Not } = require("typeorm");
const stripe = require("stripe")(process.env.STRIPE_SECRET);

const createPartnerCard = async (req, res) => {
  try {
    const { cardNumber, expMonth, expYear, cvc, nameOnCard } = req.body;
    const { user } = req.loggedInUserData;
    
    let loginUserData = await UserRepository.findOne({
      where: { id: user.id, isDeleted: false, isPartner: true },
    });

    if (!loginUserData) {
      return res.status(404).json({ message: "User Not Found" });
    }

    const partnerCardCount = await PartnerCardRepository.count({
      where: { partnerId: user.id, isDeleted: false },
    });

    let stripeCustomerId = loginUserData.stripeCustomerId;
    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: loginUserData.email,
        name: loginUserData.fullName,
        metadata: {
          id: user.id,
          isPartner: true,
        },
      });

      if (stripeCustomer) {
        await UserRepository.update(user.id, {
          stripeCustomerId: stripeCustomer.id,
        });
        stripeCustomerId = stripeCustomer.id;
      }
    }

    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: cardNumber,
        exp_month: parseInt(expMonth),
        exp_year: parseInt(expYear.toString().length === 2 ? `20${expYear}` : expYear),
        cvc: cvc,
      },
      billing_details: {
        name: nameOnCard,
        email: loginUserData.email,
      },
    });

    const attachedCard = await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: stripeCustomerId,
    });

    const isFirstCard = partnerCardCount === 0;
    if (isFirstCard) {
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      });
    }

    const cardDetails = paymentMethod.card;
    
    const partnerCardData = {
      partnerId: user.id,
      stripeCustomerId: stripeCustomerId,
      stripeCardId: paymentMethod.id,
      tokenId: paymentMethod.id,
      cardNumber: cardDetails.last4,
      expMonth: expMonth.toString().padStart(2, '0'),
      expYear: expYear.toString().length === 2 ? `20${expYear}` : expYear.toString(),
      cvc: cvc,
      nameOnCard: nameOnCard,
      cardType: cardDetails.brand.charAt(0).toUpperCase() + cardDetails.brand.slice(1),
      isPrimary: isFirstCard,
      isDeleted: false,
    };

    const newPartnerCard = await PartnerCardRepository.save(partnerCardData);

    return res.status(201).json({
      success: true,
      paymentMethod,
      message: isFirstCard 
        ? "Partner card created and set as primary successfully" 
        : "Partner card created successfully",
      data: {
        partnerCard: newPartnerCard,
        stripePaymentMethod: {
          id: attachedCard.id,
          last4: cardDetails.last4,
          brand: cardDetails.brand,
          exp_month: cardDetails.exp_month,
          exp_year: cardDetails.exp_year,
        },
        isSetAsPrimary: isFirstCard,
      },
    });

  } catch (error) {
    console.error("Error creating partner card:", error);
    if (error.type === 'StripeCardError') {
      return res.status(400).json({ 
        success: false,
        message: "Card validation failed", 
        error: error.message 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const updatePrimaryCard = async (req, res) => {
  try {
    const { user } = req.loggedInUserData;
    const { id } = req.params;
    
    const card = await PartnerCardRepository.findOne({
      where: { id, isDeleted: false },
    });
    
    if (!card) {
      return res.status(404).json({ 
        success: false,
        message: "Card Not Found" 
      });
    }

    if (card.partnerId !== user.id) {
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized: Card does not belong to this user" 
      });
    }

    const updatedCustomer = await stripe.customers.update(card.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: card.stripeCardId,
      },
    });

    await PartnerCardRepository.update(
      { 
        partnerId: user.id, 
        isDeleted: false,
        id: Not(id)
      },
      { isPrimary: false }
    );

    await PartnerCardRepository.update(id, { isPrimary: true });

    const updatedCard = await PartnerCardRepository.findOne({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Primary card updated successfully",
      data: {
        updatedCard,
        stripeCustomer: {
          id: updatedCustomer.id,
          defaultPaymentMethod: updatedCustomer.invoice_settings.default_payment_method,
        },
      },
    });

  } catch (error) {
    console.error("Error updating primary card:", error);
    
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        success: false,
        message: "Invalid Stripe request", 
        error: error.message
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const removeCard = async (req, res) => {
  try {
    const { user } = req.loggedInUserData;
    const { id } = req.params;
    
    const card = await PartnerCardRepository.findOne({
      where: { id, isDeleted: false, partnerId: user.id },
    });
    
    if (!card) {
      return res.status(404).json({ 
        success: false,
        message: "Card Not Found" 
      });
    }

    const totalCards = await PartnerCardRepository.count({
      where: { partnerId: user.id, isDeleted: false },
    });

    if (totalCards === 1) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove the only card. At least one card must be present.",
      });
    }

    await stripe.paymentMethods.detach(card.stripeCardId);

    if (card.isPrimary) {
      const anotherCard = await PartnerCardRepository.findOne({
        where: { 
          partnerId: user.id, 
          isDeleted: false, 
          id: Not(id) 
        },
        order: { createdAt: "ASC" },
      });

      if (anotherCard) {
        await stripe.customers.update(card.stripeCustomerId, {
          invoice_settings: {
            default_payment_method: anotherCard.stripeCardId,
          },
        });

        await PartnerCardRepository.update(anotherCard.id, { isPrimary: true });
      }
    }
    
    await PartnerCardRepository.update(id, { isDeleted: true, isPrimary: false });

    return res.status(200).json({
      success: true,
      message: "Card removed successfully",
      data: {
        removedCardId: id,
        remainingCards: totalCards - 1,
      },
    });

  } catch (error) {
    console.error("Error removing card:", error);
    
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        success: false,
        message: "Invalid Stripe request", 
        error: error.message 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getPartnerCards = async (req, res) => {
  try {
    const { user } = req.loggedInUserData;
    
    const cards = await PartnerCardRepository.find({
      where: { 
        partnerId: user.id, 
        isDeleted: false 
      },
      order: { 
        isPrimary: "DESC",
        createdAt: "ASC"
      },
    });

    const formattedCards = cards.map(card => ({
      id: card.id,
      cardNumber: `**** **** **** ${card.cardNumber}`,
      cardType: card.cardType,
      nameOnCard: card.nameOnCard,
      expMonth: card.expMonth,
      expYear: card.expYear,
      isPrimary: card.isPrimary,
      stripeCardId: card.stripeCardId,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      message: "Cards retrieved successfully",
      data: formattedCards, // Only the formatted cards list
    });

  } catch (error) {
    console.error("Error fetching my cards:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};




module.exports = {
  createPartnerCard,
  updatePrimaryCard,
  removeCard,
  getPartnerCards
};