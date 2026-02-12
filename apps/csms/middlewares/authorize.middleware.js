const { customErrorMsg } = require("@shared-libs/constants");

const Authorize = (permission) => (req, res, next) => {
  const loggedInUser = req.loggedInUserData;
  if (!loggedInUser.user) {
    return res.status(401).json({ message: customErrorMsg.auth.UNAUTHORIZED });
  }

  const userPermissions = [
    ...loggedInUser.permissions.map((p) => p.mappingText),
  ];

  if (userPermissions.length === 0) {
    return res.status(403).json({ message: customErrorMsg.auth.FORBIDDEN });
  }

  if (!userPermissions.includes(permission)) {
    return res.status(403).json({ message: customErrorMsg.auth.FORBIDDEN });
  }

  next();
};

module.exports = {
  Authorize,
};
