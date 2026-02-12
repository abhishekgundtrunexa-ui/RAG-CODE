const {
  CpoCardDetailsRepository,
  CpoUserRepository,
} = require("@shared-libs/db/mysql");
const { ObjectDAO } = require("@shared-libs/helpers");
const { HandleMySqlList } = require("@shared-libs/db");
const stripe = require("stripe")(process.env.STRIPE_SECRET);

const addCardDetails = async (payload, req, res) => {
  let {
    tokenId,
    cardNumber,
    expiryDate,
    firstName,
    lastName,
    name = null,
    isPrimary = false,
  } = payload;

  const expiryDateParts = expiryDate.split("/");
  if (expiryDateParts.length !== 2) {
    return res
      .status(400)
      .json({ message: "Invalid Expiry Date Format. Use MM/YY." });
  }

  if (name) {
    const nameArr = name.split(" ");
    firstName = nameArr[0] ?? "";
    lastName = nameArr[1] ?? "";
  }

  const loggedInUser = req["loggedInUserData"]["user"];
  let loginUserData = await CpoUserRepository.findOne({
    where: { id: loggedInUser.id, isDeleted: false },
  });

  if (!loginUserData) {
    return res.status(404).json({ message: "User Not Found" });
  }

  let stripeCustomerId = loginUserData?.stripeCustomerId;
  if (!stripeCustomerId) {
    const stripeCustomer = await stripe.customers.create({
      email: loginUserData.email,
      name: `${loginUserData?.firstName} ${loginUserData?.lastName}`,
    });

    if (stripeCustomer) {
      await CpoUserRepository.update(loggedInUser.id, {
        stripeCustomerId: stripeCustomer.id,
      });
      stripeCustomerId = stripeCustomer.id;
    }
  }

  // const existingCard = await CpoCardDetailsRepository.findOne({
  //   where: { cpoAdminId: loginUserData.id, cardNumber, isDeleted: false },
  // });

  // if (existingCard) {
  //   return res.status(404).json({ message: "Card Already Exist" });
  // }

  // const paymentMethods = await stripe.paymentMethods.list({
  //   customer: stripeCustomerId,
  //   type: "card",
  // });

  // Check if the card with the provided last 4 digits exists
  // const cardExists = paymentMethods.data.some((paymentMethod) => {
  //   return (
  //     paymentMethod.card && paymentMethod.card.last4 === cardNumber
  //   );
  // });
  // if (cardExists) {
  //   return res.status(404).json({ message: "Card Already Exist 1" });
  // }

  const paymentMethod = await stripe.paymentMethods.create({
    type: "card",
    card: { token: tokenId },
  });

  const createCard = await stripe.paymentMethods.attach(paymentMethod.id, {
    customer: stripeCustomerId,
  });

  if (!createCard.id) {
    return res.status(500).json({ message: "Error Adding Card" });
  }

  const month = expiryDateParts[0];
  const year = expiryDateParts[1];
  const formattedExpiryDate = `${month}/${year}`;

  const cardData = {
    cpoId: loggedInUser.cpoId,
    cpoAdminId: loggedInUser.id,
    expiryDate: formattedExpiryDate,
    stripeCustomerId,
    stripeCardId: createCard?.id,
    cardType: paymentMethod?.card?.brand,
    firstName,
    lastName,
    tokenId,
    cardNumber,
    isPrimary,
  };

  if (isPrimary) {
    // update existing primary card to non primary
    await CpoCardDetailsRepository.update(
      {
        cpoAdminId: loginUserData.id,
        isPrimary: true,
        isDeleted: false,
      },
      { isPrimary: false }
    );
  }
  const cardDetails = await CpoCardDetailsRepository.save(cardData);

  return res.status(200).json(cardDetails);
};

const getCardDetailsById = async (req, res) => {
  try {
    const cardId = req.params.cardId;
    const cardDetails = await CpoCardDetailsRepository.createQueryBuilder(
      "CpoCardDetails"
    )
      .leftJoinAndSelect("CpoCardDetails.cpoId", "cpoId")
      .leftJoinAndSelect("CpoCardDetails.cpoAdminId", "cpoAdminId")
      .where("CpoCardDetails.id = :cardId", {
        cardId,
      })
      .getOne();

    cardDetails.cpo = ObjectDAO(cardDetails?.cpoId);
    cardDetails.cpoAdmin = ObjectDAO(cardDetails?.cpoAdminId);
    cardDetails.cpoId = cardDetails?.cpo?.id;
    cardDetails.cpoAdminId = cardDetails?.cpoAdmin?.id;
    res.status(200).json(ObjectDAO(cardDetails));
  } catch (error) {
    console.error("Error fetching card details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getCardDetails = async (req, res) => {
  try {
    const loggedInUser = req["loggedInUserData"]["user"];

    const listParams = {
      entityName: "CpoCardDetails",
      baseQuery: {
        cpoId: loggedInUser.cpoId,
        cpoAdminId: loggedInUser.id,
        isDeleted: false,
      },
      req,
    };

    let cardDetailsResponse = await HandleMySqlList(listParams);

    const finalCardDetails = await Promise.all(
      cardDetailsResponse.list.map(async (cardDetails) => {
        const newcardDetails =
          await CpoCardDetailsRepository.createQueryBuilder("CpoCardDetails")
            .leftJoinAndSelect("CpoCardDetails.cpoId", "cpoId")
            .leftJoinAndSelect("CpoCardDetails.cpoAdminId", "cpoAdminId")
            .where("CpoCardDetails.id = :cardId", {
              cardId: cardDetails.id,
            })
            .getOne();

        newcardDetails.cpo = ObjectDAO(newcardDetails?.cpoId);
        newcardDetails.cpoAdmin = ObjectDAO(newcardDetails?.cpoAdminId);
        newcardDetails.cpoId = newcardDetails?.cpo?.id;
        newcardDetails.cpoAdminId = newcardDetails?.cpoAdmin?.id;
        return ObjectDAO(newcardDetails);
      })
    );
    cardDetailsResponse.list = finalCardDetails;
    res.status(200).json(cardDetailsResponse);
  } catch (error) {
    console.error("Error fetching user card details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateCardDetails = async (req, res) => {
  try {
    const id = req.params.cardId;
    const cardData = req.body;
    const loggedInUser = req["loggedInUserData"]["user"];

    const existingCardDetails = await CpoCardDetailsRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!existingCardDetails) {
      return res.status(404).json({ message: "Card Details Not Found." });
    }

    if (cardData.expiryDate) {
      const expiryDateParts = cardData.expiryDate.split("/");
      if (expiryDateParts.length !== 2) {
        return res
          .status(400)
          .json({ message: "Invalid Expiry Date Format. Use MM/YY." });
      }

      const month = expiryDateParts[0];
      const year = expiryDateParts[1];
      cardData.expiryDate = `${month}/${year}`;
    }

    cardData.cpoId = loggedInUser.cpoId;
    cardData.cpoAdminId = loggedInUser.id;
    if (cardData?.isPrimary) {
      // update existing primary card to non primary
      await CpoCardDetailsRepository.update(
        {
          cpoAdminId: loggedInUser.id,
          isPrimary: true,
          isDeleted: false,
        },
        { isPrimary: false }
      );
    }

    const updatedCardDetails = await CpoCardDetailsRepository.save({
      ...existingCardDetails,
      ...cardData,
    });

    return res.status(200).json(updatedCardDetails);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An Error Occurred While Updating Card Details." });
  }
};

const removeCardDetails = async (req, res) => {
  try {
    const id = req.params.cardId;

    const existingCardDetails = await CpoCardDetailsRepository.findOne({
      where: { id },
    });

    if (!existingCardDetails) {
      return res.status(404).json({ message: "Card Details Not Found." });
    }

    const { stripeCardId } = existingCardDetails;

    await stripe.paymentMethods.detach(stripeCardId);
    existingCardDetails.isDeleted = true;
    await CpoCardDetailsRepository.save(existingCardDetails);

    return res.status(200).json({
      message: "Card Details Successfully Deleted From Stripe And Database.",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An Error Occurred While Deleting Card Details." });
  }
};

module.exports = {
  addCardDetails,
  getCardDetailsById,
  getCardDetails,
  updateCardDetails,
  removeCardDetails,
};
