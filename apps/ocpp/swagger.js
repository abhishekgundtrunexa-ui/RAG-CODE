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
    title: "Chargnex OCPP",
    version: "1.0.0",
    description: "OCPP documentation for Chargnex",
  },
};

// ✅ Define two completely separate option objects
const fullApiOptions = {
  definition: baseDefinition,
  apis: ["./swagger-doc.js"],
};

module.exports = {
  swaggerSpec: swaggerJSDoc(fullApiOptions),
};
