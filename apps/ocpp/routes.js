const infoRoutes = require("./modules/info/info.route");

const RegisterApiRoutes = (app) => {
  app.use("/info", infoRoutes);
};

module.exports = { RegisterApiRoutes };
