const { In } = require("typeorm");
const {
  DeviceOverviewModel,
  AgentConcurrencyModel,
  RemoteCommandTrackerModel,
  RolloutModel,
  RolloutDeviceStatesModel,
  RolloutDeviceStatesHistoryModel,
} = require("@shared-libs/db/mongo-db");
const { UserRepository, ChargerRepository } = require("@shared-libs/db/mysql");
const {
  ConcurrencyEnumMap,
  RolloutStates,
  RolloutDeviceStates,
  ChargerStatuses,
  OcppEvents,
} = require("@shared-libs/constants");
const { HandleMongoDBList } = require("@shared-libs/db");
const { mqttClient } = require("@shared-libs/mqtt");
const { triggerChunked, triggerPusher } = require("@shared-libs/pusher");
const {
  arrayObjStr,
  getChargerByIdentity,
  ObjectDAO,
  sendOcppEvent,
} = require("@shared-libs/helpers");

const getDeviceOverview = async (deviceId, req, res) => {
  const deviceOverview = await DeviceOverviewModel.findOne({ deviceId });
  let result = null;
  if (deviceOverview) {
    result = deviceOverview.toJSON();
    result.data = JSON.parse(result.data);
  }

  res.status(200).json(result);
};

const publishOverview = async (req, res) => {
  try {
    const data = req.body;
    const { deviceId, interval, data: overviewData } = data;

    // If the data is an object, stringify it to store it as a string
    let stringifiedData = overviewData;

    if (typeof stringifiedData !== "string") {
      stringifiedData = JSON.stringify(stringifiedData); // Stringify the data if it's not already a string
    }

    // Find the existing device overview or create a new one
    let overview = await DeviceOverviewModel.findOne({ deviceId });
    if (!overview) {
      // Create a new document if no existing document is found
      await DeviceOverviewModel.create({
        deviceId,
        data: stringifiedData, // Store the stringified data
        interval,
      });
    } else {
      // Update the existing document with new data
      await DeviceOverviewModel.findOneAndUpdate(
        { deviceId },
        { $set: { data: stringifiedData, interval } },
        { new: true },
      );
    }

    // Handle AgentConcurrencyModel logic as before
    let AgentCon = await AgentConcurrencyModel.findOne({ deviceId });
    if (!AgentCon) {
      await AgentConcurrencyModel.create({ deviceId, overview: true });
    } else {
      AgentCon.overview = true;
      await AgentCon.save();
    }

    res.status(200).json({});
  } catch (error) {
    console.error("Error in publishOverview:", error);
  }
};

const resetAgentConcurrency = async (deviceId, overrideAllowForwarding) => {
  const concurrency = await AgentConcurrencyModel.findOne({ deviceId });
  concurrency.allowForwarding =
    overrideAllowForwarding === false ? overrideAllowForwarding : true;
  concurrency.liveModeProcessCount = 0;
  concurrency.liveCpuLoad = 0;
  concurrency.liveNetConnections = 0;
  concurrency.liveNetworkTransferMap = {};
  concurrency.enableCtlList = 0;
  await concurrency.save();

  try {
    await mqttClient.publish(
      `serversendevents-${deviceId}`,
      JSON.stringify({
        type: "CACHE_UPDATE",
        cache: concurrency.toJSON(),
      }),
    );
  } catch (e) {}
};

const checkAgentConcurrency = async (command) => {
  const { deviceId, reset, type, inf } = command;

  const device = await getChargerByIdentity(deviceId);
  if (device.status === "offline") {
    await resetAgentConcurrency(deviceId);
  }

  let agentConcurrencyMap = await AgentConcurrencyModel.findOne({ deviceId });
  if (!agentConcurrencyMap) {
    agentConcurrencyMap = await AgentConcurrencyModel.create({ deviceId });
  }

  let count;
  if (type === "LIVE_CPU_LOAD") {
    count = agentConcurrencyMap.liveCpuLoad;
    if (reset) {
      agentConcurrencyMap.liveCpuLoad = count === 0 ? 0 : count - 1;
    } else {
      agentConcurrencyMap.liveCpuLoad = count + 1;
    }
    count = agentConcurrencyMap.liveCpuLoad;
  } else if (type === "LIVE_NET_CONNECTIONS") {
    count = agentConcurrencyMap.liveNetConnections;
    if (reset) {
      agentConcurrencyMap.liveNetConnections = count === 0 ? 0 : count - 1;
    } else {
      agentConcurrencyMap.liveNetConnections = count + 1;
    }
    count = agentConcurrencyMap.liveNetConnections;
  } else if (type === "LIVE_SYSTEMCTL_LIST") {
    count = agentConcurrencyMap.enableCtlList || 0;
    if (reset) {
      agentConcurrencyMap.enableCtlList = count === 0 ? 0 : count - 1;
    } else {
      agentConcurrencyMap.enableCtlList = count + 1;
    }
    count = agentConcurrencyMap.enableCtlList;
  } else if (type === "LIVE_PROCESS_EVENT") {
    count = agentConcurrencyMap.liveModeProcessCount;
    if (reset) {
      agentConcurrencyMap.liveModeProcessCount = count === 0 ? 0 : count - 1;
    } else {
      agentConcurrencyMap.liveModeProcessCount = count + 1;
    }
    count = agentConcurrencyMap.liveModeProcessCount;
  } else if (type === "LIVE_NET_TRANSFER") {
    count = agentConcurrencyMap.liveNetworkTransferMap[inf]
      ? agentConcurrencyMap.liveNetworkTransferMap[inf]
      : 0;
    if (reset) {
      agentConcurrencyMap.liveNetworkTransferMap = {
        ...agentConcurrencyMap.liveNetworkTransferMap,
        [inf]: agentConcurrencyMap.liveNetworkTransferMap[inf]
          ? agentConcurrencyMap.liveNetworkTransferMap[inf] - 1
          : 1,
      };
    } else {
      agentConcurrencyMap.liveNetworkTransferMap = {
        ...agentConcurrencyMap.liveNetworkTransferMap,
        [inf]: agentConcurrencyMap.liveNetworkTransferMap[inf]
          ? agentConcurrencyMap.liveNetworkTransferMap[inf] + 1
          : 1,
      };
    }
    count = agentConcurrencyMap.liveNetworkTransferMap[inf];
  }

  await agentConcurrencyMap.save();

  return count;
};

const registerInvokeCommand = async (deviceId, command, status) => {
  const charger = await getChargerByIdentity(deviceId);
  if (!charger) {
    return res.status(404).json({ error: "Device Not Found" });
  }
  const result = await RemoteCommandTrackerModel.create({
    deviceId,
    command,
    status,
  });
  return result;
};

const invokeCommand = async (req, res) => {
  const command = req.body;
  const { deviceId, reset, type } = command;

  const charger = await getChargerByIdentity(deviceId);
  if (!charger) {
    return res.status(400).json({ error: "Device Not Found" });
  }

  const count = await checkAgentConcurrency(command);

  if (
    (reset === false && count > 0) ||
    [
      "LIVE_KERNAL_LOGS",
      "LIVE_APPLICATION_LOGS",
      "KILL_PROCESS",
      "CHANGE_SYSTEMCTL_UNIT_STATUS",
      "LIVE_APPLICATION_LOGS_Volt",
      "LIVE_APPLICATION_LOGS_Volt_Activator",
      "LIVE_APPLICATION_LOGS_Volt_Debug",
      "LIVE_APPLICATION_LOGS_Volt_Demo",
    ].includes(type)
  ) {
    const str = JSON.stringify(command);

    await mqttClient.publish(
      `serversendevents-${deviceId}`,
      str,
      { qos: 1, retain: false },
      (error) => {
        if (error) {
          console.error("Failed to publish MQTT message:", error);
        } else {
          console.log("🚀 -------------🚀");
          console.log(`🚀 MQTT -> serversendevents-${deviceId} -> `, str);
          console.log("🚀 -------------🚀");
        }
      },
    );

    const tracker = await registerInvokeCommand(deviceId, str, "INVOKED");
    res.status(200).json(tracker);
  } else {
    res.status(400).json({ error: "Invalid Invoke State" });
  }
};

const updateInterfaces = async (req, res) => {
  const { deviceId } = req.body;

  const charger = await getChargerByIdentity(deviceId);
  if (!charger) {
    return res.status(400).json({ error: "Device Not Found" });
  }

  let AgentCon = await AgentConcurrencyModel.findOne({ deviceId });
  if (!AgentCon) {
    await AgentConcurrencyModel.create({ deviceId, inf: true });
  } else {
    AgentCon.inf = true;
    await AgentCon.save();
  }

  res.status(200).json({});
};

const revokeCommand = async (trackerId, req, res) => {
  const tracker = await RemoteCommandTrackerModel.findById(trackerId);
  if (!tracker || tracker.status === "STOPPED") {
    return res.status(404).json({
      error: tracker ? "Tracker Stopped Already" : "Tracker Not Found",
    });
  }

  const command = JSON.parse(tracker.command);

  const charger = await getChargerByIdentity(command.deviceId);
  if (!charger) {
    return res.status(400).json({ error: "Device Not Found" });
  }

  command.reset = true;
  const count = await checkAgentConcurrency(command);

  if (count === 0) {
    await mqttClient.publish(
      `serversendevents-${tracker.deviceId}`,
      JSON.stringify(command),
    );
  }

  tracker.status = "STOPPED";
  await tracker.save();

  res.status(200).json({ message: "Success" });
};

const doRevoke = async (trackerId) => {
  const tracker = await RemoteCommandTrackerModel.findById(trackerId);
  const command = JSON.parse(tracker.command);
  command.reset = true;

  await mqttClient.publish(
    `serversendevents-${tracker.deviceId}`,
    JSON.stringify(command),
  );

  tracker.status = "STOPPED";
  await tracker.save();

  return true;
};

const revokeAll = async (req, res) => {
  const invokedCommands = await RemoteCommandTrackerModel.find({
    status: "INVOKED",
  });

  await Promise.all(
    invokedCommands.map(async (invokedCommandData) => {
      try {
        await doRevoke(invokedCommandData?._id);
      } catch (error) {
        console.log("🚀 -----------------🚀");
        console.log("🚀 ~ revokeAll error:", error);
        console.log("🚀 -----------------🚀");
      }
    }),
  );

  res.status(200).json({ message: "Success" });
};

const pingTracker = async (trackerId, req, res) => {
  const tracker = await RemoteCommandTrackerModel.findById(trackerId);
  if (!tracker) {
    return res.status(404).json({
      error: "Tracker Not Found",
    });
  }
  tracker.status = "RUNNING";
  tracker.lastBeatTime = new Date().toISOString();
  await tracker.save();

  res.status(200).json({ message: "Success" });
};

const sync = async (req, res) => {
  const activeEvents = await RemoteCommandTrackerModel.find({
    status: { $in: ["INVOKED", "RUNNING"] },
  });

  const deviceMapList = activeEvents
    .map((e) => {
      const command = JSON.parse(e.command);
      const result = {
        deviceId: e.deviceId,
        type: ConcurrencyEnumMap[command.type]
          ? ConcurrencyEnumMap[command.type]
          : null,
        inf: command.inf ? command.inf : null,
      };
      if (command.type === "liveNetworkTransferMap") {
        result.inf = command.inf;
      }

      return result;
    })
    .filter((e) => e.type !== null);

  const deviceMap = deviceMapList.reduce((acc, cur) => {
    const tmp = acc[cur.deviceId] ? acc[cur.deviceId] : {};
    if (cur.type === "liveNetworkTransferMap") {
      const nmap = tmp[cur.type] ? tmp[cur.type] : {};
      nmap[cur.inf] = nmap[cur.inf] ? nmap[cur.inf] + 1 : 1;
      tmp[cur.type] = nmap;
    } else {
      tmp[cur.type] = tmp[cur.type] ? tmp[cur.type] + 1 : 1;
    }
    acc[cur.deviceId] = tmp;
    return acc;
  }, {});

  res.status(200).json({ deviceMapList, deviceMap });
};

const kernalLogRelay = async (req, res) => {
  const data = req.body;
  console.log("🚀 ---------------🚀");
  console.log("🚀 ~ kernalLogRelay data:", data);
  console.log("🚀 ---------------🚀");
  const { clientId } = data;

  const device = await getChargerByIdentity(clientId);
  if (!device) {
    return res.status(400).json({ error: "Device Not Found" });
  }

  // if (!device.status !== "ONLINE") {
  //   device.status = "ONLINE";
  //   await device.save();
  // }

  data.kernalLogs = data.data;
  delete data.data;

  await triggerChunked(data.clientId, "LIVE_KERNAL_LOG", JSON.stringify(data));

  res.status(200).send(true);
};

const getDeviceCache = async (req, res) => {
  const data = req.params;
  const { deviceId } = data;

  const device = await getChargerByIdentity(deviceId);
  if (!device) {
    return res.status(400).json({ error: "Device Not Found" });
  }

  let acc = await AgentConcurrencyModel.findOne({ deviceId });
  if (!acc) {
    acc = await AgentConcurrencyModel.create({ deviceId });
  }

  try {
    await mqttClient.publish(
      `serversendevents-${deviceId}`,
      JSON.stringify({
        type: "CACHE_UPDATE",
        cache: acc.toJSON(),
      }),
    );
  } catch (e) {}

  res.status(200).send(acc);
};

const getRolloutCreatedByUser = async (list) => {
  const createdByIds = list.map(({ createdBy }) => createdBy);
  const updatedByIds = list.map(({ updatedBy }) => updatedBy);

  const users = await UserRepository.find({
    where: { id: In([...createdByIds, ...updatedByIds]) },
    select: ["id", "firstName", "lastName"],
  });

  const userData = arrayObjStr(users, "id");

  const returnList = list.map((d) => {
    return ObjectDAO({
      ...d,
      createdByUser: d.createdBy ? userData[d.createdBy] : {},
      updatedByUser: d.updatedBy ? userData[d.updatedBy] : {},
    });
  });

  return returnList;
};

const getRolloutList = async (req, res) => {
  const listParams = {
    model: RolloutModel,
    baseQuery: { archive: false },
    req,
  };
  const listResponse = await HandleMongoDBList(listParams);
  if (listResponse.list.length > 0) {
    listResponse.list = await getRolloutCreatedByUser(listResponse.list);

    const newList = await Promise.all(
      listResponse.list.map(async (item) => {
        if (item.status == "CREATED") {
          const completion = item.completion;
          item.completion = {
            status: "CREATED",
            completion: completion,
          };
          return item;
        }
        if (item.status === "COMPLETED" && item.completion === 100) {
          const completion = item.completion;
          item.completion = {
            status: "COMPLETED",
            completion: completion,
          };
          return item;
        }

        const deviceIds = item.deviceIds;
        const deviceStatsResponse = await RolloutDeviceStatesModel.find({
          device: { $in: deviceIds },
        });

        const hasFailedDevice = deviceStatsResponse.some(
          (deviceStats) => deviceStats.status === "FAILED",
        );

        if (hasFailedDevice) {
          const completion = item.completion;
          item.completion = {
            status: "INSTALLATION-ERROR",
            completion: completion,
          };
          return item;
        }

        if (item.status !== "COMPLETED" && item.completion < 100) {
          const completion = item.completion;
          item.completion = {
            status: "IN-PROGRESS",
            completion: completion,
          };
          return item;
        }
        return item;
      }),
    );

    listResponse.list = newList;
  }
  res.status(200).json(listResponse);
};

const findDeviceInActiveRollout = async (deviceId, _id) => {
  // const device = await getChargerByIdentity(deviceId);

  const activeRolloutCountFilter = {
    // account: device.registeredBy,
    status: { $nin: ["COMPLETED", "FAILED"] },
    archive: false,
    deviceIds: { $in: deviceId },
  };
  if (_id) {
    activeRolloutCountFilter._id = { $ne: _id };
  }
  const activeRolloutsCount = await RolloutModel.countDocuments(
    activeRolloutCountFilter,
  );

  return activeRolloutsCount > 0;
};

const createRollout = async (req, res) => {
  const body = req.body;
  const { deviceIds = [] } = body;

  const loggedInUserId = req["loggedInUserData"]["user"]["id"];

  body.account = loggedInUserId;
  body.createdBy = loggedInUserId;
  body.updatedBy = loggedInUserId;

  body.status = RolloutStates.CREATED;
  body.completion = 0;
  body.completedDevices = [];

  if (deviceIds && deviceIds.length === 0)
    return res.status(400).json({
      error: "You Need To Select At Least One Device For Creating A Rollout.",
    });

  const existingRollout = await RolloutModel.find({ name: body.name });
  if (existingRollout.length > 0) {
    return res.status(400).json({
      error: `${body.name} Rollout is already exists!`,
    });
  }

  if (deviceIds && deviceIds.length > 0) {
    let di = 0;
    while (di < deviceIds.length) {
      const deviceId = deviceIds[di];
      const count = await findDeviceInActiveRollout(deviceIds[di]);
      if (count) {
        return res.status(400).json({
          error: `Device [${deviceId}] Is Already Part Of Other Active Rollout.`,
        });
      }
      di++;
    }
  }

  const createdRollout = await RolloutModel.create(body);

  res.status(200).json(createdRollout);
};

const updateRolloutState = async (rollout, status) => {
  if (rollout) {
    rollout.status = status;
    await rollout.save();
  }
};

const getAgentConcurrencyForDevices = async (deviceIds) => {
  return AgentConcurrencyModel.find({ deviceId: { $in: deviceIds } });
};

const playRollout = async (req, res) => {
  const { rolloutId } = req.params;

  const rollout = await RolloutModel.findById(rolloutId);

  if (!rollout.deviceIds || rollout.deviceIds.length === 0) {
    return res.status(400).json({
      error: `No Devices Selected For Rollout. Kindly Update Your Rollout`,
    });
  }

  const deviceIds = [...rollout.deviceIds];
  let di = 0;
  while (di < deviceIds.length) {
    const count = await findDeviceInActiveRollout(deviceIds[di], rolloutId);
    if (count) {
      return res.status(400).json({
        error: `Device [${deviceIds[di]}] Is Already Part Of Other Active Rollout`,
      });
    }
    di++;
  }

  await updateRolloutState(rollout, RolloutStates.PREPARE_ROLLOUT);
  const rolloutStateMapListForDevices = deviceIds.map((d) => {
    return {
      device: d,
      rollout: rollout.id,
      account: rollout.account,
    };
  });

  // created device state maps
  await RolloutDeviceStatesModel.insertMany(rolloutStateMapListForDevices);

  await updateRolloutState(rollout, RolloutStates.DEVICE_STATE_MAP_CREATED);

  const deviceConcurrencies = await getAgentConcurrencyForDevices(deviceIds);
  const deviceConcurrencyMap = {};
  deviceConcurrencies.forEach((r) => {
    deviceConcurrencyMap[r.deviceId] = r;
  });

  const rolloutDeviceStatesList = await RolloutDeviceStatesModel.find({
    rollout: rollout.id,
    device: { $in: deviceIds },
  });
  const rolloutDeviceSatateMap = {};
  rolloutDeviceStatesList.forEach((r) => {
    rolloutDeviceSatateMap[r.device] = r;
  });
  let i = 0;
  while (i < deviceIds.length) {
    const ac = deviceConcurrencyMap[deviceIds[i]];
    if (ac) {
      ac.newUpdates = { isAvailable: true, version: rollout.id };
      await ac.save();
    }

    const rs = rolloutDeviceSatateMap[deviceIds[i]];
    if (rs) {
      rs.status = RolloutDeviceStates.DEVICE_REMOTE_STATE_SYNCED;
      await rs.save();
    }

    i++;
  }

  try {
    if (deviceIds.length > 0) {
      const chargers = await ChargerRepository.find({
        where: { serialNumber: In(deviceIds) },
      });
      if (chargers.length > 0) {
        await Promise.all(
          chargers.map(async (c) => {
            try {
              if (c?.status) {
                if (
                  ![
                    ChargerStatuses.GENERATED,
                    ChargerStatuses.REGISTERED,
                    ChargerStatuses.DISABLED,
                  ].includes(c?.status)
                ) {
                  await sendOcppEvent(
                    c?.chargeBoxId,
                    OcppEvents.ChangeAvailability,
                    { connectorId: 1, type: "Inoperative" },
                  );
                }
              }
            } catch (error) {}
          }),
        );
      }
    }
  } catch (error) {}

  res.status(200).send(true);
};

const transformOldRollout = (rollout) => {
  const r = rollout.toJSON();
  delete r._id;
  delete r.id;
  delete r.createdAt;
  delete r.updatedAt;
  delete r.createdBy;
  delete r.updatedBy;
  return r;
};

const cloneRollout = async (req, res) => {
  const { rolloutId } = req.params;

  const loggedInUserId = req["loggedInUserData"]["user"]["id"];

  const oldRollout = await RolloutModel.findById(rolloutId);
  if (!oldRollout) {
    return res.status(400).json({ error: `Rollout Not Found` });
  }
  // now prepare the new rollout name from old one
  const originalName = oldRollout.name.replace(/\(\d+\)$/, "");
  const nameRegex = new RegExp(`^${originalName}(\\(\\d+\\))?$`);
  const rollouts = await RolloutModel.find({ name: nameRegex });
  const rolloutNumber = rollouts.length || 1;
  const newName = `${originalName}(${rolloutNumber})`;
  oldRollout.name = newName;

  const transformed = transformOldRollout(oldRollout);
  transformed.createdBy = loggedInUserId;
  transformed.updatedBy = loggedInUserId;

  req.body = transformed;

  await createRollout(req, res);
};

const getRolloutById = async (req, res) => {
  const { rolloutId } = req.params;

  const rolloutData = await RolloutModel.findOne({
    _id: rolloutId,
    archive: false,
  }).lean();
  console.log("🚀 -----------------------------🚀");
  console.log("🚀 ~ rolloutData:", rolloutData);
  console.log("🚀 ~ rolloutId:", rolloutId);
  console.log("🚀 -----------------------------🚀");
  if (!rolloutData) {
    return res.status(400).json({ error: `Rollout Not Found` });
  }

  res.status(200).json(rolloutData);
};

const updateRolloutById = async (req, res) => {
  const { rolloutId } = req.params;
  const { deviceIds } = req.body;
  const rolloutData = await RolloutModel.findOne({
    _id: rolloutId,
    archive: false,
  });
  if (!rolloutData) {
    return res.status(400).json({ error: `Rollout Not Found` });
  }
  if (deviceIds && deviceIds.length <= 0) {
    return res.status(400).json({ error: `At lease one device is required` });
  }

  const updatedRecord = await RolloutModel.findOneAndUpdate(
    { _id: rolloutId, archive: false },
    req.body,
    { new: true },
  );

  res.status(200).json(updatedRecord);
};

const deleteRolloutById = async (req, res) => {
  const { rolloutId } = req.params;

  const rolloutData = await RolloutModel.findOne({
    _id: rolloutId,
    archive: false,
  });
  if (!rolloutData) {
    return res.status(400).json({ error: `Rollout Not Found` });
  }
  rolloutData.archive = true;
  await rolloutData.save();

  res.status(200).json(rolloutData);
};

const getRolloutDetailedStats = async (req, res) => {
  const { rolloutId } = req.params;

  const rolloutRecords = await RolloutModel.findById(rolloutId);
  if (!rolloutId || !rolloutRecords || rolloutRecords.archive == true) {
    return res.status(400).json({ error: `Invalid Rollout` });
  }

  const downloaded = await RolloutDeviceStatesModel.countDocuments({
    rollout: rolloutId,
    isDownloaded: true,
  });
  const applied = await RolloutDeviceStatesModel.countDocuments({
    rollout: rolloutId,
    isApplied: true,
  });
  const extracted = await RolloutDeviceStatesModel.countDocuments({
    rollout: rolloutId,
    isExtracted: true,
  });

  res.status(200).json({
    downloaded,
    applied,
    extracted,
    completion: rolloutRecords.completion,
    devices: rolloutRecords?.deviceIds?.length,
  });
};

const deleteBulkRollouts = async (req, res) => {
  try {
    const { rolloutIds } = req.body;

    if (!Array.isArray(rolloutIds) || rolloutIds.length === 0) {
      return res.status(400).json({ error: "No rollout IDs provided." });
    }

    // Fetch the rollouts
    const rolloutData = await RolloutModel.find({
      _id: { $in: rolloutIds },
      archive: false,
    });

    if (rolloutData.length === 0) {
      return res.status(400).json({ error: "Rollouts not found." });
    }

    if (rolloutIds.length !== rolloutData.length) {
      return res.status(400).json({ error: "Some rollouts not found!" });
    }

    // Archive all found rollouts
    await RolloutModel.updateMany(
      { _id: { $in: rolloutIds } },
      { $set: { archive: true } },
    );

    return res.status(200).json({ message: "Rollouts archived successfully." });
  } catch (error) {
    console.error("Error archiving rollouts:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

const getRolloutDetails = async (req, res) => {
  const { rolloutId } = req.params;

  const listParams = {
    model: RolloutDeviceStatesModel,
    baseQuery: { rollout: rolloutId },
    req,
  };
  const listResponse = await HandleMongoDBList(listParams);
  if (listResponse.list && listResponse.list.length > 0) {
    const newList = listResponse.list.map((rollout) => {
      return ObjectDAO(rollout);
    });
    listResponse.list = newList;
  }
  res.status(200).json(listResponse);
};

const updateDeviceState = async (rollout, deviceId, status) => {
  const device = await RolloutDeviceStatesModel.findOne({
    rollout,
    device: deviceId,
  });
  if (device) {
    device.status = status;
    await device.save();
  }
};

const setDeviceRolloutStatusFromDevice = async (req, res) => {
  const { rolloutId, deviceId } = req.params;
  const { status } = req.query;

  switch (status) {
    case RolloutStates.DEVICE_READY:
      await updateDeviceState(rolloutId, deviceId, status);
      // await eventService.sendEvent({
      //   rollout: rolloutId,
      //   device: deviceId,
      //   status,
      //   eventType: eventTypes.START_ROLLOUT,
      // });
      break;
    case RolloutStates.STARTED_ROLLOUT:
      await updateDeviceState(rolloutId, deviceId, status);
      break;
    case RolloutStates.DOWNLOADING:
      await updateDeviceState(rolloutId, deviceId, status);
      break;
    case RolloutStates.DOWNLOADED:
      await updateDeviceState(rolloutId, deviceId, status);
      break;
    case RolloutStates.UNPACKING:
      await updateDeviceState(rolloutId, deviceId, status);
      break;
    case RolloutStates.UNPACKING_SUCCESS:
      await updateDeviceState(rolloutId, deviceId, status);
      break;
    case RolloutStates.INSTALLING:
      await updateDeviceState(rolloutId, deviceId, status);
      break;
    case RolloutStates.INSTALL_SUCCESS:
      await updateDeviceState(rolloutId, deviceId, status);
      break;
    case RolloutStates.INSTALL_FAILED:
      await updateDeviceState(rolloutId, deviceId, status);
      break;
    case RolloutStates.DEVICE_ROLLOUT_COMPLTED:
      await updateDeviceState(rolloutId, deviceId, status);
      // await eventService.sendEvent({
      //   rollout: rolloutId,
      //   device: deviceId,
      //   status,
      //   eventType: eventTypes.DEVICE_ROLLOUT_COMPLETED,
      // });
      break;
    case RolloutStates.DEVICE_ROLLOUT_COMPLTED_WITH_FAILURES:
      await updateDeviceState(rolloutId, deviceId, status);
      break;
    case RolloutStates.DEVICE_ROLLOUT_FAILED:
      await updateDeviceState(rolloutId, deviceId, status);
      break;
    default:
      break;
  }
  await RolloutDeviceStatesModel.create({
    rollout: rolloutId,
    device: deviceId,
    status,
  });

  res.status(200).json({});
};

const sendEventToCharger = async (event, deviceId, body) => {
  try {
    const charger = await getChargerByIdentity(deviceId);

    if (
      [
        "ROLLOUT_DETAILS_RECEIVED",
        "DOWNLOADED_ARTIFACT",
        "DOWNLOADED_ARTIFACT_FAILED",
        "EXTRACTED_ARTIFACT",
        "EXTRACTED_ARTIFACT_FAILED",
        "INSTALL_COMPLETED",
        "POST_INSTALL_FAILED",
        "SWAP_COMPLETED",

        // "DOWNLOADED_ARTIFACT",
        // "DOWNLOADED_ARTIFACT_FAILED",
        // "EXTRACTED_ARTIFACT",
        // "EXTRACTED_ARTIFACT_FAILED",
        // "INSTALL_STARTED",
        // "INSTALL_COMPLETED",
        // "POST_INSTALL_STARTED",
        // "POST_INSTALL_COMPLETED",
        // "FAILED",
        // "COMPLETED",
        // "PRE_INSTALL_STARTED",
        // "PRE_INSTALL_FAILED",
        // "PRE_INSTALL_COMPLETED",
        // "SWAP_COMPLETED",
      ].includes(event)
    ) {
      await sendOcppEvent(charger?.chargeBoxId, OcppEvents.DataTransfer, {
        vendorId: "chargnex",
        messageId: "FOTA",
        data: JSON.stringify(body),
      });
    }

    if (
      [
        "DOWNLOADED_ARTIFACT_FAILED",
        "EXTRACTED_ARTIFACT_FAILED",
        "FAILED",
        "CONFIG_VALIDATION_FAILED",
        "PRE_INSTALL_FAILED",
        "COMPLETED",
      ].includes(event)
    ) {
      await sendOcppEvent(charger?.chargeBoxId, OcppEvents.ChangeAvailability, {
        connectorId: 1,
        type: "Operative",
      });
    }
  } catch (error) {}

  return true;
};

const updateDeviceRolloutState = async (req, res) => {
  console.log("🚀 ---------------------------🚀");
  console.log("🚀 ~ updateDeviceRolloutState:", req.params);
  console.log("🚀 ---------------------------🚀");
  const { rolloutId, deviceId } = req.params;
  const { event, message, timestamp } = req.body;

  const rollout = await RolloutModel.findById(rolloutId);
  if (!rollout || rollout.archive === true) {
    return res.status(400).json({ error: "Rollout Not Found" });
  }

  const device = await getChargerByIdentity(deviceId);
  if (!device) {
    return res.status(404).json({ error: "Device Not Found" });
  }

  let uiStatus = { download: null, extract: null, apply: null };

  let rolloutDeviceState = await RolloutDeviceStatesModel.findOne({
    rollout: rolloutId,
    device: deviceId,
  });

  if (rolloutDeviceState) {
    uiStatus = rolloutDeviceState?.uiStatus;
  }

  let isDownloaded = false;
  let isApplied = false;
  let isExtracted = false;
  switch (event) {
    case "DOWNLOADED_ARTIFACT":
      uiStatus["download"] = true;
      isDownloaded = true;
      break;
    case "EXTRACTED_ARTIFACT":
      uiStatus["extract"] = true;
      isExtracted = true;
      break;
    case "COMPLETED":
      uiStatus["apply"] = true;
      isApplied = true;
      break;
    default:
      break;
  }

  if (!rolloutDeviceState) {
    rolloutDeviceState = await RolloutDeviceStatesModel.create({
      device: deviceId,
      rollout: rolloutId,
      account: rollout.account,
      status: event,
      uiStatus,
      isDownloaded,
      isApplied,
      isExtracted,
    });
  } else {
    rolloutDeviceState.status = event;
    rolloutDeviceState.uiStatus = uiStatus;

    if (isDownloaded) rolloutDeviceState.isDownloaded = isDownloaded;
    if (isApplied) rolloutDeviceState.isApplied = isApplied;
    if (isExtracted) rolloutDeviceState.isExtracted = isExtracted;
    await rolloutDeviceState.save();
  }

  await RolloutDeviceStatesHistoryModel.create({
    device: deviceId,
    rollout: rolloutId,
    account: rollout.account,
    message,
    status: event,
    event,
    timestamp,
    uiStatus,
    isApplied,
    isDownloaded,
    isExtracted,
  });

  if (event === "FAILED") {
    const acs = await AgentConcurrencyModel.findOne({ deviceId });
    if (acs) {
      acs.newUpdates = { ...acs.newUpdates };
      acs.newUpdates.isAvailable = false;
      await acs.save();
    }

    await triggerPusher(rollout.account, "ROLLOUT_STATUS_UPDATE", {
      rollout: rollout.toJSON(),
      deviceState: rolloutDeviceState.toJSON(),
    });
  }

  if (["COMPLETED", "FAILED"].includes(event)) {
    const acs = await AgentConcurrencyModel.findOne({ deviceId });
    if (acs) {
      acs.newUpdates = {};
      await acs.save();
    }

    await triggerPusher(rollout.account, "ROLLOUT_STATUS_UPDATE", {
      rollout: rollout.toJSON(),
      deviceState: rolloutDeviceState.toJSON(),
    });

    console.log(`Sending event to Rollout`);
  }

  try {
    await sendEventToCharger(event, deviceId, req.body);
  } catch (error) {}

  if (isApplied || isDownloaded || isExtracted) {
    const data = rolloutDeviceState.toJSON();

    await triggerPusher(rollout.account, "ROLLOUT_DEVICE_STATUS_UPDATE", {
      deviceState: data,
    });

    console.log(`Sending event to UI`);
  }

  const completedDevicesList = await RolloutDeviceStatesModel.find({
    rollout: rolloutId,
    status: "COMPLETED",
  }).lean();

  const completedDevices = (completedDevicesList || []).map((r) => r.device);
  rollout.completedDevices = completedDevices;
  rollout.completion = (
    (completedDevices.length / rollout.deviceIds.length) *
    100
  ).toFixed(2);

  if (rollout.completedDevices.length === rollout.deviceIds.length) {
    rollout.status = "COMPLETED";
  }

  await rollout.save();

  const updatedRollout = await RolloutModel.findById(rolloutId);
  await triggerPusher(rollout.account, "ROLLOUT_STATUS_UPDATE", {
    rollout: updatedRollout.toJSON(),
  });

  res.status(200).json({});
};

const getDeviceLogsForRollout = async (req, res) => {
  const { rolloutId, deviceId } = req.params;
  const data = await RolloutDeviceStatesHistoryModel.find({
    rollout: rolloutId,
    device: deviceId,
  })
    .sort({ createdAt: -1 })
    .select("message createdAt")
    .lean();

  res.status(200).json(ObjectDAO(data));
};

const appendLogsForRolloutByDeviceId = async (req, res) => {
  const { rolloutId, deviceId } = req.params;
  const { message, event, timestamp } = req.body;

  const rollout = await RolloutModel.findOne({
    _id: rolloutId,
    archive: false,
  });
  if (!rollout) {
    return res.status(400).json({ error: `Rollout Not Found` });
  }

  const rolloutState = await RolloutDeviceStatesModel.findOne({
    rollout: rolloutId,
    device: deviceId,
  });

  if (rolloutState) {
    await RolloutDeviceStatesHistoryModel.create({
      device: deviceId,
      rollout: rolloutId,
      account: rollout.account,
      message,
      status: event,
      event,
      timestamp,
      isApplied: rollout.isApplied,
      isDownloaded: rollout.isDownloaded,
      isExtracted: rollout.isExtracted,
    });
  }

  try {
    await triggerPusher(rollout.account, "ROLLOUT_LOGS_UPDATED", {
      rolloutId,
      deviceId,
    });

    await sendEventToCharger(event, deviceId, req.body);
  } catch (error) {}

  res.status(200).json({ message: "Logged" });
};

const getRolloutStatusForDevice = async (req, res) => {
  const { rolloutId, deviceId } = req.params;

  const rolloutState = await RolloutDeviceStatesModel.findOne({
    rollout: rolloutId,
    device: deviceId,
    status: { $nin: ["COMPLETED", "FAILED"] },
  })
    .populate("rollout")
    .lean();

  if (rolloutState) {
    res.status(200).json({
      status: rolloutState.status,
      rollout: ObjectDAO(rolloutState.rollout),
    });
  } else {
    res.status(200).json({
      status: null,
      rollout: null,
    });
  }
};

const applicationLogRelay = async (req, res) => {
  const data = req.body;
  const { clientId } = data;

  const device = await getChargerByIdentity(clientId);
  if (!device) {
    return res.status(400).json({ error: "Device Not Found" });
  }

  // if (!device.status !== "ONLINE") {
  //   device.status = "ONLINE";
  //   await device.save();
  // }

  data.applicationLogs = data.data;
  delete data.data;

  await triggerChunked(
    data.clientId,
    "LIVE_APPLICATION_LOG",
    JSON.stringify(data),
  );

  res.status(200).send(true);
};

module.exports = {
  getDeviceOverview,
  invokeCommand,
  revokeCommand,
  pingTracker,
  sync,
  kernalLogRelay,
  getRolloutList,
  createRollout,
  cloneRollout,
  getRolloutById,
  updateRolloutById,
  deleteRolloutById,
  getRolloutDetailedStats,
  getRolloutDetails,
  setDeviceRolloutStatusFromDevice,
  updateDeviceRolloutState,
  getDeviceLogsForRollout,
  appendLogsForRolloutByDeviceId,
  getRolloutStatusForDevice,
  playRollout,
  resetAgentConcurrency,
  publishOverview,
  getDeviceCache,
  updateInterfaces,
  applicationLogRelay,
  deleteBulkRollouts,
  revokeAll,
};
