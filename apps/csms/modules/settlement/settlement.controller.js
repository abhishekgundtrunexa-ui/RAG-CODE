const settlementService = require("./settlement.service");

const addSettlement = async (req, res) => {
  await settlementService.addSettlement(req, res);
};

const generateSettlement = async (req, res) => {
  await settlementService.generateSettlement(req, res);
};

const addSettlementPartner = async (req, res) => {
  await settlementService.addSettlementPartner(req, res);
};

const getSettlements = async (req, res) => {
  await settlementService.getSettlements(req, res);
};

const getSettlementById = async (req, res) => {
  await settlementService.getSettlementById(req, res);
};

const getSettlementSessions = async (req, res) => {
  await settlementService.getSettlementSessions(req, res);
};

const getSettlementSessionOverview = async (req, res) => {
  await settlementService.getSettlementSessionOverview(req, res);
};

const rejectSettlement = async (req, res) => {
  await settlementService.rejectSettlement(req, res);
};

const updatePartnerTransferStatus = async (req, res) => {
  await settlementService.updatePartnerTransferStatus(req, res);
};

const getSettlementOverview = async (req, res) => {
  await settlementService.getSettlementOverview(req, res);
};

module.exports = {
  addSettlement,
  addSettlementPartner,
  getSettlements,
  getSettlementById,
  getSettlementSessions,
  getSettlementSessionOverview,
  rejectSettlement,
  updatePartnerTransferStatus,
  getSettlementOverview,
  generateSettlement,
};
