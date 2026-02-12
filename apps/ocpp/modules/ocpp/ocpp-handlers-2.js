const { deepClone, getDefaultOcppResponse } = require("@shared-libs/helpers");
const { default: axios } = require("axios");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const logConsoles = false;

const processOcppEvent = async (
  data,
  responseData = {},
  maxRetries = 10,
  retryInterval = 15000
) => {
  let attempt = 0;
  let returnData = deepClone(responseData);

  while (attempt < maxRetries) {
    try {
      const url = `${process.env.CORE_API_BASEURL}/ocpp/handle-event`;
      const response = await axios.post(url, data);
      if (response?.data) {
        returnData = response?.data;
      }
      return returnData;
    } catch (error) {
      const status = error?.response?.status;

      // Only retry on network errors or 5xx server errors
      if (!status || (status >= 500 && status < 600)) {
        attempt++;
        console.log(
          `Attempt ${attempt} failed (status: ${status}). Retrying in ${
            retryInterval / 1000
          }s...`
        );

        if (attempt >= maxRetries) {
          console.log("Max retries reached. Server is still down.");
          return returnData;
        }

        await new Promise((resolve) => setTimeout(resolve, retryInterval));
      } else {
        // If it's a 4xx or any other non-retryable error, fail immediately
        console.log(`Request failed with status ${status}. Not retrying.`);
        return returnData;
      }
    }
  }
};

// Export all OCPP Event Handlers
const handleOcppEvents = async (eventName, clientId, params = {}) => {
  if (logConsoles) {
    console.log(`Server got ${eventName} from ${clientId}:`, params);
  }

  let responseData = getDefaultOcppResponse(eventName);
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
  handleOcppEvents,
};
