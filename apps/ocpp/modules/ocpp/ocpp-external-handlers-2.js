const { OcppSource } = require("@shared-libs/constants");
const { getDefaultOcppResponse } = require("@shared-libs/helpers");
const { createExternalOcppLog } = require("@shared-libs/ocpp-log");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const logConsoles = false;

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

// Export all OCPP Event Handlers
const handleExternalOcppEvents = async (eventName, clientId, params = {}) => {
  if (logConsoles) {
    console.log(`EXTERNAL: Server got ${eventName} from ${clientId}:`, params);
  }

  let responseData = getDefaultOcppResponse(eventName, true);
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
};

module.exports = {
  handleExternalOcppEvents,
};
