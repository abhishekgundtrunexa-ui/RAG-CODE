const {
  EvseStationRepository,
  ChargerRepository,
  ContractEvseStationsRepository,
  ContractRepository,
  EMspRepository,
} = require("@shared-libs/db/mysql");
const { In } = require("typeorm");
const {
  customErrorMsg,
  PusherConstants,
  NotificationTypes,
} = require("@shared-libs/constants");
const {
  ObjectDAO,
  updateChargerLatLngByEvseStationId,
  getTrendsData,
  getAnalyticDataForDashboard,
  getEmspRatesByCountry,
} = require("@shared-libs/helpers");
const { HandleMySqlList } = require("@shared-libs/db");
const { saveNotification } = require("@shared-libs/notification");
const { sendDataToPusher } = require("@shared-libs/pusher");
const {
  getEvseStationCode,
  convertDateTimezone,
} = require("@shared-libs/helpers");
const { DateTime } = require("luxon");

const addEvseStation = async (req, res) => {
  try {
    const { name, address, city, state, areaCode, lat, lng, country, baseRate, electricityGridRate, taxRate, preAuthAmount } =
      req.body;

    const loggedInUserData = req["loggedInUserData"]["user"];
    const code = await getEvseStationCode(6);
    const rateData = await getEmspRatesByCountry(country);

    const createdEvseStation = await EvseStationRepository.save({
      code,
      name,
      address,
      city,
      state,
      areaCode,
      lat,
      lng,
      country,
      currency: rateData?.currency,
      currencyName: rateData?.currencyName,
      currencySymbol: rateData?.currencySymbol,
      baseRate,
      electricityGridRate,
      taxRate,
      preAuthAmount,
      createdBy: loggedInUserData.id,
    });

    await sendDataToPusher({
      channelName: PusherConstants.channels.PUSHER_NODE_APP,
      eventName: PusherConstants.events.evse.EVSE_UPDATED,
      data: { evseStationId: createdEvseStation.id },
    });

    await saveNotification({
      data: { evseStationId: createdEvseStation.id },
      type: NotificationTypes.EVSE_STATION_CREATED,
    });

    return res.status(201).json(createdEvseStation);
  } catch (error) {
    console.error("Error in addEvseStation:", error);
    res
      .status(500)
      .json({ message: "An Error Occurred While Adding The EVSE station" });
  }
};

const getEvseStation = async (evseStationId) => {
  try {
    const station = await EvseStationRepository.findOne({
      where: {
        id: evseStationId,
        isDeleted: false,
      },
    });

    if (!station) {
      return {
        code: 404,
        data: { message: customErrorMsg.station.EVSE_STATION_NOT_FOUND },
      };
    }

    return {
      code: 200,
      data: ObjectDAO(station),
    };
  } catch (error) {
    console.error("Error fetching EVSE station:", error);
    return {
      code: 404,
      data: { message: customErrorMsg.station.EVSE_STATION_NOT_FOUND },
    };
  }
};

const getEvseStationById = async (evseStationId, req, res) => {
  try {
    const stationData = await getEvseStation(evseStationId);

    res.status(stationData.code).json(stationData.data);
  } catch (error) {
    console.error("Error fetching EVSE station:", error);
    res
      .status(500)
      .json({ message: "An Error Occurred While Fetching The EVSE station" });
  }
};

const updateEvseStation = async (evseStationId, req, res) => {
  try {
    const loggedInUserData = req["loggedInUserData"]["user"];

    const stationData = await getEvseStation(evseStationId);
    if (stationData.code !== 200) {
      return res.status(stationData.code).json(stationData.data);
    }
    const station = stationData.data;

    const {
      name = station.name,
      address = station.address,
      city = station.city,
      state = station.state,
      areaCode = station.areaCode,
      lat = station.lat,
      lng = station.lng,
      country = station.country,
      allocationRuleId,
      baseRate = station.baseRate,
      electricityGridRate = station.electricityGridRate,
      taxRate = station.taxRate,
      preauthAmount = station.preAuthAmount,
    } = req.body;

    if (taxRate > 100) {
      return res
        .status(400)
        .json({ message: "Tax rate cannot be more than 100%" });
    }

    let isLatLngChanged = false;
    if (lat !== station.lat || lng !== station.lng) {
      isLatLngChanged = true;
    }

    const updateEvseStation = {
      name,
      address,
      city,
      state,
      areaCode,
      lat,
      lng,
      country,
      updatedBy: loggedInUserData.id,
      allocationRuleId,
      baseRate: baseRate,
      electricityGridRate: electricityGridRate,
      taxRate: taxRate,
      preAuthAmount: preauthAmount,
    };

    // Update the EVSE station
    await EvseStationRepository.update(evseStationId, updateEvseStation);

    const updatedStation = await EvseStationRepository.findOne({
      where: { id: evseStationId },
    });

    await sendDataToPusher({
      channelName: PusherConstants.channels.PUSHER_NODE_APP,
      eventName: PusherConstants.events.evse.EVSE_UPDATED,
      data: { evseStationId },
    });

    if (isLatLngChanged) {
      await updateChargerLatLngByEvseStationId(evseStationId);
    }

    updatedStation["updatedAtLocal"] = convertDateTimezone(
      DateTime.fromJSDate(updatedStation["updatedAt"]),
      updatedStation["timezone"] ?? "UTC"
    );

    await EvseStationRepository.update(updatedStation.id, {
      updatedAtLocal: updatedStation["updatedAtLocal"],
    });

    return res.status(200).json(updatedStation);
  } catch (error) {
    console.error("Error updating EVSE station:", error);
    res
      .status(500)
      .json({ message: "An Error Occurred While Updating The EVSE station" });
  }
};

const getEvseStationList = async (req, res) => {
  try {
    let baseQuery = { isDeleted: false };
    let { location, fromContract, filter } = req.query;

    let filterObj = {};
    try {
      filterObj = JSON.parse(filter);
    } catch (error) {}

    if (!fromContract && filterObj?.fromContract) {
      fromContract = String(filterObj?.fromContract);
    }

    if (location) {
      location = location?.trim();
    }

    const { isPartner, isPartnerTeam } = req?.loggedInUserData;

    if (isPartner || isPartnerTeam) {
      const { evseStationIds = [] } = req?.allowedIds;
      if (evseStationIds.length == 0) {
        return res.status(200).json({
          list: [],
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
        });
      }

      baseQuery["id"] = {
        custom: true,
        value: `in("${evseStationIds.join('", "')}")`,
      };

      if (location) {
        baseQuery["country"] = location;
      }
    } else {
      if (location) {
        baseQuery["country"] = location;
      }
    }

    if (fromContract === "true") {
      const contracts = await ContractRepository.find({
        where: { isDeleted: false, isExpired: false },
        select: ["id"],
      });
      if (contracts.length > 0) {
        const contractEvseStations = await ContractEvseStationsRepository.find({
          where: {
            isDeleted: false,
            contractId: In(contracts.map((c) => c.id)),
          },
          select: ["evseStationId"],
        });

        if (contractEvseStations.length > 0) {
          const contractEvseStationIds = contractEvseStations.map(
            (ces) => ces.evseStationId
          );

          baseQuery["id"] = {
            custom: true,
            value: `not in("${contractEvseStationIds.join('", "')}")`,
          };
        }
      }
    }

    const listParams = {
      entityName: "EvseStationView",
      baseQuery,
      req,
    };

    const result = await HandleMySqlList(listParams);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching EVSE Station list:", error);
    res.status(500).json({ message: "Error Fetching EVSE Station list" });
  }
};

const softDeleteEvseStation = async (evseStationId, req, res) => {
  try {
    const stationData = await getEvseStation(evseStationId);
    if (stationData.code !== 200) {
      return res.status(stationData.code).json(stationData.data);
    }

    stationData.data["deletedAt"] = convertDateTimezone(DateTime.utc());
    stationData.data["deletedBy"] = req["loggedInUserData"]["user"].id;
    stationData.data["deletedAtLocal"] = convertDateTimezone(DateTime.utc());

    const station = stationData.data;

    const chargerCount = await ChargerRepository.count({
      where: { evseStationId, isDeleted: false },
    });

    if (chargerCount > 0) {
      return res.status(400).json({
        message: "Cannot Delete EVSE Station With Associated Chargers",
      });
    }

    station.isDeleted = true;
    const updatedStation = await EvseStationRepository.save(station);

    await sendDataToPusher({
      channelName: PusherConstants.channels.PUSHER_NODE_APP,
      eventName: PusherConstants.events.evse.EVSE_UPDATED,
      data: { evseStationId: stationData.id },
    });

    return res.status(200).json(updatedStation);
  } catch (error) {
    console.error("Error soft deleting EVSE Station:", error);
    res.status(500).json({ message: "Error Soft Deleting EVSE Station" });
  }
};

const softDeleteEvseStationBulk = async (evseStationIds, req, res) => {
  try {
    const notFoundStations = [];
    const assignedChargesStations = [];
    const updatedStations = [];
    await Promise.all(
      evseStationIds.map(async (evseStationId) => {
        const stationData = await getEvseStation(evseStationId);
        if (stationData.code !== 200) {
          notFoundStations.push(evseStationId);
          return;
        }

        stationData.data["deletedAt"] = convertDateTimezone(DateTime.utc());
        stationData.data["deletedBy"] = req["loggedInUserData"]["user"].id;
        stationData.data["deletedAtLocal"] = convertDateTimezone(
          DateTime.utc()
        );

        const station = stationData.data;

        const chargerCount = await ChargerRepository.count({
          where: { evseStationId, isDeleted: false },
        });

        if (chargerCount > 0) {
          assignedChargesStations.push(evseStationId);
          return;
        }

        station.isDeleted = true;
        const updatedStation = await EvseStationRepository.save(station);
        updatedStations.push(updatedStation);
        await sendDataToPusher({
          channelName: PusherConstants.channels.PUSHER_NODE_APP,
          eventName: PusherConstants.events.evse.EVSE_UPDATED,
          data: { evseStationId: stationData.id },
        });
      })
    );
    if (notFoundStations.length > 0) {
      return res.status(400).json({
        success: false,
        message: `EVSE Stations not found!`,
      });
    }
    if (assignedChargesStations.length > 0) {
      return res.status(400).json({
        success: true,
        message: "Cannot delete EVSE Station with Chargers Assigned!",
      });
    }
    res.status(200).json(updatedStations);
  } catch (error) {
    console.error("Error soft deleting EVSE Station:", error);
    res.status(500).json({ message: "Error Soft Deleting EVSE Station" });
  }
};

const getChargingOverview = async (req, res) => {
  let defaultResponse = {
    avgChargingTime: getTrendsData({
      isMoney: true,
      suffix: "min",
      value: 0,
      valueTrends: 0,
    }),
    avgChargingRate: getTrendsData({
      isMoney: true,
      suffix: "kW",
      value: 0,
      valueTrends: 0,
    }),
  };

  try {
    const { returnDefaultResponse, matchConditions, range, rangeTrend } =
      req.analyticsFilters;

    if (returnDefaultResponse === true) {
      return res.status(200).json(defaultResponse);
    }

    const [allAnalytics, allAnalyticsTrends] = await Promise.all([
      getAnalyticDataForDashboard({
        ...matchConditions,
        ...range,
      }),
      getAnalyticDataForDashboard({
        ...matchConditions,
        ...rangeTrend,
      }),
    ]);

    if (allAnalytics.length === 0) {
      return res.status(200).json(defaultResponse);
    }

    // Extract the first object from the array
    const analyticCounts = allAnalytics[0] || {}; // Return empty object if no data found
    const analyticTrendsCounts = allAnalyticsTrends[0] || {}; // Return empty object if no data found

    let {
      totalSessions = 0,
      totalEnergyDelivered = 0,
      totalSessionsDuration = 0,
      totalSessionsDurationSec = 0,
    } = analyticCounts;
    let {
      totalSessions: totalSessionsTrends = 0,
      totalEnergyDelivered: totalEnergyDeliveredTrends = 0,
      totalSessionsDuration: totalSessionsDurationTrends = 0,
      totalSessionsDurationSec: totalSessionsDurationSecTrends = 0,
    } = analyticTrendsCounts;

    let avgChargingRate =
      totalEnergyDelivered > 0 && totalSessionsDuration > 0
        ? totalEnergyDelivered / totalSessionsDuration
        : 0;
    let avgChargingRateTrends =
      totalEnergyDeliveredTrends > 0 && totalSessionsDurationTrends > 0
        ? totalEnergyDeliveredTrends / totalSessionsDurationTrends
        : 0;

    defaultResponse["avgChargingRate"] = getTrendsData({
      isMoney: true,
      suffix: "kW",
      value: avgChargingRate,
      valueTrends: avgChargingRateTrends,
    });

    let totalSessionsDurationMin =
      totalSessionsDurationSec > 0 ? totalSessionsDurationSec / 60 : 0;
    let totalSessionsDurationMinTrends =
      totalSessionsDurationSecTrends > 0
        ? totalSessionsDurationSecTrends / 60
        : 0;

    let avgChargingTime =
      totalSessions > 0 && totalSessionsDurationMin > 0
        ? totalSessionsDurationMin / totalSessions
        : 0;
    let avgChargingTimeTrends =
      totalSessionsTrends > 0 && totalSessionsDurationMinTrends > 0
        ? totalSessionsDurationMinTrends / totalSessionsTrends
        : 0;

    defaultResponse["avgChargingTime"] = getTrendsData({
      isMoney: true,
      suffix: "min",
      value: avgChargingTime,
      valueTrends: avgChargingTimeTrends,
    });
  } catch (error) {
    console.log(error);
  }

  return res.status(200).json(defaultResponse);
};

module.exports = {
  addEvseStation,
  getEvseStationById,
  updateEvseStation,
  getEvseStationList,
  softDeleteEvseStation,
  getChargingOverview,
  softDeleteEvseStationBulk,
};
