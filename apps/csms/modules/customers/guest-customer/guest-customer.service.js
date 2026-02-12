const {
  GuestCustomerSessionRepository,
  GuestCustomersRepository,
} = require("@shared-libs/db/mysql");
const { GuestCustomerSessionStatuses } = require("@shared-libs/constants");
const jwt = require("jsonwebtoken");
const { DateTime } = require("luxon");
const { getIpData, ObjectDAO } = require("@shared-libs/helpers");
const expressUseragent = require("express-useragent");
require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const generateJwtToken = (data) => {
  return jwt.sign(data, process.env.JWT_SECRET, {
    expiresIn: "6h",
  });
};

const createCustomerSession = async (data) => {
  data.status = GuestCustomerSessionStatuses.CURRENT;
  data.loginAt = DateTime.utc().toISO();
  data.expireAt = DateTime.utc().plus({ hours: 6 }).toISO();

  const savedSession = await GuestCustomerSessionRepository.create(data);

  await GuestCustomerSessionRepository.save(savedSession);

  return savedSession;
};

const getGuestToken = async (req, res) => {
  let { deviceToken } = req.query;
  let guestCustomerId = req.cookies.guest_customer_id;
  let guestData;
  try {
    if (deviceToken) {
      const existingGuestByDeviceToken = await GuestCustomersRepository.findOne(
        {
          where: { deviceToken },
        }
      );

      if (existingGuestByDeviceToken) {
        guestCustomerId = existingGuestByDeviceToken.id;
      }
    }

    if (!guestCustomerId) {
      const createObject = {
        isDeleted: false,
        deviceToken,
      };
      guestData = await GuestCustomersRepository.save(createObject);
      guestCustomerId = guestData.id;

      res.cookie("guest_customer_id", guestCustomerId, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
    } else {
      guestData = await GuestCustomersRepository.findOne({
        where: { id: guestCustomerId },
      });

      if (!guestData) {
        return res.status(404).json({ message: "Guest Not Found" });
      }
    }

    const geoLocation = await getIpData(req);

    let userAgent = req.headers["user-agent"];
    let userAgentResponse = expressUseragent.parse(userAgent);

    const country = geoLocation?.country ?? "";
    const state = geoLocation?.region ?? "";
    const city = geoLocation?.city ?? "";
    const timezone = geoLocation?.timezone ?? "";
    const lat = geoLocation?.lat ?? "";
    const lng = geoLocation?.lng ?? "";

    const { platform, browser, version, os } = userAgentResponse;

    guestCustomerId = guestData.id;

    const token = generateJwtToken({ guestCustomerId });
    const responseObj = {
      guestCustomerId,
      token,
      country,
      city,
      state,
      lat,
      lng,
      platform: platform[0] || "Unknown",
      browser: browser,
      agent: userAgent,
      timezone,
      browserversion: version,
      os: os,
    };

    const session = await createCustomerSession(responseObj);

    res.status(200).json({
      token,
      session: ObjectDAO(session),
      guestCustomerId,
    });
  } catch (error) {
    console.error("Error generating guest token:", error);
    res.status(500).json({ message: error.message });
  }
};
module.exports = {
  generateJwtToken,
  createCustomerSession,
  getGuestToken,
};
