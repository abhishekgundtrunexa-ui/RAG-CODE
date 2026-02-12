const cgxTeamService = require("./cgx-team.service");

exports.addUser = async (req, res) => {
  try {
    await cgxTeamService.addUser(req, res);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    await cgxTeamService.updateUser(req, res);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await cgxTeamService.deleteUser(req, res);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    await cgxTeamService.getUsers(req, res);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    await cgxTeamService.getUserById(req, res);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
