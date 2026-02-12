const {
  ChargerConnectorTypeRepository,
  PartnerRepository,
  EvseStationRepository,
  ChargerRepository,
  ChargerPaymentConfigRepository,
  ChargerMeteringConfigRepository,
  ChargerCardRepository,
  ChargerOcppConfigRepository,
  ChargerLocalAuthorizationRepository,
} = require("@shared-libs/db/mysql");
const {
  getChargerByIdentity,
  convertObjectValuesToString,
  getRawCardUid,
  getChargerDetailsData,
  getIpData,
  convertDateTimezone,
  sendOcppEvent,
} = require("@shared-libs/helpers");
const {
  ChargerStatuses,
  ExpireTimeConstants,
  OcppEvents,
} = require("@shared-libs/constants");
const { DateTime } = require("luxon");
const {
  OcppGetConfigurationQueue,
  OcppSendLocalListQueue,
} = require("@shared-libs/queues");
const { ChargerConfigurationModel } = require("@shared-libs/db/mongo-db");
const {
  changeConfigurationByChargeBoxId,
} = require("@shared-libs/helpers");

const setChargerConfigurations = async (req, res) => {
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
  const {
    connectorTypeId,
    paymentModule,
    wiringType,
    typicalVoltage,
    maxCurrentLimitPerPhase,
    partnerId,
    evseStationId,
    cards,
  } = req?.body;
  const { paymentProvider, paymentManufacturerId, paymentDeviceId } =
    req.body?.paymentConfig;

  // validate the input ids
  const connectorType = await ChargerConnectorTypeRepository.findOne({
    where: { id: connectorTypeId },
    select: ["id"],
  });
  if (!connectorType) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Connector-Type Id",
      })
    );
  }

  const partner = await PartnerRepository.findOne({
    where: { userId: partnerId },
    select: ["id"],
  });
  if (!partner) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Partner Id",
      })
    );
  }

  const evseStation = await EvseStationRepository.findOne({
    where: { id: evseStationId },
  });
  if (!evseStation) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Evse-Station Id",
      })
    );
  }

  const { lat, lng, country, timezone } = evseStation;

  const chargerUpdatePayload = {
    connectorTypeId,
    evseStationId,
    partnerId,
    paymentModule,
    status: ChargerStatuses.ACTIVATED,
    isConfigured: true,
    activationDate: DateTime.utc().toISO(),
    activationDateLocal: convertDateTimezone(DateTime.utc(), timezone ?? "UTC"),
    validTill: DateTime.utc()
      .plus({ year: ExpireTimeConstants.CHARGER_VALID_TILL })
      .toISO(),
    validTillLocal: convertDateTimezone(
      DateTime.utc().plus({ year: ExpireTimeConstants.CHARGER_VALID_TILL }),
      timezone ?? "UTC"
    ),
    lat,
    lng,
    country,
    timezone,
  };
  const paymentUpdatePayload = {
    paymentProvider,
    paymentMfgId: paymentManufacturerId,
    paymentDeviceId,
  };
  const meteringConfigPayload = {
    wiringType,
    typicalVoltage,
    maxCurrentLimitPerPhase,
  };

  await ChargerRepository.update({ id: charger.id }, chargerUpdatePayload);

  const paymentConfig = await ChargerPaymentConfigRepository.findOne({
    where: { chargerId: charger.id },
  });
  if (!paymentConfig) {
    await ChargerPaymentConfigRepository.save({
      chargerId: charger.id,
      chargeBoxId: charger.chargeBoxId,
      ...paymentUpdatePayload,
    });
  } else {
    await ChargerPaymentConfigRepository.update(
      { chargerId: charger.id },
      paymentUpdatePayload
    );
  }

  const meteringConfig = await ChargerMeteringConfigRepository.findOne({
    where: { chargerId: charger.id },
  });
  if (!meteringConfig) {
    await ChargerMeteringConfigRepository.save({
      chargerId: charger.id,
      ...meteringConfigPayload,
    });
  } else {
    await ChargerMeteringConfigRepository.update(
      { chargerId: charger.id },
      meteringConfigPayload
    );
  }

  if (cards && Array.isArray(cards) && cards.length > 0) {
    for (const card of cards) {
      const { cardUid, cardLabel, expiryDate, expiryTime } = card;
      const cardUidRaw = getRawCardUid(cardUid);

      let combinedExpiryDate = expiryDate;
      if (expiryDate && expiryTime) {
        combinedExpiryDate = `${expiryDate} ${expiryTime}`;
      }

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
            message: "This cardUid is already in use.",
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
        expiryDate: combinedExpiryDate,
        expiryTimeRaw: expiryTime,
      });
    }
  }

  const chargerDetails = await getChargerDetailsData(charger.id, false, "min");

  const response = await setAndUpdateChargerConfigurations(chargerDetails);

  return res.status(200).json({
    ...chargerDetails,
  });
};

const setAndUpdateChargerConfigurations = async (chargerDetails) => {
  try {
    // now map all the keys into cnx objects
    const charger = await ChargerRepository.findOne({
      where: { chargeBoxId: chargerDetails?.chargeBoxId },
      select: ["id", "status"]
    },);

    if (!charger) {
      throw new Error(`Charger not found with chargeBoxId: ${chargerDetails?.chargeBoxId}`);
    }

    const cnx_meteringConfig = chargerDetails?.meteringConfig;
    const cnx_ocppConfig = chargerDetails?.ocppConfig;
    const cnx_paymentConfig = chargerDetails?.paymentConfig;
    const cnx_evseStation = chargerDetails?.evseStation;
    const cnx_ChargerInfo = {
      chargeBoxId: chargerDetails?.chargeBoxId,
      serialNumber: chargerDetails?.serialNumber,
      vendor: chargerDetails?.vendor,
      chargerModel: chargerDetails?.chargerModel,
      chargerConnectorType: chargerDetails?.chargerConnectorType || ""
    }


    const configsToSave = [
      { key: "cnx_meteringConfig", value: cnx_meteringConfig },
      { key: "cnx_ocppConfig", value: cnx_ocppConfig },
      { key: "cnx_paymentConfig", value: cnx_paymentConfig },
      { key: "cnx_evseStation", value: cnx_evseStation },
      { key: "cnx_ChargerInfo", value: cnx_ChargerInfo },
    ];

    for (const config of configsToSave) {
      if (config.value) {
        try {
          const valueString = JSON.stringify({
            json_flag: "TRUE",
            ...config.value,
          });

          const existingConfig = await ChargerConfigurationModel.findOne({
            chargeBoxId: chargerDetails?.chargeBoxId,
            key: config.key,
          });

          if (existingConfig) {
            await ChargerConfigurationModel.updateOne(
              { key: config.key, chargeBoxId: chargerDetails?.chargeBoxId },
              { value: valueString }
            );
          } else {
            await ChargerConfigurationModel.create({
              chargeBoxId: chargerDetails?.chargeBoxId,
              key: config.key,
              value: valueString,
              isJson: true,
              readonly: false,
            });
          }
        } catch (configError) {
          console.error(`Error saving configuration ${config.key}:`, configError);
        }
      }
    }

    const ocppSchema = {
      requestedMessage: OcppEvents.StatusNotification,
      connectorId: 1,
    };

    // now check if the charger is available or not by executing StatusNotification command
    let response;
    try {
      response = await sendOcppEvent(
        chargerDetails.chargeBoxId,
        OcppEvents.TriggerMessage,
        ocppSchema
      );
    } catch (ocppError) {
      console.error(`Error sending OCPP TriggerMessage:`, ocppError);
      response = { code: 500, message: { status: "Failed" } };
    }

    const lastUpdateDate = DateTime.now().toJSDate();

    if(response.code == 200 && response.message?.status == "Accepted"){
      try {
        const result = await changeConfigurationByChargeBoxId(chargerDetails.chargeBoxId, configsToSave);
        
        if (result.success && result.successConfigs > 0) {
          await OcppGetConfigurationQueue.add(
            { clientId: chargerDetails.chargeBoxId, connectorId: 1 },
            { delay: 3000 }
          );
        }
      } catch (changeConfigError) {
        console.error(`Error in changeConfigurationByChargeBoxId:`, changeConfigError);
        await ChargerOcppConfigRepository.update({
          chargerId: charger.id
        },{
          lastConfigUpdatedAt: lastUpdateDate,
          lastConfigSentAt: null
        });
      }
    }else{
      await ChargerOcppConfigRepository.update({
        chargerId: charger.id
      },{
        lastConfigUpdatedAt: lastUpdateDate,
        lastConfigSentAt: null
      });
    }
  } catch (error) {
    console.error("Error in setAndUpdateChargerConfigurations:", error);
    throw error;
  }
};



const setAndUpdateLocalAuthorizationList = async (req, res) => {
  try {
    const { chargeBoxId } = req.params;
    const { idTags, updateType = "Full" } = req.body;

    if (!chargeBoxId) {
      return res.status(400).json(
        convertObjectValuesToString({
          success: false,
          message: "Invalid chargeBoxId",
        })
      );
    }

    if (!idTags || !Array.isArray(idTags) || idTags.length === 0) {
      return res.status(400).json(
        convertObjectValuesToString({
          success: false,
          message: "idTags array is required and must not be empty",
        })
      );
    }

    if (!["Full", "Differential"].includes(updateType)) {
      return res.status(400).json(
        convertObjectValuesToString({
          success: false,
          message: "updateType must be either 'Full' or 'Differential'",
        })
      );
    }

    const charger = await getChargerByIdentity(chargeBoxId);
    if (!charger) {
      return res.status(400).json(
        convertObjectValuesToString({
          success: false,
          message: "Charger not found with the provided chargeBoxId",
        })
      );
    }

    const existingLists = await ChargerLocalAuthorizationRepository.find({
      where: { chargeBoxId },
      order: { listVersion: "DESC" },
      take: 1,
    });

    let newListVersion = 1;
    if (existingLists && existingLists.length > 0) {
      newListVersion = existingLists[0].listVersion + 1;
    }

    if (updateType === "Full") {
      await ChargerLocalAuthorizationRepository.delete({ chargeBoxId });
    }

    const authListEntries = [];
    for (const idTagData of idTags) {
      const {
        idTag,
        status = "Accepted",
        expiryDate = null,
        parentIdTag = null,
      } = idTagData;

      if (!idTag) {
        return res.status(400).json(
          convertObjectValuesToString({
            success: false,
            message: "Each idTag entry must have an 'idTag' field",
          })
        );
      }

      if (!["Accepted", "Blocked", "Expired", "Invalid", "ConcurrentTx"].includes(status)) {
        return res.status(400).json(
          convertObjectValuesToString({
            success: false,
            message: `Invalid status '${status}' for idTag '${idTag}'`,
          })
        );
      }

      authListEntries.push({
        chargeBoxId,
        listVersion: newListVersion,
        idTag,
        status,
        expiryDate: expiryDate || null,
        parentIdTag,
        updateType,
      });
    }

    await ChargerLocalAuthorizationRepository.save(authListEntries);

    const localAuthorizationList = authListEntries.map((entry) => {
      const authItem = {
        idTag: entry.idTag,
        idTagInfo: {
          status: entry.status,
        },
      };

      if (entry.expiryDate) {
        authItem.idTagInfo.expiryDate = entry.expiryDate;
      }

      if (entry.parentIdTag) {
        authItem.idTagInfo.parentIdTag = entry.parentIdTag;
      }

      return authItem;
    });

    const ocppPayload = {
      listVersion: newListVersion,
      updateType,
      localAuthorizationList,
    };

    let ocppResponse = null;
    let isChargerOnline = false;

    try {
      ocppResponse = await sendOcppEvent(
        chargeBoxId,
        OcppEvents.SendLocalList,
        ocppPayload
      );

      if (ocppResponse.code === 200 && ocppResponse.message?.status === "Accepted") {
        isChargerOnline = true;
      }
    } catch (error) {
      console.error(`Error sending SendLocalList to charger ${chargeBoxId}:`, error);
    }

    // if (!isChargerOnline) {
    //   await OcppSendLocalListQueue.add(
    //     {
    //       chargeBoxId,
    //       listVersion: newListVersion,
    //       updateType,
    //       localAuthorizationList,
    //     },
    //     { delay: 5000 }
    //   );
    // }

    return res.status(200).json(
      convertObjectValuesToString({
        success: true,
        message: isChargerOnline
          ? "Local authorization list updated and sent to charger successfully"
          : "Local authorization list updated. Will be sent when charger comes online",
        data: {
          chargeBoxId,
          listVersion: newListVersion,
          updateType,
          totalIdTags: authListEntries.length,
          chargerOnline: isChargerOnline,
          ocppResponse: ocppResponse?.message || null,
        },
      })
    );
  } catch (error) {
    console.error("Error in setAndUpdateLocalAuthorizationList:", error);
    return res.status(500).json(
      convertObjectValuesToString({
        success: false,
        message: error.message || "Internal server error",
      })
    );
  }
};

module.exports = {
  setChargerConfigurations,
  setAndUpdateLocalAuthorizationList,
};
