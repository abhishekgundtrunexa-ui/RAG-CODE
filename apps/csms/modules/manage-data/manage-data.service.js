const {
  OcppTransactionsRepository,
  ChargingInvoiceRepository,
  PaymentTransactionsRepository,
  ChargerConnectorMappingRepository,
  ChargerExperienceFeedbackRepository,
  ChargerLanguageRepository,
  ChargerMeteringConfigRepository,
  ChargerMeterValuesRepository,
  ChargerOcppConfigRepository,
  ChargerPaymentConfigRepository,
  ChargerVersionRepository,
  ConnectedChargerRepository,
  ChargerRepository,
  CpoRepository,
  CpoBaseRateRepository,
  CpoCardDetailsRepository,
  CpoUserRoleRepository,
  CpoSubscriptionRepository,
  CpoSubscriptionPurchaseRequestRepository,
  CpoUserRepository,
  CpoUserSessionRepository,
  AllocationRulesRepository,
  CpoPaymentAccountRepository,
  AllocationPartnersRepository,
  CpoSubscriptionInvoiceRepository,
  CpoUserCredentialRepository,
  EvseStationRepository,
  LanguageRepository,
  ChargerViewRepository,
  ContractPartnersRepository,
  ChargerRevenueRepository,
  ChargerAuthCodesRepository,
  ChargerCardRepository,
  ChargerConstantsRepository,
  ChargerEtTestingRepository,
  ChargerEtTestingTransactionsRepository,
  UserRepository,
  PartnerRepository,
  ChargerModelRepository,
  ChargerConnectorTypeRepository,
  ChargerUsageTypeRepository,
  ChargerSerialNumberLogsRepository,
  ContractRepository,
  ContractEvseStationsRepository,
  ContractActivityRepository,
  ContractChargerViewRepository,
  EMspPaymentConfigRepository,
  EMspUserRepository,
} = require("@shared-libs/db/mysql");
const { Not, In, LessThanOrEqual, Between } = require("typeorm");
const {
  AutoCaptureLogsModel,
  EmvDataAddLogsModel,
  OcppLogModel,
  OcppMeterValueLogModel,
  OcppTransactionLogModel,
  PreauthCompleteLogsModel,
  PreauthLogsModel,
  TransactionErrorLogsModel,
  AgentConcurrencyModel,
  AnalyticsModel,
  DeviceOverviewModel,
  OcppBootNotificationLogModel,
  OcppHeartbeatLogModel,
  RemoteCommandTrackerModel,
  RolloutDeviceStatesModel,
  RolloutDeviceStatesHistoryModel,
  UtilizationRateModel,
  NotificationModel,
  PreauthCancelLogsModel,
  RefundLogsModel,
  TransactionHistoryViewModel,
  PurchaseLogsModel,
  OcppAllLogModel,
  CountryModel,
} = require("@shared-libs/db/mongo-db");
const {
  addMeasurandValues,
  getChargerByIdentity,
  getOcppTransactionCalculation,
  getIpData,
  arrayObjStr,
  arrayObjArr,
  arrayChunk,
  formatDateString,
  generateRandomCode,
  getEvseStationCode,
  generateChargerSerialNumber,
  generateChargeSerialNumber,
  getConfigConstants,
  convertDateTimezone,
  generateRandomOtp,
  getEmspRatesByCountry,
  getTimezoneByCountry,
  getIsoCode3,
  generateChargeBoxIdV2,
} = require("@shared-libs/helpers");
const {
  generateInvoice,
  generateTransactionInvoice,
} = require("@shared-libs/pdf");
const { checkAndCleanStorage } = require("../../crons/check-storage.cron");
const { EmailQueue, TempInvoiceGenerateQueue } = require("@shared-libs/queues");
const {
  customErrorMsg,
  ChargerStatuses,
  ExpireTimeConstants,
} = require("@shared-libs/constants");
const { sendDataToPusher } = require("@shared-libs/pusher");
const { default: axios } = require("axios");
const { syncSettlements } = require("../../crons/sync-settlements.cron");
const { DateTime } = require("luxon");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const deleteCancelledTransactions = async (req, res) => {
  try {
    const transactions = await OcppTransactionsRepository.find({
      where: {
        // createdAt: LessThanOrEqual("2025-06-30 23:59:59"),
        // transactionUuid: Not("1ec1c760-0a83-4069-9abf-73348fd894d9"),
        // // transactionUuid: "00292a2a-f418-40c1-aa8e-506e0e90dc3c",
        transactionStatus: "cancelled",
      },
    });
    const ids = transactions.map(({ transactionUuid }) => transactionUuid);

    return res.status(200).json({ count: ids?.length, ids });

    if (ids) {
      await Promise.all([
        ChargingInvoiceRepository.delete({ transactionId: In(ids) }),
        PaymentTransactionsRepository.delete({ ocppTransactionId: In(ids) }),
        OcppTransactionsRepository.delete({ transactionUuid: In(ids) }),
        ChargerRevenueRepository.delete({ ocppTransactionId: In(ids) }),

        AutoCaptureLogsModel.deleteMany({ transactionId: { $in: ids } }),
        EmvDataAddLogsModel.deleteMany({ transactionId: { $in: ids } }),
        OcppLogModel.deleteMany({ transactionUuid: { $in: ids } }),
        OcppMeterValueLogModel.deleteMany({ transactionUuid: { $in: ids } }),
        OcppTransactionLogModel.deleteMany({ transactionUuid: { $in: ids } }),
        PreauthCompleteLogsModel.deleteMany({ transactionId: { $in: ids } }),
        PreauthLogsModel.deleteMany({ transactionId: { $in: ids } }),
        PurchaseLogsModel.deleteMany({ transactionId: { $in: ids } }),
        PreauthCancelLogsModel.deleteMany({ transactionId: { $in: ids } }),
        RefundLogsModel.deleteMany({ transactionId: { $in: ids } }),
        TransactionErrorLogsModel.deleteMany({ transactionId: { $in: ids } }),
      ]);
    }

    // =========================================================================================================
    //
    // const tr = await TransactionHistoryViewModel.find({
    //   type: { $in: ["Purchase", "Capture"] },
    //   hasError: false,
    // });
    //
    // // 2090
    // // 84
    //
    // let trIds = tr.map(({ transactionId }) => transactionId);
    //
    // trIds = [...new Set([...trIds].filter((id) => id != null))];
    //
    // await OcppTransactionsRepository.update(
    //   { transactionUuid: In(trIds), paymentStatus: Not("Accepted") },
    //   { paymentStatus: "Rejected" }
    // );
    // return res.status(200).json({ count: trIds?.length });
    // =========================================================================================================

    // const ocppLogs = await OcppAllLogModel.aggregate([
    //   { $match: { transactionUuid: { $ne: null, $ne: "" } } }, // Filter out null and empty values
    //   { $group: { _id: "$transactionUuid", doc: { $first: "$$ROOT" } } }, // Group by transactionUuid
    //   { $replaceRoot: { newRoot: "$doc" } }, // Get original documents
    // ]);

    // const ocppLogs = await OcppAllLogModel.aggregate([
    //   {
    //     $match: {
    //       transactionUuid: { $ne: null, $ne: "", $exists: true, $type: "string" },
    //     },
    //   },
    //   { $group: { _id: "$transactionUuid" } },
    //   { $project: { _id: 0, transactionUuid: "$_id" } },
    // ]);

    // const transactionIds = ocppLogs.map(({ transactionUuid }) => transactionUuid);

    // if (transactionIds?.length > 0) {
    //   const transactions2 = await OcppTransactionsRepository.find({
    //     where: { transactionUuid: In(transactionIds) },
    //   });
    //   const transactionIds2 = transactions2.map(
    //     ({ transactionUuid }) => transactionUuid
    //   );

    //   const missingIds = transactionIds.filter(
    //     (id) => !transactionIds2.includes(id)
    //   );

    //   console.log(missingIds);
    // }

    // return res
    //   .status(200)
    //   .json({ count: transactionIds?.length, transactionIds });
    return res.status(200).json({ count: ids?.length, ids });
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.message:", error?.message);
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.name:", error?.name);
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.stack:", error?.stack);
    console.log("🚀 -----------------🚀");

    return res.status(500).json({ message: error?.message });
  }
};

const hardDeleteContracts = async (req, res) => {
  try {
    const contracts = await ContractRepository.find({
      where: { isDeleted: 1 },
    });
    const ids = contracts.map(({ id }) => id);

    // return res.status(200).json({ count: ids?.length, ids });

    if (ids) {
      await Promise.all([
        ContractPartnersRepository.delete({ contractId: In(ids) }),
        ContractEvseStationsRepository.delete({ contractId: In(ids) }),
        ContractActivityRepository.delete({ contractId: In(ids) }),
        ContractRepository.delete({ id: In(ids) }),
      ]);
    }

    return res.status(200).json({ count: ids?.length, ids });
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.message:", error?.message);
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.name:", error?.name);
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.stack:", error?.stack);
    console.log("🚀 -----------------🚀");

    return res.status(500).json({ message: error?.message });
  }
};

const onboardCharger = async (req, res) => {
  try {
    const { secretCode } = req.body;
    const returnData = {};

    if (secretCode != 998877) {
      return res.status(404).json({ message: "Invalid Secret Code." });
    }

    let {
      country,
      custChargeBoxId = null,
      paymentDetails,
      partnerId = null,
      partnerDetails = {},
      evseStationId = null,
      evseStationDetails = {},
    } = req.body;

    if (custChargeBoxId != null) {
      const existingCharger = await ChargerRepository.findOne({
        where: { chargeBoxId: custChargeBoxId },
      });
      if (existingCharger) {
        return res
          .status(400)
          .json({ message: "Charger with this ChargeBoxId already exists" });
      }
    }

    let timezone = "UTC";
    try {
      timezone = await getTimezoneByCountry(country);
    } catch (error) {
      timezone = "UTC";
    }
    timezone = timezone ?? "UTC";

    const createdAtLocal = formatDateString(DateTime.utc(), timezone ?? "UTC");

    // Creating Partner
    if (true) {
      if (!partnerId) {
        // Check if partner with same email already exists
        const existingPartner = await UserRepository.findOne({
          where: { email: partnerDetails["email"], isDeleted: false },
        });

        if (existingPartner) {
          if (existingPartner?.isPartner) {
            partnerId = existingPartner.id;
          } else {
            return res
              .status(400)
              .json({ message: "User with this email already exists" });
          }
        }

        if (!partnerId) {
          const savedUser = await UserRepository.save({
            fullName: partnerDetails["name"],
            email: partnerDetails["email"],
            country,
            phoneNumber: null,
            timezone,
            dateFormat: "dd-MM-yyyy",
            permissions: [],
            isPartner: true,
            isOwner: false,
            createdAtLocal,
          });
          partnerId = savedUser?.id;

          const partnerCode = generateRandomCode(6).toUpperCase();

          await PartnerRepository.save({
            userId: savedUser?.id,
            partnerCode,
            companyName: null,
            country,
            createdAtLocal,
          });
        }
      }

      if (!partnerId) {
        return res.status(404).json({ message: "Partner is required." });
      }

      const checkPartner = await UserRepository.findOne({
        where: { id: partnerId },
      });
      if (!checkPartner) {
        return res.status(404).json({ message: "Partner not found." });
      }

      returnData["partnerId"] = partnerId;
    }

    // Creating EvseStation
    if (true) {
      if (!evseStationId) {
        const code = await getEvseStationCode();

        const newEvseStation = {
          code,
          name: evseStationDetails["name"],
          address: evseStationDetails["address"],
          city: evseStationDetails["city"],
          state: evseStationDetails["state"],
          country: evseStationDetails["country"],
          areaCode: evseStationDetails["areaCode"],
          lat: evseStationDetails["lat"],
          lng: evseStationDetails["lng"],
          partnerId,
          createdAtLocal,
          timezone,
        };

        try {
          const rateData = await getEmspRatesByCountry(country);
          if (rateData) {
            newEvseStation["baseRate"] =
              evseStationDetails["baseRate"] ?? rateData?.baseRate;
            newEvseStation["electricityGridRate"] =
              evseStationDetails["electricityGridRate"] ??
              rateData?.electricityGridRate;
            newEvseStation["taxRate"] =
              evseStationDetails["taxRate"] ?? rateData?.taxRate ?? 0;
            newEvseStation["preAuthAmount"] =
              evseStationDetails["preAuthAmount"] ??
              rateData?.preAuthAmount ??
              0;

            newEvseStation["currency"] = rateData?.currency;
            newEvseStation["currencyName"] = rateData?.currencyName;
            newEvseStation["currencySymbol"] = rateData?.currencySymbol;
          }
        } catch (error) {}

        const createdEvseStation =
          await EvseStationRepository.save(newEvseStation);
        evseStationId = createdEvseStation?.id;
      }

      if (!evseStationId) {
        return res.status(404).json({ message: "Station is required." });
      }

      const checkStation = await EvseStationRepository.findOne({
        where: { id: evseStationId },
      });
      if (!checkStation) {
        return res.status(404).json({ message: "Station not found." });
      }

      returnData["evseStationId"] = evseStationId;
    }

    // Creating Charger
    if (true) {
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
      ]);

      let serialNumber;
      if (serialNumberFormat == "1") {
        serialNumber = await generateChargerSerialNumber(req.body);
      } else {
        serialNumber = await generateChargeSerialNumber();
      }

      const registeredAt = DateTime.utc().toISO();

      const generateChargeBoxIdConfig = {
        manufacturerInitials,
        chargerModel: chargerModelPrimeNew,
        amperage,
        branchCode,
        registeredAt,
        country,
      };

      let [{ chargeBoxId, uniqueId }] = await Promise.all([
        generateChargeBoxIdV2(generateChargeBoxIdConfig),
      ]);

      chargeBoxId = custChargeBoxId != null ? custChargeBoxId : chargeBoxId;
      uniqueId = custChargeBoxId != null ? custChargeBoxId : uniqueId;

      serialNumber = chargeBoxId;

      const createdCharger = await ChargerRepository.save({
        serialNumber,
        chargeBoxId,
        uniqueId,
        country,
        timezone,
        chargerModel: chargerModel?.description || "Prime",
        connectorTypeId:
          country == "IN" ? connectorType2?.id : connectorType1?.id,
        energyMeter: "",
        paymentModule: "IDTech",
        deviceAdminPassCode: generateRandomOtp(6),
        activationCode: generateRandomOtp(6),
        chargingMode: "Online",
        chargeUsageTypeId: chargeUsageType.id,
        registeredAt: DateTime.utc().toISO(),
        status: ChargerStatuses.ACTIVATED,
        isConfigured: true,
        activationDate: DateTime.utc().toISO(),
        activationDateLocal: convertDateTimezone(
          DateTime.utc(),
          timezone ?? "UTC",
        ),
        validTill: DateTime.utc()
          .plus({ year: ExpireTimeConstants.CHARGER_VALID_TILL })
          .toISO(),
        validTillLocal: convertDateTimezone(
          DateTime.utc().plus({ year: ExpireTimeConstants.CHARGER_VALID_TILL }),
          timezone ?? "UTC",
        ),
        registeredAtLocal: convertDateTimezone(
          DateTime.utc(),
          timezone ?? "UTC",
        ),
        createdAtLocal: convertDateTimezone(DateTime.utc(), timezone ?? "UTC"),
        updatedAtLocal: convertDateTimezone(DateTime.utc(), timezone ?? "UTC"),
        evseStationId,
        partnerId,
      });

      await ChargerOcppConfigRepository.save({
        chargerId: createdCharger.id,
      });

      const chargerSerialNumberData =
        await ChargerSerialNumberLogsRepository.findOne({
          where: { serialNumber },
        });

      if (chargerSerialNumberData) {
        await ChargerSerialNumberLogsRepository.update(
          chargerSerialNumberData.id,
          { registeredAt: DateTime.utc().toISO() },
        );
      }

      await ChargerPaymentConfigRepository.save({
        chargerId: createdCharger.id,
        chargeBoxId: createdCharger.chargeBoxId,
        paymentGatewayURL: paymentDetails["paymentGatewayURL"],
        preauthAmountMultiplier: paymentDetails["preauthAmountMultiplier"],
        paymentMfg: paymentDetails["paymentMfg"],
        paymentMfgId: paymentDetails["paymentMfgId"],
        paymentProvider: paymentDetails["paymentProvider"],
        paymentDeviceId: paymentDetails["paymentDeviceId"],
        deviceType: paymentDetails["deviceType"],
        posCode: paymentDetails["posCode"],
      });

      returnData["chargerId"] = createdCharger.id;
      returnData["chargeBoxId"] = createdCharger.chargeBoxId;
      returnData["serialNumber"] = createdCharger.serialNumber;
    }

    return res.status(200).json(returnData);
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.message:", error?.message);
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.name:", error?.name);
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.stack:", error?.stack);
    console.log("🚀 -----------------🚀");

    return res.status(500).json({ message: error?.message });
  }
};

const syncSettlement = async (req, res) => {
  try {
    await syncSettlements();

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.message:", error?.message);
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.name:", error?.name);
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.stack:", error?.stack);
    console.log("🚀 -----------------🚀");

    return res.status(500).json({ message: error?.message });
  }
};

const syncCountryIso3 = async (req, res) => {
  try {
    const cursor = CountryModel.find().lean().cursor();

    const batchSize = 2000;
    let batch = [];
    let copied = 0;

    for await (const doc of cursor) {
      const isoCode3 = getIsoCode3(doc?.isoCode);

      batch.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { isoCode3 },
          upsert: true,
        },
      });

      if (batch.length >= batchSize) {
        await CountryModel.bulkWrite(batch, { timestamps: false });
        copied += batch.length;
        batch = [];
      }
    }

    if (batch.length) {
      await CountryModel.bulkWrite(batch, { timestamps: false });
      copied += batch.length;
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.message:", error?.message);
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.name:", error?.name);
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.stack:", error?.stack);
    console.log("🚀 -----------------🚀");

    return res.status(500).json({ message: error?.message });
  }
};

const updateMeterValues = async (req, res) => {
  try {
    const meterValueLogs = await OcppMeterValueLogModel.find();
    const updatedData = meterValueLogs.map((meterValueLog) => {
      return {
        _id: meterValueLog?._id,
        ocppSchema: addMeasurandValues(meterValueLog?.ocppSchema),
      };
    });

    // const updatedData = addMeasurandValues(meterValueLog?.ocppSchema);

    if (updatedData?.length > 0) {
      await OcppMeterValueLogModel.bulkWrite(
        updatedData.map((u) => ({
          updateOne: {
            filter: { _id: u._id },
            update: { $set: { ocppSchema: u?.ocppSchema } },
          },
        })),
      );
    }

    return res.status(200).json(updatedData);
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.message:", error?.message);
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.name:", error?.name);
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.stack:", error?.stack);
    console.log("🚀 -----------------🚀");

    return res.status(500).json({ message: error?.message });
  }
};

const dateTest = async (req, res) => {
  try {
    const clientId = "CGXINPRM2025E0A0D0";
    const charger = await getChargerByIdentity(clientId, {}, true);

    return res.status(200).json(charger);
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.message:", error?.message);
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.name:", error?.name);
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.stack:", error?.stack);
    console.log("🚀 -----------------🚀");

    return res.status(500).json({ message: error?.message });
  }
};

const reGenerateInvoice = async (req, res) => {
  try {
    const transactionId = req.params.transactionId;

    await generateInvoice(transactionId);
  } catch (error) {}

  return res.status(200).json({ message: "Invoice Generated.." });
};

const reCalculateAndGenerateInvoice = async (req, res) => {
  try {
    const transactionId = req.params.transactionId;

    await getOcppTransactionCalculation(transactionId);
    await generateInvoice(transactionId);
  } catch (error) {}

  return res.status(200).json({ message: "Invoice Generated.." });
};

const checkStorage = async (req, res) => {
  try {
    await checkAndCleanStorage();
  } catch (error) {}

  return res.status(200).json({ message: "ok.." });
};

const checkEmail = async (req, res) => {
  try {
    await EmailQueue.add({
      to: ["dharmesh.trunexa@gmail.com"],
      subject: "TEST",
      html: "test",
      templateData: {},
    });
  } catch (error) {}

  return res.status(200).json({ message: "ok.." });
};

const deleteCharger = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    const charger = await getChargerByIdentity(chargerId);
    if (!charger) {
      return res
        .status(404)
        .send({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    let chargerIds = [charger.id];
    let chargeBoxIds = [charger.chargeBoxId];
    let serialNumbers = [charger.serialNumber];

    const runRaw = false;
    // const runRaw = true;
    if (runRaw) {
      const chargers = await ChargerRepository.find({
        where: {
          // evseStationId: "d438d195-002a-43cf-b5f1-22c181fef3de",
          chargeBoxId: Not(
            In([
              "CGXNLPRM2025061B25",
              "CGXCAPRM2025AD1D86",
              "CGXNLPRM2025AB5E3B",
              "CGXINPRM2025314437",
              "CGXINPRM202518E2A8",
              "CGXCAPRM2025F4695F",
            ]),
          ),
        },
      });
      chargerIds = chargers.map(({ id }) => id);
      chargeBoxIds = chargers.map(({ chargeBoxId }) => chargeBoxId);
      serialNumbers = chargers.map(({ serialNumber }) => serialNumber);
    }

    return res.status(200).json({ count: chargerIds?.length, chargeBoxIds });

    if (chargerIds) {
      await Promise.all([
        ChargerConnectorMappingRepository.delete({ chargerId: In(chargerIds) }),
        ChargerExperienceFeedbackRepository.delete({
          chargeBoxId: In(chargeBoxIds),
        }),
        ChargerLanguageRepository.delete({ chargerId: In(chargerIds) }),
        ChargerMeteringConfigRepository.delete({ chargerId: In(chargerIds) }),
        ChargerMeterValuesRepository.delete({
          chargeBoxId: In(chargeBoxIds),
        }),
        ChargerOcppConfigRepository.delete({ chargerId: In(chargerIds) }),
        ChargerPaymentConfigRepository.delete({ chargerId: In(chargerIds) }),
        ChargerVersionRepository.delete({ chargerId: In(chargerIds) }),
        ConnectedChargerRepository.delete({ identity: In(chargeBoxIds) }),
        ChargerAuthCodesRepository.delete({ chargerId: In(chargerIds) }),
        ChargerCardRepository.delete({ chargerId: In(chargerIds) }),
        ChargerConstantsRepository.delete({ chargerId: In(chargerIds) }),
        ChargerRevenueRepository.delete({ chargerId: In(chargerIds) }),
        ChargerEtTestingRepository.delete({ chargeBoxId: In(chargeBoxIds) }),
        ChargerEtTestingTransactionsRepository.delete({
          chargeBoxId: In(chargeBoxIds),
        }),
        ChargerRepository.delete({ id: In(chargerIds) }),

        AgentConcurrencyModel.deleteMany({ deviceId: { $in: serialNumbers } }),
        AnalyticsModel.deleteMany({ chargerId: { $in: chargerIds } }),
        DeviceOverviewModel.deleteMany({ deviceId: { $in: serialNumbers } }),
        OcppBootNotificationLogModel.deleteMany({
          clientId: { $in: chargeBoxIds },
        }),
        OcppHeartbeatLogModel.deleteMany({ clientId: { $in: chargeBoxIds } }),
        OcppAllLogModel.deleteMany({ clientId: { $in: chargeBoxIds } }),
        OcppLogModel.deleteMany({ clientId: { $in: chargeBoxIds } }),
        OcppMeterValueLogModel.deleteMany({ clientId: { $in: chargeBoxIds } }),
        OcppTransactionLogModel.deleteMany({ clientId: { $in: chargeBoxIds } }),
        RemoteCommandTrackerModel.deleteMany({
          deviceId: { $in: serialNumbers },
        }),
        RolloutDeviceStatesModel.deleteMany({
          deviceId: { $in: serialNumbers },
        }),
        RolloutDeviceStatesHistoryModel.deleteMany({
          deviceId: { $in: serialNumbers },
        }),
        UtilizationRateModel.deleteMany({ clientId: { $in: chargeBoxIds } }),
      ]);

      const transactions = await OcppTransactionsRepository.find({
        where: { chargeBoxId: In(chargeBoxIds) },
      });

      const ids = transactions.map(({ transactionUuid }) => transactionUuid);

      if (ids) {
        await Promise.all([
          ChargingInvoiceRepository.delete({ transactionId: In(ids) }),
          PaymentTransactionsRepository.delete({ ocppTransactionId: In(ids) }),
          OcppTransactionsRepository.delete({ transactionUuid: In(ids) }),

          AutoCaptureLogsModel.deleteMany({ transactionId: { $in: ids } }),
          EmvDataAddLogsModel.deleteMany({ transactionId: { $in: ids } }),
          OcppLogModel.deleteMany({ transactionUuid: { $in: ids } }),
          OcppMeterValueLogModel.deleteMany({ transactionUuid: { $in: ids } }),
          OcppTransactionLogModel.deleteMany({ transactionUuid: { $in: ids } }),
          PreauthCompleteLogsModel.deleteMany({ transactionId: { $in: ids } }),
          PreauthLogsModel.deleteMany({ transactionId: { $in: ids } }),
          TransactionErrorLogsModel.deleteMany({ transactionId: { $in: ids } }),
        ]);
      }
    }
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error:", error);
    console.log("🚀 -----------------🚀");
  }

  return res.status(200).json({ message: "ok.." });
};

const deleteCpo = async (req, res) => {
  try {
    const cpoId = req.params.cpoId;

    const cpo = await CpoRepository.find({
      where: {
        id: cpoId,
        // id: In([
        //   "90e98680-dfd5-4119-9ba0-d48f6f7d3a63",
        //   "4c03da51-6221-419e-a00e-97c59f51c64e",
        // ]),
      },
    });
    let cpoIds = cpo.map(({ id }) => id);

    const runRaw = false;
    // const runRaw = true;
    if (runRaw) {
      const cpos = await CpoRepository.find({
        where: {
          id: In([
            "90e98680-dfd5-4119-9ba0-d48f6f7d3a63",
            "4c03da51-6221-419e-a00e-97c59f51c64e",
          ]),
        },
      });

      cpoIds = cpos.map(({ id }) => id);
    }

    return res.status(200).json({ count: cpoIds?.length, cpoIds });

    if (cpoIds) {
      const cpoUsers = await CpoUserRepository.find({
        where: { cpoId: In(cpoIds) },
      });
      const cpoUserIds = cpoUsers.map(({ id }) => id);
      if (cpoUserIds) {
        await CpoUserCredentialRepository.delete({
          cpoUserId: In(cpoUserIds),
        });
      }

      const cpoSubscriptions = await CpoSubscriptionRepository.find({
        where: { cpoId: In(cpoIds) },
      });
      const cpoSubscriptionIds = cpoSubscriptions.map(({ id }) => id);
      if (cpoSubscriptionIds) {
        await CpoSubscriptionInvoiceRepository.delete({
          subscriptionId: In(cpoSubscriptionIds),
        });
      }

      const allocationRules = await AllocationRulesRepository.find({
        where: { cpoId: In(cpoIds) },
      });
      const allocationRuleIds = allocationRules.map(({ id }) => id);
      if (allocationRuleIds) {
        await AllocationPartnersRepository.delete({
          allocationRuleId: In(allocationRuleIds),
        });
      }

      const evseStations = await EvseStationRepository.find({
        where: { cpoId: In(cpoIds) },
      });
      const evseStationIds = evseStations.map(({ id }) => id);
      if (evseStationIds) {
        await Promise.all([
          ChargerExperienceFeedbackRepository.delete({
            evseStationId: In(evseStationIds),
          }),
          EvseStationRepository.delete({
            id: In(evseStationIds),
          }),

          AnalyticsModel.deleteMany({ evseStationId: { $in: evseStationIds } }),
          UtilizationRateModel.deleteMany({
            evseStationId: { $in: evseStationIds },
          }),
        ]);
      }

      await Promise.all([
        ChargerExperienceFeedbackRepository.delete({
          cpoId: In(cpoIds),
        }),
        CpoBaseRateRepository.delete({
          cpoId: In(cpoIds),
        }),
        CpoCardDetailsRepository.delete({
          cpoId: In(cpoIds),
        }),
        CpoPaymentAccountRepository.delete({
          cpoId: In(cpoIds),
        }),
        CpoSubscriptionRepository.delete({
          cpoId: In(cpoIds),
        }),
        CpoSubscriptionPurchaseRequestRepository.delete({
          cpoId: In(cpoIds),
        }),
        CpoUserRepository.delete({
          cpoId: In(cpoIds),
        }),
        CpoUserRoleRepository.delete({
          cpoId: In(cpoIds),
        }),
        CpoUserSessionRepository.delete({
          cpoId: In(cpoIds),
        }),
        AllocationRulesRepository.delete({
          cpoId: In(cpoIds),
        }),
        CpoRepository.delete({
          id: In(cpoIds),
        }),

        AnalyticsModel.deleteMany({ cpoId: { $in: cpoIds } }),
        NotificationModel.deleteMany({ cpoId: { $in: cpoIds } }),
      ]);

      const transactions = await OcppTransactionsRepository.find({
        where: { cpoId: In(cpoIds) },
      });

      const ids = transactions.map(({ transactionUuid }) => transactionUuid);

      if (ids) {
        await Promise.all([
          ChargingInvoiceRepository.delete({ transactionId: In(ids) }),
          PaymentTransactionsRepository.delete({ ocppTransactionId: In(ids) }),
          OcppTransactionsRepository.delete({ transactionUuid: In(ids) }),

          AutoCaptureLogsModel.deleteMany({ transactionId: { $in: ids } }),
          EmvDataAddLogsModel.deleteMany({ transactionId: { $in: ids } }),
          OcppLogModel.deleteMany({ transactionUuid: { $in: ids } }),
          OcppMeterValueLogModel.deleteMany({ transactionUuid: { $in: ids } }),
          OcppTransactionLogModel.deleteMany({ transactionUuid: { $in: ids } }),
          PreauthCompleteLogsModel.deleteMany({ transactionId: { $in: ids } }),
          PreauthLogsModel.deleteMany({ transactionId: { $in: ids } }),
          TransactionErrorLogsModel.deleteMany({ transactionId: { $in: ids } }),
        ]);
      }
    }
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error:", error);
    console.log("🚀 -----------------🚀");
  }

  return res.status(200).json({ message: "ok.." });
};

const deleteEvseStation = async (req, res) => {
  try {
    const evseStationId = req.params.evseStationId;

    const evseStations = await EvseStationRepository.find({
      where: { id: evseStationId },
    });
    let evseStationIds = evseStations.map(({ id }) => id);

    const runRaw = false;
    // const runRaw = true;
    if (runRaw) {
      const stations = await EvseStationRepository.find({
        where: {
          id: Not(
            In([
              "0a3a03a8-e998-4ee2-92d0-6bd0f68321d0",
              "0d6b215e-d0ff-4583-bf77-ab7d7d80e0e3",
              "25dcae81-7193-4aa0-b66b-7dd243eee4d6",
              "5df28ae3-a17d-475d-abe4-921a54ce2050",
              "873c5850-1a16-46a4-b41b-68642c96cdf4",
              "c5e724c6-228f-49a1-950e-05e038cdb5cd",
            ]),
          ),
          // isDeleted: 1,
        },
      });

      evseStationIds = stations.map(({ id }) => id);
    }

    return res
      .status(200)
      .json({ count: evseStationIds?.length, evseStationIds });

    if (evseStationIds) {
      await Promise.all([
        ChargerExperienceFeedbackRepository.delete({
          evseStationId: In(evseStationIds),
        }),
        EvseStationRepository.delete({
          id: In(evseStationIds),
        }),

        AnalyticsModel.deleteMany({ evseStationId: { $in: evseStationIds } }),
        UtilizationRateModel.deleteMany({
          evseStationId: { $in: evseStationIds },
        }),
      ]);
    }
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error:", error);
    console.log("🚀 -----------------🚀");
  }

  return res.status(200).json({ message: "ok.." });
};

const seedAppLanguage = async (req, res) => {
  try {
    const fs = require("fs");
    const path = require("path");

    // Read the app_lang.json file from project root
    let appLangPath = path.join(process.cwd(), "app_lang.json");
    console.log("🚀 -------------------------------🚀");
    console.log("🚀 ~ process.cwd():", process.cwd());
    console.log("🚀 ~ appLangPath:", appLangPath);
    console.log("🚀 ~ file exists:", fs.existsSync(appLangPath));
    console.log("🚀 -------------------------------🚀");

    // If file doesn't exist at current working directory, try relative path from this file
    if (!fs.existsSync(appLangPath)) {
      appLangPath = path.join(__dirname, "../../../../app_lang.json");
      console.log("🚀 ~ alternative appLangPath:", appLangPath);
      console.log("🚀 ~ alternative file exists:", fs.existsSync(appLangPath));
    }

    const appLangData = JSON.parse(fs.readFileSync(appLangPath, "utf8"));

    // Prepare data for insertion
    const languageData = Object.entries(appLangData).map(
      ([key, translations]) => ({
        langFor: "app",
        langKey: key,
        en: translations.en,
        fr: translations.fr,
        es: translations.es,
      }),
    );

    if (languageData?.length > 0) {
      await LanguageRepository.delete({ langFor: "app" });

      // Insert data into language table
      await LanguageRepository.save(languageData);
    }

    return res.status(200).json({
      message: "App language data seeded successfully",
    });
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.message:", error?.message);
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.name:", error?.name);
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error?.stack:", error?.stack);
    console.log("🚀 -----------------🚀");

    return res.status(500).json({ message: error?.message });
  }
};

const updateTransactions = async (model) => {
  try {
    const transactions = await model.find({});

    await model.bulkWrite(
      transactions.map((ct) => {
        let hasError = false;
        if (ct?.type == "Pre-Auth") {
          hasError =
            ct?.response?.transactionInfo?.paymentStatus != "authorized";
        } else {
          hasError = ct?.response?.transactionInfo?.paymentStatus != "success";
        }

        return {
          updateOne: {
            filter: { _id: ct?._id },
            update: { $set: { hasError } },
          },
        };
      }),
    );
  } catch (error) {
    console.log(error);
  }
  return true;
};

const getTransactionInvoice = async (req, res) => {
  // try {
  //   await Promise.all([
  //     updateTransactions(PreauthLogsModel),
  //     updateTransactions(EmvDataAddLogsModel),
  //     updateTransactions(PreauthCompleteLogsModel),
  //     updateTransactions(PreauthCancelLogsModel),
  //     updateTransactions(RefundLogsModel),
  //   ]);
  // } catch (error) {}

  try {
    const transactionId = req.params.transactionId;

    await generateTransactionInvoice(transactionId);

    // await TempInvoiceGenerateQueue.add({ transactionId }, { delay: 500 });
  } catch (error) {}

  return res.status(200).json({ message: "Invoice Generated.." });
};

const reCallPaymentApi = async (req, res) => {
  try {
    const transactionId = req.params.transactionId;
    const transactionData = await TransactionHistoryViewModel.findOne({
      _id: transactionId,
    }).lean();

    if (transactionData?.type) {
      let url = `${process.env.CORE_API_BASEURL}/payment/preauth`;

      if (transactionData?.type == "Pre-Auth") {
        url = `${process.env.CORE_API_BASEURL}/payment/preauth`;
      } else if (transactionData?.type == "Capture") {
        url = `${process.env.CORE_API_BASEURL}/payment/preauth-complete`;
      } else if (transactionData?.type == "Cancel") {
        url = `${process.env.CORE_API_BASEURL}/payment/preauth-cancel`;
      } else if (transactionData?.type == "Refund") {
        url = `${process.env.CORE_API_BASEURL}/payment/refund`;
      } else if (transactionData?.type == "Purchase") {
        url = `${process.env.CORE_API_BASEURL}/payment/preauth`;
      }

      const transReq = transactionData?.request;

      const paymentPayload = {
        $schema: transReq?.$schema,
        id: transReq?.id,
        title: transReq?.title,
        paymentProvider: transReq?.paymentProvider,
        cardInfo: transReq?.cardInfo,
        chargerInfo: transReq?.chargerInfo,
        sessionInfo: transReq?.sessionInfo,
      };

      const { data: paymentResponse } = await axios.post(url, paymentPayload);
      return res.status(200).json({ paymentResponse });
    }
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error:", error);
    console.log("🚀 -----------------🚀");
  }

  return res.status(200).json({ message: "Got Error.." });
};

const getIpDetails = async (req, res) => {
  const geoLocation = await getIpData(req);
  // 122.171.139.133
  let ipAddress;
  if (!req) {
    return null;
  }
  ipAddress = req.headers["x-forwarded-for"] || req.ip;

  return res.status(200).json({ geoLocation, ipAddress });
};

const syncEmspRatesToStation = async (req, res) => {
  const stations = await EvseStationRepository.find({});
  let emspIds = [];
  const emspCountryData = {};

  if (stations.length > 0) {
    const stationCountries = stations.map((s) => s.country);
    const uniqueCountries = [...new Set(stationCountries)];

    const emspUser = await EMspUserRepository.find({
      where: {
        isDeleted: false,
        isEmsp: true,
        apexEmailVerified: true,
        country: In(uniqueCountries),
      },
    });

    emspIds = emspUser.map(({ emspId }) => emspId);

    if (emspIds.length > 0) {
      const paymentConfig = await EMspPaymentConfigRepository.find({
        where: { emspId: In(emspIds) },
      });

      const paymentConfigData = arrayObjStr(paymentConfig, "emspId");

      for (const key of emspUser) {
        const tData = paymentConfigData[key.emspId] ?? {};
        if (tData?.baseRate) {
          await EvseStationRepository.update(
            {
              country: key.country,
              id: Not("5df28ae3-a17d-475d-abe4-921a54ce2050"),
            },
            {
              baseRate: tData?.baseRate,
              electricityGridRate: tData?.electricityGridRate,
              taxRate: tData?.grossMargin,
            },
          );
        }

        emspCountryData[key.country] = {
          baseRate: tData?.baseRate,
          electricityGridRate: tData?.electricityGridRate,
          taxRate: tData?.grossMargin,
        };
      }

      return res.status(200).json({ emspCountryData });
    }
  }

  return res.status(200).json({ result: "NO" });
};

const syncRevenue = async (req, res) => {
  if (false) {
    const contractChargers = await ContractChargerViewRepository.find({});

    const contractData = contractChargers.map((ct) => {
      const validFrom = DateTime.fromJSDate(ct.validFrom, { zone: "UTC" });
      const validTo = DateTime.fromJSDate(ct.validTo, { zone: "UTC" });

      const start = validFrom.startOf("day").toJSDate({ zone: "UTC" });
      const end = validTo.endOf("day").toJSDate({ zone: "UTC" });

      return {
        contractId: ct.contractId,
        where: {
          createdAt: Between(start, end),
          chargeBoxId: ct.chargeBoxId,
        },
      };
    });

    if (contractData?.length > 0) {
      for (const cData of contractData) {
        await OcppTransactionsRepository.update(cData.where, {
          contractId: cData.contractId,
        });
      }
    }
  }

  // =====================================================

  const result = await TransactionHistoryViewModel.aggregate([
    {
      $match: {
        "response.transactionInfo.paymentStatus": {
          $in: ["success", "authorized"],
        },
        type: { $in: ["Capture", "Purchase"] },
      },
    },
    {
      $project: {
        _id: 0,
        paymentStatus: "$response.transactionInfo.paymentStatus",
        amount: "$response.transactionInfo.amount",
        sessionId: "$response.transactionInfo.sessionId",
        chargeBoxId: "$request.chargerInfo.chargeboxId",
      },
    },
  ]);

  const sessionIds = result.map((r) => r.sessionId);
  const chargeBoxIds = result.map((r) => r.chargeBoxId);

  let [paymentTransactions, ocppTransactions, chargers] = await Promise.all([
    PaymentTransactionsRepository.find({
      where: { ocppTransactionId: In(sessionIds) },
    }),
    OcppTransactionsRepository.find({
      where: { transactionUuid: In(sessionIds) },
    }),
    ChargerViewRepository.find({
      where: { chargeBoxId: In(chargeBoxIds) },
    }),
  ]);

  let contractIds = ocppTransactions.map(({ contractId }) => contractId);
  contractIds = [...new Set([...contractIds].filter((id) => id != null))];

  paymentTransactions = arrayObjStr(paymentTransactions, "ocppTransactionId");
  ocppTransactions = arrayObjStr(ocppTransactions, "transactionUuid");
  chargers = arrayObjStr(chargers, "chargeBoxId");

  let contractPartners = {};
  if (contractIds.length > 0) {
    contractPartners = await ContractPartnersRepository.find({
      where: { contractId: In(contractIds) },
    });

    contractPartners = arrayObjArr(contractPartners, "contractId");
  }

  let insertData = [];
  for (const r of result) {
    const paymentTransactionData = paymentTransactions[r.sessionId];
    const ocppTransactionData = ocppTransactions[r.sessionId];
    const tmpCharger = chargers[r.chargeBoxId];

    if (paymentTransactionData && ocppTransactionData && tmpCharger) {
      const totalAmount = parseFloat(r.amount);
      const partnerAmounts = {
        cpoId: null,
        cpoSplitPercentage: null,
        cpoAmount: null,
        siteHostId: null,
        siteHostSplitPercentage: null,
        siteHostAmount: null,
        investorAmounts: [],
        investor1Id: null,
        investor1SplitPercentage: null,
        investor1Amount: null,
        investor2Id: null,
        investor2SplitPercentage: null,
        investor2Amount: null,
      };

      if (ocppTransactionData?.contractId) {
        const partners =
          contractPartners[ocppTransactionData?.contractId] || [];

        if (partners?.length > 0) {
          let calcAmounts = [];
          let sum = 0;

          // first calculate raw & rounded
          for (const cp of partners) {
            const raw = totalAmount * (parseFloat(cp.splitPercentage) / 100);
            const rounded = parseFloat(raw).toFixed(2);
            calcAmounts.push({ cp, raw, rounded });
            sum += rounded;
          }

          // fix rounding diff on last partner
          const diff = parseFloat(totalAmount - sum).toFixed(2);
          if (calcAmounts.length > 0) {
            calcAmounts[calcAmounts.length - 1].rounded = parseFloat(
              calcAmounts[calcAmounts.length - 1].rounded + diff,
            ).toFixed(2);
          }

          for (const { cp, rounded } of calcAmounts) {
            if (cp.partnerType === "CPO") {
              partnerAmounts.cpoId = cp.partnerId;
              partnerAmounts.cpoSplitPercentage = cp.splitPercentage;
              partnerAmounts.cpoAmount = rounded;
            } else if (cp.partnerType === "SITE HOST") {
              partnerAmounts.siteHostId = cp.partnerId;
              partnerAmounts.siteHostSplitPercentage = cp.splitPercentage;
              partnerAmounts.siteHostAmount = rounded;
            } else if (cp.partnerType === "INVESTOR") {
              if (!partnerAmounts.investor1Id) {
                partnerAmounts.investor1Id = cp.partnerId;
                partnerAmounts.investor1SplitPercentage = cp.splitPercentage;
                partnerAmounts.investor1Amount = rounded;
              } else if (!partnerAmounts.investor2Id) {
                partnerAmounts.investor2Id = cp.partnerId;
                partnerAmounts.investor2SplitPercentage = cp.splitPercentage;
                partnerAmounts.investor2Amount = rounded;
              }

              partnerAmounts.investorAmounts.push({
                partnerId: cp.partnerId,
                amount: rounded,
                splitPercentage: cp.splitPercentage,
              });
            }
          }
        }
      }

      const dta = {
        ocppTransactionId: paymentTransactionData?.ocppTransactionId,
        chargerId: tmpCharger?.id,
        orderId: ocppTransactionData?.orderId,
        evseStationId: ocppTransactionData?.evseStationId,
        chargeBoxId: ocppTransactionData?.chargeBoxId,
        paymentProvider: paymentTransactionData?.paymentProvider,
        timezone: paymentTransactionData?.timezone,
        country: paymentTransactionData?.country,
        dateTime: paymentTransactionData?.dateTime,
        dateTimeLocal: paymentTransactionData?.dateTimeLocal,
        amount: totalAmount ?? 0,
        refundAmount: 0,
        totalAmount: totalAmount ?? 0,
        taxAmount: ocppTransactionData?.tax ?? 0,
        effectiveEnergyConsumed:
          ocppTransactionData?.effectiveEnergyConsumed ?? 0,
        chargingDuration: ocppTransactionData?.chargingDuration ?? 0,
        avgChargingRate: ocppTransactionData?.avgChargingRate ?? 0,
        isTestTransaction: ocppTransactionData?.isTestTransaction,
        purchaseOnly: ocppTransactionData?.purchaseOnly,
        contractId: ocppTransactionData?.contractId,
        ...partnerAmounts,
        isSettled: false,
        currency: ocppTransactionData?.currency,
        currencyName: ocppTransactionData?.currencyName,
        currencySymbol: ocppTransactionData?.currencySymbol,
        createdAt: ocppTransactionData?.createdAt,
        createdAtLocal: ocppTransactionData?.createdAtLocal,
      };

      insertData.push(dta);
    }
  }

  if (insertData?.length > 0) {
    insertData = arrayChunk(insertData, 100);
    await ChargerRevenueRepository.delete({});

    for (const chunk of insertData) {
      await ChargerRevenueRepository.insert(chunk);
    }
  }

  return res.status(200).json({ result: result?.length });
};

const copyCollection = async (SourceModel, TargetModel) => {
  const cursor = SourceModel.find().lean().cursor();

  const batchSize = 2000;
  let batch = [];
  let copied = 0;

  for await (const doc of cursor) {
    let transformedDoc = {
      ...doc,
      ocppSchemaRaw: doc?.ocppSchema ? JSON.stringify(doc?.ocppSchema) : null,
      responseDataRaw: doc?.responseData
        ? JSON.stringify(doc?.responseData)
        : null,
      errorRaw: doc?.error ? JSON.stringify(doc?.error) : null,
    };

    batch.push({
      updateOne: {
        filter: { _id: doc._id },
        update: transformedDoc,
        upsert: true,
      },
    });

    if (batch.length >= batchSize) {
      await TargetModel.bulkWrite(batch, { timestamps: false });
      copied += batch.length;
      console.log(`Copied ${copied} from ${SourceModel.modelName}`);
      batch = [];
    }
  }

  if (batch.length) {
    await TargetModel.bulkWrite(batch, { timestamps: false });
    copied += batch.length;
    console.log(`Copied ${copied} from ${SourceModel.modelName}`);
  }

  console.log(
    `✔ Completed syncing ${SourceModel.modelName} → Total: ${copied}`,
  );
};

const syncOcppLogs = async (req, res) => {
  try {
    const sources = [
      OcppLogModel,
      OcppMeterValueLogModel,
      OcppTransactionLogModel,
      OcppBootNotificationLogModel,
      OcppHeartbeatLogModel,
    ];

    for (const sourceModel of sources) {
      await copyCollection(sourceModel, OcppAllLogModel);
    }

    console.log("🔥 All OCPP logs synced successfully!");
    return res.status(200).json({ message: "Logs are synced.." });
  } catch (error) {
    console.error("❌ Sync failed:", error);
    return res.status(400).json({ message: "Got error" });
  }
};

const syncTransactionContract = async (req, res) => {
  const contractChargers = await ContractChargerViewRepository.find({});

  const contractData = contractChargers.map((ct) => {
    const validFrom = DateTime.fromJSDate(ct.validFrom, { zone: "UTC" });
    const validTo = DateTime.fromJSDate(ct.validTo, { zone: "UTC" });

    const start = validFrom.startOf("day").toJSDate({ zone: "UTC" });
    const end = validTo.endOf("day").toJSDate({ zone: "UTC" });

    return {
      contractId: ct.contractId,
      where: {
        createdAt: Between(start, end),
        chargeBoxId: ct.chargeBoxId,
      },
    };
  });

  if (contractData?.length > 0) {
    for (const cData of contractData) {
      await OcppTransactionsRepository.update(cData.where, {
        contractId: cData.contractId,
      });
    }
  }

  return res.status(200).json({ ok: true });
};

const viewTransactionLog = async (req, res) => {
  const transactionId = req.params.transactionId;

  const abc = await OcppAllLogModel.find({
    transactionUuid: transactionId,
    eventName: { $in: ["DataTransfer", "MeterValues"] },
  });

  const data = abc.map((a) => {
    const returnData = {
      eventName: a.eventName,
      dateTime: a.createdAt,
    };

    if (a.eventName == "MeterValues") {
      returnData["value"] = a?.ocppSchema?.meterValue[0]?.sampledValue[2].value;
    } else {
      if (a?.ocppSchema?.parsedData?.effectiveBaseRate) {
        returnData["value"] = {
          effectiveBaseRate: a?.ocppSchema?.parsedData?.effectiveBaseRate,
          chargingDuration: a?.ocppSchema?.parsedData?.chargingDuration,
          effectiveEnergyConsumed:
            a?.ocppSchema?.parsedData?.effectiveEnergyConsumed,
          offPeakCharges: a?.ocppSchema?.parsedData?.offPeakCharges,
          grossAmount: a?.ocppSchema?.parsedData?.grossAmount,
          netAmount: a?.ocppSchema?.parsedData?.netAmount,
        };
      } else {
        returnData["value"] = a?.ocppSchema?.messageId;
      }
    }

    return returnData;
  });

  return res.status(200).json({ data });
};

const testPusherMsg = async (req, res) => {
  const { channelName, eventName, data } = req.body;

  const returnData = await sendDataToPusher({
    channelName,
    eventName,
    data,
  });

  return res.status(200).json(returnData);
};

module.exports = {
  deleteCancelledTransactions,
  updateMeterValues,
  dateTest,
  reGenerateInvoice,
  reCalculateAndGenerateInvoice,
  checkStorage,
  checkEmail,
  deleteCharger,
  deleteCpo,
  deleteEvseStation,
  seedAppLanguage,
  getTransactionInvoice,
  getIpDetails,
  testPusherMsg,
  reCallPaymentApi,
  syncEmspRatesToStation,
  syncRevenue,
  syncSettlement,
  onboardCharger,
  hardDeleteContracts,
  syncTransactionContract,
  viewTransactionLog,
  syncOcppLogs,
  syncCountryIso3,
};
