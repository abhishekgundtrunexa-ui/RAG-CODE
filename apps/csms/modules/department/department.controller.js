const departmentService = require("./department.service");

exports.addDepartment = async (req, res) => {
  try {
    await departmentService.addDepartment(req, res);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    await departmentService.updateDepartment(req, res);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    await departmentService.deleteDepartment(req, res);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getDepartments = async (req, res) => {
  try {
    await departmentService.getDepartments(req, res);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    await departmentService.getDepartmentById(req, res);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getDepartmentRoles = async (req, res) => {
  try {
    await departmentService.getDepartmentRoles(req, res);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.addDepartmentRole = async (req, res) => {
  try {
    await departmentService.addDepartmentRole(req, res);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
