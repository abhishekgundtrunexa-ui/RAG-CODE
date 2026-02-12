const contractService = require("./contract.service");

module.exports = {
  createContract: (req, res) => contractService.createContract(req, res),
  getContracts: (req, res) => contractService.getContracts(req, res),
  getContractById: (req, res) => contractService.getContractById(req, res),
  updateContract: (req, res) => contractService.updateContract(req, res),
  deleteContract: (req, res) => contractService.deleteContract(req, res),
  searchEvseStation: (req, res) => contractService.searchEvseStation(req, res),
  searchPartner: (req, res) => contractService.searchPartner(req, res),
  verifyContract: (req, res) => contractService.verifyContract(req, res),
};
