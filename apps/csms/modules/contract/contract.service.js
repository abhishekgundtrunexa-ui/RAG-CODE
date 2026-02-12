const {
  ContractRepository,
  ContractPartnersRepository,
  ContractEvseStationsRepository,
  ContractActivityRepository,
  EvseStationRepository,
  PartnerViewRepository,
  EMspUserRepository,
  OcppTransactionsRepository,
  UserRepository,
} = require("@shared-libs/db/mysql");
const { HandleMySqlList } = require("@shared-libs/db");
const {
  ObjectDAO,
  generateRandomCodeForContract,
  arrayObjStr,
} = require("@shared-libs/helpers");
const { Like, IsNull, In } = require("typeorm");
const { UserStatuses } = require("@shared-libs/constants");
const { convertDateTimezone } = require("@shared-libs/helpers");
const { DateTime } = require("luxon");
const { getTimezoneByCountry } = require("@shared-libs/helpers");

const createContract = async (req, res) => {
  try {
    const { userId: createdBy } = req?.loggedInUserData;

    const { validFrom, validTo, evseStationIds, partners } = req.body;

    const contractCode = generateRandomCodeForContract(6).toUpperCase();

    if (!evseStationIds || evseStationIds.length === 0) {
      return res.status(400).json({ message: "EVSE Station IDs are required" });
    }
    if (!partners || partners.length === 0) {
      return res.status(400).json({ message: "Partner IDs are required" });
    }
    if (!validFrom) {
      return res.status(400).json({ message: "Valid From is required" });
    }
    if (!validTo) {
      return res.status(400).json({ message: "Valid To is required" });
    }
    let country = req?.body?.country;
    // if (!country) {
    //   return res.status(400).json({ message: "Country is required" });
    // }

    const partnerIds = partners.map((p) => p.id);
    const uniquePartnerIds = new Set(partnerIds);

    if (uniquePartnerIds.size !== partnerIds.length) {
      return res
        .status(400)
        .json({ message: `Partner is already linked to this contract.` });
    }

    const emspUser = await EMspUserRepository.findOne({
      where: {
        isDeleted: false,
        isEmsp: true,
        apexEmailVerified: true,
        country,
      },
    });

    const emspId = emspUser?.emspId;
    country = emspUser?.country ?? req?.body?.country;

    const contract = ContractRepository.create({
      contractCode: contractCode,
      validFrom: validFrom,
      validTo: validTo,
      emspId,
      country,
      createdBy: createdBy,
    });

    const savedContract = await ContractRepository.save(contract);

    // Create contract partners
    for (const partner of partners) {
      const { id, partnerType, splitPercentage } = partner;
      const partnerData = await PartnerViewRepository.findOne({
        where: { id, isDeleted: false },
      });
      if (!partnerData) {
        return res
          .status(400)
          .json({ message: `Partner with ID ${id} not found` });
      }

      const contractPartner = ContractPartnersRepository.create({
        contractId: savedContract.id,
        partnerId: id,
        partnerType: partnerType,
        splitPercentage: splitPercentage,
        isVerified: false,
      });

      await ContractPartnersRepository.save(contractPartner);
    }

    // Create contract EVSE stations
    for (const evseStationId of evseStationIds) {
      // Verify EVSE station exists
      const evseStation = await EvseStationRepository.findOne({
        where: { id: evseStationId, isDeleted: false },
      });
      if (!evseStation) {
        return res
          .status(400)
          .json({ message: `EVSE Station with ID ${evseStationId} not found` });
      }

      const contractEvseStation = ContractEvseStationsRepository.create({
        contractId: savedContract.id,
        evseStationId: evseStationId,
      });

      await ContractEvseStationsRepository.save(contractEvseStation);
    }

    const timezone = await getTimezoneByCountry(country);
    const createdAtLocal = convertDateTimezone(DateTime.utc(), timezone);

    // Log contract activity
    const contractActivity = ContractActivityRepository.create({
      contractId: savedContract.id,
      userId: createdBy,
      action: "Contract Created",
      details: `Contract created successfully`,
      createdAtLocal: createdAtLocal,
    });

    await ContractActivityRepository.save(contractActivity);

    res.status(201).json(savedContract);
  } catch (error) {
    console.error("Error creating contract:", error);
    res
      .status(500)
      .json({ message: "Failed to create contract", error: error.message });
  }
};

const getContracts = async (req, res) => {
  try {
    let baseQuery = { isDeleted: false };

    const { isPartner, isPartnerTeam } = req?.loggedInUserData;

    if (isPartner || isPartnerTeam) {
      const { contractIds = [] } = req?.allowedIds;

      if (contractIds.length == 0) {
        return res.status(200).json({
          list: [],
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
        });
      }

      baseQuery["id"] = {
        custom: true,
        value: `in("${contractIds.join('", "')}")`,
      };
    }

    /**
     * 1. If user is entering partner type filter then check in contract_partner table for partner type, fetch contract ids and then fetch contracts from contract table
     */
    let { partnerType } = req.query;
    if (partnerType && partnerType != "") {
      const contractPartners = await ContractPartnersRepository.find({
        where: { partnerType: partnerType, isDeleted: false },
      });
      const contractIds = contractPartners.map((cp) => cp.contractId);
      baseQuery["id"] = {
        custom: true,
        value: `in("${contractIds.join('", "')}")`,
      };
      if (contractIds.length == 0) {
        return res.status(200).json({
          list: [],
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
        });
      }
    }

    const order = { createdAt: "DESC" };
    const contracts = {
      entityName: "ContractView",
      baseQuery,
      req,
    };
    contracts.order = order;

    const listResponse = await HandleMySqlList(contracts);

    if (listResponse.list.length > 0) {
      listResponse.list = listResponse.list.map((contract) => {
        return ObjectDAO(contract);
      });
    }

    res.status(200).json(listResponse);
  } catch (error) {
    console.error("Error getting contracts:", error);
    res
      .status(500)
      .json({ message: "Failed to get contracts", error: error.message });
  }
};

const getContractById = async (req, res) => {
  try {
    const { id } = req.params;

    const contract = await ContractRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    const order = { createdAt: "DESC" };
    const contracts = {
      entityName: "ContractView",
      baseQuery: { id: id, isDeleted: false },
      req,
    };
    contracts.order = order;

    // get list of contract activities based on contract id and map into the contractView object
    const contractActivity = await ContractActivityRepository.find({
      where: { contractId: id },
    });

    const userIds = contractActivity.map(({ userId }) => userId);
    const { isPartner, isPartnerTeam, userId } = req?.loggedInUserData;

    let contractActivityList = [];

    if (userIds?.length > 0) {
      const users = await UserRepository.find({
        where: { id: In(userIds) },
      });
      const userDatas = arrayObjStr(users, "id", "fullName");

      let i = 0;
      for (const t of contractActivity) {
        let createdBy =
          t.userId === userId ? "You" : (userDatas[t.userId] ?? "-");

        let details = t.details;
        if (
          t.action == "Contract Verification Updated" &&
          t.userId === userId
        ) {
          details = "You have verified the contract";
        }
        contractActivityList[i] = ObjectDAO({ ...t, createdBy, details });
        i++;
      }
    }

    // return contractView object not list
    const listResponse = await HandleMySqlList(contracts);
    const contractView = listResponse.list[0];
    contractView["activities"] = contractActivityList;

    if (isPartner || isPartnerTeam) {
      const { partnerId } = req?.allowedIds;

      if (contractView) {
        let loggedInPartnerData = {};
        if (contractView?.cpoId == partnerId) {
          loggedInPartnerData = {
            partnerId,
            splitPercentage: contractView?.cpoSplitPercentage,
            isVerified: contractView?.cpoVerificationStatus,
            createdAt: contractView?.cpoCreatedAt,
            partnerName: contractView?.cpoName,
            partnerType: "CPO",
            partnerEmail: contractView?.cpoEmail,
          };
        } else if (contractView?.siteHostId == partnerId) {
          loggedInPartnerData = {
            partnerId,
            splitPercentage: contractView?.siteHostSplitPercentage,
            isVerified: contractView?.siteHostVerificationStatus,
            createdAt: contractView?.siteHostCreatedAt,
            partnerName: contractView?.siteHostName,
            partnerType: "SITE HOST",
            partnerEmail: contractView?.siteHostEmail,
          };
        } else {
          loggedInPartnerData = contractView?.investors?.find(
            (inv) => inv.partnerId === partnerId,
          );
          if (loggedInPartnerData) {
            loggedInPartnerData = {
              ...loggedInPartnerData,
              partnerType: "INVESTOR",
            };
          }
        }

        contractView["loggedInPartnerData"] = loggedInPartnerData;
      }
    }

    res.status(200).json(contractView);
  } catch (error) {
    console.error("Error getting contract by ID:", error);
    res
      .status(500)
      .json({ message: "Failed to get contract", error: error.message });
  }
};

const updateContract = async (req, res) => {
  try {
    const { userId: updatedBy } = req?.loggedInUserData;

    const { contractId, validFrom, validTo, evseStationIds, partners } =
      req.body;

    if (!evseStationIds || evseStationIds.length === 0) {
      return res.status(400).json({ message: "EVSE Station IDs are required" });
    }
    if (!partners || partners.length === 0) {
      return res.status(400).json({ message: "Partner IDs are required" });
    }
    if (!validFrom) {
      return res.status(400).json({ message: "Valid From is required" });
    }
    if (!validTo) {
      return res.status(400).json({ message: "Valid To is required" });
    }

    // Check if contract exists
    const existingContract = await ContractRepository.findOne({
      where: { id: contractId, isDeleted: false },
    });

    if (!existingContract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Update contract
    await ContractRepository.update(
      { id: contractId },
      {
        validFrom: validFrom,
        validTo: validTo,
        updatedBy: updatedBy,
      },
    );

    // Create new contract partners
    for (const partner of partners) {
      const { id, partnerType, splitPercentage } = partner;

      // Verify partner exists
      const partnerData = await PartnerViewRepository.findOne({
        where: { id, isDeleted: false },
      });
      if (!partnerData) {
        return res
          .status(400)
          .json({ message: `Partner with ID ${id} not found` });
      }

      await ContractPartnersRepository.update(
        {
          contractId: contractId,
          partnerId: id,
        },
        {
          partnerType: partnerType,
          splitPercentage: splitPercentage,
          isVerified: false,
        },
      );
    }

    // Create new contract EVSE stations
    for (const evseStationId of evseStationIds) {
      // Verify EVSE station exists
      const evseStation = await EvseStationRepository.findOne({
        where: { id: evseStationId, isDeleted: false },
      });
      if (!evseStation) {
        return res
          .status(400)
          .json({ message: `EVSE Station with ID ${evseStationId} not found` });
      }

      await ContractEvseStationsRepository.update(
        { contractId: contractId },
        { evseStationId: evseStationId },
      );
    }

    const country = existingContract?.country;
    const timezone = await getTimezoneByCountry(country);
    const createdAtLocal = convertDateTimezone(DateTime.utc(), timezone);

    // Log contract activity
    const contractActivity = ContractActivityRepository.create({
      contractId: contractId,
      userId: updatedBy,
      action: "Contract Updated",
      details: `Contract updated successfully`,
      createdAtLocal: createdAtLocal,
    });

    await ContractActivityRepository.save(contractActivity);

    res.status(200).json({ message: "Contract updated successfully" });
  } catch (error) {
    console.error("Error updating contract:", error);
    res
      .status(500)
      .json({ message: "Failed to update contract", error: error.message });
  }
};

const deleteContract = async (req, res) => {
  try {
    const { userId: updatedBy } = req?.loggedInUserData;

    const { id } = req.params;
    const { contractId } = req.body;

    // Check if contract exists
    const existingContract = await ContractRepository.findOne({
      where: { id: contractId, isDeleted: false },
    });

    if (!existingContract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Check if there are already transactions
    const contractTransaction = await OcppTransactionsRepository.count({
      where: { contractId },
    });
    if (contractTransaction > 0) {
      return res.status(400).json({
        message:
          "Cannot delete this Contract. It already have some transactions.",
      });
    }

    // Soft delete contract
    await ContractRepository.update(contractId, {
      isDeleted: true,
      updatedBy,
    });

    // Soft delete contract partners
    await ContractPartnersRepository.update(
      { contractId: contractId },
      { isDeleted: true, updatedBy },
    );

    // Soft delete contract EVSE stations
    await ContractEvseStationsRepository.update(
      { contractId: contractId },
      { isDeleted: true, updatedBy },
    );

    const country = existingContract?.country;
    const timezone = await getTimezoneByCountry(country);
    const createdAtLocal = convertDateTimezone(DateTime.utc(), timezone);

    // Log contract activity
    await ContractActivityRepository.save({
      contractId: contractId,
      userId: updatedBy,
      action: "Contract Deleted",
      details: `Contract deleted successfully`,
      createdAtLocal: createdAtLocal,
    });

    res.status(200).json({ message: "Contract deleted successfully" });
  } catch (error) {
    console.error("Error deleting contract:", error);
    res
      .status(500)
      .json({ message: "Failed to delete contract", error: error.message });
  }
};

// take country as param and show only evse station name, code and country
const searchEvseStation = async (req, res) => {
  try {
    const { query, country } = req.body;

    let baseQuery = { isDeleted: false, allocationRuleId: IsNull() };

    const { isPartner, isPartnerTeam } = req?.loggedInUserData;

    if (isPartner || isPartnerTeam) {
      const { evseStationIds = [] } = req?.allowedIds;

      if (evseStationIds.length == 0) {
        return res.status(200).json([]);
      }

      baseQuery["id"] = In(evseStationIds);
    }

    if (country) {
      baseQuery["country"] = country.toUpperCase();
    }
    if (query) {
      baseQuery["code"] = Like(`%${query}%`);
    }

    const evseStations = await EvseStationRepository.find({
      where: baseQuery,
      select: ["id", "name", "code", "country"],
      order: { createdAt: "DESC" },
    });

    res.status(200).json(evseStations);
  } catch (error) {
    console.error("Error searching EVSE stations:", error);
    res.status(500).json({
      message: "Failed to search EVSE stations",
      error: error.message,
    });
  }
};

const searchPartner = async (req, res) => {
  try {
    const { query } = req.body;
    const { country = null } = req.query;

    let baseQuery = { isDeleted: false, status: UserStatuses.ACTIVE };

    const { isPartner, isPartnerTeam } = req?.loggedInUserData;

    if (isPartner || isPartnerTeam) {
      const { partnerIds = [] } = req?.allowedIds;

      if (partnerIds.length == 0) {
        return res.status(200).json([]);
      }

      baseQuery["id"] = In(partnerIds);
    }

    if (country) {
      baseQuery["country"] = country;
    }
    if (query) {
      baseQuery["fullName"] = Like(`%${query}%`);
    }

    const partners = await PartnerViewRepository.find({
      where: baseQuery,
      select: ["id", "fullName", "partnerCode"],
      order: { createdAt: "DESC" },
      take: 10,
    });

    res.status(200).json(partners);
  } catch (error) {
    console.error("Error searching partners:", error);
    res
      .status(500)
      .json({ message: "Failed to search partners", error: error.message });
  }
};

const verifyContract = async (req, res) => {
  try {
    const { userId: updatedBy } = req?.loggedInUserData;

    const { contractId, partnerId, isVerified, consent } = req.body;

    // Validate required fields
    if (
      !contractId ||
      !partnerId ||
      typeof isVerified !== "boolean" ||
      typeof consent !== "boolean"
    ) {
      return res.status(400).json({
        message:
          "Contract ID, Partner ID, verification status, and consent are required",
      });
    }

    // Check if contract exists
    const contract = await ContractRepository.findOne({
      where: { id: contractId, isDeleted: false },
    });

    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Check if partner exists
    const partner = await PartnerViewRepository.findOne({
      where: { id: partnerId, isDeleted: false },
    });

    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // Check if contract-partner relationship exists
    const contractPartner = await ContractPartnersRepository.findOne({
      where: { contractId, partnerId, isDeleted: false },
    });

    if (!contractPartner) {
      return res
        .status(404)
        .json({ message: "Partner is not associated with this contract" });
    }

    const partnerType = contractPartner.partnerType;

    // Update verification status
    await ContractPartnersRepository.update(
      { id: contractPartner.id },
      { isVerified, consent, updatedBy },
    );

    // Log contract activity

    const country = contract?.country;
    const timezone = await getTimezoneByCountry(country);
    const createdAtLocal = convertDateTimezone(DateTime.utc(), timezone);

    if (isVerified) {
      await ContractActivityRepository.save({
        contractId,
        userId: updatedBy,
        action: "Contract Verification Updated",
        details: `${partnerType} ${partner.fullName} has verified the contract`,
        createdAtLocal: createdAtLocal,
      });
    } else {
      await ContractActivityRepository.save({
        contractId,
        userId: updatedBy,
        action: "Contract Verification Updated",
        details: `${partnerType} ${partner.fullName} has unverified the contract`,
        createdAtLocal: createdAtLocal,
      });
    }

    res.status(200).json({
      message: "Contract verification status updated successfully",
      contractId,
      partnerId,
      isVerified,
      consent,
    });
  } catch (error) {
    console.error("Error verifying contract:", error);
    res
      .status(500)
      .json({ message: "Failed to verify contract", error: error.message });
  }
};

module.exports = {
  createContract,
  getContracts,
  getContractById,
  updateContract,
  deleteContract,
  searchEvseStation,
  searchPartner,
  verifyContract,
};
