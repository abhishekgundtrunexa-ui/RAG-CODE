const { HandleMySqlList } = require("@shared-libs/db");
const {
  AllocationRulesRepository,
  CpoUserRepository,
  AllocationPartnersRepository,
  EvseStationRepository,
  ChargerRepository,
} = require("@shared-libs/db/mysql");
const { ObjectDAO } = require("@shared-libs/helpers");
const { In, Not } = require("typeorm");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const addAllocationRule = async (req, res) => {
  try {
    const { ruleName, validFrom, validTill, partnersData } = req.body;
    const loggedInUserData = req["loggedInUserData"];
    //check if rule name already exists
    const ruleNameExists = await AllocationRulesRepository.findOne({
      where: { ruleName, cpoId: loggedInUserData.user?.cpoId },
      select: ["id"],
    });
    if (ruleNameExists) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Allocation Rule with Name " + ruleName + " already exists",
        });
    }
    const createdAllocationRule = await AllocationRulesRepository.save({
      ruleName,
      validFrom,
      validTill,
      cpoId: loggedInUserData.user?.cpoId,
    });
    // add partners for above allocation rule
    const partnersIds = [];
    for (const partner of partnersData) {
      partnersIds.push(partner.partnerId);
    }
    const partners = await CpoUserRepository.find({
      where: { id: In(partnersIds) },
      select: ["id"],
    });
    if (partners.length !== partnersIds.length) {
      return res
        .status(400)
        .json({ success: false, message: "One or more partners not found" });
    }
    let totalAllocation = 0;
    const partnersPayload = [];
    for (const partner of partnersData) {
      partnersPayload.push({
        allocationRuleId: createdAllocationRule.id,
        cpoUserId: partner.partnerId,
        percentage: partner.percentage,
        bankAccountId: partner?.bankAccountId,
      });
      totalAllocation += Number(partner.percentage);
    }
    const allocationPartners = await AllocationPartnersRepository.save(
      partnersPayload
    );
    await AllocationRulesRepository.update(createdAllocationRule.id, {
      totalAllocation,
    });
    const responsePayload = {
      ...ObjectDAO(createdAllocationRule),
      partners: allocationPartners.map((partner) => ObjectDAO(partner)),
    };
    res.status(200).json(responsePayload);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "An Error Occurred While Creating Allocation Rule" });
  }
};

const getAllocationRules = async (req, res) => {
  try {
    const loggedInUserData = req["loggedInUserData"]["user"];
    const listParams = {
      entityName: "AllocationRule",
      baseQuery: {
        isDeleted: false,
        cpoId: loggedInUserData.cpoId,
      },
      req,
    };
    const listResponse = await HandleMySqlList(listParams);
    if (listResponse.list.length <= 0) {
      return res.status(200).json({
        success: true,
        list: [],
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
      });
    }
    const finalData = await Promise.all(
      listResponse.list.map(async (rule) => {
        const stationData = await EvseStationRepository.findOne({
          where: { allocationRuleId: rule.id },
          select: ["id", "name", "country"],
        });
        let chargers = 0;
        if (stationData) {
          chargers = await ChargerRepository.count({
            where: { evseStationId: stationData.id, isDeleted: false },
          });
        }
        const partnersData = await AllocationPartnersRepository.find({
          where: { allocationRuleId: rule.id, isDeleted: false },
          relations: ["cpoUser"],
          select: {
            id: true,
            percentage: true,
            cpoUser: {
              id: true,
              firstName: true,
              lastName: true,
              businessName: true,
            },
          },
        });
        // add cpo_user as a partner in allocation rule
        const cpoUserPartnerData = {
          id: loggedInUserData.id,
          isCpo: true,
          percentage: (100 - Number(rule?.totalAllocation)).toFixed(2),
          cpoUser: {
            id: loggedInUserData.id,
            firstName: loggedInUserData?.firstName,
            lastName: loggedInUserData?.lastName,
          },
        };
        partnersData.push(cpoUserPartnerData);
        return {
          ...rule,
          station: stationData ?? {},
          totalChargers: chargers,
          partners: partnersData,
          totalPartners: partnersData.length || 0,
        };
      })
    );
    return res.status(200).json(finalData);
  } catch (error) {
    res
      .status(500)
      .json({ message: "An Error Occurred While getting Allocation Rule" });
  }
};

const updateAllocationRule = async (req, res) => {
  try {
    const { ruleName, validFrom, validTill, partnersData } = req.body;
    const { allocationRuleId } = req.params;
    const loggedInUserData = req["loggedInUserData"];

    const ruleExists = await AllocationRulesRepository.findOne({
      where: { id: allocationRuleId, cpoId: loggedInUserData.user?.cpoId },
      select: ["id"],
    });
    if (!ruleExists) {
      return res
        .status(400)
        .json({ success: false, message: "Allocation Rule not found!" });
    }

    const ruleNameExists = await AllocationRulesRepository.findOne({
      where: {
        ruleName,
        cpoId: loggedInUserData.user?.cpoId,
        id: Not(allocationRuleId),
      },
      select: ["id"],
    });
    if (ruleNameExists) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Allocation Rule with Name ${ruleName} already exists`,
        });
    }

    await AllocationRulesRepository.update(allocationRuleId, {
      ruleName,
      validFrom,
      validTill,
    });
    const newPartnersData = [];
    const partnersIds = [];
    // Validate partners
    partnersData.map((partner) => {
      if (partner.partnerId != loggedInUserData["user"]["id"]) {
        newPartnersData.push(partner);
        partnersIds.push(partner.partnerId);
      }
    });
    const partners = await CpoUserRepository.find({
      where: { id: In(partnersIds) },
      select: ["id"],
    });
    if (partners.length !== partnersIds.length) {
      return res
        .status(400)
        .json({ success: false, message: "One or more partners not found" });
    }

    let totalAllocation = 0;
    const partnersPayload = newPartnersData.map((partner) => {
      totalAllocation += Number(partner.percentage);
      return {
        allocationRuleId,
        cpoUserId: partner.partnerId,
        percentage: partner.percentage,
        bankAccountId: partner?.bankAccountId,
      };
    });

    await AllocationPartnersRepository.delete({ allocationRuleId });

    const allocationPartners = await AllocationPartnersRepository.save(
      partnersPayload
    );
    await AllocationRulesRepository.update(allocationRuleId, {
      totalAllocation,
    });
    const updatedRule = await AllocationRulesRepository.findOne({
      where: { id: allocationRuleId },
    });

    // Prepare response payload
    const responsePayload = {
      ...ObjectDAO(updatedRule),
      partners: allocationPartners.map((partner) => ObjectDAO(partner)),
    };

    return res.status(200).json(responsePayload);
  } catch (error) {
    return res.status(500).json({
      message: "An Error Occurred While Updating Allocation Rule",
    });
  }
};

const deleteAllocationRule = async (req, res) => {
  try {
    const { allocationRuleId } = req.params;
    const loggedInUserData = req["loggedInUserData"];
    //check if rule name already exists
    const ruleNameExists = await AllocationRulesRepository.findOne({
      where: { id: allocationRuleId, cpoId: loggedInUserData["user"]?.cpoId },
      select: ["id"],
    });
    if (!ruleNameExists) {
      return res
        .status(400)
        .json({ success: false, message: "Allocation Rule not found!" });
    }
    const updatedRule = await AllocationRulesRepository.update(
      allocationRuleId,
      { isDeleted: true }
    );
    return res.status(200).json(updatedRule);
  } catch (error) {
    res
      .status(500)
      .json({ message: "An Error Occurred While getting Allocation Rule" });
  }
};

module.exports = {
  addAllocationRule,
  getAllocationRules,
  updateAllocationRule,
  deleteAllocationRule,
};
