const {
  DepartmentRepository,
  UserRoleRepository,
  UserRepository,
} = require("@shared-libs/db/mysql");
const { toSnakeCase } = require("@shared-libs/helpers");
const { HandleMySqlList } = require("@shared-libs/db");
const { ObjectDAO } = require("@shared-libs/helpers");
const { Not, In, IsNull } = require("typeorm");

const addDepartment = async (req, res) => {
  try {
    const { name, code, permissions = [], isDefault = false } = req.body;
    const loggedInUser = req.loggedInUserData?.user;
    const createdBy = loggedInUser.id;
    let partnerId = null;

    let baseQuery = { isDeleted: false };
    const { isPartner, isPartnerTeam } = req?.loggedInUserData;
    if (isPartner || isPartnerTeam) {
      const { partnerIds = [] } = req?.allowedIds;
      baseQuery["partnerId"] = In(partnerIds);

      partnerId = loggedInUser.id;
    } else {
      baseQuery["partnerId"] = IsNull();
    }

    if (!name) {
      return res.status(400).json({ message: "Department name is required" });
    }
    if (!code) {
      return res.status(400).json({ message: "Department code is required" });
    }

    // Check if name or code already exists
    const existingName = await DepartmentRepository.findOne({
      where: { name, ...baseQuery },
    });

    if (existingName) {
      return res.status(400).json({
        message: "Department name already exists",
      });
    }

    const existingCode = await DepartmentRepository.findOne({
      where: { code, ...baseQuery },
    });

    if (existingCode) {
      return res.status(400).json({
        message: "Department code already exists",
      });
    }

    const department = DepartmentRepository.create({
      name,
      code,
      permissions,
      isDefault,
      partnerId,
      createdBy: createdBy,
    });

    const saved = await DepartmentRepository.save(department);

    res.status(201).json(saved);
  } catch (error) {
    console.error("Error adding department:", error);
    res
      .status(500)
      .json({ message: "Failed to add department", error: error.message });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { name, code, permissions, isDefault } = req.body;
    const loggedInUser = req.loggedInUserData?.user;
    const updatedBy = loggedInUser.id;

    if (!departmentId) {
      return res.status(400).json({ message: "Department ID is required" });
    }

    let baseQuery = { isDeleted: false, id: Not(departmentId) };
    const { isPartner, isPartnerTeam } = req?.loggedInUserData;
    if (isPartner || isPartnerTeam) {
      const { partnerIds = [] } = req?.allowedIds;
      baseQuery["partnerId"] = In(partnerIds);
    } else {
      baseQuery["partnerId"] = IsNull();
    }

    // Check if name or code already exists
    const existingName = await DepartmentRepository.findOne({
      where: { name, ...baseQuery },
    });

    if (existingName) {
      return res.status(400).json({
        message: "Department name already exists",
      });
    }

    const existingCode = await DepartmentRepository.findOne({
      where: { code, ...baseQuery },
    });

    if (existingCode) {
      return res.status(400).json({
        message: "Department code already exists",
      });
    }

    await DepartmentRepository.update(
      { id: departmentId },
      { name, code, permissions, isDefault, updatedBy: updatedBy }
    );

    await UserRepository.update(
      { departmentId },
      { permissions, updatedBy: updatedBy }
    );

    res.status(200).json({ message: "Department updated successfully" });
  } catch (error) {
    console.error("Error updating department:", error);
    res
      .status(500)
      .json({ message: "Failed to update department", error: error.message });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const loggedInUser = req.loggedInUserData?.user;

    if (!departmentId) {
      return res.status(400).json({ message: "Department ID is required" });
    }

    const department = await DepartmentRepository.findOneBy({
      id: departmentId,
    });

    if (!department || department.isDeleted) {
      return res.status(404).json({ message: "Department not found" });
    }

    // if the same departmentId is present in the uesr table, then it cannot be deleted
    const user = await UserRepository.findOneBy({
      departmentId,
      isDeleted: false,
    });
    if (user) {
      return res.status(400).json({
        message:
          "Department cannot be deleted because it is assigned to a user",
      });
    }

    await DepartmentRepository.update(
      { id: departmentId },
      { isDeleted: true }
    );

    res.status(200).json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Error deleting department:", error);
    res
      .status(500)
      .json({ message: "Failed to delete department", error: error.message });
  }
};

const getDepartments = async (req, res) => {
  try {
    const order = { createdAt: "DESC" };

    let baseQuery = { isDeleted: false };
    const { isPartner, isPartnerTeam } = req?.loggedInUserData;
    if (isPartner || isPartnerTeam) {
      const { partnerIds = [] } = req?.allowedIds;

      if (partnerIds.length == 0) {
        return res.status(200).json({
          list: [],
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
        });
      }

      baseQuery["partnerId"] = {
        custom: true,
        value: `in("${partnerIds.join('", "')}")`,
      };
    } else {
      baseQuery["partnerId"] = {
        custom: true,
        value: `IS NULL`,
      };
    }

    const departments = {
      entityName: "Department",
      baseQuery,
      req,
    };
    departments.order = order;

    const listResponse = await HandleMySqlList(departments);

    if (listResponse.list.length > 0) {
      listResponse.list = listResponse.list.map((d) => {
        return ObjectDAO({
          ...d,
        });
      });
    }

    res.status(200).json(listResponse);
  } catch (error) {
    console.error("Error fetching departments:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch departments", error: error.message });
  }
};

const getDepartmentById = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const loggedInUser = req.loggedInUserData?.user;

    if (!departmentId) {
      return res.status(400).json({ message: "Department ID is required" });
    }

    const department = await DepartmentRepository.findOneBy({
      id: departmentId,
      isDeleted: false,
    });

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.status(200).json(department);
  } catch (error) {
    console.error("Error fetching department:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch department", error: error.message });
  }
};

const getDepartmentRoles = async (req, res) => {
  try {
    const { departmentId } = req.params;

    if (!departmentId) {
      return res.status(400).json({ message: "Department ID is required" });
    }

    let baseQuery = { id: departmentId, isDeleted: false };
    const { isPartner, isPartnerTeam } = req?.loggedInUserData;
    if (isPartner || isPartnerTeam) {
      const { partnerIds = [] } = req?.allowedIds;
      baseQuery["partnerId"] = In(partnerIds);
    } else {
      baseQuery["partnerId"] = IsNull();
    }

    const department = await DepartmentRepository.findOne({
      where: baseQuery,
    });

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    const roles = await UserRoleRepository.find({
      select: ["id", "name"],
      where: { departmentId, isDeleted: false },
    });

    res.status(200).json({ roles });
  } catch (error) {
    console.error("Error getting department role list:", error);
    res.status(500).json({
      message: "Failed to get department role list",
      error: error.message,
    });
  }
};

const addDepartmentRole = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { name } = req.body;

    if (!departmentId) {
      return res.status(400).json({ message: "Department ID is required" });
    }
    if (!name) {
      return res.status(400).json({ message: "Role Name Is Required" });
    } else {
      if (name.trim() == "") {
        return res.status(400).json({ message: "Role Name Is Required" });
      }
    }

    const department = await DepartmentRepository.findOne({
      where: { id: departmentId, isDeleted: false },
    });

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    const userRole = await UserRoleRepository.findOne({
      where: {
        departmentId,
        code: toSnakeCase(name),
      },
    });

    if (userRole) {
      return res.status(400).json({ message: "This Role Already Exists" });
    }

    const createdUserRole = await UserRoleRepository.save({
      departmentId,
      name: name,
      code: toSnakeCase(name),
    });

    res.status(200).json(createdUserRole);
  } catch (error) {
    console.error("Error adding department role:", error);
    res
      .status(500)
      .json({ message: "Failed to add department role", error: error.message });
  }
};

module.exports = {
  addDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartments,
  getDepartmentById,
  getDepartmentRoles,
  addDepartmentRole,
};
