const swaggerJSDoc = require("swagger-jsdoc");
require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

let servers = [];
if (process.env.CGX_ENV !== "local") {
  servers = [
    {
      url: "https://api.chargnex.com/",
      description: "Prod server",
    },
    {
      url: "https://dev.api.chargnex.com/",
      description: "Dev server",
    },
    {
      url: "http://localhost:3001",
      description: "Local server",
    },
  ];
} else {
  servers = [
    {
      url: "http://localhost:3001",
      description: "Local server",
    },
  ];
}

const baseDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Chargnex API",
    version: "1.0.0",
    description: "API documentation for Chargnex",
  },
  // servers,
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

// ✅ Define two completely separate option objects
const fullApiOptions = {
  definition: baseDefinition,
  apis: ["./modules/**/*.swagger.js"],
};

const daApiOptions = {
  definition: baseDefinition,
  apis: ["./modules/**/*.swagger.da.js"],
};

const devApiOptions = {
  definition: baseDefinition,
  apis: ["./modules/**/*.swagger.dev.js"],
};

const ocppApiOptions = {
  definition: baseDefinition,
  apis: ["./modules/**/*.swagger.ocpp.js"],
};

const waApiOptions = {
  definition: baseDefinition,
  apis: ["./modules/**/*.swagger.wa.js"],
};

const hubApiOptions = {
  definition: baseDefinition,
  apis: ["./modules/**/*.swagger.hub.js"],
};

module.exports = {
  swaggerSpec: swaggerJSDoc(fullApiOptions),
  swaggerSpecDa: swaggerJSDoc(daApiOptions),
  swaggerSpecDev: swaggerJSDoc(devApiOptions),
  swaggerSpecOcpp: swaggerJSDoc(ocppApiOptions),
  swaggerSpecWa: swaggerJSDoc(waApiOptions),
  swaggerSpecHub: swaggerJSDoc(hubApiOptions),
};
