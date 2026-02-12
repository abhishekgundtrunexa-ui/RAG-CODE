const {
  OcppEvents,
  OcppConstants,
  OcppSource,
} = require("@shared-libs/constants");
const { createExternalOcppLog } = require("@shared-libs/ocpp-log");
const { DateTime } = require("luxon");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const logConsoles = false;

// ===================
const processOcppEvent = async (data, responseData = {}) => {
  const { clientId, eventName, params } = data;

  try {
    await createExternalOcppLog({
      clientId,
      eventName,
      ocppSchema: params,
      requestFrom: OcppSource.CHARGER,
      responseData,
      responseFrom: OcppSource.SERVER,
    });
  } catch (error) {}

  return responseData;
};

// ===================

const handleAuthorize = (client) => {
  client.handle(OcppEvents.Authorize, async ({ params }) => {
    const eventName = OcppEvents.Authorize;
    const clientId = client.identity;

    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    const expiryDate = DateTime.utc().plus({ hours: 2 }).toISO();

    let responseData = { idTagInfo: { expiryDate, status: "Accepted" } };
    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleBootNotification = (client) => {
  client.handle(OcppEvents.BootNotification, async ({ params }) => {
    const eventName = OcppEvents.BootNotification;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = {
      status: "Accepted",
      interval: OcppConstants.BOOT_NOTIFICATION_INTERVAL,
      currentTime: DateTime.utc().toISO(),
    };

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleChangeAvailability = (client) => {
  client.handle(OcppEvents.ChangeAvailability, async ({ params }) => {
    const eventName = OcppEvents.ChangeAvailability;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = { status: "Accepted" };

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleChangeConfiguration = (client) => {
  client.handle(OcppEvents.ChangeConfiguration, async ({ params }) => {
    const eventName = OcppEvents.ChangeConfiguration;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = { status: "Accepted" };

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleClearCache = (client) => {
  client.handle(OcppEvents.ClearCache, async ({ params }) => {
    const eventName = OcppEvents.ClearCache;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = { status: "Accepted" };

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleDataTransfer = (client) => {
  client.handle(OcppEvents.DataTransfer, async ({ params }) => {
    const eventName = OcppEvents.DataTransfer;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = { status: "Accepted" };

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleGetConfiguration = (client) => {
  client.handle(OcppEvents.GetConfiguration, async ({ params }) => {
    const eventName = OcppEvents.GetConfiguration;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = { status: "Accepted" };

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleHeartbeat = (client) => {
  client.handle(OcppEvents.Heartbeat, async ({ params }) => {
    const eventName = OcppEvents.Heartbeat;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = { currentTime: DateTime.utc().toISO() };

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleMeterValues = (client) => {
  client.handle(OcppEvents.MeterValues, async ({ params }) => {
    const eventName = OcppEvents.MeterValues;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = {};

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleRemoteStartTransaction = (client) => {
  client.handle(OcppEvents.RemoteStartTransaction, async ({ params }) => {
    const eventName = OcppEvents.RemoteStartTransaction;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = { status: "Accepted" };

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleRemoteStopTransaction = (client) => {
  client.handle(OcppEvents.RemoteStopTransaction, async ({ params }) => {
    const eventName = OcppEvents.RemoteStopTransaction;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = { status: "Accepted" };

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleReset = (client) => {
  client.handle(OcppEvents.Reset, async ({ params }) => {
    const eventName = OcppEvents.Reset;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = { status: "Accepted" };

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleStartTransaction = (client) => {
  client.handle(OcppEvents.StartTransaction, async ({ params }) => {
    const eventName = OcppEvents.StartTransaction;
    const clientId = client.identity;
    let { connectorId, meterStart, timestamp } = params;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:\nconnector id: ${connectorId}\ntime: ${timestamp}\nmeterStart: ${meterStart}`,
        params
      );
    }

    let responseData = { idTagInfo: { status: "Accepted" }, transactionId: 1 };

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleStatusNotification = (client) => {
  client.handle(OcppEvents.StatusNotification, async ({ params }) => {
    const eventName = OcppEvents.StatusNotification;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = {};

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleStopTransaction = (client) => {
  client.handle(OcppEvents.StopTransaction, async ({ params }) => {
    const eventName = OcppEvents.StopTransaction;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = { idTagInfo: { status: "Accepted" } };

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleUnlockConnector = (client) => {
  client.handle(OcppEvents.UnlockConnector, async ({ params }) => {
    const eventName = OcppEvents.UnlockConnector;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = { status: "Unlocked" };

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleGetDiagnostics = (client) => {
  client.handle(OcppEvents.GetDiagnostics, async ({ params }) => {
    const eventName = OcppEvents.GetDiagnostics;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = { fileName: "diagnostics.txt" };

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleDiagnosticsStatusNotification = (client) => {
  client.handle(
    OcppEvents.DiagnosticsStatusNotification,
    async ({ params }) => {
      const eventName = OcppEvents.DiagnosticsStatusNotification;
      const clientId = client.identity;
      if (logConsoles) {
        console.log(
          `EXTERNAL: Server got ${eventName} from ${clientId}:`,
          params
        );
      }

      let responseData = {};

      try {
        responseData = await processOcppEvent(
          {
            clientId,
            eventName,
            params,
          },
          responseData
        );
      } catch (error) {}

      return responseData;
    }
  );
};

const handleFirmwareStatusNotification = (client) => {
  client.handle(OcppEvents.FirmwareStatusNotification, async ({ params }) => {
    const eventName = OcppEvents.FirmwareStatusNotification;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = {};

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleGetLocalListVersion = (client) => {
  client.handle(OcppEvents.GetLocalListVersion, async ({ params }) => {
    const eventName = OcppEvents.GetLocalListVersion;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = { listVersion: 1 };

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleCancelReservation = (client) => {
  client.handle(OcppEvents.CancelReservation, async ({ params }) => {
    const eventName = OcppEvents.CancelReservation;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = { status: "Accepted" };

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleReserveNow = (client) => {
  client.handle(OcppEvents.ReserveNow, async ({ params }) => {
    const eventName = OcppEvents.ReserveNow;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = { status: "Accepted" };

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleClearChargingProfile = (client) => {
  client.handle(OcppEvents.ClearChargingProfile, async ({ params }) => {
    const eventName = OcppEvents.ClearChargingProfile;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = { status: "Accepted" };

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleGetCompositeSchedule = (client) => {
  client.handle(OcppEvents.GetCompositeSchedule, async ({ params }) => {
    const eventName = OcppEvents.GetCompositeSchedule;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = { status: "Accepted" };

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleSetChargingProfile = (client) => {
  client.handle(OcppEvents.SetChargingProfile, async ({ params }) => {
    const eventName = OcppEvents.SetChargingProfile;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = { status: "Accepted" };

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleTriggerMessage = (client) => {
  client.handle(OcppEvents.TriggerMessage, async ({ params }) => {
    const eventName = OcppEvents.TriggerMessage;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = { status: "Accepted" };

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

const handleLogStatusNotification = (client) => {
  client.handle(OcppEvents.LogStatusNotification, async ({ params }) => {
    const eventName = OcppEvents.LogStatusNotification;
    const clientId = client.identity;
    if (logConsoles) {
      console.log(
        `EXTERNAL: Server got ${eventName} from ${clientId}:`,
        params
      );
    }

    let responseData = { status: "Uploaded" };

    try {
      responseData = await processOcppEvent(
        {
          clientId,
          eventName,
          params,
        },
        responseData
      );
    } catch (error) {}

    return responseData;
  });
};

// ----------------------------------------------------------------------------
// Export all OCPP Event Handlers
const handleExternalOcppEvents = (client) => {
  handleAuthorize(client);
  handleBootNotification(client);
  handleChangeAvailability(client);
  handleChangeConfiguration(client);
  handleClearCache(client);
  handleDataTransfer(client);
  handleGetConfiguration(client);
  handleHeartbeat(client);
  handleMeterValues(client);
  handleRemoteStartTransaction(client);
  handleRemoteStopTransaction(client);
  handleReset(client);
  handleStartTransaction(client);
  handleStatusNotification(client);
  handleStopTransaction(client);
  handleUnlockConnector(client);
  handleGetDiagnostics(client);
  handleDiagnosticsStatusNotification(client);
  handleFirmwareStatusNotification(client);
  handleGetLocalListVersion(client);
  handleCancelReservation(client);
  handleReserveNow(client);
  handleClearChargingProfile(client);
  handleGetCompositeSchedule(client);
  handleSetChargingProfile(client);
  handleTriggerMessage(client);
  handleLogStatusNotification(client);
};

module.exports = {
  handleExternalOcppEvents,
};
