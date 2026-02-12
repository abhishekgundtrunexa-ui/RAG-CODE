const { ApiErrorLogsModel } = require("@shared-libs/db/mongo-db");

const allowedPrefixes = [
  "/info",
  "/ip-info",
  "/hub/",
  "/ocpp/",
  "/payment/",
  "/app/",
  "/api/",
];

// Middleware to log error responses (4xx, 5xx)
const LogAPIErrors = (req, res, next) => {
  res.on("finish", async () => {
    if (
      res.statusCode >= 400 &&
      req.originalUrl &&
      allowedPrefixes.some((prefix) => req.originalUrl.startsWith(prefix))
    ) {
      try {
        await ApiErrorLogsModel.create({
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          responseBody: res.locals.responseBody || null, // Store response safely
          requestBody: req.body,
          headers: req.headers,
        });
      } catch (error) {
        console.error("Error saving log:", error?.message);
      }
    }
  });

  // Capture response data safely
  const oldJson = res.json;
  res.json = function (data) {
    res.locals.responseBody = data; // Store response body
    return oldJson.apply(res, arguments);
  };

  next();
};

module.exports = { LogAPIErrors };
