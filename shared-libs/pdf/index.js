const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");
const QRCode = require("qrcode");
const {
  OcppTransactionsRepository,
  CpoSubscriptionRepository,
  ChargingInvoiceRepository,
  CpoSubscriptionInvoiceRepository,
  ChargerRepository,
  CpoRepository,
  EvseStationViewRepository,
} = require("@shared-libs/db/mysql");
const Handlebars = require("handlebars");
const {
  generateInvoiceNumber,
  convertDateTimezone,
  getConfigConstants,
  calculatePeakAndOffPeakTime,
  updateCalculationByCaptureAmount,
  toRoundedFloat,
  translateAmount,
  formatChargingDuration,
  replaceStringWithVariables,
} = require("@shared-libs/helpers");
const puppeteer = require("puppeteer");
const { default: axios } = require("axios");
const { sendDataToPusher } = require("@shared-libs/pusher");
const { PusherConstants } = require("@shared-libs/constants");
const { DateTime } = require("luxon");
const {
  TransactionHistoryViewModel,
  PreauthLogsModel,
  PreauthCompleteLogsModel,
  EmvDataAddLogsModel,
  PreauthCancelLogsModel,
  RefundLogsModel,
  PurchaseLogsModel,
} = require("@shared-libs/db/mongo-db");
const { invoiceLanguage } = require("./language");

const s3 = new AWS.S3();

const getTranslatedMessage = (key, language = "en") => {
  if (invoiceLanguage[key] && invoiceLanguage[key][language]) {
    return invoiceLanguage[key][language];
  }
  return key;
};

const getInvoiceHeader = async (
  transaction,
  language,
  isFinalReceipt = false,
) => {
  const headerDynamicLabels = {
    receipt_upper_lbl: getTranslatedMessage("Transaction Record", language),
    header_description: getTranslatedMessage(
      "Here's your transaction record for your charging session.",
      language,
    ),
    receipt_number_lbl: getTranslatedMessage("Receipt Number:", language),
    date_of_issue_and_time_lbl: getTranslatedMessage(
      "Date of Issue and Time:",
      language,
    ),
    transaction_id_lbl: getTranslatedMessage("Transaction ID:", language),
    type_lbl: getTranslatedMessage("Type:", language),
    card_system_lbl: getTranslatedMessage("Card Scheme:", language),
    card_number_lbl: getTranslatedMessage("Card Number:", language),
    reference_lbl: getTranslatedMessage("Reference #:", language),
    authorization_no_lbl: getTranslatedMessage("Authorization No.:", language),
    charger_details_evse_station_lbl: getTranslatedMessage(
      "Charger Details EVSE Station:",
      language,
    ),
    chargebox_id_lbl: getTranslatedMessage("Chargebox ID:", language),
  };

  let transactionRes = {};
  if (transaction?.paymentProvider == "moneris") {
    transactionRes = transaction?.providerResponse?.response?.receipt;
  }

  const ocppTransaction = await OcppTransactionsRepository.findOne({
    where: { transactionUuid: transaction?.transactionId },
  });

  const charger = await ChargerRepository.findOne({
    where: { chargeBoxId: ocppTransaction.chargeBoxId },
  });

  const cpo = await CpoRepository.findOne({
    where: { id: charger.cpoId },
  });

  const evseStationData = await EvseStationViewRepository.findOne({
    where: { id: ocppTransaction.evseStationId },
  });

  const {
    areaCode: evseStationAreaCode,
    state: evseStationState,
    city: evseStationCity,
    address: evseStationAddress,
    name: evseStationName,
  } = evseStationData;

  let logoDataUri;
  let invoiceNumber = generateInvoiceNumber();
  let isDuplicate = true;

  while (isDuplicate) {
    let existingInvoice = null;

    if (isFinalReceipt) {
      existingInvoice = await ChargingInvoiceRepository.findOne({
        where: { invoiceNumber },
      });
    } else {
      existingInvoice = await TransactionHistoryViewModel.findOne({
        invoiceNumber,
      }).lean();
    }

    if (!existingInvoice) {
      isDuplicate = false;
    } else {
      invoiceNumber = generateInvoiceNumber();
    }
  }

  // Convert image to Base64
  if (cpo?.profilePicture !== null && cpo?.profilePicture.startsWith("http")) {
    const response = await axios.get(cpo.profilePicture, {
      responseType: "arraybuffer",
    });
    const logoBase64 = Buffer.from(response.data, "binary").toString("base64");
    logoDataUri = `data:image/jpeg;base64,${logoBase64}`;
  } else {
    const logoPath = path.join(__dirname, "/templates/logo1.png");
    const logoBase64 = fs.readFileSync(logoPath, "base64");
    logoDataUri = `data:image/png;base64,${logoBase64}`;
  }

  let dateOfIssue = transactionRes?.TransDate ?? null;
  let timeOfIssue = transactionRes?.TransTime ?? null;
  const cardSchema = transaction?.request?.cardInfo?.cardType ?? "";
  const referenceNumber = transactionRes?.ReferenceNum
    ? `${transactionRes?.ReferenceNum} H`
    : "";

  try {
    if (transaction?.paymentProvider == "littlepay") {
      if (transaction?.providerRequest?.transaction_date_time) {
        const dt = DateTime.fromISO(
          transaction?.providerRequest?.transaction_date_time,
        );

        dateOfIssue = dt.toFormat("yyyy-MM-dd");
        timeOfIssue = dt.toFormat("HH:mm:ss");
      }
    }
  } catch (error) {}

  const authCode = transactionRes?.AuthCode ?? "";
  const iso = transactionRes?.ISO ?? "";
  const message = transactionRes?.Message ?? "";
  const responseCode = transactionRes?.ResponseCode ?? "";

  let cardNumber = "";
  try {
    const maskedPan = transaction?.request?.cardInfo?.maskedPan;
    if (maskedPan) {
      cardNumber = maskedPan.slice(-4);
    }
  } catch (error) {}

  const paymentTransId = transactionRes?.TransID
    ? transactionRes?.TransID
    : transaction?.providerResponse?.transaction_id;

  let paymentTransType = "Pre-authorization Completion";

  if (transaction?.type == "Capture") {
    paymentTransType = "Pre-authorization Completion";
  } else if (transaction?.type == "Pre-Auth") {
    paymentTransType = "Pre-authorization";
  } else if (transaction?.type == "EmvData-Add") {
    paymentTransType = "EMV Data Add";
  } else if (transaction?.type == "Cancel") {
    paymentTransType = "Pre-authorization Cancellation";
  } else if (transaction?.type == "Refund") {
    paymentTransType = "Refund";
  } else if (transaction?.type == "Purchase") {
    paymentTransType = "Purchase";
  }

  // Prepare dynamic data
  const headerDynamicData = {
    ...headerDynamicLabels,
    logo: logoDataUri,
    receiptNumber: invoiceNumber,
    dateOfIssue: dateOfIssue
      ? dateOfIssue
      : convertDateTimezone(
          DateTime.utc(),
          ocppTransaction?.timezone ?? "UTC",
          "dd MMMM yyyy",
        ),
    timeOfIssue,
    paymentTransId,

    paymentTransType: getTranslatedMessage(paymentTransType, language),
    cardSchema,
    cardNumber,

    appLable: ocppTransaction?.appLabel ?? "",
    tvr: ocppTransaction?.tvr ?? "",
    tsi: ocppTransaction?.tsi ?? "",
    aid: ocppTransaction?.aid ?? "",
    referenceNumber,
    authCode,

    // evseStationName,
    evseStationAddress,
    evseStationCity,
    evseStationState,
    evseStationAreaCode,
    chargeBoxId: ocppTransaction.chargeBoxId,

    iso,
    message,
    responseCode,
  };

  const filePath = path.join(__dirname, `/templates/invoice/header.html`);
  const htmlTemplate = fs.readFileSync(filePath, "utf8");

  const compiledTemplate = Handlebars.compile(htmlTemplate);
  const htmlContent = compiledTemplate(headerDynamicData);

  return { invoiceNumber, htmlContent };
};

const getInvoiceHeaderRemote = async (ocppTransaction, language) => {
  const headerDynamicLabels = {
    receipt_upper_lbl: getTranslatedMessage("Transaction Record", language),
    header_description: getTranslatedMessage(
      "Here's your transaction record for your charging session.",
      language,
    ),
    receipt_number_lbl: getTranslatedMessage("Receipt Number:", language),
    charger_details_evse_station_lbl: getTranslatedMessage(
      "Charger Details EVSE Station:",
      language,
    ),
    chargebox_id_lbl: getTranslatedMessage("Chargebox ID:", language),
  };

  const charger = await ChargerRepository.findOne({
    where: { chargeBoxId: ocppTransaction.chargeBoxId },
  });

  const cpo = await CpoRepository.findOne({
    where: { id: charger.cpoId },
  });

  const evseStationData = await EvseStationViewRepository.findOne({
    where: { id: ocppTransaction.evseStationId },
  });

  const {
    areaCode: evseStationAreaCode,
    state: evseStationState,
    city: evseStationCity,
    address: evseStationAddress,
    name: evseStationName,
  } = evseStationData;

  let logoDataUri;
  let invoiceNumber = generateInvoiceNumber();
  let isDuplicate = true;

  while (isDuplicate) {
    let existingInvoice = await ChargingInvoiceRepository.findOne({
      where: { invoiceNumber },
    });

    if (!existingInvoice) {
      isDuplicate = false;
    } else {
      invoiceNumber = generateInvoiceNumber();
    }
  }

  // Convert image to Base64
  if (cpo?.profilePicture !== null && cpo?.profilePicture.startsWith("http")) {
    const response = await axios.get(cpo.profilePicture, {
      responseType: "arraybuffer",
    });
    const logoBase64 = Buffer.from(response.data, "binary").toString("base64");
    logoDataUri = `data:image/jpeg;base64,${logoBase64}`;
  } else {
    const logoPath = path.join(__dirname, "/templates/logo1.png");
    const logoBase64 = fs.readFileSync(logoPath, "base64");
    logoDataUri = `data:image/png;base64,${logoBase64}`;
  }

  // Prepare dynamic data
  const headerDynamicData = {
    ...headerDynamicLabels,
    logo: logoDataUri,
    receiptNumber: invoiceNumber,

    // evseStationName,
    evseStationAddress,
    evseStationCity,
    evseStationState,
    evseStationAreaCode,
    chargeBoxId: ocppTransaction.chargeBoxId,
  };

  const filePath = path.join(
    __dirname,
    `/templates/invoice/header_remote.html`,
  );
  const htmlTemplate = fs.readFileSync(filePath, "utf8");

  const compiledTemplate = Handlebars.compile(htmlTemplate);
  const htmlContent = compiledTemplate(headerDynamicData);

  return { invoiceNumber, htmlContent };
};

const getInvoiceDetails = async (
  transaction,
  language,
  isFinalReceipt = false,
) => {
  const ocppTransaction = await OcppTransactionsRepository.findOne({
    where: { transactionUuid: transaction?.transactionId },
  });

  if (
    transaction?.type == "Capture" ||
    (transaction?.type == "Purchase" && transaction?.hasError == false)
  ) {
    const headerDynamicLabels = {
      charging_session_summary_lbl: getTranslatedMessage(
        "Charging Session Summary",
        language,
      ),
      charging_time_lbl: getTranslatedMessage("Charging time", language),
      session_id_lbl: getTranslatedMessage("Session ID", language),
      duration_hrs_lbl: getTranslatedMessage("Duration(hrs)", language),
      energy_used_k_wh_lbl: getTranslatedMessage("Energy Used(kWh)", language),
      from_lbl: getTranslatedMessage("From:", language),
      to_lbl: getTranslatedMessage("To:", language),
      billing_summary_lbl: getTranslatedMessage("Billing Summary", language),
      description_lbl: getTranslatedMessage("Description", language),
      total_lbl: getTranslatedMessage("Total", language),
      unit_price_lbl: getTranslatedMessage("Unit Price", language),
      amount_lbl: getTranslatedMessage("Amount", language),
      energy_consumed_k_wh_lbl: getTranslatedMessage(
        "Energy Consumed (kWh)",
        language,
      ),
      parking_rate_hrs_lbl: getTranslatedMessage(
        "Parking Rate (hrs)",
        language,
      ),
      peak_or_offpeak_charges_hrs_lbl: getTranslatedMessage(
        "Peak(or offpeak) Charges (hrs)",
        language,
      ),
      sub_total_lbl: getTranslatedMessage("Sub Total", language),
      discount_lbl: getTranslatedMessage("Discount", language),
      penalty_lbl: getTranslatedMessage("Penalty", language),
      taxable_amount_lbl: getTranslatedMessage("Taxable Amount", language),
      tax_lbl: getTranslatedMessage("Tax", language),
      total_amount_lbl: getTranslatedMessage("Total Amount:", language),
    };

    const billingData = await getBillingData(transaction?.transactionId);

    const filePath = path.join(
      __dirname,
      `/templates/invoice/capture_details.html`,
    );
    const htmlTemplate = fs.readFileSync(filePath, "utf8");

    const compiledTemplate = Handlebars.compile(htmlTemplate);
    const htmlContent = compiledTemplate({
      ...headerDynamicLabels,
      ...billingData,
    });

    return htmlContent;
  } else {
    let amountLabel = "Pre-authorization Amount";
    if (transaction?.type == "Refund") {
      amountLabel = "Refund Amount";
    } else if (transaction?.type == "Purchase") {
      amountLabel = "Purchase Amount";
    }

    let amount = transaction?.request?.sessionInfo?.totalAmount;
    if (transaction?.type == "Refund") {
      amount = transaction?.request?.sessionInfo?.refundAmount;
    }

    const currencySymbol = ocppTransaction?.currencySymbol
      ? ocppTransaction?.currencySymbol
      : "$";

    const filePath = path.join(
      __dirname,
      `/templates/invoice/preauth_details.html`,
    );
    const htmlTemplate = fs.readFileSync(filePath, "utf8");

    const compiledTemplate = Handlebars.compile(htmlTemplate);
    const htmlContent = compiledTemplate({
      currencySymbol,
      amount: translateAmount(amount, language, currencySymbol),
      amountLabel: getTranslatedMessage(amountLabel, language),
    });

    return htmlContent;
  }
};

const getInvoiceDetailsRemote = async (transactionUuid, language) => {
  const headerDynamicLabels = {
    charging_session_summary_lbl: getTranslatedMessage(
      "Charging Session Summary",
      language,
    ),
    charging_time_lbl: getTranslatedMessage("Charging time", language),
    session_id_lbl: getTranslatedMessage("Session ID", language),
    duration_hrs_lbl: getTranslatedMessage("Duration(hrs)", language),
    energy_used_k_wh_lbl: getTranslatedMessage("Energy Used(kWh)", language),
    from_lbl: getTranslatedMessage("From:", language),
    to_lbl: getTranslatedMessage("To:", language),
    billing_summary_lbl: getTranslatedMessage("Billing Summary", language),
    description_lbl: getTranslatedMessage("Description", language),
    total_lbl: getTranslatedMessage("Total", language),
    unit_price_lbl: getTranslatedMessage("Unit Price", language),
    amount_lbl: getTranslatedMessage("Amount", language),
    energy_consumed_k_wh_lbl: getTranslatedMessage(
      "Energy Consumed (kWh)",
      language,
    ),
    parking_rate_hrs_lbl: getTranslatedMessage("Parking Rate (hrs)", language),
    peak_or_offpeak_charges_hrs_lbl: getTranslatedMessage(
      "Peak(or offpeak) Charges (hrs)",
      language,
    ),
    sub_total_lbl: getTranslatedMessage("Sub Total", language),
    discount_lbl: getTranslatedMessage("Discount", language),
    penalty_lbl: getTranslatedMessage("Penalty", language),
    taxable_amount_lbl: getTranslatedMessage("Taxable Amount", language),
    tax_lbl: getTranslatedMessage("Tax", language),
    total_amount_lbl: getTranslatedMessage("Total Amount:", language),
  };

  const billingData = await getBillingData(transactionUuid);

  const filePath = path.join(
    __dirname,
    `/templates/invoice/capture_details.html`,
  );
  const htmlTemplate = fs.readFileSync(filePath, "utf8");

  const compiledTemplate = Handlebars.compile(htmlTemplate);
  const htmlContent = compiledTemplate({
    ...headerDynamicLabels,
    ...billingData,
  });

  return htmlContent;
};

const getInvoiceFooter = async (
  transaction,
  language,
  isFinalReceipt = false,
) => {
  let transactionRes = {};
  if (transaction?.paymentProvider == "moneris") {
    transactionRes = transaction?.providerResponse?.response?.receipt;
  }

  const iso = transactionRes?.ISO ?? "";
  const message = transactionRes?.Message ?? "";
  const responseCode = transactionRes?.ResponseCode ?? "";

  const templateData = {
    signatureText: getTranslatedMessage("NO SIGNATURE REQUIRED", language),
    footerText: getTranslatedMessage(
      "CARDHOLDER WILL PAY CARD ISSUER ABOVE AMOUNT PURSUANT TO CARDHOLDER AGREEMENT",
      language,
    ),
    importantText: getTranslatedMessage("- - IMPORTANT - -", language),
    importantDetails: getTranslatedMessage(
      "Important: Retain this copy for your records.",
      language,
    ),
    cardHolderCopy: getTranslatedMessage("CARD HOLDER COPY", language),

    isoText: `${iso} &nbsp; &nbsp; ${message} &nbsp; &nbsp; ${responseCode}`,
  };

  if (transaction?.type == "Capture" || transaction?.type == "Purchase") {
    let tmpltIso = iso ? `${iso} &nbsp; &nbsp; ` : "";
    tmpltIso += message ? `${message} &nbsp; ` : "";
    tmpltIso += tmpltIso
      ? `- &nbsp; ${getTranslatedMessage("Thank you", language)}`
      : `${getTranslatedMessage("Thank you", language)}`;
    tmpltIso += responseCode ? ` &nbsp; &nbsp; ${responseCode}` : "";

    templateData["isoText"] = tmpltIso;
  }

  if (transaction?.hasError == true) {
    templateData["signatureText"] = "";
    templateData["footerText"] = "";

    let msg = getTranslatedMessage("Transaction Not Approved", language);

    if (
      ![
        "05",
        "51",
        "54",
        "55",
        "57",
        "58",
        "61",
        "62",
        "65",
        "75",
        "82",
        "92",
      ].includes(iso)
    ) {
      msg = getTranslatedMessage("Transaction Not Completed", language);
    }
    templateData["isoText"] =
      `${iso} &nbsp; &nbsp; ${msg} &nbsp; &nbsp; ${responseCode}`;
  }

  const filePath = path.join(__dirname, `/templates/invoice/footer.html`);
  const htmlTemplate = fs.readFileSync(filePath, "utf8");

  const htmlContent = replaceStringWithVariables(htmlTemplate, templateData);

  return htmlContent;
};

const getInvoiceFooterRemote = async (language) => {
  const templateData = {
    signatureText: getTranslatedMessage("NO SIGNATURE REQUIRED", language),
    footerText: "",
    importantText: getTranslatedMessage("- - IMPORTANT - -", language),
    importantDetails: getTranslatedMessage(
      "Important: Retain this copy for your records.",
      language,
    ),
    cardHolderCopy: "",
    isoText: getTranslatedMessage("Thank you", language),
  };

  const filePath = path.join(__dirname, `/templates/invoice/footer.html`);
  const htmlTemplate = fs.readFileSync(filePath, "utf8");

  const htmlContent = replaceStringWithVariables(htmlTemplate, templateData);

  return htmlContent;
};

const getBillingData = async (transactionUuid) => {
  await updateCalculationByCaptureAmount(transactionUuid);

  const ocppTransaction = await OcppTransactionsRepository.findOne({
    where: { transactionUuid },
  });

  let language = (ocppTransaction?.language ?? "en").toLowerCase();

  const currencySymbol = ocppTransaction.currencySymbol
    ? ocppTransaction.currencySymbol
    : "$";

  // PENDING update into format 1:30AM
  const startTimeLocal = DateTime.fromJSDate(
    ocppTransaction?.startTimeLocal,
  ).toFormat("h:mma");
  const endTimeLocal = DateTime.fromJSDate(
    ocppTransaction?.endTimeLocal,
  ).toFormat("h:mma");

  const startTime = ocppTransaction?.startTime;
  const endTime = ocppTransaction?.endTime;

  let chargingDuration = ocppTransaction?.chargingDuration
    ? Number(ocppTransaction.chargingDuration)
    : "00:00:00";

  if (ocppTransaction?.chargingDuration) {
    chargingDuration = formatChargingDuration(
      ocppTransaction?.chargingDuration,
    );
  }

  // calculation of peak and off peak hours
  const configConstants = await getConfigConstants([
    "peakRateMultiplier",
    "offPeakRateMultiplier",
    "peakStartTime",
    "peakEndTime",
    "offPeakStartTime",
    "offPeakEndTime",
  ]);
  const peakRate = configConstants["peakRateMultiplier"];
  const offPeakRate = configConstants["offPeakRateMultiplier"];
  const peakStartTime = configConstants["peakStartTime"];
  const peakEndTime = configConstants["peakEndTime"];
  const offPeakStartTime = configConstants["offPeakStartTime"];
  const offPeakEndTime = configConstants["offPeakEndTime"];

  let { totalPeakTime: peakHours, totalOffPeakTime: offPeakHours } =
    calculatePeakAndOffPeakTime(
      startTime,
      endTime,
      peakStartTime,
      peakEndTime,
      offPeakStartTime,
      offPeakEndTime,
    );

  let peakOffPeakHours = "00:00:00";
  let peakOffPeakRate = 0.0;
  let peakOffPeakCharges = 0.0;
  if (ocppTransaction.peakCharges > 0) {
    peakOffPeakHours = formatChargingDuration(peakHours);
    peakOffPeakRate = peakRate;
    peakOffPeakCharges = ocppTransaction.peakCharges;
  } else if (ocppTransaction.offPeakCharges > 0) {
    peakOffPeakHours = formatChargingDuration(offPeakHours);
    peakOffPeakRate = offPeakRate;
    peakOffPeakCharges = ocppTransaction.offPeakCharges;
  }

  // Prepare dynamic data
  const dynamicData = {
    chargingSessionStartDate: DateTime.fromJSDate(
      ocppTransaction.startTimeLocal,
    ).toFormat("d MMMM yyyy"),
    chargingSessionEndDate: DateTime.fromJSDate(
      ocppTransaction.endTimeLocal,
    ).toFormat("d MMMM yyyy"),
    peakOffPeakHours,
    peakOffPeakRate: translateAmount(
      toRoundedFloat(peakOffPeakRate),
      language,
      currencySymbol,
    ),
    peakOffPeakCharges: translateAmount(
      toRoundedFloat(peakOffPeakCharges),
      language,
      currencySymbol,
    ),

    startTime: startTimeLocal,
    endTime: endTimeLocal,
    chargingDuration,
    effectiveEnergyConsumed: translateAmount(
      ocppTransaction.effectiveEnergyConsumed,
      language,
    ),
    parkingFee: translateAmount(
      ocppTransaction.parkingFee,
      language,
      currencySymbol,
    ),
    penaltyAmount: translateAmount(
      ocppTransaction.penaltyAmount,
      language,
      currencySymbol,
    ),
    discount: ocppTransaction.discount * 1,
    discountedAmount: translateAmount(
      ocppTransaction.discountedAmount,
      language,
      currencySymbol,
    ),
    taxRate: ocppTransaction.taxRate * 1,
    taxableAmount: translateAmount(
      ocppTransaction.taxableAmount,
      language,
      currencySymbol,
    ),
    grossAmount: translateAmount(
      ocppTransaction.grossAmount,
      language,
      currencySymbol,
    ),
    netAmount: translateAmount(
      ocppTransaction.netAmount,
      language,
      currencySymbol,
    ),
    parkingRatePerHour: translateAmount(
      ocppTransaction.parkingRatePerHour,
      language,
      currencySymbol,
    ),
    effectiveBaseRate: translateAmount(
      ocppTransaction.effectiveBaseRate,
      language,
      currencySymbol,
    ),
    baseFare: translateAmount(
      ocppTransaction.baseFare,
      language,
      currencySymbol,
    ),
    tax: translateAmount(ocppTransaction.tax, language, currencySymbol),
    currencySymbol,
    sessionId: ocppTransaction?.orderId,
  };

  return dynamicData;
};

const generateTransactionInvoice = async (
  transactionId,
  isFinalReceipt = false,
) => {
  try {
    const models = [
      TransactionHistoryViewModel,
      PurchaseLogsModel,
      PreauthLogsModel,
      EmvDataAddLogsModel,
      PreauthCompleteLogsModel,
      PreauthCancelLogsModel,
      RefundLogsModel,
    ];

    let transaction = null;

    for (const model of models) {
      transaction = await model.findOne({ _id: transactionId }).lean();
      if (transaction) break;
    }

    if (transaction) {
      const ocppTransaction = await OcppTransactionsRepository.findOne({
        where: { transactionUuid: transaction?.transactionId },
      });
      let language = (ocppTransaction?.language ?? "en").toLowerCase();

      const [
        { invoiceNumber, htmlContent: invoiceHeader },
        invoiceDetails,
        invoiceFooter,
      ] = await Promise.all([
        getInvoiceHeader(transaction, language, isFinalReceipt),
        getInvoiceDetails(transaction, language, isFinalReceipt),
        getInvoiceFooter(transaction, language, isFinalReceipt),
      ]);

      const filePath = path.join(__dirname, `/templates/invoice/layout.html`);
      const htmlTemplate = fs.readFileSync(filePath, "utf8");

      const htmlContent = replaceStringWithVariables(htmlTemplate, {
        receipt_lbl: getTranslatedMessage("Receipt", language),
        header: invoiceHeader,
        details: invoiceDetails,
        footer: invoiceFooter,
      });

      const browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
          "--disable-gpu",
          "--disable-setuid-sandbox",
          "--no-sandbox",
          "--no-zygote",
        ],
      });

      const page = await browser.newPage();

      await page.setContent(htmlContent, { waitUntil: "load" });

      // Generate PDF in buffer format
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
      });

      await browser.close();

      let pdfPath = `${ocppTransaction.chargeBoxId}/transaction-receipt/${transaction._id}.pdf`;
      let qrPath = `${ocppTransaction.chargeBoxId}/transaction-receipt/${transaction._id}_qr.png`;

      if (isFinalReceipt) {
        pdfPath = `${ocppTransaction.chargeBoxId}/${ocppTransaction.transactionUuid}.pdf`;
        qrPath = `${ocppTransaction.chargeBoxId}/${ocppTransaction.transactionUuid}_qr.png`;
      }

      // Upload PDF to S3
      const pdfParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: pdfPath,
        Body: pdfBuffer,
        ContentType: "application/pdf",
        ACL: "public-read",
      };

      const uploadPdfResult = await s3.upload(pdfParams).promise();
      const pdfUrl = uploadPdfResult.Location;

      // Generate QR Code for the pdfUrl
      const qrCodeDataUrl = await QRCode.toDataURL(pdfUrl, {
        width: 364,
        height: 364,
        color: {
          dark: "#000000",
          light: "#00000000",
        },
      });

      // Decode base64 from the data URL to get the image buffer
      const qrCodeBase64 = qrCodeDataUrl.replace(
        /^data:image\/png;base64,/,
        "",
      );
      const qrCodeBuffer = Buffer.from(qrCodeBase64, "base64");

      const qrCodeParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: qrPath,
        Body: qrCodeBuffer,
        ContentType: "image/png",
        ACL: "public-read",
      };

      const uploadQrCodeResult = await s3.upload(qrCodeParams).promise();
      let qrCodeUrl = uploadQrCodeResult.Location;
      qrCodeUrl = qrCodeUrl.replace("https://", "http://");

      if (!isFinalReceipt) {
        let updateData = transaction?.response;
        if (updateData) {
          updateData["receiptInfo"] = {
            invoicePdfUrl: pdfUrl,
            invoiceQRUrl: qrCodeUrl,
            invoiceNumber,
          };
        } else {
          updateData = {
            receiptInfo: {
              invoicePdfUrl: pdfUrl,
              invoiceQRUrl: qrCodeUrl,
              invoiceNumber,
            },
          };
        }

        let updateModel = PreauthLogsModel;
        if (transaction?.type == "Capture") {
          updateModel = PreauthCompleteLogsModel;
        } else if (transaction?.type == "Pre-Auth") {
          updateModel = PreauthLogsModel;
        } else if (transaction?.type == "EmvData-Add") {
          updateModel = EmvDataAddLogsModel;
        } else if (transaction?.type == "Cancel") {
          updateModel = PreauthCancelLogsModel;
        } else if (transaction?.type == "Refund") {
          updateModel = RefundLogsModel;
        } else if (transaction?.type == "Purchase") {
          updateModel = PurchaseLogsModel;
        }

        await updateModel.findByIdAndUpdate(transaction._id, {
          response: updateData,
          invoiceNumber,
        });

        return updateData["receiptInfo"];
      } else {
        const updateData = {
          invoicePdfUrl: pdfUrl,
          invoiceQRUrl: qrCodeUrl,
        };

        await OcppTransactionsRepository.update(
          transaction?.transactionId,
          updateData,
        );

        // const updatedTransaction = await OcppTransactionsRepository.findOne({
        //   where: { transactionUuid },
        // });

        await sendDataToPusher({
          channelName: PusherConstants.channels.PUSHER_NODE_APP,
          eventName: PusherConstants.events.transaction.TRANSACTION_UPDATED,
          data: { transactionUuid: transaction?.transactionId },
        });

        if (ocppTransaction?.cpoId) {
          await sendDataToPusher({
            channelName: ocppTransaction.cpoId,
            eventName: PusherConstants.events.transaction.TRANSACTION_UPDATED,
            data: { transactionUuid: transaction?.transactionId },
          });
        }

        // Find an existing invoice based on the transaction ID
        const existingInvoice = await ChargingInvoiceRepository.findOne({
          where: { transactionId: transaction?.transactionId },
        });

        const createdAtLocal = convertDateTimezone(
          DateTime.utc(),
          ocppTransaction?.timezone ?? "UTC",
        );

        if (existingInvoice) {
          existingInvoice.invoiceNumber = invoiceNumber;
          existingInvoice.pdfUrl = pdfUrl;
          existingInvoice.qrUrl = qrCodeUrl;
          existingInvoice.timezone = ocppTransaction?.timezone;
          existingInvoice.country = ocppTransaction?.country;
          existingInvoice.createdAtLocal = createdAtLocal;

          await ChargingInvoiceRepository.save(existingInvoice);
        } else {
          const newInvoice = ChargingInvoiceRepository.create({
            transactionId: transaction?.transactionId,
            invoiceNumber: invoiceNumber,
            pdfUrl: pdfUrl,
            qrUrl: qrCodeUrl,
            timezone: ocppTransaction?.timezone,
            country: ocppTransaction?.country,
            createdAtLocal,
          });

          await ChargingInvoiceRepository.save(newInvoice);
        }

        return { pdfUrl, qrCodeUrl };
      }
    }
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log(
      `🚀 ~ PDF Invoice Generation Failed: ${transactionId} :`,
      error?.message,
    );
    console.log("🚀 -----------------🚀");
    return {
      invoicePdfUrl: null,
      invoiceQRUrl: null,
      invoiceNumber: null,
    };
  }
};

const generateRemoteTransactionInvoice = async (transactionId) => {
  try {
    const ocppTransaction = await OcppTransactionsRepository.findOne({
      where: { transactionUuid: transactionId },
    });
    let language = (ocppTransaction?.language ?? "en").toLowerCase();

    const [
      { invoiceNumber, htmlContent: invoiceHeader },
      invoiceDetails,
      invoiceFooter,
    ] = await Promise.all([
      getInvoiceHeaderRemote(ocppTransaction, language),
      getInvoiceDetailsRemote(transactionId, language),
      getInvoiceFooterRemote(language),
    ]);

    const filePath = path.join(__dirname, `/templates/invoice/layout.html`);
    const htmlTemplate = fs.readFileSync(filePath, "utf8");

    const htmlContent = replaceStringWithVariables(htmlTemplate, {
      receipt_lbl: getTranslatedMessage("Receipt", language),
      header: invoiceHeader,
      details: invoiceDetails,
      footer: invoiceFooter,
    });

    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: [
        "--disable-gpu",
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--no-zygote",
      ],
    });

    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: "load" });

    // Generate PDF in buffer format
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    let pdfPath = `${ocppTransaction.chargeBoxId}/${ocppTransaction.transactionUuid}.pdf`;
    let qrPath = `${ocppTransaction.chargeBoxId}/${ocppTransaction.transactionUuid}_qr.png`;

    // Upload PDF to S3
    const pdfParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: pdfPath,
      Body: pdfBuffer,
      ContentType: "application/pdf",
      ACL: "public-read",
    };

    const uploadPdfResult = await s3.upload(pdfParams).promise();
    const pdfUrl = uploadPdfResult.Location;

    // Generate QR Code for the pdfUrl
    const qrCodeDataUrl = await QRCode.toDataURL(pdfUrl, {
      width: 364,
      height: 364,
      color: {
        dark: "#000000",
        light: "#00000000",
      },
    });

    // Decode base64 from the data URL to get the image buffer
    const qrCodeBase64 = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
    const qrCodeBuffer = Buffer.from(qrCodeBase64, "base64");

    const qrCodeParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: qrPath,
      Body: qrCodeBuffer,
      ContentType: "image/png",
      ACL: "public-read",
    };

    const uploadQrCodeResult = await s3.upload(qrCodeParams).promise();
    let qrCodeUrl = uploadQrCodeResult.Location;
    qrCodeUrl = qrCodeUrl.replace("https://", "http://");

    // =============================================================================

    const updateData = {
      invoicePdfUrl: pdfUrl,
      invoiceQRUrl: qrCodeUrl,
    };

    await OcppTransactionsRepository.update(
      ocppTransaction.transactionUuid,
      updateData,
    );

    // const updatedTransaction = await OcppTransactionsRepository.findOne({
    //   where: { transactionUuid },
    // });

    await sendDataToPusher({
      channelName: PusherConstants.channels.PUSHER_NODE_APP,
      eventName: PusherConstants.events.transaction.TRANSACTION_UPDATED,
      data: { transactionUuid: ocppTransaction.transactionUuid },
    });

    if (ocppTransaction?.cpoId) {
      await sendDataToPusher({
        channelName: ocppTransaction.cpoId,
        eventName: PusherConstants.events.transaction.TRANSACTION_UPDATED,
        data: { transactionUuid: ocppTransaction.transactionUuid },
      });
    }

    // Find an existing invoice based on the transaction ID
    const existingInvoice = await ChargingInvoiceRepository.findOne({
      where: { transactionId: ocppTransaction.transactionUuid },
    });

    const createdAtLocal = convertDateTimezone(
      DateTime.utc(),
      ocppTransaction?.timezone ?? "UTC",
    );

    if (existingInvoice) {
      existingInvoice.invoiceNumber = invoiceNumber;
      existingInvoice.pdfUrl = pdfUrl;
      existingInvoice.qrUrl = qrCodeUrl;
      existingInvoice.timezone = ocppTransaction?.timezone;
      existingInvoice.country = ocppTransaction?.country;
      existingInvoice.createdAtLocal = createdAtLocal;

      await ChargingInvoiceRepository.save(existingInvoice);
    } else {
      await ChargingInvoiceRepository.save({
        transactionId: ocppTransaction.transactionUuid,
        invoiceNumber: invoiceNumber,
        pdfUrl: pdfUrl,
        qrUrl: qrCodeUrl,
        timezone: ocppTransaction?.timezone,
        country: ocppTransaction?.country,
        createdAtLocal,
      });
    }

    return { pdfUrl, qrCodeUrl };
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log(
      `🚀 ~ PDF Invoice Generation Failed: ${transactionId} :`,
      error?.message,
    );
    console.log("🚀 -----------------🚀");
    return {
      invoicePdfUrl: null,
      invoiceQRUrl: null,
      invoiceNumber: null,
    };
  }
};

const generateInvoice = async (transactionUuid) => {
  let returnData = { pdfUrl: null, qrCodeUrl: null };
  try {
    const transactions = await TransactionHistoryViewModel.aggregate(
      [
        {
          $match: {
            type: { $in: ["Capture", "Pre-Auth", "Purchase"] },
            transactionId: transactionUuid,
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 1 },
        { $project: { _id: 1, type: 1 } },
      ],
      { allowDiskUse: true },
    );

    if (transactions?.length > 0) {
      if (transactions[0]?._id) {
        returnData = await generateTransactionInvoice(
          transactions[0]?._id,
          true,
        );
      }
    } else {
      const ocppTransaction = await OcppTransactionsRepository.findOne({
        where: { transactionUuid },
      });

      if (ocppTransaction) {
        returnData = await generateRemoteTransactionInvoice(transactionUuid);
      }
    }
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log(
      `🚀 ~ PDF Invoice Generation Failed: ${transactionUuid} :`,
      error?.message,
    );
    console.log("🚀 -----------------🚀");
  }

  return returnData;
};

const generatePaymentInvoice = async (pdfData) => {
  try {
    const browser = await puppeteer.launch({
      executablePath: "/usr/bin/chromium-browser",
      args: [
        "--disable-gpu",
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--no-zygote",
      ],
    });

    const page = await browser.newPage();

    const filePath = path.join(
      __dirname,
      "/templates/payment-invoice_new.html",
    );
    const htmlTemplate = fs.readFileSync(filePath, "utf8");

    let logoDataUri;
    // Convert image to Base64
    if (
      pdfData.cpoProfilePicture &&
      pdfData.cpoProfilePicture.startsWith("http")
    ) {
      const response = await axios.get(pdfData.companyLogo, {
        responseType: "arraybuffer",
      });
      const logoBase64 = Buffer.from(response.data, "binary").toString(
        "base64",
      );
      logoDataUri = `data:image/jpeg;base64,${logoBase64}`;
    } else {
      const logoPath = path.join(__dirname, "/templates/logo1.png");
      const logoBase64 = fs.readFileSync(logoPath, "base64");
      logoDataUri = `data:image/png;base64,${logoBase64}`;
    }

    let invoiceNumber = generateInvoiceNumber("INV");
    let isDuplicate = true;

    while (isDuplicate) {
      const existingInvoice = await CpoSubscriptionInvoiceRepository.findOne({
        where: { invoiceNumber },
      });

      if (!existingInvoice) {
        isDuplicate = false;
      } else {
        invoiceNumber = generateInvoiceNumber("INV");
      }
    }

    pdfData.invoiceNumber = invoiceNumber;
    pdfData.logo = logoDataUri;

    // Compile the HTML with dynamic data
    const compiledTemplate = Handlebars.compile(htmlTemplate);
    const htmlContent = compiledTemplate(pdfData);

    await page.setContent(htmlContent, { waitUntil: "load" });

    // Generate PDF in buffer format
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    // Upload PDF to S3
    const pdfParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${pdfData.subscriptionId}.pdf`,
      Body: pdfBuffer,
      ContentType: "application/pdf",
      ACL: "public-read",
    };

    const uploadPdfResult = await s3.upload(pdfParams).promise();
    let pdfUrl = uploadPdfResult.Location;
    pdfUrl = pdfUrl.replace("https://", "http://");

    await CpoSubscriptionRepository.update(pdfData.subscriptionId, { pdfUrl });

    // Find an existing invoice based on the subscription ID
    const existingInvoice = await CpoSubscriptionInvoiceRepository.findOne({
      where: { subscriptionId: pdfData.subscriptionId },
    });

    let subscriptionData = await CpoSubscriptionRepository.findOne({
      where: { id: pdfData.subscriptionId },
    });

    if (existingInvoice) {
      existingInvoice.invoiceNumber = invoiceNumber;
      existingInvoice.pdfUrl = pdfUrl;
      existingInvoice.timezone = subscriptionData?.timezone;
      existingInvoice.country = subscriptionData?.country;
      existingInvoice.createdAtLocal = convertDateTimezone(
        DateTime.utc(),
        subscriptionData?.timezone ?? "UTC",
      );

      await CpoSubscriptionInvoiceRepository.save(existingInvoice);
    } else {
      const newInvoice = CpoSubscriptionInvoiceRepository.create({
        subscriptionId: pdfData.subscriptionId,
        invoiceNumber: invoiceNumber,
        pdfUrl: pdfUrl,
        timezone: subscriptionData?.timezone,
        country: subscriptionData?.country,
        createdAtLocal: convertDateTimezone(
          DateTime.utc(),
          subscriptionData?.timezone ?? "UTC",
        ),
      });

      await CpoSubscriptionInvoiceRepository.save(newInvoice);
    }

    return { pdfUrl };
  } catch (err) {
    console.error("Error generating PDF or QR code:", err);
  }
};

module.exports = {
  generateInvoice,
  generatePaymentInvoice,
  generateTransactionInvoice,
};
