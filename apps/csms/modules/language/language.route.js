const { Router } = require("express");
const router = Router();
const languageController = require("./language.controller");

router.post(
  "/add-language-key",
  languageController.addLanguageKey
);
router.post(
  "/update-language-key",
  languageController.updateLanguageKey
);
router.get(
  "/get-language",
  languageController.getLanguage
);
router.get(
  "/get-language-json",
  languageController.getLanguageJson
);

module.exports = router;
