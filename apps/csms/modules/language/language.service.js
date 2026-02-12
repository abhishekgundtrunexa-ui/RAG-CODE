const { LanguageRepository } = require("@shared-libs/db/mysql");

const addLanguageKey = async (payload, req, res) => {
  const { langFor = "app", langKey, en, fr, es = "" } = payload;

  if (!langFor) {
    return res.status(400).json({ message: "langFor is required." });
  }
  if (!["app", "nexpay"].includes(langFor)) {
    return res
      .status(400)
      .json({ message: "Only 'app' or 'nexpay' is supported for langFor." });
  }

  if (!langKey) {
    return res.status(400).json({ message: "langKey is required." });
  }
  if (!en) {
    return res.status(400).json({ message: "en is required." });
  }

  const check = await LanguageRepository.findOne({
    where: { langFor, langKey },
  });

  if (check) {
    return res.status(400).json({ message: "langKey already exists." });
  }

  await LanguageRepository.save({
    langFor,
    langKey,
    en,
    fr,
    es,
  });
  return res.status(200).json({ message: "langKey added." });
};

const updateLanguageKey = async (payload, req, res) => {
  const { langFor = "app", langKey, en, fr, es = "" } = payload;

  if (!langFor) {
    return res.status(400).json({ message: "langFor is required." });
  }
  if (!["app", "nexpay"].includes(langFor)) {
    return res
      .status(400)
      .json({ message: "Only 'app' or 'nexpay' is supported for langFor." });
  }

  if (!langKey) {
    return res.status(400).json({ message: "langKey is required." });
  }
  if (!en) {
    return res.status(400).json({ message: "en is required." });
  }

  const check = await LanguageRepository.findOne({
    where: { langFor, langKey },
  });

  if (!check) {
    return res.status(400).json({ message: "langKey does not exist." });
  }

  await LanguageRepository.update(check?.id, {
    langFor,
    langKey,
    en,
    fr,
    es,
  });
  return res.status(200).json({ message: "langKey updated." });
};

const getLanguage = async (req, res) => {
  const { langFor = "app" } = req.query;
  if (!["app", "nexpay"].includes(langFor)) {
    return res
      .status(400)
      .json({ message: "Only 'app' or 'nexpay' is supported for langFor." });
  }

  const languageData = await LanguageRepository.find({
    where: { langFor },
  });

  let returnData = {};
  await Promise.all(
    languageData.map(async (ln) => {
      returnData[ln?.langKey] = {
        en: ln?.en,
        fr: ln?.fr,
        es: ln?.es,
      };
    })
  );

  return res.status(200).json(returnData);
};

const getLanguageJson = async (req, res) => {
  const languageData = await LanguageRepository.find({
    order: { langFor: "ASC" },
  });

  let returnData = {};
  await Promise.all(
    languageData.map(async (ln) => {
      returnData[ln?.langKey] = {
        en: ln?.en,
        fr: ln?.fr,
        es: ln?.es,
        langFor: ln?.langFor,
      };
    })
  );

  return res.status(200).json(returnData);
};

module.exports = {
  addLanguageKey,
  updateLanguageKey,
  getLanguage,
  getLanguageJson,
};
