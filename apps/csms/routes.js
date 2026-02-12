const infoRoutes = require("./modules/info/info.route");
const razorpayRoutes = require("./modules/razorpay/razorpay.route");
const ipInfoRoutes = require("./modules/ip-info/ip-info.route");
const hubMonerisRoute = require("./modules/hub-apis/moneris/moneris.route");
const hubPerformanceAnalyticsRoute = require("./modules/hub-apis/analytics/performance-analytics/performance-analytics.route");
const hubChargerRoute = require("./modules/hub-apis/charger/charger.route");

const ocppHandlerRoutes = require("./modules/ocpp-handler/ocpp-handler.route");

const paymentRoutes = require("./modules/payment/payment.route");

const analyticsRoutes = require("./modules/analytics/analytics.route");
const performanceAnalyticsRoutes = require("./modules/performance-analytics/performance-analytics.route");
const authRoutes = require("./modules/auth/auth.route");
const chargerRoutes = require("./modules/charger/charger.route");
const chargerEtTestingRoutes = require("./modules/charger-et-testing/charger-et-testing.route");
const connectorTypeRoutes = require("./modules/connector-type/connector-type.route");
const countryRoutes = require("./modules/country/country.route");
const countryBaseRateRoutes = require("./modules/country-base-rate/country-base-rate.route");

const cpoAdminRoutes = require("./modules/cpo-admin/cpo-admin.route");

const evseStationRoutes = require("./modules/evse-station/evse-station.route");
const faqRoutes = require("./modules/faq/faq.route");
const gitlabWebhookRoutes = require("./modules/gitlab-webhook/gitlab-webhook.route");
const invoiceRoutes = require("./modules/invoice/invoice.route");
const littlePayRoutes = require("./modules/little-pay/little-pay.route");
const auroPayRoutes = require("./modules/auro-pay/auro-pay.route");
const manageDataRoutes = require("./modules/manage-data/manage-data.route");
const notificationRoutes = require("./modules/notification/notification.route");
const ocppRoutes = require("./modules/ocpp/ocpp.route");
const paymentModeRoutes = require("./modules/payment-mode/payment-mode.route");
const rapidUpRoutes = require("./modules/rapid-up/rapid-up.route");
const serialNumberRoutes = require("./modules/serial-number/serial-number.route");
const serviceRequestRoutes = require("./modules/service-request/service-request.route");
const sessionRoutes = require("./modules/session/session.route");
const subscriptionPlanRoutes = require("./modules/subscription-plan/subscription-plan.route");
const tenantRoutes = require("./modules/tenant/tenant.route");
const transactionRoutes = require("./modules/transaction/transaction.route");
const transactionHistoryRoutes = require("./modules/transaction-history/transaction-history.route");
const troubleshootRoutes = require("./modules/troubleshoot/troubleshoot.route");
const universalBaseRateRoutes = require("./modules/universal-base-rate/universal-base-rate.route");
const uploadRoutes = require("./modules/upload/upload.route");
const userRoutes = require("./modules/user/user.route");
const userRoleRoutes = require("./modules/user-role/user-role.route");
const webhookRoutes = require("./modules/webhook/webhook.route");
const languageRoutes = require("./modules/language/language.route");
const configConstantRoutes = require("./modules/config-constant/config-constant.route");
const webhookListenerRoutes = require("./modules/webhook-listener/webhook-listener.route");
const activatorRoutes = require("./modules/activator/activator.route");

// CPO
const cpoUserRoutes = require("./modules/cpo/cpo-user/cpo-user.route");
const cpoUserRoleRoutes = require("./modules/cpo/cpo-user-role/cpo-user-role.route");
const cpoBaseRateRoutes = require("./modules/cpo/cpo-base-rate/cpo-base-rate.route");
const cpoPaymentAccountRoutes = require("./modules/cpo/cpo-payment-account/cpo-payment-account.route");
const cpoSubscriptionPurchaseReqRoutes = require("./modules/cpo/cpo-subscription-purchase-request/cpo-subscription-purchase-request.route");
const cpoCardDetailsRoutes = require("./modules/cpo/cpo-card-details/cpo-card-details.route");
const allocationRuleRoutes = require("./modules/cpo/allocation-rules/allocation-rules.route");

// Customers
const customerAuthRoutes = require("./modules/customers/customer-auth/customer-auth.route");
const guestCustomerRoutes = require("./modules/customers/guest-customer/guest-customer.route");
const customerChargerRoutes = require("./modules/customers/customer-charger/customer-charger.route");
const customerPaymentCardRoutes = require("./modules/customers/customer-payment-card/customer-payment-card.route");
const customerTransactions = require("./modules/customers/customer-transaction/customer-transaction.route");
const emspUserRoutes = require("./modules/emsp-user/emsp-user.route");
const departmentRoutes = require("./modules/department/department.route");

// User
const cgxTeamRoutes = require("./modules/user/cgx-team/cgx-team.route");
const superAdminRoutes = require("./modules/user/super-admin/super-admin.route");

// Partner
const partnerRoutes = require("./modules/partner/partner.route");

// Contract
const contractRoutes = require("./modules/contract/contract.route");

// Emsp
const emspRoutes = require("./modules/emsp/emsp.route");

// Settlement
const settlementRoutes = require("./modules/settlement/settlement.route");
const { authenticatePusherController } = require("@shared-libs/pusher");

// Support Ticket
const supportTicketRoutes = require("./modules/support-ticket/support-ticket.route");

// Refund
const refundRoutes = require("./modules/refund/refund.route");

// Revenue Reports
const revenueReportsRoutes = require("./modules/revenue-reports/revenue-reports.route");

// Partner Card
const partnerCardRoutes = require("./modules/partner-card/partner-card.route");
const remoteOcppRoutes = require("./modules/remote-ocpp/remote-ocpp.route");

const paynexRoutes = require("./modules/paynex/paynex.route");

const chargerCardsRoutes = require("./modules/charger-cards/charger-cards.route");
const chargerConfigurationsRoutes = require("./modules/charger-configurations/charger-configurations.route");
const otaUpdatesRoutes = require("./modules/ota-updates/ota-updates.route");

// const paynexRoutes = require("./modules/paynex/paynex.route");

const RegisterApiRoutes = (app) => {
  app.use("/api/razorpay", razorpayRoutes);
  app.use("/info", infoRoutes);
  app.use("/ip-info", ipInfoRoutes);

  app.use("/hub/moneris", hubMonerisRoute);
  app.use("/hub/performance-analytics", hubPerformanceAnalyticsRoute);
  app.use("/hub/charger", hubChargerRoute);

  // Ocpp Handlers Routes (Should start with /ocpp)
  app.use("/ocpp", ocppHandlerRoutes);

  // Payment Routes (Should start with /payment)
  app.use("/payment", paymentRoutes);

  // Customer Routes (Should start with /app)
  app.use("/app/auth", customerAuthRoutes);
  app.use("/app/guest", guestCustomerRoutes);
  app.use("/app/charger", customerChargerRoutes);
  app.use("/app/payment-card", customerPaymentCardRoutes);
  app.use("/app/transaction", customerTransactions);

  // Super Admin & CPO Routes (MUST start with /api)
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/activator", activatorRoutes);
  app.use("/api/performance", performanceAnalyticsRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/charger", chargerRoutes);
  app.use("/api/ota-updates", otaUpdatesRoutes);
  app.use("/api/charger-card", chargerCardsRoutes);
  app.use("/api/charger-configurations", chargerConfigurationsRoutes);
  app.use("/api/charger-et-testing", chargerEtTestingRoutes);
  app.use("/api/connector-types", connectorTypeRoutes);
  app.use("/api/country", countryRoutes);
  app.use("/api/country-base-rate", countryBaseRateRoutes);
  app.use("/api/cpo-admin", cpoAdminRoutes);
  app.use("/api/evse-station", evseStationRoutes);
  app.use("/api/faq", faqRoutes);
  app.use("/api/gitlab-webhook", gitlabWebhookRoutes);
  app.use("/api/invoice", invoiceRoutes);
  app.use("/api/little-pay", littlePayRoutes);
  app.use("/api/auro-pay", auroPayRoutes);
  app.use("/api/manage-data", manageDataRoutes);
  app.use("/api/notification", notificationRoutes);
  app.use("/api/ocpp", ocppRoutes);
  app.use("/api/payment-mode", paymentModeRoutes);
  app.use("/api/rapid-up", rapidUpRoutes);
  app.use("/api/serial-number", serialNumberRoutes);
  app.use("/api/service-request", serviceRequestRoutes);
  app.use("/api/session", sessionRoutes);
  app.use("/api/subscription-plan", subscriptionPlanRoutes);
  app.use("/api/tenant", tenantRoutes);
  app.use("/api/transaction", transactionRoutes);
  app.use("/api/transaction-history", transactionHistoryRoutes);
  app.use("/api/troubleshoot", troubleshootRoutes);
  app.use("/api/set-universal-base-rate", universalBaseRateRoutes);
  app.use("/api/file", uploadRoutes);
  app.use("/api/user-role", userRoleRoutes);
  app.use("/api/webhook", webhookRoutes);
  app.use("/api/language", languageRoutes);
  app.use("/api/config-constant", configConstantRoutes);
  app.use("/api/webhook-listener", webhookListenerRoutes);

  // CPO Routes
  app.use("/api/cpo/user", cpoUserRoutes);
  app.use("/api/cpo/role", cpoUserRoleRoutes);
  app.use("/api/cpo/base-rate", cpoBaseRateRoutes);
  app.use("/api/cpo/payment-account", cpoPaymentAccountRoutes);
  app.use(
    "/api/cpo/subscription-purchase-request",
    cpoSubscriptionPurchaseReqRoutes,
  );
  app.use("/api/cpo/card-details", cpoCardDetailsRoutes);
  app.use("/api/cpo/allocation-rule", allocationRuleRoutes);

  // Department routes
  app.use("/api/department", departmentRoutes);

  // Partner routes (Super Admin only)
  app.use("/api/partner", partnerRoutes);

  // Contract routes
  app.use("/api/contract", contractRoutes);

  // User routes (SPECIFIC ROUTES FIRST)
  app.use("/api/user/cgx-team", cgxTeamRoutes);
  app.use("/api/user/super-admin", superAdminRoutes);

  // General user routes (AFTER SPECIFIC ROUTES)
  app.use("/api/user", userRoutes);

  // Emsp routes
  app.use("/api/emsp/user", emspUserRoutes);
  app.use("/api/emsp", emspRoutes);

  // Settlement routes
  app.use("/api/settlement", settlementRoutes);

  app.use("/api/pusher/auth", authenticatePusherController);

  app.use("/api/support-ticket", supportTicketRoutes);

  app.use("/api/refund", refundRoutes);

  // Revenue Reports routes
  app.use("/api/revenue-reports", revenueReportsRoutes);

  app.use("/api/partner-card", partnerCardRoutes);
  app.use("/api/remote-ocpp", remoteOcppRoutes);

  app.use("/api/paynex", paynexRoutes);
};

module.exports = { RegisterApiRoutes };
