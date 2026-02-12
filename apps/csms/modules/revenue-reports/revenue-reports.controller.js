const revenueReportsService = require("./revenue-reports.service");

const getRevenueReports = async (req, res) => {
  await revenueReportsService.getRevenueReports(req, res);
};

module.exports = {
  getRevenueReports,
};
