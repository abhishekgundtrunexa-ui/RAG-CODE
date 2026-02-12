const { In } = require("typeorm");
const {
  CpoSubscriptionPurchaseRequestRepository,
  SubscriptionPlanRepository,
  CpoSubscriptionRepository,
  CpoCardDetailsRepository,
  CpoSubscriptionInvoiceRepository,
  CpoRepository,
  CpoUserRepository,
  UserRepository,
  EMspRepository,
} = require("@shared-libs/db/mysql");
const { HandleMySqlList } = require("@shared-libs/db");
const { generatePaymentInvoice } = require("@shared-libs/pdf");
const {
  arrayObjStr,
  getIpData,
  convertDateTimezone,
  ObjectDAO,
} = require("@shared-libs/helpers");
const { DateTime } = require("luxon");

const initiateSubscriptionPurchase = async (req, res) => {
  const loggedInUser = req["loggedInUserData"]["user"];

  let bodyData = req.body;
  let subscriptionPlan = await SubscriptionPlanRepository.findOne({
    where: { id: bodyData.subscriptionPlanId },
  });

  if (!subscriptionPlan) {
    return res.status(404).json({ message: "Subscription Plan Not Found" });
  }

  let cardDetails = await CpoCardDetailsRepository.findOne({
    where: { id: bodyData.cardDetailsId, isDeleted: false },
  });

  if (!cardDetails) {
    return res.status(404).json({ message: "Card Details Not Found" });
  }

  let timezone = null;
  let country = null;
  try {
    const geoLocation = await getIpData(req);
    country = geoLocation?.country ?? null;
    timezone = geoLocation?.timezone ?? null;
  } catch (error) {
    timezone = null;
    country = null;
  }

  if (!timezone) {
    timezone = "UTC";
  }

  const createdAtLocal = convertDateTimezone(DateTime.utc(), timezone);

  let subscriptionPurchaseRequestData = {
    cpoId: loggedInUser.cpoId,
    cpoAdminId: loggedInUser.id,
    subscriptionPlanId: bodyData.subscriptionPlanId,
    cardDetailsId: bodyData.cardDetailsId,
    timezone,
    country,
    createdAtLocal,
  };

  const subscription = await CpoSubscriptionPurchaseRequestRepository.save(
    subscriptionPurchaseRequestData
  );
  return res.status(201).json(subscription);
};

const updateSubscriptionPurchase = async (req, res) => {
  const loggedInUser = req["loggedInUserData"]["user"];

  let subscriptionPurchaseReqId = req.params.subscriptionPurchaseReqId;
  let status = req.body.status;
  let transactionPaymentId = req.body.transactionPaymentId;

  let subscriptionPurchaseRequest =
    await CpoSubscriptionPurchaseRequestRepository.findOne({
      where: { id: subscriptionPurchaseReqId },
    });

  if (!subscriptionPurchaseRequest) {
    return res
      .status(404)
      .json({ message: "Subscription Purchase Request Not Found" });
  }

  let subscriptionPlan = await SubscriptionPlanRepository.findOne({
    where: { id: subscriptionPurchaseRequest.subscriptionPlanId },
  });

  let cardDetails = await CpoCardDetailsRepository.findOne({
    where: { id: subscriptionPurchaseRequest.cardDetailsId, isDeleted: false },
  });

  if (status === "Fail") {
    await CpoSubscriptionPurchaseRequestRepository.update(
      subscriptionPurchaseReqId,
      {
        status: "InCompleted",
        transactionPaymentId: transactionPaymentId,
      }
    );
  }
  if (status === "Success") {
    await CpoSubscriptionPurchaseRequestRepository.update(
      subscriptionPurchaseReqId,
      {
        status: "Completed",
        transactionPaymentId: transactionPaymentId,
      }
    );
  }
  let subscriptionData = {
    cpoId: loggedInUser.cpoId,
    cpoAdminId: loggedInUser.id,
    subscriptionPurchaseRequestId: subscriptionPurchaseRequest.id,
    purchaseDate: convertDateTimezone(DateTime.utc()),
    expiryDate: convertDateTimezone(
      DateTime.utc().plus({ days: subscriptionPlan.days })
    ),
    purchaseDateLocal: convertDateTimezone(
      DateTime.utc(),
      subscriptionPurchaseRequest?.timezone
    ),
    createdAtLocal: convertDateTimezone(
      DateTime.utc(),
      subscriptionPurchaseRequest?.timezone
    ),
    expiryDateLocal: convertDateTimezone(
      DateTime.utc().plus({ days: subscriptionPlan.days }),
      subscriptionPurchaseRequest?.timezone
    ),
    timezone: subscriptionPurchaseRequest?.timezone,
    country: subscriptionPurchaseRequest?.country,
    subscriptionPlanId: subscriptionPlan.id,
    status: status,
  };

  let existingSubscription = await CpoSubscriptionRepository.findOne({
    where: { subscriptionPurchaseRequestId: subscriptionPurchaseRequest.id },
  });

  let subscriptionPlanData = await SubscriptionPlanRepository.findOne({
    where: { id: subscriptionPurchaseRequest.subscriptionPlanId },
  });

  const cpo = await CpoRepository.findOne({
    where: { id: loggedInUser.cpoId },
  });

  const cpoUser = await CpoUserRepository.findOne({
    where: { id: loggedInUser.id, cpoId: cpo.id, isDeleted: false },
  });

  const user = await UserRepository.findOne({
    where: { email: "admin@chargnex.com", isDeleted: false },
  });

  const eMsp = await EMspRepository.findOne({
    where: { id: user.eMspId, isDeleted: false },
  });
  const noOfMonths = subscriptionPlanData?.days / 30;
  const costPerMonth = (subscriptionPlanData?.amount ?? 1) / noOfMonths;
  const subTotal = noOfMonths * costPerMonth;
  const discountRate = subscriptionData?.discount ?? 2;
  const discount = subTotal * (discountRate / 100);
  const taxRate = subscriptionData?.tax ?? 1.5;
  const tax = subTotal * (taxRate / 100);
  const totalAmount = subTotal - (discount ?? 0) + (tax ?? 0);

  let paymentPdfData = {
    dateOfIssue: DateTime.fromFormat(
      subscriptionData.purchaseDateLocal,
      "yyyy-MM-dd HH:mm:ss"
    ).toFormat("dd MMMM yyyy"),
    purchaseDate: DateTime.fromFormat(
      subscriptionData.purchaseDateLocal,
      "yyyy-MM-dd HH:mm:ss"
    ).toFormat("MMM dd"),
    expiryDate: DateTime.fromFormat(
      subscriptionData.expiryDateLocal,
      "yyyy-MM-dd HH:mm:ss"
    ).toFormat("MMM dd, yyyy"),
    subscriptionPlanName: subscriptionPlanData.name,
    subscriptionPlanPrice: subscriptionPlanData.amount,
    cardHolderName: cardDetails.firstName + " " + cardDetails.lastName,
    transactionPaymentId: transactionPaymentId,
    cpoName: cpo.name,
    cpoAddress: cpo.billingAddress,
    cpoPhoneNumber: cpoUser.phoneNumber,
    cpoEmail: cpoUser.email,
    currencySymbol: cpo.currencySymbol ? cpo.currencySymbol : "$",
    currencyName: cpo.currencyName ? cpo.currencyName : "USD",
    companyName: eMsp.name,
    companyAddress: eMsp.billingAddress,
    companyPhoneNumber: user.phoneNumber,
    companyEmail: user.email,
    companyLogo: eMsp.profilePicture ? eMsp.profilePicture : null,
    cpoPhone: cpoUser.phoneNumber,
    planDuration: noOfMonths,
    costPerMonth,
    subTotal,
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    taxRate,
    tax,
    discount,
    discountRate,
  };
  if (existingSubscription) {
    // If it exists, update the existing subscription
    await CpoSubscriptionRepository.update(
      existingSubscription.id,
      subscriptionData
    );

    paymentPdfData.subscriptionId = existingSubscription.id;
    const generatedPdf = await generatePaymentInvoice(paymentPdfData);
    existingSubscription.pdfUrl = generatedPdf.pdfUrl;
    return res.status(200).json({
      message: "Subscription Updated Successfully",
      subscription: existingSubscription,
    });
  } else {
    // If it does not exist, create a new subscription
    const newSubscription = await CpoSubscriptionRepository.save(
      subscriptionData
    );
    paymentPdfData.subscriptionId = newSubscription.id;
    const generatedPdf = await generatePaymentInvoice(paymentPdfData);
    newSubscription.pdfUrl = generatedPdf.pdfUrl;
    return res.status(201).json({
      message: "Subscription Created Successfully",
      subscription: newSubscription,
    });
  }
};

const getSubscription = async (req, res) => {
  try {
    const loggedInUser = req["loggedInUserData"]["user"];

    const listParams = {
      entityName: "CpoSubscription",
      baseQuery: {
        cpoAdminId: loggedInUser.id,
      },
      req,
    };

    let subscriptionPlanResponse = await HandleMySqlList(listParams);

    if (subscriptionPlanResponse.list.length > 0) {
      subscriptionPlanResponse.list = await getSubscriptionDetails(
        subscriptionPlanResponse.list
      );
    }

    res.status(200).json(subscriptionPlanResponse);
  } catch (error) {
    console.error("Error fetching tenent list:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getSubscriptionDetails = async (list) => {
  const subscriptionPlanIds = list
    .map(({ subscriptionPlanId }) => subscriptionPlanId)
    .filter(Boolean);

  const CpoSubscriptionPurchaseRequestIds = list
    .map(({ subscriptionPurchaseRequestId }) => subscriptionPurchaseRequestId)
    .filter(Boolean);

  // Fetch Subscription Plan details
  const subscriptionPlans = await SubscriptionPlanRepository.find({
    where: { id: In([...subscriptionPlanIds]) },
    select: [
      "id",
      "name",
      "allowedMaxCharger",
      "allowedMaxUserAccounts",
      "allowedMaxEvseStations",
      "allowedMaxRoles",
      "amount",
      "days",
    ],
  });
  // fetch subscription paymentTransaction Id
  const paymentTransactionData =
    await CpoSubscriptionPurchaseRequestRepository.find({
      where: {
        id: In(CpoSubscriptionPurchaseRequestIds),
      },
      select: ["id", "transactionPaymentId"],
    });
  const paymentTransactionDataMap = arrayObjStr(paymentTransactionData, "id");
  const subscriptionPlanData = arrayObjStr(subscriptionPlans, "id");

  const uniqueReturnList = new Map();

  list.forEach((d) => {
    const subscriptionPlan = subscriptionPlanData[d.subscriptionPlanId] || {};
    const updatedRecord = {
      ...d,
      subscriptionPlan: subscriptionPlan || {},
      subscriptionPlanName: subscriptionPlan.name || null,
      subscriptionPlanMaxChargers: subscriptionPlan.allowedMaxCharger || null,
      subscriptionPlanMaxUserAccounts:
        subscriptionPlan.allowedMaxUserAccounts || null,
      subscriptionPlanMaxEvseStations:
        subscriptionPlan.allowedMaxEvseStations || null,
      subscriptionPlanMaxRoles: subscriptionPlan.allowedMaxRoles || null,
      subscriptionPlanAmount: subscriptionPlan.amount || null,
      subscriptionPlanDays: subscriptionPlan.days || null,
      purchaseDate: DateTime.fromJSDate(d.purchaseDate).toFormat("yyyy-MM-dd"),
      expiryDate: DateTime.fromJSDate(d.expiryDate).toFormat("yyyy-MM-dd"),
      paymentTransactionId: paymentTransactionDataMap[
        d?.subscriptionPurchaseRequestId
      ]
        ? paymentTransactionDataMap[d?.subscriptionPurchaseRequestId][
            "transactionPaymentId"
          ]
        : null,
    };

    uniqueReturnList.set(d.id, ObjectDAO(updatedRecord));
  });

  const returnList = Array.from(uniqueReturnList.values());
  return returnList;
};

const listSubscriptionInvoices = async (req, res) => {
  try {
    const loggedInUser = req["loggedInUserData"]["user"];

    const listParams = {
      entityName: "CpoSubscription",
      baseQuery: {
        cpoAdminId: loggedInUser.id,
        cpoId: loggedInUser.cpoId,
      },
      req,
    };

    let subscriptionPlanInvoicesResponse = await HandleMySqlList(listParams);

    // let subscription = await CpoSubscriptionRepository.find({
    //   where: { cpoAdminId: loggedInUser.id, isDeleted: false },
    // });

    // if (!subscription.length) {
    //   return res
    //     .status(404)
    //     .json({ message: "No Subscriptions Found For This User." });
    // }
    if (subscriptionPlanInvoicesResponse.list?.length > 0) {
      const subscriptionIds = subscriptionPlanInvoicesResponse.list.map(
        (subscription) => subscription.id
      );
      delete subscriptionPlanInvoicesResponse.list;
      subscriptionPlanInvoicesResponse.invoices =
        await CpoSubscriptionInvoiceRepository.find({
          where: {
            subscriptionId: In(subscriptionIds),
            isDeleted: false,
          },
          select: ["id", "invoiceNumber", "pdfUrl"],
        });
    } else {
      delete subscriptionPlanInvoicesResponse.list;
      subscriptionPlanInvoicesResponse.invoices = [];
    }
    res.status(200).json(subscriptionPlanInvoicesResponse);
  } catch (error) {
    console.error("Error fetching tenent list:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// const getSubscriptionPlanById = async (req, res) => {
//     try {
//         const subscriptionPlanId = req.params.subscriptionPlanId;
//         const listParams = {
//             entityName: "SubscriptionPlan",
//             baseQuery: {
//                 id: subscriptionPlanId,
//             },
//             req,
//         };

//         const subscriptionPlanResponse = await HandleMySqlList(listParams)

//         res.status(200).json(subscriptionPlanResponse);
//     } catch (error) {
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// };

module.exports = {
  initiateSubscriptionPurchase,
  updateSubscriptionPurchase,
  getSubscription,
  listSubscriptionInvoices,
  // getSubscriptionPlanById,
};
