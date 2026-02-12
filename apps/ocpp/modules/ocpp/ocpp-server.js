const { RPCServer } = require("ocpp-rpc");
const { handleOcppEvents } = require("./ocpp-handlers");
const { DateTime } = require("luxon");
const {
  ConnectedChargerStatuses,
  ChargerStatuses,
  OcppEvents,
  OcppSource,
} = require("@shared-libs/constants");
const { ConnectedChargerRepository } = require("@shared-libs/db/mysql");
const { getChargerByIdentity, deepClone } = require("@shared-libs/helpers");
const {
  createOcppLog,
  createExternalOcppLog,
} = require("@shared-libs/ocpp-log");
const { handleExternalOcppEvents } = require("./ocpp-external-handlers");
const { ExternalOcppConnectionModel } = require("@shared-libs/db/mongo-db");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const PORT = process.env.PORT || 3002;
const ALLOW_EXTERNAL_OCPP = process.env.ALLOW_EXTERNAL_OCPP === "true";
const connectedClients = new Map();

const InitOcppServer = (app) => {
  const rpcServer = new RPCServer({
    protocols: ["ocpp1.6"],
    // strictMode: true,
    callTimeoutMs: 86400000,
    // pingIntervalMs: 86400000,
    pingIntervalMs: 30000,
  });

  rpcServer.auth(async (accept, reject, handshake, signal) => {
    const clientId = handshake.identity;
    console.log(clientId, " => Client trying to connect.");

    const charger = await getChargerByIdentity(handshake.identity, {
      isDeleted: false,
    });

    handshake["isCgx"] = false;
    if (charger) {
      console.log(clientId, " => Charger Found In DB.");
      if (charger.status == ChargerStatuses.DISABLED) {
        console.log(clientId, " => Charger is Disabled. Rejecting Connection.");
        reject(401, "Charger is Disabled.");
      }

      console.log(clientId, " => Client Authorized.");

      handshake["isCgx"] = true;
      accept();
    } else {
      console.log(clientId, " => Charger Not Found In DB.");
      if (!ALLOW_EXTERNAL_OCPP) {
        console.log(
          clientId,
          " => External OCPP Connections are not allowed. Rejecting Connection."
        );
        reject(401, "Charger not found.");
      } else {
        console.log(clientId, " => External Client Authorized.");
        accept();
      }
    }
  });

  rpcServer.on("client", async (client) => {
    console.log(client.identity, " => Client Connected.");
    const isCgx = client?.handshake?.isCgx ?? false;

    try {
      const existingClient = connectedClients.get(client.identity);
      if (existingClient && existingClient !== client) {
        console.log(client.identity, " => Replacing stale client object");
      }

      // const whereData1 = {
      //   identity: client.identity,
      //   status: ConnectedChargerStatuses.CONNECTED,
      // };
      // const updateData1 = {
      //   status: ConnectedChargerStatuses.DISCONNECTED,
      //   disConnectedAt: DateTime.utc().toISO(),
      // };

      // if (isCgx) {
      //   await ConnectedChargerRepository.update(whereData1, updateData1);
      // } else {
      //   await ExternalOcppConnectionModel.updateMany(whereData1, updateData1);
      // }
    } catch (error) {}

    //Add client in Map when client is connected
    connectedClients.set(client.identity, client);

    if (false) {
      // INTERCEPTOR: Re-add client on ANY incoming message
      const originalCall = client.handle.bind(client);
      client.handle = async (message, cb) => {
        console.log("🚀 ---------------------🚀");
        console.log("🚀 ~ message:", message);
        console.log("🚀 ---------------------🚀");
        // Ensure client is in map
        if (!connectedClients.has(client.identity)) {
          console.log(
            client.identity,
            " => Message received but client not in map. Re-adding."
          );
          connectedClients.set(client.identity, client);
        }

        return originalCall(message, cb);
      };
    }

    const createData = {
      identity: client.identity,
      connectedAt: DateTime.utc().toISO(),
      remoteAddress: client.handshake.remoteAddress,
      protocols: Array.from(client.handshake.protocols),
      headers: client.handshake.headers,
      status: ConnectedChargerStatuses.CONNECTED,
    };

    if (isCgx) {
      // Event handling for different OCPP events
      handleOcppEvents(client);

      // await ConnectedChargerRepository.insert(createData);
    } else {
      // Event handling for different OCPP events
      handleExternalOcppEvents(client);

      // await ExternalOcppConnectionModel.create(createData);
    }

    //Handle client disconnect event and remove client from Map
    client.on("disconnect", async (data) => {
      const { code, reason } = data;

      console.log(
        client.identity,
        " => Client Disconnected.",
        " -> Code: ",
        code,
        "Reason: ",
        reason
      );

      // CRITICAL: Only delete if this is still the current client
      const currentClient = connectedClients.get(client.identity);
      if (currentClient === client) {
        connectedClients.delete(client.identity);

        // const whereData = {
        //   identity: client.identity,
        //   status: ConnectedChargerStatuses.CONNECTED,
        // };
        // const updateData = {
        //   status: ConnectedChargerStatuses.DISCONNECTED,
        //   disConnectedAt: DateTime.utc().toISO(),
        // };

        // if (isCgx) {
        //   await ConnectedChargerRepository.update(whereData, updateData);
        // } else {
        //   await ExternalOcppConnectionModel.updateMany(whereData, updateData);
        // }
      } else {
        console.log(
          client.identity,
          " => Ignoring disconnect for old client object"
        );
      }
    });

    client.on("connecting", async (data) => {
      console.log(client.identity, " => Got Connecting.");

      connectedClients.set(client.identity, client);
    });
  });

  const httpServer = app.listen(PORT, () => {
    console.log(`OCPP running on port ${PORT}`);
  });

  httpServer.on("upgrade", rpcServer.handleUpgrade);

  const triggerRemoteEvent = async (remoteEventData) => {
    let returnData = {
      code: 400,
      data: { message: "Client is not connected" },
    };

    try {
      const {
        identity,
        eventName,
        ocppSchema,
        logError = false,
      } = remoteEventData;

      const ocppClient = connectedClients.get(identity);

      if (ocppClient) {
        try {
          const isCgx = ocppClient?.handshake?.isCgx ?? false;

          // Send the event from Server -> Client
          const remoteRes = await ocppClient.call(eventName, ocppSchema);
          if (eventName == "RemoteStartTransaction") {
            console.log("🚀 -------------------------🚀");
            console.log(
              "🚀 ~ ocppClient.call RemoteStartTransaction Res:",
              remoteRes
            );
            console.log("🚀 -------------------------🚀");
          }

          let ocppSchemaToSave = deepClone(ocppSchema);
          if (isCgx) {
            try {
              if (eventName === OcppEvents.DataTransfer) {
                if (
                  ocppSchema?.messageId === "chargingAmount" &&
                  ocppSchema?.data
                ) {
                  try {
                    ocppSchemaToSave["parsedData"] = JSON.parse(
                      ocppSchema?.data
                    );
                  } catch (error) {}
                }
              }
            } catch (error) {
              console.log("🚀 -----------------🚀");
              console.log("🚀 ~ error createOcppLog :", error);
              console.log("🚀 -----------------🚀");
            }

            // Save OCPP Logs In Database
            await createOcppLog({
              clientId: identity,
              eventName,
              ocppSchema: ocppSchemaToSave,
              requestFrom: OcppSource.SERVER,
              responseData: remoteRes ?? {},
              responseFrom: OcppSource.CHARGER,
            });
          } else {
            // Save External OCPP Logs In Database
            await createExternalOcppLog({
              clientId: identity,
              eventName,
              ocppSchema: ocppSchemaToSave,
              requestFrom: OcppSource.SERVER,
              responseData: remoteRes ?? {},
              responseFrom: OcppSource.CHARGER,
            });
          }

          returnData = { code: 200, data: remoteRes };
        } catch (err) {
          console.log("🚀 -----------------🚀");
          console.log("🚀 ~ err createOcppLog :", err);
          console.log("🚀 -----------------🚀");
          console.log("🚀 ~ identity :", identity);
          console.log("🚀 ~ eventName :", eventName);
          console.log("🚀 ~ ocppSchema :", ocppSchema);
          console.log("🚀 -----------------🚀");
        }
      } else {
        console.log("🚀 -----------------🚀");
        console.log("🚀 ~ CLIENT NOT CONNECTED");
        console.log("🚀 -----------------🚀");
        console.log("🚀 ~ identity :", identity);
        console.log("🚀 ~ eventName :", eventName);
        console.log("🚀 ~ ocppSchema :", ocppSchema);
        console.log("🚀 -----------------🚀");
        return false;
      }
    } catch (error) {}

    return returnData;
  };

  app.post("/api/ocpp/trigger-remote-event", async (req, res) => {
    try {
      const { identity, eventName, ocppSchema, logError = false } = req?.body;
      const { code, data } = await triggerRemoteEvent({
        identity,
        eventName,
        ocppSchema,
        logError,
      });
      return res.status(code).json(data);
    } catch (error) {}

    return res.status(400).json({ message: "Client is not connected" });
  });

  const triggerEvent = async (req, eventName) => {
    let returnData = {
      code: 400,
      data: { message: "Client is not connected" },
    };

    try {
      const clientId = req.params.client_id;

      returnData = await triggerRemoteEvent({
        identity: clientId,
        eventName,
        ocppSchema: req?.body ?? {},
        logError: false,
      });
    } catch (error) {}

    return returnData;
  };

  app.post("/api/ocpp/:client_id/disconnect-client", async (req, res) => {
    try {
      const clientId = req.params.client_id;
      connectedClients.delete(clientId);
      return res.status(200).json({ message: "Client Disconnected" });
    } catch (error) {
      console.log("🚀 -----------------🚀");
      console.log("🚀 ~ error:", error);
      console.log("🚀 -----------------🚀");
      return res.status(200).json({ message: "Got some error" });
    }
  });

  app.post(
    "/api/ocpp/:client_id/remote-start-transaction",
    async (req, res) => {
      const { code, data } = await triggerEvent(
        req,
        OcppEvents.RemoteStartTransaction
      );

      return res.status(code).json(data);
    }
  );

  app.post("/api/ocpp/:client_id/remote-stop-transaction", async (req, res) => {
    const { code, data } = await triggerEvent(
      req,
      OcppEvents.RemoteStopTransaction
    );

    return res.status(code).json(data);
  });

  app.post("/api/ocpp/:client_id/change-availability", async (req, res) => {
    const { code, data } = await triggerEvent(
      req,
      OcppEvents.ChangeAvailability
    );

    return res.status(code).json(data);
  });

  app.post("/api/ocpp/:client_id/reset", async (req, res) => {
    const { code, data } = await triggerEvent(req, OcppEvents.Reset);

    return res.status(code).json(data);
  });

  app.post("/api/ocpp/:client_id/change-configuration", async (req, res) => {
    const { code, data } = await triggerEvent(
      req,
      OcppEvents.ChangeConfiguration
    );

    return res.status(code).json(data);
  });

  app.post("/api/ocpp/:client_id/get-configuration", async (req, res) => {
    const { code, data } = await triggerEvent(req, OcppEvents.GetConfiguration);

    return res.status(code).json(data);
  });

  app.post("/api/ocpp/:client_id/clear-cache", async (req, res) => {
    const { code, data } = await triggerEvent(req, OcppEvents.ClearCache);

    return res.status(code).json(data);
  });

  app.post("/api/ocpp/:client_id/update-firmware", async (req, res) => {
    const { code, data } = await triggerEvent(req, OcppEvents.UpdateFirmware);

    return res.status(code).json(data);
  });

  app.post("/api/ocpp/:client_id/get-diagnostics", async (req, res) => {
    const { code, data } = await triggerEvent(req, OcppEvents.GetDiagnostics);

    return res.status(code).json(data);
  });

  app.post("/api/ocpp/:client_id/send-local-list", async (req, res) => {
    const { code, data } = await triggerEvent(req, OcppEvents.SendLocalList);

    return res.status(code).json(data);
  });

  app.post("/api/ocpp/:client_id/get-local-list-version", async (req, res) => {
    const { code, data } = await triggerEvent(
      req,
      OcppEvents.GetLocalListVersion
    );

    return res.status(code).json(data);
  });

  app.post("/api/ocpp/:client_id/data-transfer", async (req, res) => {
    const { code, data } = await triggerEvent(req, OcppEvents.DataTransfer);

    return res.status(code).json(data);
  });

  app.post("/api/ocpp/:client_id/trigger-message", async (req, res) => {
    const { code, data } = await triggerEvent(req, OcppEvents.TriggerMessage);

    return res.status(code).json(data);
  });

  app.post("/api/ocpp/:client_id/set-charging-profile", async (req, res) => {
    const { code, data } = await triggerEvent(
      req,
      OcppEvents.SetChargingProfile
    );

    return res.status(code).json(data);
  });

  app.post("/api/ocpp/:client_id/clear-charging-profile", async (req, res) => {
    const { code, data } = await triggerEvent(
      req,
      OcppEvents.ClearChargingProfile
    );

    return res.status(code).json(data);
  });

  app.post("/api/ocpp/:client_id/get-composite-schedule", async (req, res) => {
    const { code, data } = await triggerEvent(
      req,
      OcppEvents.GetCompositeSchedule
    );

    return res.status(code).json(data);
  });
};

const GetConnectedOcppClient = (clientId) => {
  return connectedClients.get(clientId);
};

module.exports = {
  InitOcppServer,
  GetConnectedOcppClient,
};
