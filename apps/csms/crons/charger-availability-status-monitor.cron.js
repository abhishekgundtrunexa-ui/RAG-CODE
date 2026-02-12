const cron = require("node-cron");
const {
  OcppConstants,
  ChargerStatuses,
  ChargingStatuses,
} = require("@shared-libs/constants");
const { DateTime } = require("luxon");
const { ChargerRepository } = require("@shared-libs/db/mysql");
const { LessThan, In } = require("typeorm");
const { OcppLogModel } = require("@shared-libs/db/mongo-db");
const {
  formatDateString,
  sendChargerUpdatedPusherEvent,
} = require("@shared-libs/helpers");

const ChargerAvailabilityStatusMonitorCron = () => {
  cron.schedule("*/30 * * * * *", async () => {
    await monitorChargerAvailability();
  });
};

const monitorChargerAvailability = async () => {
  try {
    //calculate threshold for the charger status monitoring
    const currentTime = DateTime.utc(); //upper limit
    const threshold =
      OcppConstants.BOOT_NOTIFICATION_INTERVAL *
      OcppConstants.HEARTBEAT_THRESHOLD;
    // const thresholdTime = currentTime.minus({ seconds: threshold }); //lower limit
    const thresholdTime = currentTime.minus({ seconds: 300 }); //lower limit

    //find chargers based on the last heartbeat received
    const chargersToMakeOffline = await ChargerRepository.find({
      where: {
        lastHeartbeat: LessThan(thresholdTime.toJSDate()),
        status: In([ChargerStatuses.AVAILABLE, ChargerStatuses.BUSY]),
      },
    });

    const chargerIds = chargersToMakeOffline.map((charger) => charger.id);
    if (chargerIds?.length > 0) {
      // 1. Bulk Update Chargers
      await ChargerRepository.update(
        { id: In(chargerIds) },
        {
          status: ChargerStatuses.OFFLINE,
          chargingStatus: ChargingStatuses.UNAVAILABLE,
        }
      );

      // 2. Prepare Logs
      const nowUtc = DateTime.utc();
      const ocppLogs = chargersToMakeOffline.map((charger) => {
        const timezone = charger?.timezone || null;
        const formattedTime = timezone
          ? formatDateString(nowUtc, timezone)
          : null;

        return new OcppLogModel({
          transactionUuid: null,
          chargerTransactionId: null,
          connectorId: null,
          clientId: charger.chargeBoxId,
          eventName: "StatusNotification",
          ocppSchema: {
            connectorId: null,
            errorCode: "NoError",
            status: ChargerStatuses.OFFLINE,
            vendorId: charger.vendor,
            vendorErrorCode: "Offline",
          },
          requestFrom: "server",
          responseData: {},
          responseFrom: "server",
          error: null,
          dateByTimezone: formattedTime,
          country: charger?.country || null,
          timezone,
          createdAtLocal: formattedTime,
        });
      });

      // 3. Bulk Insert OCPP Logs
      if (ocppLogs.length) {
        await OcppLogModel.insertMany(ocppLogs);
      }

      // 4. Trigger Pusher Events in Parallel
      await Promise.allSettled(
        chargerIds.map((id) => sendChargerUpdatedPusherEvent(id))
      );
    }
  } catch (error) {
    console.log(
      "ChargerAvailabilityStatusMonitorCron Failed: ",
      error?.message
    );
  }
};

module.exports = {
  ChargerAvailabilityStatusMonitorCron,
  monitorChargerAvailability,
};
