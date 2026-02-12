const jwt = require("jsonwebtoken");
const { customErrorMsg } = require("@shared-libs/constants");
const {
  getLoggedInUserFromToken,
  getPartnerAccessData,
} = require("../modules/auth/auth.service");

const Authenticate = async (req, res, next) => {
  const bearerToken =
    req.headers["authorization"] ?? req.headers["Authorization"];

  let token = null;
  if (bearerToken) {
    token = bearerToken.replace("Bearer ", "");
  }

  if (token) {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const { userId } = decodedToken;

      const { code, data } = await getLoggedInUserFromToken(userId, token);
      if (code === 200) {
        req.loggedInUserData = data;
        next();
      } else {
        res.status(code).json(data);
      }
    } catch (error) {
      res.status(401).json({ message: customErrorMsg.auth.UNAUTHORIZED });
    }
  } else {
    res.status(401).json({ message: customErrorMsg.auth.UNAUTHORIZED });
  }
};

const AuthenticatePartner = async (req, res, next) => {
  if (req.loggedInUserData) {
    try {
      let { isPartner, isPartnerTeam, partnerId } = req.loggedInUserData;

      if (isPartner || isPartnerTeam) {
        const { code, data } = await getPartnerAccessData(partnerId);

        if (code === 200) {
          req.allowedIds = data;
          next();
        } else {
          res.status(code).json(data);
        }
      } else {
        next();
      }
    } catch (error) {
      res.status(401).json({ message: customErrorMsg.auth.UNAUTHORIZED });
    }
  } else {
    res.status(401).json({ message: customErrorMsg.auth.UNAUTHORIZED });
  }
};

module.exports = {
  Authenticate,
  AuthenticatePartner,
};
