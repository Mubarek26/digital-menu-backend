


const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");

// Use the cleaned swagger file to avoid YAML parsing errors caused by tabs
const swaggerDocument = YAML.load(path.join(__dirname, "swagger-clean.yaml"));

function setupSwagger(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

module.exports = setupSwagger;
