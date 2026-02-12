const { ConfigConstantsRepository } = require("@shared-libs/db/mysql");

const SeedConfigConstants = async () => {
  try {
    // Check if there are existing records
    const configConstantsData = await ConfigConstantsRepository.find();

    if (configConstantsData.length === 0) {
      const configConstants = [
        {
          key: "voltCheckVersion",
          value: "1.0.0",
        },
        {
          key: "scanTimeout",
          value: "15",
        },
        {
          key: "deviceAgentVersion",
          value: "1.0.0",
        },
        {
          key: "csmsHttpURL",
          value: "http://csms.chargnex.com/",
        },
        {
          key: "offPeakEndTime",
          value: "11:30:00 PM",
        },
        {
          key: "energyLoss",
          value: "5",
        },
        {
          key: "chargerVariant",
          value: "P1",
        },
        {
          key: "csmsWsURL",
          value: "ws://ocpp.chargnex.com:3002/",
        },
        {
          key: "csmsHttpsURL",
          value: "https://csms.chargnex.com/",
        },
        {
          key: "chargerBatchCode",
          value: "00",
        },
        {
          key: "maxDistanceForNearByChargers",
          value: "50",
        },
        {
          key: "defaultAnalyticsDuration",
          value: "6",
        },
        {
          key: "offPeakStartTime",
          value: "09:00:00 PM",
        },
        {
          key: "peakStartTime",
          value: "09:00:00 AM",
        },
        {
          key: "underVoltageLimitPerPhase",
          value: "190",
        },
        {
          key: "overVoltageLimitPerPhase",
          value: "270",
        },
        {
          key: "chargerPaymentModule",
          value: "ECR",
        },
        {
          key: "emModelName",
          value: "EM_SDM630_MB_1.0.json",
        },
        {
          key: "paymentProvider",
          value: "moneris",
        },
        {
          key: "underCurrentLimitPerPhase",
          value: "0.5",
        },
        {
          key: "ocppVersion",
          value: "1.6",
        },
        {
          key: "timeToFullCharge",
          value: "4.78",
        },
        {
          key: "standardThreshold",
          value: "4-10",
        },
        {
          key: "csmsURL",
          value: "https://csms.chargnex.com",
        },
        {
          key: "overCurrentLimitPerPhase",
          value: "32",
        },
        {
          key: "paymentDeviceId",
          value: "N0000012",
        },
        {
          key: "certificatePath",
          value: "",
        },
        {
          key: "offPeakRateMultiplier",
          value: "0.7",
        },
        {
          key: "chargerEnergyMeter",
          value: "80A",
        },
        {
          key: "maxCurrentLimitPerPhase",
          value: "30",
        },
        {
          key: "peakRateMultiplier",
          value: "1.3",
        },
        {
          key: "ocppURL",
          value: "wss://ocpp.chargnex.com",
        },
        {
          key: "noLoadTimeLimit",
          value: "15",
        },
        {
          key: "peakThreshold",
          value: "12",
        },
        {
          key: "maxDistanceBetweenChargerAndStation",
          value: "100",
        },
        {
          key: "wiringType",
          value: "3Phase",
        },
        {
          key: "batterySize",
          value: "55",
        },
        {
          key: "heartbeatIntervalSeconds",
          value: "15",
        },
        {
          key: "paymentGatewayURL",
          value: "https://csms.chargnex.com/payment",
        },
        {
          key: "manufacturerInitials",
          value: "CGX",
        },
        {
          key: "offpeakThreshold",
          value: "3",
        },
        {
          key: "heartbeatThreshold",
          value: "4",
        },
        {
          key: "serialNumberFormat",
          value: "0",
        },
        {
          key: "preAuthMultiplier",
          value: "4",
        },
        {
          key: "averageChargingRate",
          value: "11.5",
        },
        {
          key: "chargerModelPrime",
          value: "PRM",
        },
        {
          key: "chargerModelPrimeNew",
          value: "P1",
        },
        {
          key: "amperage",
          value: "80",
        },
        {
          key: "branchCode",
          value: "03A",
        },
        {
          key: "margin",
          value: "20",
        },
        {
          key: "peakEndTime",
          value: "11:30:00 AM",
        },
        {
          key: "chargerCapacity",
          value: "19.2",
        },
        {
          key: "paymentProvider",
          value: "moneris",
        },
        {
          key: "chargerAppVersion",
          value: "1.0.0",
        },
        {
          key: "csmsWssURL",
          value: "wss://ocpp.chargnex.com/",
        },
      ];

      await ConfigConstantsRepository.save(configConstants);
      console.log("Config Constants seeding done.");
    }
  } catch (error) {
    console.error("Error seeding Config Constants in database:", error);
  }
};

module.exports = { SeedConfigConstants };
