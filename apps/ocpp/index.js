const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { initializeMySQL } = require("@shared-libs/db/mysql");
const { initializeMongoDB } = require("@shared-libs/db/mongo-db");
const { RegisterApiRoutes } = require("./routes");
const { InitOcppServer2 } = require("./modules/ocpp/ocpp-server-2");
const { InitOcppServer } = require("./modules/ocpp/ocpp-server");
const { swaggerSpec } = require("./swagger");
const swaggerUi = require("swagger-ui-express");
const useServer2 = true;

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

// Creating express server instance
const app = express();
// Increase the capacity to accept large payload
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ limit: "150mb", extended: true }));

// Register Global Middleware
app.use(cors());

// Add cookie-parser middleware for handling cookies
app.use(cookieParser());

// /api-docs
app.use(
  "/api-docs",
  swaggerUi.serveFiles(swaggerSpec),
  swaggerUi.setup(swaggerSpec)
);

const startServer = async () => {
  await initializeMySQL();
  await initializeMongoDB();

  // Initialize OCPP Server
  if (useServer2) {
    InitOcppServer2(app);
  } else {
    InitOcppServer(app);
  }

  // Register API Routes.
  RegisterApiRoutes(app);
};

app.get("/", (req, res) => {
  res.send("Health Check ChargeNex OCPP.");
});

startServer();
