const manageDataService = require("./manage-data.service");
const { getAnalyticsFromDate } = require("@shared-libs/analytics-helper");
const { DateTime } = require("luxon");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

exports.deleteCancelledTransactions = async (req, res) => {
  try {
    await manageDataService.deleteCancelledTransactions(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.hardDeleteContracts = async (req, res) => {
  try {
    await manageDataService.hardDeleteContracts(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateMeterValues = async (req, res) => {
  try {
    await manageDataService.updateMeterValues(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.runCron = async (req, res) => {
  try {
    const { date } = req.body;

    const startDate = DateTime.fromFormat(date, "yyyy-MM-dd", { zone: "UTC" });
    const yesterday = DateTime.utc();

    const dates = [];
    let current = startDate;

    while (current <= yesterday) {
      dates.push(current.toISODate()); // Format: 'YYYY-MM-DD'
      current = current.plus({ days: 1 });
    }

    for (const dt of dates) {
      console.log(`Processing date: ${dt}`);

      await getAnalyticsFromDate(dt);
    }

    return res.status(200).json({
      success: true,
      message: "analytics calculated",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.onboardCharger = async (req, res) => {
  try {
    await manageDataService.onboardCharger(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.syncSettlement = async (req, res) => {
  try {
    await manageDataService.syncSettlement(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.syncCountryIso3 = async (req, res) => {
  try {
    await manageDataService.syncCountryIso3(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteCharger = async (req, res) => {
  try {
    await manageDataService.deleteCharger(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteCpo = async (req, res) => {
  try {
    await manageDataService.deleteCpo(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteEvseStation = async (req, res) => {
  try {
    await manageDataService.deleteEvseStation(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.dateTest = async (req, res) => {
  try {
    await manageDataService.dateTest(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.reGenerateInvoice = async (req, res) => {
  try {
    await manageDataService.reGenerateInvoice(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.reCalculateAndGenerateInvoice = async (req, res) => {
  try {
    await manageDataService.reCalculateAndGenerateInvoice(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.checkStorage = async (req, res) => {
  try {
    await manageDataService.checkStorage(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.checkEmail = async (req, res) => {
  try {
    await manageDataService.checkEmail(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.seedAppLanguage = async (req, res) => {
  try {
    await manageDataService.seedAppLanguage(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getTransactionInvoice = async (req, res) => {
  try {
    await manageDataService.getTransactionInvoice(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.reCallPaymentApi = async (req, res) => {
  try {
    await manageDataService.reCallPaymentApi(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getIpDetails = async (req, res) => {
  try {
    await manageDataService.getIpDetails(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.syncEmspRatesToStation = async (req, res) => {
  try {
    await manageDataService.syncEmspRatesToStation(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.syncRevenue = async (req, res) => {
  try {
    await manageDataService.syncRevenue(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.syncOcppLogs = async (req, res) => {
  try {
    await manageDataService.syncOcppLogs(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.syncTransactionContract = async (req, res) => {
  try {
    await manageDataService.syncTransactionContract(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.viewTransactionLog = async (req, res) => {
  try {
    await manageDataService.viewTransactionLog(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.testPusherMsg = async (req, res) => {
  try {
    await manageDataService.testPusherMsg(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
