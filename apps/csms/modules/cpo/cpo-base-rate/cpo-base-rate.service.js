const {
  CpoBaseRateRepository,
  EvseStationViewRepository,
  CpoRepository,
} = require("@shared-libs/db/mysql");
const { CurrencyData } = require("@shared-libs/constants/country-currency");
const { ObjectDAO } = require("@shared-libs/helpers");
const { HandleMySqlList } = require("@shared-libs/db");
const { In } = require("typeorm");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const addCpoBaseRate = async (req, res) => {
  try {
    let payload = req.body;
    let {
      name,
      baseRateKWH,
      parkingRate,
      taxRate,
      discount,
      penalty,
      currency,
    } = payload;
    const loggedInUser = req["loggedInUserData"]["user"];

    const checkName = await CpoBaseRateRepository.findOne({
      where: { cpoId: loggedInUser.cpoId, name, isDeleted: false },
    });

    if (checkName) {
      return res
        .status(400)
        .json({ message: "Base Rate Name Already Exists." });
    }

    if (!currency) {
      const cpoCurrency = await CpoRepository.findOne({
        where: { id: loggedInUser.cpoId },
      });

      currency = cpoCurrency?.currency ?? currency;
    }

    let currencyName = null;
    let currencySymbol = null;
    if (currency) {
      const currencyDetails = CurrencyData[currency] ?? null;

      if (currencyDetails) {
        currencyName = currencyDetails.name;
        currencySymbol = currencyDetails.symbol;
      }
    }

    let isDefault = false;
    const allBaseRates = await CpoBaseRateRepository.find({
      where: { cpoId: loggedInUser.cpoId, isDeleted: false },
    });
    if (allBaseRates.length === 0) {
      isDefault = true;
    }

    const createdCpoBaseRate = await CpoBaseRateRepository.save({
      cpoId: loggedInUser.cpoId,
      baseRateKWH,
      name,
      parkingRate,
      taxRate,
      discount,
      penalty,
      currency,
      currencyName,
      currencySymbol,
      isDefault,
    });

    res.status(200).json(createdCpoBaseRate);
  } catch (error) {
    res
      .status(500)
      .json({ message: "An Error Occurred While Create Cpo Base Rate." });
  }
};

const getCpoBaseRateList = async (req, res) => {
  try {
    const loggedInUser = req["loggedInUserData"]["user"];

    const listParams = {
      entityName: "CpoBaseRate",
      baseQuery: {
        isDeleted: false,
        cpoId: loggedInUser.cpoId,
      },
      req,
    };

    let listResponse = await HandleMySqlList(listParams);

    if (listResponse.list?.length > 0) {
      listResponse.list = listResponse.list.map((item) => {
        return ObjectDAO(item, ["cpoId"]);
      });
      listResponse.list.sort((a, b) => {
        if (a.name === "default" || a.name === "Default") return -1;
        if (b.name === "default" || b.name === "Default") return 1;
        return 0;
      });
    }
    res.status(200).json(listResponse);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getCpoBaseRateById = async (cpoBaseRateId, req, res) => {
  try {
    const loggedInUser = req["loggedInUserData"]["user"];
    const cpoBaseRate = await CpoBaseRateRepository.findOne({
      where: { id: cpoBaseRateId, cpoId: loggedInUser.cpoId },
    });

    if (!cpoBaseRate) {
      return res.status(404).json({ message: "CPO Base Rate Not Found" });
    }
    res.status(200).json(ObjectDAO(cpoBaseRate, ["cpoId"]));
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateCpoBaseRateById = async (cpoBaseRateId, req, res) => {
  try {
    let payload = req.body;
    const { name: newName } = payload;

    const loggedInUser = req["loggedInUserData"]["user"];

    const cpoBaseRate = await CpoBaseRateRepository.findOne({
      where: { id: cpoBaseRateId, cpoId: loggedInUser.cpoId },
    });

    if (!cpoBaseRate) {
      return res.status(404).json({ message: "CPO Base Rate Not Found" });
    }

    if (newName) {
      if (newName !== cpoBaseRate.name) {
        const checkName = await CpoBaseRateRepository.findOne({
          where: { cpoId: loggedInUser.cpoId, name: newName, isDeleted: false },
        });

        if (checkName) {
          return res
            .status(400)
            .json({ message: "Base Rate Name Already Exists." });
        }
      }
    }

    const {
      name = cpoBaseRate.name,
      baseRateKWH = cpoBaseRate.baseRateKWH,
      parkingRate = cpoBaseRate.parkingRate,
      taxRate = cpoBaseRate.taxRate,
      discount = cpoBaseRate.discount,
      penalty = cpoBaseRate.penalty,
      currency = cpoBaseRate.currency,
    } = payload;

    let currencyName = null;
    let currencySymbol = null;
    if (currency) {
      const currencyDetails = CurrencyData[currency] ?? null;
      if (currencyDetails) {
        currencyName = currencyDetails.name;
        currencySymbol = currencyDetails.symbol;
      }
    }

    await CpoBaseRateRepository.update(cpoBaseRateId, {
      name,
      baseRateKWH,
      parkingRate,
      taxRate,
      discount,
      penalty,
      currency,
      currencyName,
      currencySymbol,
    });

    const updatedCpoBaseRate = await CpoBaseRateRepository.findOne({
      where: { id: cpoBaseRateId },
    });

    res.status(200).json(updatedCpoBaseRate);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteCpoBaseRateById = async (cpoBaseRateId, req, res) => {
  try {
    const loggedInUser = req["loggedInUserData"]["user"];
    const cpoBaseRate = await CpoBaseRateRepository.findOne({
      where: { id: cpoBaseRateId, cpoId: loggedInUser.cpoId },
    });

    if (!cpoBaseRate) {
      return res.status(404).json({ message: "CPO Base Rate Not Found" });
    }

    if (cpoBaseRate["isDefault"]) {
      return res.status(400).json({
        success: false,
        message: "Default BaseRate cannot be deleted!",
      });
    }

    // check if base rate is assigned to
    const evseStation = await EvseStationViewRepository.findOne({
      where: { baseRateId: cpoBaseRateId },
      select: ["id"],
    });
    if (evseStation) {
      return res.status(400).json({
        success: false,
        message: "Base Rate cannot be deleted if assigned to chargers!",
      });
    }
    await CpoBaseRateRepository.update(cpoBaseRateId, {
      isDeleted: true,
    });

    const updatedCpoBaseRate = await CpoBaseRateRepository.findOne({
      where: { id: cpoBaseRateId },
    });

    res.status(200).json(updatedCpoBaseRate);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteCpoBaseRateBulk = async (cpoBaseRateIds, req, res) => {
  try {
    const loggedInUser = req["loggedInUserData"]["user"];
    const cpoBaseRates = await CpoBaseRateRepository.find({
      where: { id: In(cpoBaseRateIds), cpoId: loggedInUser.cpoId },
    });

    if (cpoBaseRates.length != cpoBaseRateIds.length) {
      return res.status(404).json({ message: "CPO Base Rates Not Found" });
    }

    cpoBaseRates.forEach((baseRate) => {
      if (baseRate["isDefault"]) {
        return res.status(400).json({
          success: false,
          message: "Default BaseRate cannot be deleted!",
        });
      }
    });

    // check if base rate is assigned to
    const evseStations = await EvseStationViewRepository.find({
      where: { baseRateId: In(cpoBaseRateIds) },
      select: ["id"],
    });
    if (evseStations.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Base Rate cannot be deleted if assigned to stations!",
      });
    }
    await CpoBaseRateRepository.update(
      { id: In(cpoBaseRateIds), isDeleted: false },
      {
        isDeleted: true,
      }
    );

    const updatedCpoBaseRate = await CpoBaseRateRepository.find({
      where: { id: In(cpoBaseRateIds) },
    });
    const finalRespose = updatedCpoBaseRate.map((dt) => ObjectDAO(dt));

    res.status(200).json(finalRespose);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const makeDefaultCpoBaseRateById = async (cpoBaseRateId, req, res) => {
  try {
    const loggedInUser = req["loggedInUserData"]["user"];

    const cpoBaseRate = await CpoBaseRateRepository.findOne({
      where: { id: cpoBaseRateId, cpoId: loggedInUser.cpoId },
    });

    if (!cpoBaseRate) {
      return res.status(404).json({ message: "CPO Base Rate Not Found" });
    }

    await CpoBaseRateRepository.update(
      { cpoId: loggedInUser.cpoId },
      { isDefault: false }
    );

    await CpoBaseRateRepository.update(cpoBaseRateId, {
      isDefault: true,
    });

    const updatedCpoBaseRate = await CpoBaseRateRepository.findOne({
      where: { id: cpoBaseRateId },
    });

    res.status(200).json(updatedCpoBaseRate);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  addCpoBaseRate,
  getCpoBaseRateList,
  getCpoBaseRateById,
  updateCpoBaseRateById,
  deleteCpoBaseRateById,
  makeDefaultCpoBaseRateById,
  deleteCpoBaseRateBulk,
};
