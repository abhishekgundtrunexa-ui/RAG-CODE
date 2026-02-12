require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const UserStatuses = {
  REGISTERED: "REGISTERED", //invited by admin but password is not set
  ACTIVE: "ACTIVE", //once user sets the password
  INACTIVE: "INACTIVE", //when user subscription gets over
  DISABLED: "DISABLED", //id the admin manually disables the user
};

const PartnerTypes = {
  SITE_HOST: "SITE HOST",
  INVESTOR: "INVESTOR",
  CPO: "CPO",
};

const TransferStatuses = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  FAILED: "Failed",
  PROCESSING: "Processing",
};

const BankVerificationStatuses = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

const SettlementPeriods = {
  WEEKLY: "1 Week",
  TWO_WEEKS: "2 Weeks",
  MONTHLY: "1 Month",
};

const SettlementStatuses = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  SETTLED: "Settled",
  REJECTED: "Rejected",
};

const UserSessionStatuses = {
  CURRENT: "CURRENT",
  EXPIRED: "EXPIRED",
};

const CustomerSessionStatuses = {
  CURRENT: "CURRENT",
  EXPIRED: "EXPIRED",
};

const GuestCustomerSessionStatuses = {
  CURRENT: "CURRENT",
  EXPIRED: "EXPIRED",
};

const ChargerConnectorTypes = {
  TYPE1: "type_1",
  TYPE2: "type_2",
  CC2: "cc2",
};

const ChargerConnectorTypesLabelMapping = {
  type_1: "Type1",
  type_2: "Type2",
  cc2: "CC2",
};

const ChargerStatuses = {
  GENERATED: "generated", //when user registers or enters the new charger in the system
  REGISTERED: "registered", //when user registers or enters the new charger in the system
  ACTIVATED: "activated", //when manually activates the charger with activation code
  AVAILABLE: "available", //after activation of charger, when heartbeat or boot notification is received, charger is available for charging the vehicle
  BUSY: "busy", //when charger is charging any vehicle, then it's busy in charging
  OFFLINE: "offline", //when heartbeat is not received from charger, then consider it offline
  DISABLED: "disabled",
  INOPERATIVE: "in-operative",
};

const TestingConfigStatuses = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  STOPPED: "STOPPED",
  CANCELLED: "CANCELLED",
};

//Statuses received from the OCPP Charge Points -> StatusNotification event
const ChargingStatuses = {
  AVAILABLE: "Available",
  PREPARING: "Preparing",
  CHARGING: "Charging",
  SUSPENDED_EVSE: "SuspendedEVSE",
  SUSPENDED_EV: "SuspendedEV",
  FINISHING: "Finishing",
  RESERVED: "Reserved",
  UNAVAILABLE: "Unavailable",
  FAULTED: "Faulted",
};

const RefundIssueCategoryStatus = {
  EV_DRIVER_ISSUE: "EV Driver Issue",
  CARD_RE_ISSUE: "Card Re-Issue",
  GENERAL_SUPPORT: "General Support",
  CSMS_SUBSCRIPTION: "CSMS Subscription",
  HARDWARE_ISSUE: "Hardware issue",
  CHARGER_OFFLINE: "Charger offline",
};

const RefundPriorityStatus = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

const RefundAssignedToStatus = {
  SALES: "Sales",
  OPERATIONS: "Operations",
  MAINTENANCE: "Maintenance",
  FINANCE: "Finance",
  SUPPORT: "Support Team",
};

const TicketStatus = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const CreatedBy = {
  ADMIN: "Admin",
  PARTNER: "Partner",
};

const RefundStatus = {
  PENDING: "Pending",
  IN_REVIEW: "In Review",
  COMPLETED: "Completed",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const ExpireTimeConstants = {
  USER_SET_PASSWORD_CODE: process.env.USER_SET_PASSWORD_CODE_EXPIRE_TIME || 7, //days
  CHARGER_ACTIVATION_CODE: process.env.CHARGER_ACTIVATION_CODE_EXPIRE_TIME || 7, //days
  CHARGER_VALID_TILL: process.env.CHARGER_VALID_TILL_EXPIRE_TIME || 3, //years
};

const TransactionPaymentModes = {
  CREDIT: "credit",
  DEBIT: "debit",
  QR: "qr",
};

const TransactionStatuses = {
  SUCCESS: "success",
  FAILED: "failed",
  ERROR: "error",
};

const NotificationTypes = {
  CHARGER_REGISTERED: "charger-registered",
  CHARGER_ACTIVATED: "charger-activated",
  CPO_REGISTERED: "cpo-registered",
  CPO_ACTIVATED: "cpo-activated",
  EVSE_STATION_CREATED: "evse-station-created",
  CHARGER_ASSIGNED_TO_CPO: "charger-assigned-to-cpo",
  CHARGER_ASSIGNED_TO_EVSE: "charger-assigned-to-evse",
};

const customErrorMsg = {
  auth: {
    UNAUTHORIZED: "Unauthorized.",
    FORBIDDEN: "Forbidden.",
    USER_CREDENTIAL_NOT_FOUND: "User Credential Not Found.",
    CUSTOMER_CREDENTIAL_NOT_FOUND: "Customer Credential Not Found.",
    INVALID_PASSWORD: "Invalid password.",
    USER_SESSION_ALREADY_EXPIRED: "User Session Already Expired.",
    LOGOUT_SUCCESSFUL: "Logout Successful.",
    NEW_PASSWORD_MISMATCH: "New Password And Confirm Password Doesn't Match",
    INVALID_CODE: "Invalid Code Entered.",
    CODE_EXPIRED: "Code Expired, Please try again.",
    PASSWORD_RESET_SUCCESSFUL: "Password Reset Successfully.",
    LOGIN_DISABLED: "Can Not Login, User Is Disabled.",
  },
  user: {
    USER_ALREADY_EXIST: "User Already Exist.",
    INVALID_USER_TYPE_IN_PAYLOAD: "Invalid User Type.",
    INVALID_USER_ROLE_IN_PAYLOAD: "Invalid User Role.",
    PARENT_USER_NOT_FOUND: "Parent User Not Found.",
    USER_NOT_FOUND: "User Not Found.",
    CANNOT_RESEND_INVITE_USER_NOT_REGISTERED:
      "Can Not Resend Invite, User Is Not Registered.",
    USER_STATUS_IS_INVITED_CANNOT_ENABLE_USER:
      "User Status Is Invited, Can Not Enable User.",
    USER_IS_ALREADY_ENABLED_ACTIVE: "User Is Already Enabled/Active.",
    USER_WITH_MOBILE_NUMBER_ALREADY_EXIST:
      "User With Mobile Number Already Exist.",
    USER_ALREADY_DELETED: "User Already Deleted.",
    USER_ALREADY_DISABLED: "User Is Already Disabled.",
  },
  station: {
    EVSE_STATION_NOT_FOUND: "EVSE Station Not Found.",
    STATION_NOT_FOUND: "EVSE Station Not Found.",
    STATION_ALREADY_DELETED: "EVSE Station Already Deleted.",
  },
  charger: {
    CHARGER_ALREADY_EXISTS: "Charger With Serial Number Already Exists.",
    INVALID_CONNECTOR_TYPE: "Invalid Connector Type.",
    EVSE_STATION_NOT_FOUND: "EVSE Station Not Found.",
    INVALID_OWNER_ID: "Invalid Owner ID.",
    CHARGER_NOT_FOUND: "Charger Not Found.",
    CHARGER_ALREADY_ACTIVE: "Charger Is Already Active.",
    CHARGER_NOT_REGISTERED: "Charger Is Not In Registered Status.",
    INVALID_ACTIVATION_CODE: "Invalid Activation Code.",
    ACTIVATION_CODE_EXPIRED: "Activation Code Expired.",
    CHARGER_ALREADY_DELETED: "Charger Already Deleted.",
    CONNECTOR_ID_ALREADY_EXIST_FOR_CHARGER:
      "Connector ID Already Exists For Charger.",
    INVALID_CHARGE_USAGE_TYPE_ID: "Invalid Charge Usage Type.",
    EVSE_STATION_AND_CHARGER_LOCATION_NOT_MATCH:
      "EVSE Station & Charger's Location Does Not Match.",
    CHARGER_HAS_ACTIVE_SESSION: "Charger Has Active Session.",
  },
  session: {
    SESSION_NOT_FOUND: "Session Not Found.",
  },
  transaction: {
    TRANSACTION_NOT_FOUND: "Transaction Not Found.",
  },
  serviceRequest: {
    SERVICE_REQUEST_CATEGORY_NOT_FOUND: "Service Request Category Not Found.",
    SERIAL_NUMBER_ALREADY_EXIST: "Serial Number Is Already Exist.",
    SERVICE_REQUEST_NOT_FOUND: "Service Request Not Found.",
    SERVICE_REQUEST_ALREADY_DELETED: "Service Request Already Deleted.",
  },
  faq: {
    FAQ_NOT_FOUND: "Faq Not Found.",
    FAQ_ALREADY_DELETED: "Faq Already Deleted.",
  },
  webhook: {
    WEBHOOK_NOT_FOUND: "Webhook Not Found",
    INVALID_WEBHOOK_EVENTS: "Invalid Webhook Events.",
    WEBHOOK_ALREADY_ENABLED: "Webhook Already Enabled.",
    WEBHOOK_ALREADY_DISABLED: "Webhook Already Disabled.",
    WEBHOOK_ALREADY_EXIST: "Webhook Already Exists With URL.",
  },
  ocpp: {
    CLIENT_NOT_CONNECTED: "Client Not Connected.",
  },
  customer: {
    CUSTOMER_NOT_FOUND: "Customer Not Found.",
  },
  cpo: {
    CPO_ID_NOT_FOUND: "Cpo Id Not Found.",
  },
};

const customSuccessMsg = {
  auth: {
    LOGOUT_SUCCESS: "Logout Successful.",
    PASSWORD_RESET_SUCCESS: "Password Reset Successfully.",
  },
  session: {
    SESSION_DELETED_SUCCESS: "Session Deleted Successfully.",
  },
  transaction: {
    TRANSACTION_DELETED_SUCCESS: "Transaction Deleted Successfully.",
  },
};

const ServiceRequestCategories = {
  CHARGER_INSTALLATION: "charger_installation",
  CHARGER_CONNECTIVITY: "charger_connectivity",
  CHARGER_ACTIVATION: "charger_activation",
  CHARGING_SESSION: "charging_session",
  CHARGING_TRANSACTION: "charging_transaction",
  MAINTENANCE: "maintenance",
  HARDWARE_SPARES: "hardware_spares",
  POWER: "power",
  SAFETY: "safety",
  NETWORK_INTERNET: "network_internet",
  DAMAGES_BREAKDOWN: "damages_breakdown",
  SUBSCRIPTION_PLAN_CHANGE: "subscription_plan_change",
  REIMBURSEMENT_AMOUNT_NOT_RECEIVED: "reimbursement_amount_not_received",
  SUBSCRIPTION_PLAN_CHANGE: "subscription_plan_change",
  FARE_UPDATE: "fare_update",
  DASHBOARD_DATA_ISSUES: "dashboard_data_issues",
  OTHERS: "others",
};

const ServiceRequestCategoriesLabelMapping = {
  charger_installation: "Charger installation",
  charger_connectivity: "Charger connectivity",
  charger_activation: "Charger activation",
  charging_session: "Charging session",
  charging_transaction: "Charging transaction",
  maintenance: "Maintenance",
  hardware_spares: "Hardware / spares",
  power: "Power",
  safety: "Safety",
  network_internet: "Network / Internet",
  damages_breakdown: "Damages / breakdown",
  subscription_plan_change: "Subscription plan change",
  reimbursement_amount_not_received: "Reimbursement amount not received",
  fare_update: "Fare update",
  dashboard_data_issues: "Dashboard data issues",
  others: "Others",
};

const ServiceRequestCategoriesSequenceMapping = {
  charger_installation: 1,
  charger_connectivity: 2,
  charger_activation: 3,
  charging_session: 4,
  charging_transaction: 5,
  maintenance: 6,
  hardware_spares: 7,
  power: 8,
  safety: 9,
  network_internet: 10,
  damages_breakdown: 11,
  subscription_plan_change: 12,
  reimbursement_amount_not_received: 13,
  fare_update: 14,
  dashboard_data_issues: 15,
  others: 16,
};

const ServiceRequestStatuses = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  FIRST_REVIEW: "first_review",
  CLOSED: "closed",
};

const EmailConstants = {
  subject: {
    WELCOME_TO_CHARGE_NEX: "Welcome To ChargNex",
    CHARGER_ACTIVATION: "Charger Activation",
    RESET_PASSWORD: "Reset Password",
    CUSTOMER_LOGIN_OTP: "Your Login Verification Code: {{otp}}",
    TRANSACTION_RECEIPT: "Your Charging Receipt – {{receipt_id}}",
    NEW_CHARGER_ADDED: "New Charger Added",
    RELEASE_NOTE: "Release Note",
    ADD_EMSP: "Verify your identity to add EMSP user",
    DELETE_DEPARTMENT: "Verify your identity to delete department",
    UPDATE_EMSP: "Verify your identity to update EMSP settings",
    DELETE_EMSP: "Verify your identity to delete EMSP settings",
  },
};

const MongoDbConstants = {
  viewAggregationQuery: {
    transaction: [
      {
        $lookup: {
          from: "sessions",
          localField: "sessionId",
          foreignField: "_id",
          as: "sessionObj",
        },
      },
      {
        $lookup: {
          from: "customers",
          let: { customerId: "$customerId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$customerId"] },
              },
            },
          ],
          as: "customerObj",
        },
      },
      {
        $unwind: "$sessionObj",
      },
      {
        $unwind: {
          path: "$customerObj",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          session: "$sessionObj",
          customer: "$customerObj",
          customerName: {
            $cond: {
              if: { $eq: ["$customerObj", {}] },
              then: "unknown",
              else: {
                $concat: [
                  {
                    $ifNull: ["$customerObj.firstName", ""],
                  },
                  " ",
                  {
                    $ifNull: ["$customerObj.lastName", ""],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $unset: ["sessionObj", "customerObj"],
      },
    ],
    session: [
      {
        $lookup: {
          from: "customers",
          let: { customerId: "$customerId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$customerId"] },
              },
            },
          ],
          as: "customerObj",
        },
      },
      {
        $unwind: {
          path: "$customerObj",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          customer: "$customerObj",
          customerName: {
            $cond: {
              if: { $eq: ["$customerObj", {}] },
              then: "unknown",
              else: {
                $concat: [
                  {
                    $ifNull: ["$customerObj.firstName", ""],
                  },
                  " ",
                  {
                    $ifNull: ["$customerObj.lastName", ""],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $unset: ["customerObj"],
      },
    ],
    //add other view queries as required
  },
};

const PusherConstants = {
  channels: {
    PUSHER_NODE_APP: "pusher-node-app",
  },
  events: {
    charger: {
      CHARGER_ACTIVATED: "charger-activated",
      CHARGER_ASSIGNED: "charger-assigned",
      CHARGER_UPDATED: "charger-updated",
      CHARGER_REGISTERED: "charger-registered",
      CHARGER_DOWN: "charger-down",
      CHARGER_CONFIG_FETCHED: "charger-config-fetched",
    },
    cpo: {
      ACCOUNT_UPDATED: "account-updated",
      PROFILE_UPDATED: "profile-updated",
    },
    eMsp: {
      ACCOUNT_UPDATED: "account-updated",
      PROFILE_UPDATED: "profile-updated",
    },
    evse: {
      EVSE_UPDATED: "evse-updated",
    },
    transaction: {
      TRANSACTION_CREATED: "transaction-created",
      TRANSACTION_UPDATED: "transaction-updated",
      PREAUTH_CREATED: "preauth-created",
      CAPTURE_CREATED: "capture-created",
    },
  },
};

const WebhookEvents = {
  CHARGER_STATUS_UPDATE: "charger_status_update",
};

const OcppEvents = {
  Authorize: "Authorize",
  BootNotification: "BootNotification",
  CancelReservation: "CancelReservation",
  ChangeAvailability: "ChangeAvailability",
  ChangeConfiguration: "ChangeConfiguration",
  ClearCache: "ClearCache",
  ClearChargingProfile: "ClearChargingProfile",
  DataTransfer: "DataTransfer",
  DiagnosticsStatusNotification: "DiagnosticsStatusNotification",
  FirmwareStatusNotification: "FirmwareStatusNotification",
  GetCompositeSchedule: "GetCompositeSchedule",
  GetConfiguration: "GetConfiguration",
  GetDiagnostics: "GetDiagnostics",
  GetLocalListVersion: "GetLocalListVersion",
  Heartbeat: "Heartbeat",
  MeterValues: "MeterValues",
  RemoteStartTransaction: "RemoteStartTransaction",
  RemoteStopTransaction: "RemoteStopTransaction",
  ReserveNow: "ReserveNow",
  Reset: "Reset",
  SendLocalList: "SendLocalList",
  SetChargingProfile: "SetChargingProfile",
  StartTransaction: "StartTransaction",
  StatusNotification: "StatusNotification",
  StopTransaction: "StopTransaction",
  TriggerMessage: "TriggerMessage",
  UnlockConnector: "UnlockConnector",
  UpdateFirmware: "UpdateFirmware",

  LogStatusNotification: "LogStatusNotification",
};

const OcppSource = {
  CHARGER: "charger", //refers to ocpp client or charger
  SERVER: "server", //refers to ocpp server or csms
};

const ChargingState = {
  START: "start",
  STOP: "stop",
};

const ChargerConnectorPairMapping = {
  SS: "Socket-Socket",
  SG: "Socket-Gun",
  GS: "Gun-Socket",
  GG: "Gun-Gun",
};

const ChargerModelMapping = {
  HP: "Hyper",
  PR: "Prime",
};

const ConnectedChargerStatuses = {
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
};

const QueueNames = {
  EMAIL_QUEUE: "email-queue",
  OCPP_AMOUNT_LOOKUP_QUEUE: "ocpp-amount-lookup-queue",
  OCPP_REALTIME_AMOUNT_QUEUE: "ocpp-realtime-amount-queue",
  STOP_TRANSACTION_AND_CAPTURE_QUEUE: "stop-transaction-and-capture-queue",
  OCPP_STOP_TRANSACTION_QUEUE: "ocpp-stop-transaction-queue",
  OCPP_GENERATE_INVOICE_QUEUE: "ocpp-generate-invoice-queue",
  OCPP_CALCULATE_AVG_CHARGING_RATE_QUEUE:
    "ocpp-calculate-avg-charging-rate-queue",
  SYNC_REVENUE_QUEUE: "sync-revenue-queue",
  TEMP_INVOICE_GENERATE_QUEUE: "temp-invoice-generate-queue",
  OCPP_GET_CONFIGURATION_QUEUE: "ocpp-get-configuration-queue",
  OCPP_CHANGE_CONFIGURATION_QUEUE: "ocpp-change-configuration-queue",
  OCPP_UPDATE_PENDING_FIRMWARE_QUEUE: "ocpp-update-pending-firmware-queue",
  OCPP_SEND_LOCAL_LIST_QUEUE: "ocpp-send-local-list-queue",
  MOCK_TRANSACTION_QUEUE: "mock-transaction-queue",
};

const RedisConfig = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
};

const OcppConstants = {
  BOOT_NOTIFICATION_INTERVAL: 15, //Seconds
  HEARTBEAT_THRESHOLD: 4, //check 4 consecutive missing heartbeats
};

const ValidTimezones = {
  AFRICA_ABIDJAN: "Africa/Abidjan",
  AFRICA_ALGIERS: "Africa/Algiers",
  AFRICA_BISSAU: "Africa/Bissau",
  AFRICA_CAIRO: "Africa/Cairo",
  AFRICA_CASABLANCA: "Africa/Casablanca",
  AFRICA_CEUTA: "Africa/Ceuta",
  AFRICA_EL_AAIUN: "Africa/El_Aaiun",
  AFRICA_JOHANNESBURG: "Africa/Johannesburg",
  AFRICA_JUBA: "Africa/Juba",
  AFRICA_KHARTOUM: "Africa/Khartoum",
  AFRICA_LAGOS: "Africa/Lagos",
  AFRICA_MAPUTO: "Africa/Maputo",
  AFRICA_MONROVIA: "Africa/Monrovia",
  AFRICA_NAIROBI: "Africa/Nairobi",
  AFRICA_NDJAMENA: "Africa/Ndjamena",
  AFRICA_SAO_TOME: "Africa/Sao_Tome",
  AFRICA_TRIPOLI: "Africa/Tripoli",
  AFRICA_TUNIS: "Africa/Tunis",
  AFRICA_WINDHOEK: "Africa/Windhoek",
  AMERICA_ADAK: "America/Adak",
  AMERICA_ANCHORAGE: "America/Anchorage",
  AMERICA_ARAGUAINA: "America/Araguaina",
  AMERICA_ARGENTINA_BUENOS_AIRES: "America/Argentina/Buenos_Aires",
  AMERICA_ARGENTINA_CATAMARCA: "America/Argentina/Catamarca",
  AMERICA_ARGENTINA_CORDOBA: "America/Argentina/Cordoba",
  AMERICA_ARGENTINA_JUJUY: "America/Argentina/Jujuy",
  AMERICA_ARGENTINA_LA_RIOJA: "America/Argentina/La_Rioja",
  AMERICA_ARGENTINA_MENDOZA: "America/Argentina/Mendoza",
  AMERICA_ARGENTINA_RIO_GALLEGOS: "America/Argentina/Rio_Gallegos",
  AMERICA_ARGENTINA_SALTA: "America/Argentina/Salta",
  AMERICA_ARGENTINA_SAN_JUAN: "America/Argentina/San_Juan",
  AMERICA_ARGENTINA_SAN_LUIS: "America/Argentina/San_Luis",
  AMERICA_ARGENTINA_TUCUMAN: "America/Argentina/Tucuman",
  AMERICA_ARGENTINA_USHUAIA: "America/Argentina/Ushuaia",
  AMERICA_ASUNCION: "America/Asuncion",
  AMERICA_BAHIA: "America/Bahia",
  AMERICA_BAHIA_BANDERAS: "America/Bahia_Banderas",
  AMERICA_BARBADOS: "America/Barbados",
  AMERICA_BELEM: "America/Belem",
  AMERICA_BELIZE: "America/Belize",
  AMERICA_BOA_VISTA: "America/Boa_Vista",
  AMERICA_BOGOTA: "America/Bogota",
  AMERICA_BOISE: "America/Boise",
  AMERICA_CAMBRIDGE_BAY: "America/Cambridge_Bay",
  AMERICA_CAMPO_GRANDE: "America/Campo_Grande",
  AMERICA_CANCUN: "America/Cancun",
  AMERICA_CARACAS: "America/Caracas",
  AMERICA_CAYENNE: "America/Cayenne",
  AMERICA_CHICAGO: "America/Chicago",
  AMERICA_CHIHUAHUA: "America/Chihuahua",
  AMERICA_CIUDAD_JUAREZ: "America/Ciudad_Juarez",
  AMERICA_COSTA_RICA: "America/Costa_Rica",
  AMERICA_CUIABA: "America/Cuiaba",
  AMERICA_DANMARKSHAVN: "America/Danmarkshavn",
  AMERICA_DAWSON: "America/Dawson",
  AMERICA_DAWSON_CREEK: "America/Dawson_Creek",
  AMERICA_DENVER: "America/Denver",
  AMERICA_DETROIT: "America/Detroit",
  AMERICA_EDMONTON: "America/Edmonton",
  AMERICA_EIRUNEPE: "America/Eirunepe",
  AMERICA_EL_SALVADOR: "America/El_Salvador",
  AMERICA_FORT_NELSON: "America/Fort_Nelson",
  AMERICA_FORTALEZA: "America/Fortaleza",
  AMERICA_GLACE_BAY: "America/Glace_Bay",
  AMERICA_GOOSE_BAY: "America/Goose_Bay",
  AMERICA_GRAND_TURK: "America/Grand_Turk",
  AMERICA_GUATEMALA: "America/Guatemala",
  AMERICA_GUAYAQUIL: "America/Guayaquil",
  AMERICA_GUYANA: "America/Guyana",
  AMERICA_HALIFAX: "America/Halifax",
  AMERICA_HAVANA: "America/Havana",
  AMERICA_HERMOSILLO: "America/Hermosillo",
  AMERICA_INDIANA_INDIANAPOLIS: "America/Indiana/Indianapolis",
  AMERICA_INDIANA_KNOX: "America/Indiana/Knox",
  AMERICA_INDIANA_MARENGO: "America/Indiana/Marengo",
  AMERICA_INDIANA_PETERSBURG: "America/Indiana/Petersburg",
  AMERICA_INDIANA_TELL_CITY: "America/Indiana/Tell_City",
  AMERICA_INDIANA_VEVAY: "America/Indiana/Vevay",
  AMERICA_INDIANA_VINCENNES: "America/Indiana/Vincennes",
  AMERICA_INDIANA_WINAMAC: "America/Indiana/Winamac",
  AMERICA_INUVIK: "America/Inuvik",
  AMERICA_IQALUIT: "America/Iqaluit",
  AMERICA_JAMAICA: "America/Jamaica",
  AMERICA_JUNEAU: "America/Juneau",
  AMERICA_KENTUCKY_LOUISVILLE: "America/Kentucky/Louisville",
  AMERICA_KENTUCKY_MONTICELLO: "America/Kentucky/Monticello",
  AMERICA_LA_PAZ: "America/La_Paz",
  AMERICA_LIMA: "America/Lima",
  AMERICA_LOS_ANGELES: "America/Los_Angeles",
  AMERICA_MACEIO: "America/Maceio",
  AMERICA_MANAGUA: "America/Managua",
  AMERICA_MANAUS: "America/Manaus",
  AMERICA_MARTINIQUE: "America/Martinique",
  AMERICA_MATAMOROS: "America/Matamoros",
  AMERICA_MAZATLAN: "America/Mazatlan",
  AMERICA_MENOMINEE: "America/Menominee",
  AMERICA_MERIDA: "America/Merida",
  AMERICA_METLAKATLA: "America/Metlakatla",
  AMERICA_MEXICO_CITY: "America/Mexico_City",
  AMERICA_MIQUELON: "America/Miquelon",
  AMERICA_MONCTON: "America/Moncton",
  AMERICA_MONTERREY: "America/Monterrey",
  AMERICA_MONTEVIDEO: "America/Montevideo",
  AMERICA_NEW_YORK: "America/New_York",
  AMERICA_NOME: "America/Nome",
  AMERICA_NORONHA: "America/Noronha",
  AMERICA_NORTH_DAKOTA_BEULAH: "America/North_Dakota/Beulah",
  AMERICA_NORTH_DAKOTA_CENTER: "America/North_Dakota/Center",
  AMERICA_NORTH_DAKOTA_NEW_SALEM: "America/North_Dakota/New_Salem",
  AMERICA_NUUK: "America/Nuuk",
  AMERICA_OJINAGA: "America/Ojinaga",
  AMERICA_PANAMA: "America/Panama",
  AMERICA_PARAMARIBO: "America/Paramaribo",
  AMERICA_PHOENIX: "America/Phoenix",
  AMERICA_PORT_AU_PRINCE: "America/Port-au-Prince",
  AMERICA_PORTO_VELHO: "America/Porto_Velho",
  AMERICA_PUERTO_RICO: "America/Puerto_Rico",
  AMERICA_PUNTA_ARENAS: "America/Punta_Arenas",
  AMERICA_RANKIN_INLET: "America/Rankin_Inlet",
  AMERICA_RECIFE: "America/Recife",
  AMERICA_REGINA: "America/Regina",
  AMERICA_RESOLUTE: "America/Resolute",
  AMERICA_RIO_BRANCO: "America/Rio_Branco",
  AMERICA_SANTAREM: "America/Santarem",
  AMERICA_SANTIAGO: "America/Santiago",
  AMERICA_SANTO_DOMINGO: "America/Santo_Domingo",
  AMERICA_SAO_PAULO: "America/Sao_Paulo",
  AMERICA_SCORESBYSUND: "America/Scoresbysund",
  AMERICA_SITKA: "America/Sitka",
  AMERICA_ST_JOHNS: "America/St_Johns",
  AMERICA_SWIFT_CURRENT: "America/Swift_Current",
  AMERICA_TEGUCIGALPA: "America/Tegucigalpa",
  AMERICA_THULE: "America/Thule",
  AMERICA_TIJUANA: "America/Tijuana",
  AMERICA_TORONTO: "America/Toronto",
  AMERICA_VANCOUVER: "America/Vancouver",
  AMERICA_WHITEHORSE: "America/Whitehorse",
  AMERICA_WINNIPEG: "America/Winnipeg",
  AMERICA_YAKUTAT: "America/Yakutat",
  AMERICA_YELLOWKNIFE: "America/Yellowknife",
  ANTARCTICA_CASEY: "Antarctica/Casey",
  ANTARCTICA_DAVIS: "Antarctica/Davis",
  ANTARCTICA_DUMONTDURVILLE: "Antarctica/DumontDUrville",
  ANTARCTICA_MACQUARIE: "Antarctica/Macquarie",
  ANTARCTICA_MAWSON: "Antarctica/Mawson",
  ANTARCTICA_MCMURDO: "Antarctica/McMurdo",
  ANTARCTICA_PALMER: "Antarctica/Palmer",
  ANTARCTICA_ROTHERA: "Antarctica/Rothera",
  ANTARCTICA_SOUTH_POLE: "Antarctica/South_Pole",
  ANTARCTICA_SYOWA: "Antarctica/Syowa",
  ANTARCTICA_TROLL: "Antarctica/Troll",
  ANTARCTICA_VOSTOK: "Antarctica/Vostok",
  ARCTIC_LONGYEARBYEN: "Arctic/Longyearbyen",
  ASIA_ALMATY: "Asia/Almaty",
  ASIA_AMMAN: "Asia/Amman",
  ASIA_ANADYR: "Asia/Anadyr",
  ASIA_AQTAU: "Asia/Aqtau",
  ASIA_AQTOBE: "Asia/Aqtobe",
  ASIA_ASHGABAT: "Asia/Ashgabat",
  ASIA_ATYRAU: "Asia/Atyrau",
  ASIA_BAGHDAD: "Asia/Baghdad",
  ASIA_BAKU: "Asia/Baku",
  ASIA_BANGKOK: "Asia/Bangkok",
  ASIA_BARNAUL: "Asia/Barnaul",
  ASIA_BEIRUT: "Asia/Beirut",
  ASIA_BISHKEK: "Asia/Bishkek",
  ASIA_CHITA: "Asia/Chita",
  ASIA_CHOIBALSAN: "Asia/Choibalsan",
  ASIA_COLOMBO: "Asia/Colombo",
  ASIA_DAMASCUS: "Asia/Damascus",
  ASIA_DHAKA: "Asia/Dhaka",
  ASIA_DILI: "Asia/Dili",
  ASIA_DUBAI: "Asia/Dubai",
  ASIA_DUSHANBE: "Asia/Dushanbe",
  ASIA_FAMAGUSTA: "Asia/Famagusta",
  ASIA_GAZA: "Asia/Gaza",
  ASIA_HANOI: "Asia/Hanoi",
  ASIA_HEBRON: "Asia/Hebron",
  ASIA_HO_CHI_MINH: "Asia/Ho_Chi_Minh",
  ASIA_HONG_KONG: "Asia/Hong_Kong",
  ASIA_HOVD: "Asia/Hovd",
  ASIA_IRKUTSK: "Asia/Irkutsk",
  ASIA_ISTANBUL: "Asia/Istanbul",
  ASIA_JAKARTA: "Asia/Jakarta",
  ASIA_JAYAPURA: "Asia/Jayapura",
  ASIA_JERUSALEM: "Asia/Jerusalem",
  ASIA_KABUL: "Asia/Kabul",
  ASIA_KAMCHATKA: "Asia/Kamchatka",
  ASIA_KARACHI: "Asia/Karachi",
  ASIA_KATHMANDU: "Asia/Kathmandu",
  ASIA_KHANDYGA: "Asia/Khandyga",
  ASIA_KOLKATA: "Asia/Kolkata",
  ASIA_KRASNOYARSK: "Asia/Krasnoyarsk",
  ASIA_KUCHING: "Asia/Kuching",
  ASIA_MACAU: "Asia/Macau",
  ASIA_MAGADAN: "Asia/Magadan",
  ASIA_MAKASSAR: "Asia/Makassar",
  ASIA_MANILA: "Asia/Manila",
  ASIA_NICOSIA: "Asia/Nicosia",
  ASIA_NOVOKUZNETSK: "Asia/Novokuznetsk",
  ASIA_NOVOSIBIRSK: "Asia/Novosibirsk",
  ASIA_OMSK: "Asia/Omsk",
  ASIA_ORAL: "Asia/Oral",
  ASIA_PONTIANAK: "Asia/Pontianak",
  ASIA_PYONGYANG: "Asia/Pyongyang",
  ASIA_QATAR: "Asia/Qatar",
  ASIA_QOSTANAY: "Asia/Qostanay",
  ASIA_QYZYLORDA: "Asia/Qyzylorda",
  ASIA_RIYADH: "Asia/Riyadh",
  ASIA_SAKHALIN: "Asia/Sakhalin",
  ASIA_SAMARKAND: "Asia/Samarkand",
  ASIA_SEOUL: "Asia/Seoul",
  ASIA_SHANGHAI: "Asia/Shanghai",
  ASIA_SINGAPORE: "Asia/Singapore",
  ASIA_SREDNEKOLYMSK: "Asia/Srednekolymsk",
  ASIA_TAIPEI: "Asia/Taipei",
  ASIA_TASHKENT: "Asia/Tashkent",
  ASIA_TBILISI: "Asia/Tbilisi",
  ASIA_TEHRAN: "Asia/Tehran",
  ASIA_THIMPHU: "Asia/Thimphu",
  ASIA_TOKYO: "Asia/Tokyo",
  ASIA_TOMSK: "Asia/Tomsk",
  ASIA_ULANBAATAR: "Asia/Ulaanbaatar",
  ASIA_URUMQI: "Asia/Urumqi",
  ASIA_UST_NERA: "Asia/Ust-Nera",
  ASIA_VLADIVOSTOK: "Asia/Vladivostok",
  ASIA_YAKUTSK: "Asia/Yakutsk",
  ASIA_YANGON: "Asia/Yangon",
  ASIA_YEKATERINBURG: "Asia/Yekaterinburg",
  ASIA_YEREVAN: "Asia/Yerevan",
  ATLANTIC_AZORES: "Atlantic/Azores",
  ATLANTIC_BERMUDA: "Atlantic/Bermuda",
  ATLANTIC_CANARY: "Atlantic/Canary",
  ATLANTIC_CAPE_VERDE: "Atlantic/Cape_Verde",
  ATLANTIC_FAROE: "Atlantic/Faroe",
  ATLANTIC_JAN_MAYEN: "Atlantic/Jan_Mayen",
  ATLANTIC_MADEIRA: "Atlantic/Madeira",
  ATLANTIC_REYKJAVIK: "Atlantic/Reykjavik",
  ATLANTIC_SOUTH_GEORGIA: "Atlantic/South_Georgia",
  ATLANTIC_ST_HELENA: "Atlantic/St_Helena",
  ATLANTIC_STANLEY: "Atlantic/Stanley",
  AUSTRALIA_ADELAIDE: "Australia/Adelaide",
  AUSTRALIA_BRISBANE: "Australia/Brisbane",
  AUSTRALIA_BROKEN_HILL: "Australia/Broken_Hill",
  AUSTRALIA_DARWIN: "Australia/Darwin",
  AUSTRALIA_EUCLA: "Australia/Eucla",
  AUSTRALIA_HOBART: "Australia/Hobart",
  AUSTRALIA_LINDEMAN: "Australia/Lindeman",
  AUSTRALIA_LORD_HOWE: "Australia/Lord_Howe",
  AUSTRALIA_MELBOURNE: "Australia/Melbourne",
  AUSTRALIA_PERTH: "Australia/Perth",
  AUSTRALIA_SYDNEY: "Australia/Sydney",
  CANADA_ATLANTIC: "Canada/Atlantic",
  CANADA_CENTRAL: "Canada/Central",
  CANADA_EASTERN: "Canada/Eastern",
  CANADA_MOUNTAIN: "Canada/Mountain",
  CANADA_NEWFOUNDLAND: "Canada/Newfoundland",
  CANADA_PACIFIC: "Canada/Pacific",
  CANADA_SASKATCHEWAN: "Canada/Saskatchewan",
  CANADA_YUKON: "Canada/Yukon",
  ETC_GMT: "Etc/GMT",
  ETC_GMT_PLUS_1: "Etc/GMT+1",
  ETC_GMT_PLUS_10: "Etc/GMT+10",
  ETC_GMT_PLUS_11: "Etc/GMT+11",
  ETC_GMT_PLUS_12: "Etc/GMT+12",
  ETC_GMT_PLUS_2: "Etc/GMT+2",
  ETC_GMT_PLUS_3: "Etc/GMT+3",
  ETC_GMT_PLUS_4: "Etc/GMT+4",
  ETC_GMT_PLUS_5: "Etc/GMT+5",
  ETC_GMT_PLUS_6: "Etc/GMT+6",
  ETC_GMT_PLUS_7: "Etc/GMT+7",
  ETC_GMT_PLUS_8: "Etc/GMT+8",
  ETC_GMT_PLUS_9: "Etc/GMT+9",
  ETC_GMT_MINUS_1: "Etc/GMT-1",
  ETC_GMT_MINUS_10: "Etc/GMT-10",
  ETC_GMT_MINUS_11: "Etc/GMT-11",
  ETC_GMT_MINUS_12: "Etc/GMT-12",
  ETC_GMT_MINUS_13: "Etc/GMT-13",
  ETC_GMT_MINUS_14: "Etc/GMT-14",
  ETC_GMT_MINUS_2: "Etc/GMT-2",
  ETC_GMT_MINUS_3: "Etc/GMT-3",
  ETC_GMT_MINUS_4: "Etc/GMT-4",
  ETC_GMT_MINUS_5: "Etc/GMT-5",
  ETC_GMT_MINUS_6: "Etc/GMT-6",
  ETC_GMT_MINUS_7: "Etc/GMT-7",
  ETC_GMT_MINUS_8: "Etc/GMT-8",
  ETC_GMT_MINUS_9: "Etc/GMT-9",
  ETC_UTC: "Etc/UTC",
  EUROPE_ANDORRA: "Europe/Andorra",
  EUROPE_ASTRAKHAN: "Europe/Astrakhan",
  EUROPE_ATHENS: "Europe/Athens",
  EUROPE_BELGRADE: "Europe/Belgrade",
  EUROPE_BERLIN: "Europe/Berlin",
  EUROPE_BRUSSELS: "Europe/Brussels",
  EUROPE_BUCHAREST: "Europe/Bucharest",
  EUROPE_BUDAPEST: "Europe/Budapest",
  EUROPE_CHISINAU: "Europe/Chisinau",
  EUROPE_DUBLIN: "Europe/Dublin",
  EUROPE_GIBRALTAR: "Europe/Gibraltar",
  EUROPE_HELSINKI: "Europe/Helsinki",
  EUROPE_ISTANBUL: "Europe/Istanbul",
  EUROPE_KALININGRAD: "Europe/Kaliningrad",
  EUROPE_KIROV: "Europe/Kirov",
  EUROPE_KYIV: "Europe/Kyiv",
  EUROPE_LISBON: "Europe/Lisbon",
  EUROPE_LONDON: "Europe/London",
  EUROPE_MADRID: "Europe/Madrid",
  EUROPE_MALTA: "Europe/Malta",
  EUROPE_MINSK: "Europe/Minsk",
  EUROPE_MOSCOW: "Europe/Moscow",
  EUROPE_NICOSIA: "Europe/Nicosia",
  EUROPE_PARIS: "Europe/Paris",
  EUROPE_PRAGUE: "Europe/Prague",
  EUROPE_RIGA: "Europe/Riga",
  EUROPE_ROME: "Europe/Rome",
  EUROPE_SAMARA: "Europe/Samara",
  EUROPE_SARATOV: "Europe/Saratov",
  EUROPE_SIMFEROPOL: "Europe/Simferopol",
  EUROPE_SOFIA: "Europe/Sofia",
  EUROPE_TALLINN: "Europe/Tallinn",
  EUROPE_TIRANE: "Europe/Tirane",
  EUROPE_ULYANOVSK: "Europe/Ulyanovsk",
  EUROPE_VIENNA: "Europe/Vienna",
  EUROPE_VILNIUS: "Europe/Vilnius",
  EUROPE_VOLGOGRAD: "Europe/Volgograd",
  EUROPE_WARSAW: "Europe/Warsaw",
  EUROPE_ZURICH: "Europe/Zurich",
  INDIAN_ANTANANARIVO: "Indian/Antananarivo",
  INDIAN_CHAGOS: "Indian/Chagos",
  INDIAN_CHRISTMAS: "Indian/Christmas",
  INDIAN_COCOS: "Indian/Cocos",
  INDIAN_COMORO: "Indian/Comoro",
  INDIAN_MAHE: "Indian/Mahe",
  INDIAN_MALDIVES: "Indian/Maldives",
  INDIAN_MAURITIUS: "Indian/Mauritius",
  INDIAN_MAYOTTE: "Indian/Mayotte",
  INDIAN_REUNION: "Indian/Reunion",
  PACIFIC_APIA: "Pacific/Apia",
  PACIFIC_AUCKLAND: "Pacific/Auckland",
  PACIFIC_BOUGAINVILLE: "Pacific/Bougainville",
  PACIFIC_CHATHAM: "Pacific/Chatham",
  PACIFIC_EASTER: "Pacific/Easter",
  PACIFIC_EFATE: "Pacific/Efate",
  PACIFIC_FAKAOFO: "Pacific/Fakaofo",
  PACIFIC_FIJI: "Pacific/Fiji",
  PACIFIC_GALAPAGOS: "Pacific/Galapagos",
  PACIFIC_GAMBIER: "Pacific/Gambier",
  PACIFIC_GUADALCANAL: "Pacific/Guadalcanal",
  PACIFIC_GUAM: "Pacific/Guam",
  PACIFIC_HONOLULU: "Pacific/Honolulu",
  PACIFIC_KANTON: "Pacific/Kanton",
  PACIFIC_KIRITIMATI: "Pacific/Kiritimati",
  PACIFIC_KOSRAE: "Pacific/Kosrae",
  PACIFIC_KWAJALEIN: "Pacific/Kwajalein",
  PACIFIC_MARQUESAS: "Pacific/Marquesas",
  PACIFIC_NAURU: "Pacific/Nauru",
  PACIFIC_NIUE: "Pacific/Niue",
  PACIFIC_NORFOLK: "Pacific/Norfolk",
  PACIFIC_NOUMEA: "Pacific/Noumea",
  PACIFIC_PAGO_PAGO: "Pacific/Pago_Pago",
  PACIFIC_PALAU: "Pacific/Palau",
  PACIFIC_PITCAIRN: "Pacific/Pitcairn",
  PACIFIC_PORT_MORESBY: "Pacific/Port_Moresby",
  PACIFIC_RAROTONGA: "Pacific/Rarotonga",
  PACIFIC_TAHITI: "Pacific/Tahiti",
  PACIFIC_TARAWA: "Pacific/Tarawa",
  PACIFIC_TONGATAPU: "Pacific/Tongatapu",
  US_ALASKA: "US/Alaska",
  US_ALEUTIAN: "US/Aleutian",
  US_ARIZONA: "US/Arizona",
  US_CENTRAL: "US/Central",
  US_EAST_INDIANA: "US/East-Indiana",
  US_EASTERN: "US/Eastern",
  US_HAWAII: "US/Hawaii",
  US_INDIANA_STARKE: "US/Indiana-Starke",
  US_MICHIGAN: "US/Michigan",
  US_MOUNTAIN: "US/Mountain",
  US_PACIFIC: "US/Pacific",
  US_PACIFIC_NEW: "US/Pacific-New",
  US_SAMOA: "US/Samoa",
};

const MeterValuesFieldMapping = {
  "Energy.Active.Export.Register": "energyActiveExportRegister",
  "Energy.Active.Import.Register": "energyActiveImportRegister",
  "Energy.Reactive.Export.Register": "energyReactiveExportRegister",
  "Energy.Reactive.Import.Register": "energyReactiveImportRegister",
  "Energy.Active.Export.Interval": "energyActiveExportInterval",
  "Energy.Active.Import.Interval": "energyActiveImportInterval",
  "Energy.Reactive.Export.Interval": "energyReactiveExportInterval",
  "Energy.Reactive.Import.Interval": "energyReactiveImportInterval",
  "Power.Active.Export": "powerActiveExport",
  "Power.Active.Import": "powerActiveImport",
  "Power.Offered": "powerOffered",
  "Power.Reactive.Export": "powerReactiveExport",
  "Power.Reactive.Import": "powerReactiveImport",
  "Power.Factor": "powerFactor",
  "Current.Import": "currentImport",
  "Current.Export": "currentExport",
  "Current.Offered": "currentOffered",
  Voltage: "voltage",
  Frequency: "frequency",
  Temperature: "temperature",
  SoC: "soc",
  RPM: "rpm",
};

const ChargeUsageTypeMapping = {
  private: "Private",
  public: "Public",
};

const ChargeUsageType = {
  PRIVATE: "private",
  PUBLIC: "public",
};

const ChargerRapidLogsMapping = {
  LIVE_NET_TRANSFER: "LIVE_NET_TRANSFER",
  LIVE_PROCESS_EVENT: "LIVE_PROCESS_EVENT",
  LIVE_CPU_LOAD: "LIVE_CPU_LOAD",
  LIVE_NET_CONNECTIONS: "LIVE_NET_CONNECTIONS",
  OVERVIEW_EVENT: "OVERVIEW_EVENT",
  NETWORK_INTERFACE_LIST_EVENT: "NETWORK_INTERFACE_LIST_EVENT",
  LIVE_KERNAL_LOG: "LIVE_KERNAL_LOG",
};

const ConcurrencyEnumMap = {
  LIVE_NET_TRANSFER: "liveNetworkTransferMap",
  LIVE_PROCESS_EVENT: "liveModeProcessCount",
  LIVE_CPU_LOAD: "liveCpuLoad",
  LIVE_NET_CONNECTIONS: "liveNetConnections",
};

const RolloutTypes = {
  APPLICATION: "APPLICATION",
  OS: "OS",
};

const RolloutStates = {
  CREATED: "CREATED",
  PREPARE_ROLLOUT: "PREPARE_ROLLOUT",
  DEVICE_STATE_MAP_CREATED: "DEVICE_STATE_MAP_CREATED",
  DEVICE_READY: "DEVICE_READY",
  STARTED_ROLLOUT: "STARTED_ROLLOUT",
  DOWNLOADING: "DOWNLOADING",
  DOWNLOADED: "DOWNLOADED",
  UNPACKING: "UNPACKING",
  UNPACKING_SUCCESS: "UNPACKING_SUCCESS",
  INSTALLING: "INSTALLING",
  INSTALL_SUCCESS: "INSTALL_SUCCESS",
  INSTALL_FAILED: "INSTALL_FAILED",
  DEVICE_ROLLOUT_COMPLTED: "DEVICE_ROLLOUT_COMPLTED",
  DEVICE_ROLLOUT_COMPLTED_WITH_FAILURES:
    "DEVICE_ROLLOUT_COMPLTED_WITH_FAILURES",
  DEVICE_ROLLOUT_FAILED: "DEVICE_ROLLOUT_FAILED",
};

const RolloutDeviceStates = {
  CREATED: "CREATED",
  DEVICE_REMOTE_STATE_SYNCED: "DEVICE_REMOTE_STATE_SYNCED",
};

module.exports = {
  UserStatuses,
  PartnerTypes,
  TransferStatuses,
  UserSessionStatuses,
  BankVerificationStatuses,
  SettlementPeriods,
  SettlementStatuses,
  ChargerConnectorTypes,
  ChargerStatuses,
  ChargerConnectorTypesLabelMapping,
  ExpireTimeConstants,
  customErrorMsg,
  TransactionPaymentModes,
  TransactionStatuses,
  customSuccessMsg,
  ServiceRequestCategories,
  ServiceRequestCategoriesLabelMapping,
  ServiceRequestCategoriesSequenceMapping,
  ServiceRequestStatuses,
  EmailConstants,
  MongoDbConstants,
  PusherConstants,
  WebhookEvents,
  NotificationTypes,
  OcppEvents,
  OcppSource,
  ChargingState,
  ChargerConnectorPairMapping,
  ChargerModelMapping,
  ConnectedChargerStatuses,
  QueueNames,
  RedisConfig,
  OcppConstants,
  ChargingStatuses,
  ValidTimezones,
  MeterValuesFieldMapping,
  ChargeUsageTypeMapping,
  ChargeUsageType,
  CustomerSessionStatuses,
  ChargerRapidLogsMapping,
  ConcurrencyEnumMap,
  RolloutTypes,
  RolloutStates,
  RolloutDeviceStates,
  GuestCustomerSessionStatuses,
  TestingConfigStatuses,
  RefundIssueCategoryStatus,
  RefundPriorityStatus,
  RefundAssignedToStatus,
  TicketStatus,
  RefundStatus,
  CreatedBy,
};
