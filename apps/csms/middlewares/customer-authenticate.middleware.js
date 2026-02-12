const jwt = require("jsonwebtoken");
const { customErrorMsg } = require("@shared-libs/constants");
const {
  CustomersRepository,
  CustomerSessionRepository,
  GuestCustomerSessionRepository,
  GuestCustomersRepository,
} = require("@shared-libs/db/mysql");
const { ObjectDAO } = require("@shared-libs/helpers");

const CustomerAuthenticate = async (req, res, next) => {
  const bearerToken =
    req.headers["authorization"] ?? req.headers["Authorization"];

  let token = null;
  if (bearerToken) {
    token = bearerToken.replace("Bearer ", "");
  }

  if (token) {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

      if (decodedToken.customerId) {
        const customer = await CustomersRepository.findOne({
          where: { id: decodedToken.customerId },
        });

        const session = await CustomerSessionRepository.findOne({
          where: { token, status: "CURRENT" },
        });

        if (!session || !customer) {
          return res
            .status(401)
            .json({ message: customErrorMsg.auth.UNAUTHORIZED });
        }

        // const sessionData = {
        //   id: session?.id,
        //   customerId: session?.customerId,
        //   token: session?.token,
        //   refreshToken: session?.refreshToken,
        //   status: session?.status,
        //   expireAt: session?.expireAt,
        // };
        const sessionData = session;

        if (customer) {
          req.loggedInUserData = {
            customerId: customer?.id,
            isOnboarded: customer?.isOnboarded,
            customer: ObjectDAO(customer),
            session: sessionData,
            isGuest: false,
          };
        }
      }

      if (decodedToken.guestCustomerId) {
        const guestCustomer = await GuestCustomersRepository.findOne({
          where: { id: decodedToken.guestCustomerId },
        });

        const guestSession = await GuestCustomerSessionRepository.findOne({
          where: { token, status: "CURRENT" },
        });

        // const guestSessionData = {
        //   id: guestSession?.id,
        //   customerId: guestSession?.customerId,
        //   token: guestSession?.token,
        //   refreshToken: guestSession?.refreshToken,
        //   status: guestSession?.status,
        //   expireAt: guestSession?.expireAt,
        // };
        const guestSessionData = guestSession;

        if (!guestSession || !guestCustomer) {
          return res
            .status(401)
            .json({ message: customErrorMsg.auth.UNAUTHORIZED });
        }

        if (guestCustomer) {
          req.loggedInUserData = {
            customerId: guestCustomer?.id,
            isOnboarded: guestCustomer?.isOnboarded,
            customer: ObjectDAO(guestCustomer),
            session: guestSessionData,
            isGuest: true,
          };
        }
      }
      next();
    } catch (error) {
      res.status(401).json({ message: customErrorMsg.auth.UNAUTHORIZED });
    }
  } else {
    res.status(401).json({ message: customErrorMsg.auth.UNAUTHORIZED });
  }
};

module.exports = {
  CustomerAuthenticate,
};
