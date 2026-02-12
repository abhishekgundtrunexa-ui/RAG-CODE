const { Not } = require("typeorm");
const { toSnakeCase, ObjectDAO } = require("@shared-libs/helpers");
const { UserRoleRepository, UserRepository } = require("@shared-libs/db/mysql");
const { HandleMySqlList } = require("@shared-libs/db");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const addUserRole = async (req, res) => {
  try {
    const payload = req.body;
    const { name, permissions } = payload;

    if (!name) {
      return res.status(400).json({ message: "Role Name Is Required" });
    } else {
      if (name.trim() == "") {
        return res.status(400).json({ message: "Role Name Is Required" });
      }
    }

    const loggedInUser = req?.loggedInUserData?.user;

    const userRole = await UserRoleRepository.findOne({
      where: {
        eMspId: loggedInUser.eMspId,
        code: toSnakeCase(name),
      },
    });
    if (userRole) {
      return res.status(400).json({ message: "This Role Already Exists" });
    }

    const createdUserRole = await UserRoleRepository.save({
      eMspId: loggedInUser.eMspId,
      name: name,
      code: toSnakeCase(name),
      permissions,
    });

    res.status(200).json(createdUserRole);
  } catch (error) {
    console.error("Error adding user role:", error);
    res
      .status(500)
      .json({ message: "An Error Occurred While Adding User Role." });
  }
};

const getUserRoleList = async (req, res) => {
  try {
    const loggedInUser = req["loggedInUserData"]["user"];
    if (!loggedInUser.isOwner) {
      return res.status(400).json({ message: "eMspId not found!" });
    }
    const listParams = {
      entityName: "UserRole",
      baseQuery: {
        isDeleted: false,
        // eMspId: loggedInUser.eMspId,
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
    console.error("Error fetching User Role list:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getUserRoleById = async (userRoleId, req, res) => {
  try {
    const loggedInUser = req["loggedInUserData"]["user"];
    const userRole = await UserRoleRepository.findOne({
      where: { id: userRoleId, eMspId: loggedInUser.eMspId },
    });

    if (!userRole) {
      return res.status(404).json({ message: "User Role Not Found" });
    }

    res.status(200).json(ObjectDAO(userRole));
  } catch (error) {
    console.error("Error fetching User Role:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateUserRoleById = async (userRoleId, req, res) => {
  try {
    const payload = req.body;
    const { name, permissions } = payload;

    const loggedInUser = req["loggedInUserData"]["user"];
    const userRole = await UserRoleRepository.findOne({
      where: { id: userRoleId, eMspId: loggedInUser.eMspId },
    });

    if (!userRole) {
      return res.status(404).json({ message: "User Role Not Found" });
    }
    if (userRole.isDefault) {
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

    const userRoleCheck = await UserRoleRepository.findOne({
      where: {
        id: Not(userRoleId),
        eMspId: loggedInUser.eMspId,
        code: toSnakeCase(name),
      },
    });
    if (userRoleCheck) {
      return res.status(400).json({ message: "Role Already Exists" });
    }

    await UserRoleRepository.update(userRoleId, {
      name: name,
      code: toSnakeCase(name),
      permissions,
    });

    const updatedUserRole = await UserRoleRepository.findOne({
      where: { id: userRoleId },
    });

    res.status(200).json(updatedUserRole);
  } catch (error) {
    console.error("Error Updating User Role:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteUserRoleById = async (userRoleId, req, res) => {
  try {
    const loggedInUser = req["loggedInUserData"]["user"];
    const userRole = await UserRoleRepository.findOne({
      where: { id: userRoleId, eMspId: loggedInUser.eMspId },
    });

    if (!userRole) {
      return res.status(404).json({ message: "User Role Not Found" });
    }
    if (userRole.isDefault) {
      return res
        .status(400)
        .json({ message: "Default Role Cannot Be Deleted" });
    }

    const users = await UserRepository.find({
      where: { userRoleId, isDeleted: false },
    });

    if (users.length > 0) {
      return res.status(400).json({
        message: "Role Cannot Be Deleted. It Is Already Assigned To Users",
      });
    }

    await UserRoleRepository.update(userRoleId, {
      isDeleted: true,
    });

    const updatedUserRole = await UserRoleRepository.findOne({
      where: { id: userRoleId },
    });

    res.status(200).json(updatedUserRole);
  } catch (error) {
    console.error("Error Deleting User Role:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  addUserRole,
  getUserRoleList,
  getUserRoleById,
  updateUserRoleById,
  deleteUserRoleById,
};
