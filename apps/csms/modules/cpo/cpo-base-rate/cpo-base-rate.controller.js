const cpoBaseRateService = require("./cpo-base-rate.service");

exports.addCpoBaseRate = async (req, res) => {
  try {
    await cpoBaseRateService.addCpoBaseRate(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCpoBaseRateList = async (req, res) => {
  try {
    await cpoBaseRateService.getCpoBaseRateList(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCpoBaseRateById = async (req, res) => {
  try {
    const cpoBaseRateId = req.params.cpoBaseRateId;
    await cpoBaseRateService.getCpoBaseRateById(cpoBaseRateId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateCpoBaseRateById = async (req, res) => {
  try {
    const cpoBaseRateId = req.params.cpoBaseRateId;
    await cpoBaseRateService.updateCpoBaseRateById(cpoBaseRateId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteCpoBaseRateById = async (req, res) => {
  try {
    const cpoBaseRateId = req.params.cpoBaseRateId;
    await cpoBaseRateService.deleteCpoBaseRateById(cpoBaseRateId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteCpoBaseRateBulk = async (req, res) => {
  try {
    const { cpoBaseRateIds } = req.body;
    await cpoBaseRateService.deleteCpoBaseRateBulk(cpoBaseRateIds, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.makeDefaultCpoBaseRateById = async (req, res) => {
  try {
    const cpoBaseRateId = req.params.cpoBaseRateId;
    await cpoBaseRateService.makeDefaultCpoBaseRateById(
      cpoBaseRateId,
      req,
      res
    );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
