const { In, Not } = require("typeorm");
const { DateTime } = require("luxon");
const {
  ChargerRepository,
  OtaUpdatesChargersRepository,
  OtaUpdatesRepository,
} = require("@shared-libs/db/mysql");
const { getConfigConstants, sendOcppEvent } = require("@shared-libs/helpers");
const { HandleMySqlList } = require("@shared-libs/db");
const { OcppEvents } = require("@shared-libs/constants");

const createRollout = async (req, res) => {
  try {
    const { name, description, fileUrl, updateType, updateDateTime, chargers } =
      req.body;
    let { filter } = req.query;
    filter = JSON.parse(filter)

    const existingOtaWithName = await OtaUpdatesRepository.findOne({
      where: { name },
      select: ["id"],
    });
    if (existingOtaWithName) {
      return res
        .status(400)
        .json({ message: "OTA Update with this name already exists" });
    }

    const chargersData = await ChargerRepository.find({
      where: { id: In(chargers) },
      select: ["id", "serialNumber", "evseStationId", "chargeBoxId"],
    });
    if (chargersData.length !== chargers.length) {
      return res.status(400).json({ message: "Invalid Charger List" });
    }

    // check if ota update is already in progress
    const pendingOtaUpdate = await OtaUpdatesChargersRepository.find({
      where: {
        chargerId: In(chargers),
        status: In(["Sent", "Downloaded", "Downloading", "Idle", "Installing"]),
      },
      select: ["id", "chargerId", "status", "otaUpdateId", "chargeBoxId"],
    });
    if (pendingOtaUpdate.length > 0) {
      return res.status(400).json({
        message: "OTA Update is already in progress for chargers",
        success: false,
        data: pendingOtaUpdate,
      });
    }

    const pendingCreatedOta = await OtaUpdatesChargersRepository.find({
      where: { chargerId: In(chargers), status: "Created" },
      select: ["id"],
    });
    if (pendingCreatedOta.length > 0) {
      // change the status of the pending ota update to skipped
      await OtaUpdatesChargersRepository.update(
        { id: In(pendingCreatedOta.map((item) => item.id)) },
        { status: "Skipped" }
      );
    }
    const retrieveDate = updateDateTime
      ? DateTime.fromISO(updateDateTime)
          .toUTC()
          .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
      : DateTime.now().toUTC().toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    const otaUpdate = OtaUpdatesRepository.create({
      name,
      description,
      fileUrl,
      updateType,
      updateDateTime: retrieveDate,
      totalChargers: chargers.length,
      country: filter?.country
    });
    const otaUpdateData = await OtaUpdatesRepository.save(otaUpdate);

    const otaUpdateChargers = chargersData.map((charger) => {
      return {
        otaUpdateId: otaUpdateData.id,
        chargerId: charger.id,
        chargeBoxId: charger.chargeBoxId,
        evseStationId: charger.evseStationId,
        country: filter?.country
      };
    });

    await OtaUpdatesChargersRepository.insert(otaUpdateChargers);

    const data = await getConfigConstants([
      "OTA_UPDATE_RETRIES",
      "OTA_UPDATE_RETRY_INTERVAL",
    ]);
    const retries = data.OTA_UPDATE_RETRIES || 3;
    const retryInterval = data.OTA_UPDATE_RETRY_INTERVAL || 60;

    const results = {
      successful: [],
      failed: [],
    };

    for (const charger of chargersData) {
      try {
        const response = await sendOcppEvent(charger.chargeBoxId, OcppEvents.UpdateFirmware, {
          location: fileUrl,
          retrieveDate: retrieveDate,
          retries: retries,
          retryInterval: retryInterval,
        });

        if(response.code == 200){
          await OtaUpdatesChargersRepository.update(
            { chargerId: charger.id, otaUpdateId: otaUpdateData.id },
            { status: "Sent" }
          );
          results.successful.push({
            chargeBoxId: charger.chargeBoxId,
            evseStationId: charger.evseStationId,
          });
        }else{
          results.failed.push({
          chargeBoxId: charger.chargeBoxId,
          evseStationId: charger.evseStationId,
          error: response.message,
        });
        }
      } catch (err) {
        console.error(
          `Failed to send OTA update to charger ${charger.chargeBoxId}:`,
          err.message
        );
        results.failed.push({
          chargeBoxId: charger.chargeBoxId,
          evseStationId: charger.evseStationId,
          error: err.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "OTA update rollout created",
      otaUpdateId: otaUpdateData.id,
      summary: {
        total: chargersData.length,
        successful: results.successful.length,
        pending: results.failed.length,
      },
      details: results,
    });
  } catch (error) {
    res.status(400).json({ message: error.message, success: false });
  }
};

const getOtaUpdatesList = async (req, res) => {
  try {
    const listParams = {
      entityName: "OtaUpdate",
      baseQuery: {},
      req,
    };

    const listResponse = await HandleMySqlList(listParams);

    const otaUpdateIds = listResponse.list.map((update) => update.id);
    let allChargers = [];

    if (otaUpdateIds.length > 0) {
      allChargers = await OtaUpdatesChargersRepository.find({
        where: { otaUpdateId: In(otaUpdateIds) },
      });
    }

    const chargersMap = allChargers.reduce((acc, charger) => {
      if (!acc[charger.otaUpdateId]) {
        acc[charger.otaUpdateId] = [];
      }
      acc[charger.otaUpdateId].push(charger);
      return acc;
    }, {});

    const enrichedUpdates = listResponse.list.map((update) => {
      const chargers = chargersMap[update.id] || [];

      const statistics = {
        total: chargers.length,
        created: chargers.filter((c) => c.status === "Created").length,
        sent: chargers.filter((c) => c.status === "Sent").length,
        downloading: chargers.filter((c) => c.status === "Downloading").length,
        downloaded: chargers.filter((c) => c.status === "Downloaded").length,
        installing: chargers.filter((c) => c.status === "Installing").length,
        installed: chargers.filter((c) => c.status === "Installed").length,
        downloadFailed: chargers.filter((c) => c.status === "DownloadFailed")
          .length,
        installationFailed: chargers.filter(
          (c) => c.status === "InstallationFailed"
        ).length,
        skipped: chargers.filter((c) => c.status === "Skipped").length,
        idle: chargers.filter((c) => c.status === "Idle").length,
      };

      const completionPercentage =
        statistics.total > 0
          ? ((statistics.installed / statistics.total) * 100).toFixed(2)
          : 0;

      return {
        ...update,
        statistics,
        completionPercentage: parseFloat(completionPercentage),
      };
    });

    listResponse.list = enrichedUpdates;

    return res.status(200).json(listResponse);
  } catch (error) {
    console.error("Error fetching OTA updates list:", error);
    res.status(500).json({ error: error.message });
  }
};

const getOtaUpdateById = async (req, res) => {
  try {
    const { id } = req.params;

    const otaUpdate = await OtaUpdatesRepository.findOne({
      where: { id },
    });

    if (!otaUpdate) {
      return res.status(404).json({
        success: false,
        error: "OTA Update not found",
      });
    }

    const chargers = await OtaUpdatesChargersRepository.find({
      where: { otaUpdateId: id },
    });

    const chargerIds = chargers.map((c) => c.chargerId);
    const chargerDetails = await ChargerRepository.find({
      where: { id: In(chargerIds) },
      select: [
        "id",
        "serialNumber",
        "chargeBoxId",
        "evseStationId",
        "status",
        "lastHeartbeat",
      ],
    });

    const enrichedChargers = chargers.map((otaCharger) => {
      const chargerInfo = chargerDetails.find(
        (c) => c.id === otaCharger.chargerId
      );
      return {
        id: otaCharger.id,
        chargerId: otaCharger.chargerId,
        chargeBoxId: otaCharger.chargeBoxId,
        evseStationId: otaCharger.evseStationId,
        updateStatus: otaCharger.status,
        serialNumber: chargerInfo?.serialNumber,
        chargerStatus: chargerInfo?.status,
        lastHeartbeat: chargerInfo?.lastHeartbeat,
        updatedAt: otaCharger.updatedAt,
      };
    });

    const statistics = {
      total: chargers.length,
      created: chargers.filter((c) => c.status === "Created").length,
      sent: chargers.filter((c) => c.status === "Sent").length,
      downloading: chargers.filter((c) => c.status === "Downloading").length,
      downloaded: chargers.filter((c) => c.status === "Downloaded").length,
      installing: chargers.filter((c) => c.status === "Installing").length,
      installed: chargers.filter((c) => c.status === "Installed").length,
      downloadFailed: chargers.filter((c) => c.status === "DownloadFailed")
        .length,
      installationFailed: chargers.filter(
        (c) => c.status === "InstallationFailed"
      ).length,
      skipped: chargers.filter((c) => c.status === "Skipped").length,
      idle: chargers.filter((c) => c.status === "Idle").length,
    };

    const completionPercentage =
      statistics.total > 0
        ? ((statistics.installed / statistics.total) * 100).toFixed(2)
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        ...otaUpdate,
        statistics,
        completionPercentage: parseFloat(completionPercentage),
        chargers: enrichedChargers,
      },
    });
  } catch (error) {
    console.error("Error fetching OTA update by ID:", error);
    res.status(500).json({ error: error.message });
  }
};

const getOtaUpdateChargerStatus = async (req, res) => {
  try {
    const { chargeBoxId } = req.params;

    const charger = await ChargerRepository.findOne({
      where: { chargeBoxId },
      select: ["id", "serialNumber", "chargeBoxId", "evseStationId"],
    });

    if (!charger) {
      return res.status(404).json({
        success: false,
        error: "Charger not found",
      });
    }

    const latestOtaCharger = await OtaUpdatesChargersRepository.findOne({
      where: { chargerId: charger.id },
      order: { createdAt: "DESC" },
    });

    if (!latestOtaCharger) {
      return res.status(200).json({
        success: true,
        data: {
          chargeBoxId,
          serialNumber: charger.serialNumber,
          hasActiveUpdate: false,
          message: "No OTA updates found for this charger",
        },
      });
    }

    const otaUpdate = await OtaUpdatesRepository.findOne({
      where: { id: latestOtaCharger.otaUpdateId },
    });

    return res.status(200).json({
      success: true,
      data: {
        chargeBoxId,
        serialNumber: charger.serialNumber,
        hasActiveUpdate: true,
        currentUpdate: {
          otaUpdateId: otaUpdate.id,
          name: otaUpdate.name,
          description: otaUpdate.description,
          fileUrl: otaUpdate.fileUrl,
          updateType: otaUpdate.updateType,
          updateDateTime: otaUpdate.updateDateTime,
          status: latestOtaCharger.status,
          updatedAt: latestOtaCharger.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching charger OTA status:", error);
    res.status(500).json({ error: error.message });
  }
};

const updateOtaUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, fileUrl, updateType, updateDateTime } = req.body;

    const otaUpdate = await OtaUpdatesRepository.findOne({ where: { id } });

    if (!otaUpdate) {
      return res.status(404).json({
        success: false,
        message: "OTA Update not found",
      });
    }

    const startedChargersCount = await OtaUpdatesChargersRepository.count({
      where: {
        otaUpdateId: id,
        status: Not(In(["Created", "Sent", "Skipped"])),
      },
    });

    if (startedChargersCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot update OTA rollout as it has already started",
      });
    }

    if (name && name !== otaUpdate.name) {
      const existingOtaWithName = await OtaUpdatesRepository.findOne({
        where: { name },
        select: ["id"],
      });
      if (existingOtaWithName) {
        return res
          .status(400)
          .json({ message: "OTA Update with this name already exists" });
      }
    }

    const retrieveDate = updateDateTime
      ? DateTime.fromISO(updateDateTime)
          .toUTC()
          .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
      : otaUpdate.updateDateTime;

    await OtaUpdatesRepository.update(
      { id },
      {
        name: name || otaUpdate.name,
        description: description || otaUpdate.description,
        fileUrl: fileUrl || otaUpdate.fileUrl,
        updateType: updateType || otaUpdate.updateType,
        updateDateTime: retrieveDate,
      }
    );

    const updatedOtaUpdate = await OtaUpdatesRepository.findOne({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "OTA Update updated successfully",
      data: updatedOtaUpdate,
    });
  } catch (error) {
    console.error("Error updating OTA update:", error);
    res.status(500).json({ error: error.message });
  }
};

const deleteOtaUpdate = async (req, res) => {
  try {
    const { id } = req.params;

    const otaUpdate = await OtaUpdatesRepository.findOne({ where: { id } });

    if (!otaUpdate) {
      return res.status(404).json({
        success: false,
        message: "OTA Update not found",
      });
    }

    const startedChargersCount = await OtaUpdatesChargersRepository.count({
      where: {
        otaUpdateId: id,
        status: Not(In(["Created", "Sent", "Skipped"])),
      },
    });

    if (startedChargersCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete OTA rollout as it has already started",
      });
    }

    // Delete associated charger records first
    await OtaUpdatesChargersRepository.delete({ otaUpdateId: id });

    // Delete the OTA update
    await OtaUpdatesRepository.delete({ id });

    return res.status(200).json({
      success: true,
      message: "OTA Update deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting OTA update:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createRollout,
  getOtaUpdatesList,
  getOtaUpdateById,
  getOtaUpdateChargerStatus,
  updateOtaUpdate,
  deleteOtaUpdate,
};
