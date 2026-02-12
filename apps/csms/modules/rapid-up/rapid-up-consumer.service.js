const {
  DeviceOverviewModel,
  ChargerRapidLogsModel,
  StorageMonthlyModel,
  StorageDeviceMonthlyModel,
} = require("@shared-libs/db/mongo-db");
const { getChargerByIdentity } = require("@shared-libs/helpers");
const { triggerChunked, triggerPusher } = require("@shared-libs/pusher");
const { resetAgentConcurrency } = require("./rapid-up.service");

const getUsageRows = async (deviceId, date) => {
  const device = await getChargerByIdentity(deviceId);
  if (!device) {
    return [null, null];
  }

  let storageMonthly = await StorageMonthlyModel.findOne({
    account: device.registeredBy,
    date,
  });
  if (!storageMonthly) {
    storageMonthly = await StorageMonthlyModel.create({
      account: device.registeredBy,
      date,
    });
  }

  let storageDeviceMonthly = await StorageDeviceMonthlyModel.findOne({
    account: device.registeredBy,
    date,
    deviceId,
  });
  if (!storageDeviceMonthly) {
    storageDeviceMonthly = await StorageDeviceMonthlyModel.create({
      account: device.registeredBy,
      date,
      deviceId,
    });
  }

  return [storageMonthly, storageDeviceMonthly];
};

const saveByteSize = async (device, size) => {
  const d = new Date();
  const date = `${d.getMonth() + 1}-${d.getFullYear()}`;

  const [storageMonthly, storageDeviceMonthly] = await getUsageRows(
    device,
    date
  );

  storageDeviceMonthly.usage += size;
  await storageDeviceMonthly.save();

  storageMonthly.usage += size;
  await storageMonthly.save();
};

const handleSystemOverview = async (data1) => {
  const data = { ...data1 };
  data.data = JSON.stringify(data.data);
  const { deviceId } = data;

  let deviceOverview = await DeviceOverviewModel.findOne({ deviceId });

  if (deviceOverview) {
    deviceOverview = await DeviceOverviewModel.findByIdAndUpdate(
      deviceOverview.id,
      data,
      { new: true }
    );
  } else {
    deviceOverview = await DeviceOverviewModel.create(data);
  }

  return deviceOverview;
};

const updateNetworkInterface = async (deviceId, updateBody) => {
  const device = await getChargerByIdentity(deviceId);
  if (device) {
    const { active } = updateBody;

    if (active === false) {
      await resetAgentConcurrency(deviceId, false);
    }
  }
  return device;
};

const processEvent = async (eventType, data) => {
  switch (eventType) {
    case "OVERVIEW_EVENT":
      await handleSystemOverview(data);
      break;
    case "NETWORK_INTERFACE_LIST_EVENT":
      await updateNetworkInterface(data.deviceId, data.data);
      break;
    default:
      break;
  }
};

const processLiveEvent = async (eventType, eventData1) => {
  const eventData = { ...eventData1 };

  switch (eventType) {
    case "LIVE_PROCESS_EVENT":
      eventData.processes = eventData.data;
      delete eventData.data;

      await triggerChunked(
        eventData.clientId,
        eventType,
        JSON.stringify(eventData)
      );

      break;
    case "LIVE_CPU_LOAD":
      eventData.cpuLoad = eventData.cpu_load;
      delete eventData.cpu_load;

      await triggerPusher(
        eventData.clientId,
        eventType,
        JSON.stringify(eventData)
      );

      break;
    case "LIVE_NET_CONNECTIONS":
      await triggerChunked(
        eventData.clientId,
        eventType,
        JSON.stringify(eventData)
      );

      break;
    case "LIVE_NET_TRANSFER":
      eventData.dataTransfer = eventData.data;
      delete eventData.data;

      await triggerPusher(
        eventData.clientId,
        eventType,
        JSON.stringify(eventData)
      );

      break;
    case "LIVE_KERNAL_LOG":
      eventData.kernalLogs = eventData.data;
      delete eventData.data;

      await triggerChunked(
        eventData.clientId,
        eventType,
        JSON.stringify(eventData)
      );

      break;
    case "LIVE_SYSTEMCTL_LIST":
      eventData.systemCtlList = eventData.data;
      delete eventData.data;

      await triggerChunked(
        eventData.clientId,
        eventType,
        JSON.stringify(eventData)
      );

      break;
    default:
      break;
  }
};

const processLogs = async (req, res) => {
  try {
    const parsedData = req.body;
    console.log('🚀 ---------------------------🚀')
    console.log('🚀 ~ processLogs parsedData:', parsedData)
    console.log('🚀 ---------------------------🚀')
    const { clientId, data, isLive } = parsedData;
    if (parsedData?.event_type) {
      parsedData.eventType = parsedData.event_type;
      delete parsedData.event_type;
    }
    const eventType = parsedData?.eventType;

    if (clientId) {
      const charger = await getChargerByIdentity(clientId);
      if (!charger) {
        return res.status(404).json({ error: "Device Not found" });
      }

      // if (charger.status !== "ONLINE") {
      //   charger.status = "ONLINE";
      //   await charger.save();
      // }

      saveByteSize(clientId, Buffer.byteLength(JSON.stringify(data)));

      if (isLive) {
        await processLiveEvent(eventType, parsedData);
      } else {
        await processEvent(eventType, {
          deviceId: clientId,
          interval: parsedData.interval ? parsedData.interval : "1m",
          data,
        });
      }
    }

    // const createdChargerRapidLogs = await ChargerRapidLogsModel.create(
    //   parsedData
    // );

    // res.status(201).json(createdChargerRapidLogs);
    res.status(201).json({ status: "success" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  processLogs,
};
