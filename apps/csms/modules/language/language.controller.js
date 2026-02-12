const languageService = require("./language.service");

exports.addLanguageKey = async (req, res) => {
  try {
    await languageService.addLanguageKey(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateLanguageKey = async (req, res) => {
  try {
    await languageService.updateLanguageKey(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getLanguage = async (req, res) => {
  try {
    await languageService.getLanguage(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getLanguageJson = async (req, res) => {
  try {
    await languageService.getLanguageJson(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
