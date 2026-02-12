const { DataSource } = require("typeorm");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const MySQLDataSource = new DataSource({
  type: "mysql",
  host: process.env.MYSQL_DB_HOST,
  port: process.env.MYSQL_DB_PORT,
  username: process.env.MYSQL_DB_USERNAME,
  password: process.env.MYSQL_DB_PASSWORD,
  database: process.env.MYSQL_DB_NAME,

  synchronize: false,
  // logging: false,
  logging: ["error"],

  retryAttempts: 5,
  retryDelay: 3000,

  timezone: "Z", // ✅ Force UTC
  extra: {
    connectionLimit: 10, // <= limit to avoid hitting 50
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  },
  entities: [`${__dirname}/entities/**/*.entity{.ts,.js}`],
});

const initializeMySQL = async () => {
  try {
    await MySQLDataSource.initialize();
    console.log("MySQL Database connected successfully.");
  } catch (error) {
    console.error("MySQL Database connection error:", error);
    throw error;
  }
};

module.exports = {
  initializeMySQL,
  MySQLDataSource,
  ChargerRepository: MySQLDataSource.getRepository("Charger"),
  ChargerRevenueRepository: MySQLDataSource.getRepository("ChargerRevenue"),
  ChargerAuthCodesRepository: MySQLDataSource.getRepository("ChargerAuthCodes"),
  ChargerModelRepository: MySQLDataSource.getRepository("ChargerModel"),
  ChargerConnectorMappingRepository: MySQLDataSource.getRepository(
    "ChargerConnectorMapping",
  ),
  ChargerConnectorPairRepository: MySQLDataSource.getRepository(
    "ChargerConnectorPair",
  ),
  ChargerConnectorTypeRepository: MySQLDataSource.getRepository(
    "ChargerConnectorType",
  ),
  ChargerMeterValuesRepository:
    MySQLDataSource.getRepository("ChargerMeterValues"),
  ConnectedChargerRepository: MySQLDataSource.getRepository("ConnectedCharger"),
  CustomersRepository: MySQLDataSource.getRepository("Customers"),
  EvseStationRepository: MySQLDataSource.getRepository("EvseStation"),
  UserRepository: MySQLDataSource.getRepository("User"),
  UserCredentialRepository: MySQLDataSource.getRepository("UserCredential"),
  DepartmentRepository: MySQLDataSource.getRepository("Department"),
  UserRoleRepository: MySQLDataSource.getRepository("UserRole"),
  UserSessionRepository: MySQLDataSource.getRepository("UserSession"),
  UserViewRepository: MySQLDataSource.getRepository("UserView"),
  CpoUserViewRepository: MySQLDataSource.getRepository("CpoUserView"),
  CustomerCredentialRepository:
    MySQLDataSource.getRepository("CustomerCredential"),
  CustomerSessionRepository: MySQLDataSource.getRepository("CustomerSession"),
  ChargerUsageTypeRepository: MySQLDataSource.getRepository("ChargeUsageType"),
  ServiceRequestCategoryRepository: MySQLDataSource.getRepository(
    "ServiceRequestCategory",
  ),
  FaqRepository: MySQLDataSource.getRepository("Faq"),
  FaqUserRelationRepository: MySQLDataSource.getRepository("FaqUserRelation"),
  ServiceRequestRepository: MySQLDataSource.getRepository("ServiceRequest"),
  ServiceRequestLogRepository:
    MySQLDataSource.getRepository("ServiceRequestLog"),
  ChargerViewRepository: MySQLDataSource.getRepository("ChargerView"),
  EvseStationViewRepository: MySQLDataSource.getRepository("EvseStationView"),
  ContractViewRepository: MySQLDataSource.getRepository("ContractView"),
  CpoPaymentAccountRepository:
    MySQLDataSource.getRepository("CpoPaymentAccount"),
  ConfigConstantsRepository: MySQLDataSource.getRepository("ConfigConstants"),
  TenantRepository: MySQLDataSource.getRepository("Tenant"),
  PaymentModeRepository: MySQLDataSource.getRepository("PaymentMode"),
  StoreUserMappingRepository: MySQLDataSource.getRepository("StoreUserMapping"),
  TenantAccountRepository: MySQLDataSource.getRepository("TenantAccount"),
  MultiMediaRepository: MySQLDataSource.getRepository("Multimedia"),
  OcppTransactionsRepository: MySQLDataSource.getRepository("OcppTransactions"),
  ChargerMeteringConfigRepository: MySQLDataSource.getRepository(
    "ChargerMeteringConfig",
  ),
  ChargerOcppConfigRepository:
    MySQLDataSource.getRepository("ChargerOcppConfig"),
  CpoRepository: MySQLDataSource.getRepository("Cpo"),
  CpoUserRepository: MySQLDataSource.getRepository("CpoUser"),
  CpoUserRoleRepository: MySQLDataSource.getRepository("CpoUserRole"),
  CpoUserCredentialRepository:
    MySQLDataSource.getRepository("CpoUserCredential"),
  CpoUserSessionRepository: MySQLDataSource.getRepository("CpoUserSession"),
  CpoBaseRateRepository: MySQLDataSource.getRepository("CpoBaseRate"),
  UniversalBaseRateRepository:
    MySQLDataSource.getRepository("UniversalBaseRate"),
  ChargingInvoiceRepository: MySQLDataSource.getRepository("ChargingInvoice"),
  CpoSubscriptionRepository: MySQLDataSource.getRepository("CpoSubscription"),
  SubscriptionPlanRepository: MySQLDataSource.getRepository("SubscriptionPlan"),
  CpoSubscriptionPurchaseRequestRepository: MySQLDataSource.getRepository(
    "CpoSubscriptionPurchaseRequest",
  ),
  CpoCardDetailsRepository: MySQLDataSource.getRepository("CpoCardDetails"),
  CpoSubscriptionInvoiceRepository: MySQLDataSource.getRepository(
    "CpoSubscriptionInvoice",
  ),
  ChargerExperienceFeedbackRepository: MySQLDataSource.getRepository(
    "ChargerExperienceFeedback",
  ),
  EMspRepository: MySQLDataSource.getRepository("EMsp"),
  EMspBusinessTaxDetailsRepository: MySQLDataSource.getRepository(
    "EmspBusinessTaxDetail",
  ),
  EMspBankAccountRepository: MySQLDataSource.getRepository("EmspBankAccount"),
  EMspChargerConfigRepository: MySQLDataSource.getRepository(
    "EmspChargerConfigSetting",
  ),
  EMspPaymentConfigRepository: MySQLDataSource.getRepository(
    "EmspPaymentConfigSetting",
  ),
  EMspUserRepository: MySQLDataSource.getRepository("EmspUser"),
  EMspUserSessionRepository: MySQLDataSource.getRepository("EmspUserSession"),
  EMspUserCredentialRepository:
    MySQLDataSource.getRepository("EmspUserCredential"),
  GuestCustomersRepository: MySQLDataSource.getRepository("GuestCustomers"),
  GuestCustomerSessionRepository: MySQLDataSource.getRepository(
    "GuestCustomerSession",
  ),
  ChargerSerialNumberLogsRepository: MySQLDataSource.getRepository(
    "ChargerSerialNumberLogs",
  ),
  PaymentTransactionsRepository: MySQLDataSource.getRepository(
    "PaymentTransactions",
  ),
  LocalizationCodesRepository:
    MySQLDataSource.getRepository("LocalizationCodes"),
  ChargerPaymentConfigRepository: MySQLDataSource.getRepository(
    "ChargerPaymentConfig",
  ),
  ChargerVersionRepository: MySQLDataSource.getRepository("ChargerVersion"),
  TestingConfigurationRepository: MySQLDataSource.getRepository(
    "TestingConfiguration",
  ),
  FeedbackCannedMessagesRepository: MySQLDataSource.getRepository(
    "FeedbackCannedMessages",
  ),
  ChargerEtTestingRepository: MySQLDataSource.getRepository("ChargerEtTesting"),
  AllocationRulesRepository: MySQLDataSource.getRepository("AllocationRule"),
  AllocationPartnersRepository:
    MySQLDataSource.getRepository("AllocationPartner"),
  ChargerEtTestingTransactionsRepository: MySQLDataSource.getRepository(
    "ChargerEtTestingTransactions",
  ),
  ChargerLanguageRepository: MySQLDataSource.getRepository("ChargerLanguage"),
  ChargerConstantsRepository: MySQLDataSource.getRepository("ChargerConstants"),
  RegionalElectricityRateRepository: MySQLDataSource.getRepository(
    "RegionalElectricityRate",
  ),
  LanguageRepository: MySQLDataSource.getRepository("Language"),
  CustomerPaymentCardRepository: MySQLDataSource.getRepository(
    "CustomerPaymentCard",
  ),
  ApiKeysRepository: MySQLDataSource.getRepository("ApiKeys"),
  ChargerCardRepository: MySQLDataSource.getRepository("ChargerCard"),
  PartnerRepository: MySQLDataSource.getRepository("Partner"),
  ContractRepository: MySQLDataSource.getRepository("Contract"),
  ContractPartnersRepository: MySQLDataSource.getRepository("ContractPartners"),
  ContractEvseStationsRepository: MySQLDataSource.getRepository(
    "ContractEvseStations",
  ),
  ContractActivityRepository: MySQLDataSource.getRepository("ContractActivity"),
  PartnerViewRepository: MySQLDataSource.getRepository("PartnerView"),
  PartnerAccessViewRepository:
    MySQLDataSource.getRepository("PartnerAccessView"),
  SettlementRepository: MySQLDataSource.getRepository("Settlement"),
  SettlementPartnerRepository:
    MySQLDataSource.getRepository("SettlementPartner"),
  SettlementViewRepository: MySQLDataSource.getRepository("SettlementView"),
  SupportTicketRepository: MySQLDataSource.getRepository("SupportTicket"),
  SupportTicketUpdatesRepository: MySQLDataSource.getRepository(
    "SupportTicketUpdates",
  ),
  PartnerCardRepository: MySQLDataSource.getRepository("PartnerCard"),
  ContractChargerViewRepository: MySQLDataSource.getRepository(
    "ContractChargerView",
  ),
  OtaUpdatesRepository: MySQLDataSource.getRepository("OtaUpdate"),
  OtaUpdatesChargersRepository:
    MySQLDataSource.getRepository("OtaUpdateChargers"),
  ChargerBookingsRepository: MySQLDataSource.getRepository("ChargerBookings"),
  ChargerLocalAuthorizationRepository: MySQLDataSource.getRepository("ChargerLocalAuthorization")
};
