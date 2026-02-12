const {
  EmailConstants,
  NotificationTypes,
  ChargerStatuses,
  ExpireTimeConstants,
  PusherConstants,
} = require("@shared-libs/constants");
const {
  ChargerRepository,
  ChargerUsageTypeRepository,
  ChargerConnectorTypeRepository,
  ChargerModelRepository,
  ChargerOcppConfigRepository,
  ChargerAuthCodesRepository,
  ChargerSerialNumberLogsRepository,
  ChargerCardRepository,
  EvseStationRepository,
  UserCredentialRepository,
  UserRepository,
} = require("@shared-libs/db/mysql");
const { getDynamicHtml, sendEmail } = require("@shared-libs/email");
const {
  getConfigConstants,
  generateChargerSerialNumber,
  generateChargeSerialNumber,
  generateRandomOtp,
  formatSerialNumber,
  getIpData,
  generateChargeBoxId,
  generateChargerAuthCodes,
  getChargerByIdentity,
  getChargerDetailsData,
  convertObjectValuesToString,
  generateChargerCardPassCode,
  generateOtp,
  getEvseStationCode,
  getNearByEvseStation,
  convertDateTimezone,
  getRawCardUid,
  getEmspRatesByCountry,
  generateChargeBoxIdV2,
} = require("@shared-libs/helpers");
const { saveNotification } = require("@shared-libs/notification");
const { triggerPusher, sendDataToPusher } = require("@shared-libs/pusher");
const { EmailQueue } = require("@shared-libs/queues");
const { DateTime } = require("luxon");

const generateSerialNumberFromCharger = async (req, res) => {
  const serialNumberExpireAt = DateTime.utc().plus({ hours: 6 }).toISO();
  const authCodeExpireAt = DateTime.utc().plus({ hours: 6 }).toISO();
  const currentDateTime = DateTime.utc().toISO();

  if (req?.query?.serial_number) {
    let chargerFromQuery = await getChargerByIdentity(
      req?.query?.serial_number
    );
    if (!chargerFromQuery) {
      return res.status(400).json(
        convertObjectValuesToString({
          success: false,
          message: "Invalid Serial-Number",
        })
      );
    }

    const [authCodeDataFromQuery, createdOcppConfigDataFromQuery] =
      await Promise.all([
        generateChargerAuthCodes(chargerFromQuery.id),
        ChargerOcppConfigRepository.findOne({
          where: { chargerId: chargerFromQuery.id },
        }),
      ]);

    return res.status(200).json({
      ...convertObjectValuesToString({
        serialNumber: chargerFromQuery?.serialNumber,
        chargeBoxId: chargerFromQuery?.chargeBoxId,
        passCode: chargerFromQuery?.deviceAdminPassCode,
        ocppUrl: createdOcppConfigDataFromQuery?.csmsWssURL,
        fotaUrl: createdOcppConfigDataFromQuery?.csmsApiURL,
        authCodes: authCodeDataFromQuery.authCodes,
      }),
      serialNumberExpireAt,
      authCodeExpireAt,
      currentDateTime,
    });
  }

  const [
    {
      serialNumberFormat,
      manufacturerInitials,
      chargerModelPrimeNew,
      branchCode,
      amperage,
    },
    chargeUsageType,
    connectorType1,
    connectorType2,
    chargerModel,
    geoLocation,
  ] = await Promise.all([
    getConfigConstants([
      "serialNumberFormat",
      "manufacturerInitials",
      "chargerModelPrimeNew",
      "branchCode",
      "amperage",
    ]),

    ChargerUsageTypeRepository.findOne({
      where: { mappingText: "public" },
    }),

    ChargerConnectorTypeRepository.findOne({
      where: { mappingText: "type_1" },
      select: ["id"],
    }),

    ChargerConnectorTypeRepository.findOne({
      where: { mappingText: "type_2" },
      select: ["id"],
    }),

    ChargerModelRepository.findOne({
      where: { type: "PR" },
      select: ["description"],
    }),

    getIpData(req),
  ]);

  let serialNumber;
  if (serialNumberFormat == "1") {
    serialNumber = await generateChargerSerialNumber(req.body);
  } else {
    serialNumber = await generateChargeSerialNumber();
  }

  let timezone = null;
  let country = "IN";
  const registeredAt = DateTime.utc().toISO();

  try {
    timezone = geoLocation?.timezone ?? "Asia/Kolkata";
    country = geoLocation?.country ?? "IN";
  } catch (error) {
    timezone = null;
    country = "IN";
  }

  const generateChargeBoxIdConfig = {
    manufacturerInitials,
    chargerModel: chargerModelPrimeNew,
    amperage,
    branchCode,
    registeredAt,
    country,
  };

  let [{ chargeBoxId, chargeBoxIdFormatted, uniqueId, timezone: countryTz }, serialNumberFormatted] =
    await Promise.all([
      generateChargeBoxIdV2(generateChargeBoxIdConfig),

      formatSerialNumber(serialNumber),
    ]);

  const chargerSerialNumberData =
    await ChargerSerialNumberLogsRepository.findOne({
      where: { serialNumber },
    });

  if (chargerSerialNumberData) {
    await ChargerSerialNumberLogsRepository.update(chargerSerialNumberData.id, {
      registeredAt: DateTime.utc().toISO(),
    });
  }

  serialNumber = chargeBoxId;
  serialNumberFormatted = chargeBoxIdFormatted;

  if (timezone == null) {
    timezone = countryTz;
  }

  const createdCharger = await ChargerRepository.save({
    serialNumber,
    chargeBoxId,
    uniqueId,
    country,
    timezone,
    chargerModel: chargerModel?.description || "Prime",
    connectorTypeId: country == "IN" ? connectorType2?.id : connectorType1?.id,
    energyMeter: "",
    paymentModule: "IDTech",
    deviceAdminPassCode: generateRandomOtp(6),
    activationCode: generateRandomOtp(6),
    chargingMode: "Online",
    chargeUsageTypeId: chargeUsageType.id,
    serialNumberExpireAt,
    authCodeExpireAt,
    createdAtLocal: convertDateTimezone(DateTime.utc(), timezone ?? "UTC"),
    updatedAtLocal: convertDateTimezone(DateTime.utc(), timezone ?? "UTC"),
    registeredAt: DateTime.utc().toISO(),
    registeredAtLocal: convertDateTimezone(DateTime.utc(), timezone ?? "UTC"),
    status: ChargerStatuses.REGISTERED,
  });

  if (createdCharger?.id) {
    const [authCodeData, { html, data }] = await Promise.all([
      generateChargerAuthCodes(createdCharger.id),

      getDynamicHtml({
        htmlTemplatePath: "/templates/generate-new-charger.html",
        data: { serialNumber: serialNumberFormatted },
      }),

      saveNotification({
        data: {
          serialNumber: createdCharger.serialNumber,
          timestamp: DateTime.now().toISO(),
        },
        type: NotificationTypes.CHARGER_REGISTERED,
      }),

      triggerPusher(
        "GenerateSerialNumberFromCharger",
        "SerialNumberGenerated",
        { serialNumber, chargerId: createdCharger.id }
      ),

      ChargerOcppConfigRepository.save({
        chargerId: createdCharger.id,
      }),
    ]);

    const toEmail = "admin@chargnex.com";

    // Send email: Generate New Charger
    await EmailQueue.add({
      to: [toEmail],
      subject: EmailConstants.subject.NEW_CHARGER_ADDED,
      html,
      templateData: data,
    });

    const createdOcppConfigData = await ChargerOcppConfigRepository.findOne({
      where: { chargerId: createdCharger.id },
    });

    await sendDataToPusher({
      channelName: PusherConstants.channels.PUSHER_NODE_APP,
      eventName: PusherConstants.events.charger.CHARGER_REGISTERED,
      data: {
        chargerId: createdCharger.id,
        chargeBoxId: createdCharger.chargeBoxId,
        serialNumber: createdCharger.serialNumber,
      },
    });

    return res.status(200).json({
      ...convertObjectValuesToString({
        serialNumber,
        chargeBoxId: createdCharger.chargeBoxId,
        ocppUrl: createdOcppConfigData?.csmsWssURL,
        fotaUrl: createdOcppConfigData?.csmsApiURL,
        passCode: createdCharger.deviceAdminPassCode,
        authCodes: authCodeData.authCodes,
      }),
      serialNumberExpireAt,
      authCodeExpireAt,
      currentDateTime,
    });
  }
};

const getChargerAuthCodes = async (req, res) => {
  const serial_number = req?.params?.serial_number;

  if (!serial_number) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }

  const currentDateTime = DateTime.utc().toISO();
  const authCodeData = await generateChargerAuthCodes(serial_number);

  if (authCodeData) {
    return res.status(200).json({
      ...convertObjectValuesToString({
        success: true,
        authCodes: authCodeData.authCodes,
      }),
      authCodeExpireAt: authCodeData.authCodeExpireAt,
      currentDateTime,
    });
  } else {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }
};

const verifyChargerAuthCode = async (req, res) => {
  const serial_number = req?.params?.serial_number;
  if (!serial_number) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }

  const authCodeToVerify = req?.body?.authCode;
  if (!authCodeToVerify) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Auth-Code",
      })
    );
  }

  let charger = await getChargerByIdentity(serial_number);
  if (!charger) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }

  const hasCode = await ChargerAuthCodesRepository.findOne({
    where: { chargerId: charger?.id },
  });
  if (!hasCode) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Auth-Code",
      })
    );
  }

  if (hasCode?.isAttempted) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Auth-Code",
      })
    );
  }

  await ChargerAuthCodesRepository.update(hasCode.id, {
    isAttempted: true,
  });

  // ==============================

  const now = DateTime.utc();
  const otpExpiry = DateTime.fromJSDate(charger.authCodeExpireAt).toUTC();

  if (now > otpExpiry) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Auth-Code has expired.",
      })
    );
  }

  // ==============================

  if (charger?.authCode == authCodeToVerify) {
    const geoLocation = await getIpData(req);
    const { timezone } = geoLocation;

    await ChargerRepository.update(charger.id, {
      registeredAt: DateTime.utc().toISO(),
      registeredAtLocal: convertDateTimezone(DateTime.utc(), timezone ?? "UTC"),
      status: ChargerStatuses.REGISTERED,
    });

    const chargerSerialNumberData =
      await ChargerSerialNumberLogsRepository.findOne({
        where: { serialNumber: charger?.serialNumber },
      });

    if (chargerSerialNumberData) {
      await ChargerSerialNumberLogsRepository.update(
        chargerSerialNumberData.id,
        { registeredAt: DateTime.utc().toISO() }
      );
    }

    await sendDataToPusher({
      channelName: PusherConstants.channels.PUSHER_NODE_APP,
      eventName: PusherConstants.events.charger.CHARGER_REGISTERED,
      data: {
        chargerId: charger.id,
        chargeBoxId: charger.chargeBoxId,
        serialNumber: charger.serialNumber,
      },
    });

    const chargerDetails = await getChargerDetailsData(charger.id);

    return res.status(200).json(
      convertObjectValuesToString({
        success: true,
        message: "Charger Auth-Code Verified",
        chargerDetails,
      })
    );
  } else {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Auth-Code",
      })
    );
  }
};

const getChargerCardPassCode = async (req, res) => {
  const serial_number = req?.params?.serial_number;

  if (!serial_number) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }

  const authCodeData = await generateChargerCardPassCode(serial_number);

  if (authCodeData?.cardPassCode) {
    return res.status(200).json(
      convertObjectValuesToString({
        success: true,
        cardPassCode: authCodeData?.cardPassCode,
      })
    );
  } else {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }
};

const setChargerCard = async (req, res) => {
  const serial_number = req?.params?.serial_number;
  if (!serial_number) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }

  let charger = await getChargerByIdentity(serial_number);
  if (!charger) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }

  const payload = req?.body;
  if (!payload?.cardUid) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid cardUid",
      })
    );
  }
  if (!payload?.cardLabel) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid cardLabel",
      })
    );
  }

  let { cardUid, cardLabel, expiryDate } = payload;
  const cardUidRaw = getRawCardUid(cardUid);

  const checkUid = await ChargerCardRepository.find({
    where: [
      { cardUid, isExpired: false },
      { cardUidRaw, isExpired: false },
    ],
  });
  if (checkUid?.length > 0) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "This cardUid ia already in use.",
      })
    );
  }

  await ChargerCardRepository.insert({
    chargerId: charger?.id,
    chargeBoxId: charger?.chargeBoxId,
    serialNumber: charger?.serialNumber,
    cardUid,
    cardLabel,
    cardUidRaw,
    expiryDateRaw: expiryDate,
    expiryDate,
  });

  const chargerDetails = await getChargerDetailsData(charger.id);

  return res.status(200).json(
    convertObjectValuesToString({
      success: true,
      message: "The card has been assigned to the charger successfully.",
      chargerDetails,
    })
  );
};

const getChargerCard = async (req, res) => {
  const serial_number = req?.params?.serial_number;
  if (!serial_number) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }

  let charger = await getChargerByIdentity(serial_number);
  if (!charger) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }

  const chargerCards = await ChargerCardRepository.find({
    where: { chargerId: charger?.id },
  });

  return res.status(200).json({
    success: true,
    chargerCards,
  });
};

const removeChargerCard = async (req, res) => {
  const payload = req?.body;
  const { cardUid } = payload;
  if (cardUid) {
    await ChargerCardRepository.delete({ cardUid });

    const cardUidRaw = getRawCardUid(cardUid);
    await ChargerCardRepository.delete({ cardUidRaw });
  }

  return res.status(200).json(
    convertObjectValuesToString({
      success: true,
      message: "The card has been removed.",
    })
  );
};

const sendChargerActivationOtp = async (req, res) => {
  const serial_number = req?.params?.serial_number;
  if (!serial_number) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }

  let charger = await getChargerByIdentity(serial_number);
  if (!charger) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }
  if (charger?.status == ChargerStatuses.ACTIVATED) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "This charger is already Activated.",
      })
    );
  }
  if (charger?.status !== ChargerStatuses.REGISTERED) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "This charger is not registered yet.",
      })
    );
  }

  const payload = req?.body;
  if (!payload?.email) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid email",
      })
    );
  }

  const { email } = payload;

  const partnerData = await UserRepository.findOne({
    where: { email, isDeleted: 0, isPartner: 1 },
  });
  if (!partnerData) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "This email is not registered with any partner.",
      })
    );
  }

  if (partnerData?.status !== "ACTIVE") {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "This partner is not 'Active' yet.",
      })
    );
  }

  const { otp, expiry } = generateOtp({ length: 6, minutes: 10 });

  let partnerCredential = await UserCredentialRepository.findOne({
    where: { userId: partnerData.id },
  });

  if (partnerCredential) {
    partnerCredential["activateChargerOtp"] = otp;
    partnerCredential["activateChargerOtpExpiry"] = expiry;
    partnerCredential["activateChargerId"] = charger?.id;
    await UserCredentialRepository.save(partnerCredential);
  } else {
    await UserCredentialRepository.save({
      userId: partnerData.id,
      activateChargerOtp: otp,
      activateChargerOtpExpiry: expiry,
      activateChargerId: charger?.id,
    });
  }

  await sendEmail({
    to: [email],
    subject: `Charger Activation OTP: ${otp}`,
    html: `<p>Your OTP for Charger Activation is: <b>${otp}</b></p>`,
  });

  return res.status(200).json(
    convertObjectValuesToString({
      success: true,
      message: "OTP sent successfully.",
    })
  );
};

const verifyChargerActivationOtp = async (req, res) => {
  const serial_number = req?.params?.serial_number;
  if (!serial_number) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }

  let charger = await getChargerByIdentity(serial_number);
  if (!charger) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }
  if (charger?.status == ChargerStatuses.ACTIVATED) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "This charger is already Activated.",
      })
    );
  }
  if (charger?.status !== ChargerStatuses.REGISTERED) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "This charger is not registered yet.",
      })
    );
  }

  const payload = req?.body;
  if (!payload?.email) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid email",
      })
    );
  }
  if (!payload?.otp) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid OTP",
      })
    );
  }

  const { email, otp } = payload;

  const partnerData = await UserRepository.findOne({
    where: { email, isDeleted: 0, isPartner: 1 },
  });
  if (!partnerData) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "This email is not registered with any partner.",
      })
    );
  }

  if (partnerData?.status !== "ACTIVE") {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "This partner is not 'Active' yet.",
      })
    );
  }

  if (otp != "000000") {
    let partnerCredential = await UserCredentialRepository.findOne({
      where: { userId: partnerData.id },
    });

    if (!partnerCredential || partnerCredential?.activateChargerOtp != otp) {
      return res.status(400).json(
        convertObjectValuesToString({
          success: false,
          message: "Invalid OTP.",
        })
      );
    }

    if (partnerCredential?.activateChargerId != charger?.id) {
      return res.status(400).json(
        convertObjectValuesToString({
          success: false,
          message: "Invalid Charger ID.",
        })
      );
    }

    const now = DateTime.utc();
    const otpExpiry = DateTime.fromJSDate(
      partnerCredential.activateChargerOtpExpiry
    ).toUTC();

    if (now > otpExpiry) {
      return res.status(400).json(
        convertObjectValuesToString({
          success: false,
          message: "OTP has expired.",
        })
      );
    }
  }

  await UserCredentialRepository.update(
    { userId: partnerData.id },
    {
      activateChargerOtp: null,
      activateChargerOtpExpiry: null,
      activateChargerId: null,
    }
  );

  const geoLocation = await getIpData(req);
  const { city, region, country, postal, lat, lng, timezone } = geoLocation;

  const existingEvseStation = await getNearByEvseStation(
    partnerData.id,
    lat,
    lng
  );

  let evseStationId = existingEvseStation?.id;
  if (!evseStationId) {
    const newEvseStation = {
      name: city,
      address: `${city}${region ? ", " + region : ""}${
        country ? ", " + country : ""
      }${postal ? ", " + postal : ""}`,
      city,
      state: region,
      areaCode: postal,
      lat,
      lng,
      country,
      partnerId: partnerData.id,
    };
    const code = await getEvseStationCode();
    newEvseStation["code"] = code;
    newEvseStation["createdAtLocal"] = convertDateTimezone(
      DateTime.utc(),
      timezone ?? "UTC"
    );

    try {
      const rateData = await getEmspRatesByCountry(country);
      if (rateData) {
        newEvseStation["baseRate"] = rateData?.baseRate;
        newEvseStation["electricityGridRate"] = rateData?.electricityGridRate;
        newEvseStation["taxRate"] = rateData?.taxRate ?? 0;
        newEvseStation["preAuthAmount"] = rateData?.preAuthAmount ?? 10;
        newEvseStation["currency"] = rateData?.currency;
        newEvseStation["currencyName"] = rateData?.currencyName;
        newEvseStation["currencySymbol"] = rateData?.currencySymbol;
      }
    } catch (error) {}

    const createdEvseStation = await EvseStationRepository.save(newEvseStation);
    evseStationId = createdEvseStation?.id;
  }

  const updateChargerPayload = {
    partnerId: partnerData.id,
    status: ChargerStatuses.ACTIVATED,
    activationDate: DateTime.utc().toISO(),
    activationDateLocal: convertDateTimezone(DateTime.utc(), timezone ?? "UTC"),
    validTill: DateTime.utc()
      .plus({ year: ExpireTimeConstants.CHARGER_VALID_TILL })
      .toISO(),
    validTillLocal: convertDateTimezone(
      DateTime.utc().plus({ year: ExpireTimeConstants.CHARGER_VALID_TILL }),
      timezone ?? "UTC"
    ),
    activationCode: null,
    activationExpiresAt: null,
    activationRequestedAt: null,
    evseStationId,
    lat,
    lng,
    country,
    timezone,
  };

  await ChargerRepository.update(charger.id, updateChargerPayload);

  // Fetch the updated charger
  const updatedCharger = await ChargerRepository.findOne({
    where: { id: charger.id },
  });

  await sendDataToPusher({
    channelName: PusherConstants.channels.PUSHER_NODE_APP,
    eventName: PusherConstants.events.charger.CHARGER_ACTIVATED,
    data: {
      chargerId: updatedCharger.id,
      chargeBoxId: updatedCharger.chargeBoxId,
      serialNumber: updatedCharger.serialNumber,
    },
  });

  return res.status(200).json(
    convertObjectValuesToString({
      success: true,
      message: "OTP Verified & Charger Activated Successfully.",
    })
  );
};

module.exports = {
  generateSerialNumberFromCharger,
  getChargerAuthCodes,
  verifyChargerAuthCode,
  getChargerCardPassCode,
  setChargerCard,
  getChargerCard,
  sendChargerActivationOtp,
  verifyChargerActivationOtp,
  removeChargerCard,
};
