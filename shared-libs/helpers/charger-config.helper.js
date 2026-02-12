const { ChargerRepository, ChargerOcppConfigRepository } = require("@shared-libs/db/mysql");
const { OcppEvents } = require("@shared-libs/constants");
const { DateTime } = require("luxon");

const changeConfigurationByChargeBoxId = async (chargeBoxId, configs) => {
  const { sendOcppEvent } = require("@shared-libs/helpers");
  try {
    const charger = await ChargerRepository.findOne({
      where: {
        chargeBoxId,
      },
      select: ["id", "status"]
    });

    if (!charger) {
      throw new Error(`Charger not found with chargeBoxId: ${chargeBoxId}`);
    }

    const lastUpdateDate = DateTime.now().toJSDate();
    let toTalConfigs = 0;
    let successConfigs = 0;
    for (const config of configs) {
      if (config.key?.startsWith("cnx_")) {
        const parsedValue = JSON.parse(config.value);
        const { json_flag, ...actualConfig } = parsedValue;
        toTalConfigs += Object.keys(actualConfig).length;
        for (const [key, value] of Object.entries(actualConfig)) {
          try {
            const changeResponse = await sendOcppEvent(
              chargeBoxId,
              OcppEvents.ChangeConfiguration,
              {
                key: key,
                value: String(value),
              }
            );

            const { code: changeHttp, message: ocppRes } = changeResponse;

            if (changeHttp !== 200 || ocppRes?.status !== "Accepted") {
              console.log(`❌ Failed to update configuration: ${key}`, JSON.stringify(ocppRes));
            } else {
              successConfigs++;
            }
          } catch (err) {
            console.error(`🚀 ~ Error updating configuration: ${key}`, err.message || err);
          }
        }
      } else {
        try {
          if (config.readonly) {
            continue;
          }

          const changeResponse = await sendOcppEvent(
            chargeBoxId,
            OcppEvents.ChangeConfiguration,
            {
              key: config.key,
              value: String(config.value),
            }
          );

          const { code: changeHttp, message: ocppRes } = changeResponse;

          if (changeHttp !== 200 || ocppRes?.status !== "Accepted") {
            console.log(`Failed to update configuration: ${config.key}`, ocppRes);
          }
        } catch (err) {
          console.error(`Error updating configuration: ${config.key}`, err);
        }
      }
    }

    if (successConfigs > 0) {
      await ChargerOcppConfigRepository.update({
        chargerId: charger.id
      }, {
        lastConfigUpdatedAt: lastUpdateDate,
        lastConfigSentAt: lastUpdateDate
      });
      
      return {
        success: true,
        successConfigs,
        chargeBoxId,
        chargerId: charger.id
      };
    }
    
    return {
      success: false,
      successConfigs: 0
    };
  } catch (error) {
    console.error("Error in changeConfigurationByChargeBoxId:", error);
    throw error;
  }
};



module.exports = {
  changeConfigurationByChargeBoxId
};
