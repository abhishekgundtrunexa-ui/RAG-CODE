const { SubscriptionPlanRepository } = require("@shared-libs/db/mysql");

const SeedSubscriptionPlan = async () => {
  try {
    const subscriptionPlanData = await SubscriptionPlanRepository.find();
    if (subscriptionPlanData.length === 0) {
      await SubscriptionPlanRepository.save([
        {
          name: "Standard Plan",
          allowedMaxCharger: "5",
          allowedMaxUserAccounts: "5",
          allowedMaxEvseStations: "5",
          allowedMaxRoles: "5",
          amount: "10",
          days: "30",
        },
        {
          name: "Free Plan",
          allowedMaxCharger: "1",
          allowedMaxUserAccounts: "1",
          allowedMaxEvseStations: "1",
          allowedMaxRoles: "1",
        },
      ]);

      console.log("Subscription Plan seeding done.");
    }
  } catch (error) {
    console.error("Error seeding Subscription Plan in database:", error);
  }
};

module.exports = { SeedSubscriptionPlan };
