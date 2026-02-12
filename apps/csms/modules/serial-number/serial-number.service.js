const {
  ChargerRepository,
  ChargerUsageTypeRepository,
  ChargerOcppConfigRepository,
  ChargerSerialNumberLogsRepository,
  ChargerConnectorTypeRepository,
  ChargerModelRepository,
} = require("@shared-libs/db/mysql");
const {
  generateChargeSerialNumber,
  generateRandomOtp,
  formatSerialNumber,
  getIpTimezone,
  getChargerByIdentity,
  generateChargerSerialNumber,
  getConfigConstants,
} = require("@shared-libs/helpers");
const { DateTime } = require("luxon");
const { triggerPusher } = require("@shared-libs/pusher");
const { getDynamicHtml } = require("@shared-libs/email");
const { EmailQueue } = require("@shared-libs/queues");
const {
  EmailConstants,
  customErrorMsg,
  ChargerStatuses,
  NotificationTypes,
} = require("@shared-libs/constants");
const { saveNotification } = require("@shared-libs/notification");

const generateSerialNumber = async (req, res) => {
  const serialNumber = await generateChargeSerialNumber();

  res.status(200).json({
    serialNumber,
  });
};

const generateSerialNumberFromCharger = async (req, res) => {
  const serialNumberFormat = await getConfigConstants(["serialNumberFormat"]);

  let serialNumber;
  if (serialNumberFormat == "1") {
    serialNumber = await generateChargerSerialNumber(req.body);
  } else {
    serialNumber = await generateChargeSerialNumber();
  }

  const createdExists = await ChargerRepository.findOne({
    where: { serialNumber },
  });

  let chargerId = null;
  if (createdExists?.id) {
    chargerId = createdExists.id;
  }

  let createdCharger = {};

  if (chargerId) {
    await ChargerRepository.update(chargerId, { serialNumber });
    createdCharger = await ChargerRepository.findOne({
      where: { id: chargerId },
    });
  } else {
    const chargeUsageType = await ChargerUsageTypeRepository.findOne({
      where: { mappingText: "public" },
    });

    let timezone = null;
    try {
      timezone = await getIpTimezone(req);
    } catch (error) {
      timezone = null;
    }
    const connectorType = await ChargerConnectorTypeRepository.findOne({
      where: { mappingText: "type_1" },
      select: ["id"]
    });

    const chargerModel = await ChargerModelRepository.findOne({
      where: { type: "PR" },
      select: ["description"]
    });

    const chargerCreateData = {
      serialNumber,
      chargerModel: chargerModel?.description || "Prime",
      connectorTypeId: connectorType?.id,
      energyMeter: "",
      paymentModule: "IDTech",
      deviceAdminPassCode: generateRandomOtp(6),
      activationCode: generateRandomOtp(6),
      chargingMode: "Online",
      chargeUsageTypeId: chargeUsageType.id,
    };

    if (timezone) {
      chargerCreateData["timezone"] = timezone;
    }

    createdCharger = await ChargerRepository.save(chargerCreateData);

    if (createdCharger?.id) {
      const chargerOcppConfigData = await ChargerOcppConfigRepository.findOne({
        where: { chargerId: createdCharger.id },
      });
      if (!chargerOcppConfigData?.id) {
        await ChargerOcppConfigRepository.save({
          chargerId: createdCharger.id,
        });
      }
    }

    const registerChargerDataForPusher = {
      serialNumber: createdCharger.serialNumber,
      timestamp: DateTime.now().toISO(),
    };

    await saveNotification({
      data: registerChargerDataForPusher,
      type: NotificationTypes.CHARGER_REGISTERED,
    });
  }
  const { html, data } = await getDynamicHtml({
    htmlTemplatePath: "/templates/generate-new-charger.html",
    data: {
      serialNumber: await formatSerialNumber(serialNumber),
    },
  });

  const toEmail = "admin@chargnex.com";

  // Send email: Generate New Charger
  await EmailQueue.add({
    to: [toEmail],
    subject: EmailConstants.subject.NEW_CHARGER_ADDED,
    html,
    templateData: data,
  });
  await triggerPusher(
    "GenerateSerialNumberFromCharger",
    "SerialNumberGenerated",
    { serialNumber, chargerId: createdCharger.id }
  );

  res.status(200).json({ serialNumber, chargerId: createdCharger.id });
};

const registerSerialNumber = async (req, res) => {
  const { serialNumber } = req.body;

  if (!serialNumber) {
    return res
      .status(404)
      .json({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
  }

  const charger = await getChargerByIdentity(serialNumber);
  if (!charger) {
    return res
      .status(404)
      .json({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
  }

  await ChargerRepository.update(charger.id, {
    registeredAt: DateTime.utc().toISO(),
    status: ChargerStatuses.REGISTERED,
  });

  const chargerSerialNumberData =
    await ChargerSerialNumberLogsRepository.findOne({
      where: { serialNumber },
    });

  if (chargerSerialNumberData) {
    await ChargerSerialNumberLogsRepository.update(chargerSerialNumberData.id, {
      registeredAt: DateTime.utc().toISO(),
    });
  }

  res.status(200).json({ serialNumber, chargerId: charger.id });
};

module.exports = {
  generateSerialNumber,
  generateSerialNumberFromCharger,
  registerSerialNumber,
};
