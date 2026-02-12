const { SeedChargerConnectorPairs } = require("./charger-connector-pair.seed");
const { SeedChargerConnectorTypes } = require("./charger-connector-type.seed");
const { SeedChargerModels } = require("./charger-model.seed");
const { SeedSuperAdmin } = require("./e-msp.seed");
const { SeedChargeUsageType } = require("./charge-usage-type.seed");
const {
  SeedServiceRequestCategories,
} = require("./service-request-category.seed");
const { SeedFaq } = require("./faqs.seed");
const { SeedConfigConstants } = require("./config-constant.seed");
const { SeedPaymentMode } = require("./payment-mode.seed");
const { SeedEvseStation } = require("./evse-station.seed");
const { SeedChargers } = require("./chargers.seed");
const { SeedCpo } = require("./cpo.seed");
const { SeedUniversalBaseRate } = require("./universal-base-rate.seed");
const { SeedSubscriptionPlan } = require("./subscription-plan.seed");
const { SeedLocalizationCodesData } = require("./localization-codes.seed");
const {
  SeedFeedBackCannedMessages,
} = require("./feed-back-canned-messages.seed");
const {
  SeedRegionalElectricityRate,
} = require("./regional-electricity-rate.seed");
const { SeedLanguage } = require("./language.seed");
const { SeedApiKey } = require("./api-key.seed");

module.exports = {
  SeedChargerConnectorPairs,
  SeedChargerConnectorTypes,
  SeedChargerModels,
  SeedSuperAdmin,
  SeedUniversalBaseRate,
  SeedSubscriptionPlan,
  SeedChargeUsageType,
  SeedRegionalElectricityRate,
  SeedServiceRequestCategories,
  SeedFaq,
  SeedConfigConstants,
  SeedPaymentMode,
  SeedEvseStation,
  SeedCpo,
  SeedChargers,
  SeedLocalizationCodesData,
  SeedFeedBackCannedMessages,
  SeedLanguage,
  SeedApiKey,
};
