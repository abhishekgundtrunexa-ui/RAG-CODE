const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { initializeMySQL } = require("@shared-libs/db/mysql");
const { initializeMongoDB } = require("@shared-libs/db/mongo-db");
const { RegisterApiRoutes } = require("./routes");
const { CronScheduler } = require("./crons/cron.scheduler");
const { LogAPIErrors } = require("./middlewares/api-error-logger.middleware");
const { InitOcppServer } = require("../ocpp/modules/ocpp/ocpp-server");
const { seedMongoDBData, seedMySqlDBData } = require("./seed/seeder");
const {
  swaggerSpec,
  swaggerSpecDa,
  swaggerSpecDev,
  swaggerSpecOcpp,
  swaggerSpecWa,
  swaggerSpecHub,
} = require("./swagger");
const swaggerUi = require("swagger-ui-express");
const { initSocket } = require("./socket");
const { getCountries } = require("@shared-libs/helpers");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });
console.log("Loaded ENV from:", process.env.ENV_FILE || ".env");

// Creating express server instance
const app = express();
// Increase the capacity to accept large payload
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ limit: "150mb", extended: true }));

// Register Global Middleware
app.use(cors());

// Add cookie-parser middleware for handling cookies
app.use(cookieParser());

// Use the logging middleware
app.use(LogAPIErrors);

// /api-docs
app.use(
  "/api-docs",
  swaggerUi.serveFiles(swaggerSpec),
  swaggerUi.setup(swaggerSpec),
);

// /da-api-docs
app.use(
  "/da-api-docs",
  swaggerUi.serveFiles(swaggerSpecDa),
  swaggerUi.setup(swaggerSpecDa),
);

// /dev-api-docs
app.use(
  "/dev-api-docs",
  swaggerUi.serveFiles(swaggerSpecDev),
  swaggerUi.setup(swaggerSpecDev),
);

// /ocpp-api-docs
app.use(
  "/ocpp-api-docs",
  swaggerUi.serveFiles(swaggerSpecOcpp),
  swaggerUi.setup(swaggerSpecOcpp),
);

// wa-api-docs
app.use(
  "/wa-api-docs",
  swaggerUi.serveFiles(swaggerSpecWa),
  swaggerUi.setup(swaggerSpecWa),
);

// hub-api-docs
app.use(
  "/hub-api-docs",
  swaggerUi.serveFiles(swaggerSpecHub),
  swaggerUi.setup(swaggerSpecHub),
);

const startServer = async () => {
  await initializeMySQL();
  await initializeMongoDB();

  if (process.env.CGX_ENV !== "local") {
    await CronScheduler();
    await seedMySqlDBData();
    await seedMongoDBData();
  }
  await getCountries(); // Preload country list

  // Register API Routes
  RegisterApiRoutes(app);

  if (process.env.USE_SAME_OCPP === "true") {
    InitOcppServer(app);
  } else {
    const server = http.createServer(app);

    // Initialize Socket.IO
    initSocket(server);

    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`CSMS running on port ${PORT}`);
      console.log(`Swagger Doc: http://localhost:${PORT ?? 3001}/api-docs`);
      console.log(`Swagger Doc: http://localhost:${PORT ?? 3001}/da-api-docs`);
      console.log(`Swagger Doc: http://localhost:${PORT ?? 3001}/dev-api-docs`);
      console.log(
        `Swagger Doc: http://localhost:${PORT ?? 3001}/ocpp-api-docs`,
      );
      console.log(`Swagger Doc: http://localhost:${PORT ?? 3001}/wa-api-docs`);
      console.log(`Swagger Doc: http://localhost:${PORT ?? 3001}/hub-api-docs`);
    });
  }
};

app.get("/", (req, res) => {
  res.send("Health Check ChargeNex CSMS");
});

startServer();
