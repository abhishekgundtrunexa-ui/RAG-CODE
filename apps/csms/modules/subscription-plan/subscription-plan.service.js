const { SubscriptionPlanRepository } = require("@shared-libs/db/mysql");
const { ObjectDAO } = require("@shared-libs/helpers");
const { HandleMySqlList } = require("@shared-libs/db");

const addSubscriptionPlan = async (req, res) => {
  let bodyData = req.body;

  const subscriptionPlan = await SubscriptionPlanRepository.save(bodyData);
  return res.status(201).json(subscriptionPlan);
};

const getSubscriptionPlan = async (req, res) => {
  try {
    const loggedInUserData = req["loggedInUserData"];

    const listParams = {
      entityName: "SubscriptionPlan",
      baseQuery: {},
      req,
    };

    const subscriptionPlanResponse = await HandleMySqlList(listParams);
    if (
      subscriptionPlanResponse.list &&
      subscriptionPlanResponse.list.length > 0
    ) {
      const newList = subscriptionPlanResponse.list.map((subscription) => {
        if (loggedInUserData?.subscription?.planName == subscription.name) {
          subscription.isCurrentPlan = true;
        } else {
          subscription.isCurrentPlan = false;
        }

        return ObjectDAO(subscription);
      });
      subscriptionPlanResponse.list = newList;
    }
    res.status(200).json(subscriptionPlanResponse);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getSubscriptionPlanById = async (req, res) => {
  try {
    const subscriptionPlanId = req.params.subscriptionPlanId;
    const listParams = {
      entityName: "SubscriptionPlan",
      baseQuery: {
        id: subscriptionPlanId,
      },
      req,
    };

    const subscriptionPlanResponse = await HandleMySqlList(listParams);
    if (
      subscriptionPlanResponse.list &&
      subscriptionPlanResponse.list.length > 0
    ) {
      const newList = subscriptionPlanResponse.list.map((subscription) => {
        return ObjectDAO(subscription);
      });
      subscriptionPlanResponse.list = newList;
    }
    res.status(200).json(subscriptionPlanResponse);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  addSubscriptionPlan,
  getSubscriptionPlan,
  getSubscriptionPlanById,
};
