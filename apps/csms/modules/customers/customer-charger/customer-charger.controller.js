const chargerService = require("./customer-charger.service");

exports.getNearbyChargers = async (req, res) => {
  try {
    await chargerService.getNearbyChargers(req, res);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(400).json({ error: error.message });
  }
};

exports.getChargerDetails = async (req, res) => {
  try {
    await chargerService.getChargerDetails(req, res);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(400).json({ error: error.message });
  }
};

exports.remoteStartTransaction = async (req, res) => {
  try {
    await chargerService.remoteStartTransaction(req, res);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(400).json({ error: error.message });
  }
};

exports.remoteStopTransaction = async (req, res) => {
  try {
    await chargerService.remoteStopTransaction(req, res);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(400).json({ error: error.message });
  }
};

exports.reserveNow = async (req, res) => {
  try {
    await chargerService.reserveNow(req, res);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(400).json({ error: error.message });
  }
};

exports.cancelReservation = async (req, res) => {
  try {
    await chargerService.cancelReservation(req, res);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

exports.reserveByStation = async (req, res) => {
  try {
    await chargerService.reserveByStation(req, res);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(400).json({ error: error.message });
  }
};

exports.chargingExperienceFeedback = async (req, res) => {
  try {
    await chargerService.chargingExperienceFeedback(req, res);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

exports.getPayableAmount = async (req, res) => {
  try {
    await chargerService.getPayableAmount(req, res);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

exports.paymentStatusUpdate = async (req, res) => {
  try {
    await chargerService.paymentStatusUpdate(req, res);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};
