const {
  CpoUserRoleRepository,
  CpoUserRepository,
} = require("@shared-libs/db/mysql");
const { Not } = require("typeorm");
const {
  toSnakeCase,
  getSubscriptionUsage,
  ObjectDAO,
} = require("@shared-libs/helpers");
const { HandleMySqlList } = require("@shared-libs/db");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const addCpoUserRole = async (req, res) => {
  try {
    const payload = req.body;
    const { name, permissions, isPartnerRole = false } = payload;

    if (!name) {
      return res.status(400).json({ message: "Role Name Is Required" });
    } else {
      if (name.trim() == "") {
        return res.status(400).json({ message: "Role Name Is Required" });
      }
    }

    const loggedInUserData = req["loggedInUserData"];
    const loggedInUser = loggedInUserData["user"];

    let subscriptionUsage = {};
    if (loggedInUserData?.settings?.subscriptionUsage) {
      subscriptionUsage = loggedInUserData?.settings?.subscriptionUsage;
    } else {
      subscriptionUsage = await getSubscriptionUsage(loggedInUser.cpoId);
    }

    // Check Subscription Limit
    subscriptionUsage = subscriptionUsage?.roles;

    if (
      !isPartnerRole &&
      subscriptionUsage?.limit - subscriptionUsage?.used <= 0
    ) {
      return res.status(400).json({
        message: "CPO Has Exceeded The Limit Of Creating Roles.",
      });
    }

    const cpoUserRole = await CpoUserRoleRepository.findOne({
      where: {
        cpoId: loggedInUser.cpoId,
        code: toSnakeCase(name),
        isPartnerRole,
        isDeleted: false,
      },
    });
    if (cpoUserRole) {
      return res.status(400).json({ message: "This Role Already Exists" });
    }

    const createdCpoUserRole = await CpoUserRoleRepository.save({
      cpoId: loggedInUser.cpoId,
      name: name,
      code: toSnakeCase(name),
      isPartnerRole,
      permissions,
    });

    res.status(200).json(createdCpoUserRole);
  } catch (error) {
    console.error("Error registering user:", error);
    res
      .status(500)
      .json({ message: "An Error Occurred While Registering The User." });
  }
};

const getCpoUserRoleList = async (req, res) => {
  try {
    const { partner } = req.query;
    const loggedInUser = req["loggedInUserData"]["user"];

    const listParams = {
      entityName: "CpoUserRole",
      baseQuery: {
        isDeleted: false,
        cpoId: loggedInUser.cpoId,
        isPartnerRole: partner == "true" ? true : false,
      },
      req,
    };

    const listResponse = await HandleMySqlList(listParams);
    if (listResponse.list && listResponse.list.length > 0) {
      const newList = listResponse.list.map((role) => {
        return ObjectDAO(role);
      });
      listResponse.list = newList;
    }
    res.status(200).json(listResponse);
  } catch (error) {
    console.error("Error fetching CPO Role list:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getCpoUserRoleById = async (cpoUserRoleId, req, res) => {
  try {
    const loggedInUser = req["loggedInUserData"]["user"];
    const cpoUserRole = await CpoUserRoleRepository.findOne({
      where: { id: cpoUserRoleId, cpoId: loggedInUser.cpoId },
    });

    if (!cpoUserRole) {
      return res.status(404).json({ message: "CPO Role Not Found" });
    }

    res.status(200).json(ObjectDAO(cpoUserRole));
  } catch (error) {
    console.error("Error fetching CPO Role:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateCpoUserRoleById = async (cpoUserRoleId, req, res) => {
  try {
    const payload = req.body;
    const { name, permissions } = payload;

    const loggedInUser = req["loggedInUserData"]["user"];
    const cpoUserRole = await CpoUserRoleRepository.findOne({
      where: { id: cpoUserRoleId, cpoId: loggedInUser.cpoId },
    });

    if (!cpoUserRole) {
      return res.status(404).json({ message: "CPO Role Not Found" });
    }
    if (cpoUserRole.isDefault) {
      return res
        .status(400)
        .json({ message: "Default Role Cannot Be Updated" });
    }

    if (!name) {
      return res.status(400).json({ message: "Role Name Is Required" });
    } else {
      if (name.trim() == "") {
        return res.status(400).json({ message: "Role Name Is Required" });
      }
    }

    const cpoUserRoleCheck = await CpoUserRoleRepository.findOne({
      where: {
        id: Not(cpoUserRoleId),
        cpoId: loggedInUser.cpoId,
        code: toSnakeCase(name),
        isDeleted: false,
      },
    });
    if (cpoUserRoleCheck) {
      return res.status(400).json({ message: "Role Already Exists" });
    }

    await CpoUserRoleRepository.update(cpoUserRoleId, {
      name: name,
      code: toSnakeCase(name),
      permissions,
    });

    const updatedCpoUserRole = await CpoUserRoleRepository.findOne({
      where: { id: cpoUserRoleId },
    });

    res.status(200).json(updatedCpoUserRole);
  } catch (error) {
    console.error("Error Updating CPO Role:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteCpoUserRoleById = async (cpoUserRoleId, req, res) => {
  try {
    const loggedInUser = req["loggedInUserData"]["user"];
    const cpoUserRole = await CpoUserRoleRepository.findOne({
      where: { id: cpoUserRoleId, cpoId: loggedInUser.cpoId },
    });

    if (!cpoUserRole) {
      return res.status(404).json({ message: "CPO Role Not Found" });
    }
    if (cpoUserRole.isDefault) {
      return res
        .status(400)
        .json({ message: "Default Role Cannot Be Deleted" });
    }

    const cpoUsers = await CpoUserRepository.find({
      where: { cpoUserRoleId, cpoId: loggedInUser.cpoId, isDeleted: false },
    });

    if (cpoUsers.length > 0) {
      return res.status(400).json({
        message: "Role Cannot Be Deleted. It Is Already Assigned To Users",
      });
    }

    await CpoUserRoleRepository.update(cpoUserRoleId, {
      isDeleted: true,
    });

    const updatedCpoUserRole = await CpoUserRoleRepository.findOne({
      where: { id: cpoUserRoleId },
    });

    res.status(200).json(updatedCpoUserRole);
  } catch (error) {
    console.error("Error Deleting CPO Role:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  addCpoUserRole,
  getCpoUserRoleList,
  getCpoUserRoleById,
  updateCpoUserRoleById,
  deleteCpoUserRoleById,
};
