const { customErrorMsg } = require("@shared-libs/constants");
const { ApiKeysRepository } = require("@shared-libs/db/mysql");

const ApiKeyAuthenticate = async (req, res, next) => {
  const apiKey = req.headers["cgx-api-key"] ?? null;

  if (apiKey) {
    try {
      const apiKeyData = await ApiKeysRepository.findOne({
        where: { apiKey, isDeleted: false },
      });

      if (apiKeyData) {
        req.loggedInUserData = apiKeyData;
        next();
      } else {
        res.status(401).json({ message: customErrorMsg.auth.UNAUTHORIZED });
      }
    } catch (error) {
      res.status(401).json({ message: customErrorMsg.auth.UNAUTHORIZED });
    }
  } else {
    next();
    // res.status(401).json({ message: customErrorMsg.auth.UNAUTHORIZED });
  }
};

module.exports = {
  ApiKeyAuthenticate,
};
