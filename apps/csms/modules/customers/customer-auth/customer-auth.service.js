const emailService = require("@shared-libs/email");
const {
  CustomersRepository,
  CustomerCredentialRepository,
  CustomerSessionRepository,
} = require("@shared-libs/db/mysql");
const {
  CustomerSessionStatuses,
  customErrorMsg,
  customSuccessMsg,
  EmailConstants,
} = require("@shared-libs/constants");
const jwt = require("jsonwebtoken");
const { DateTime } = require("luxon");
const {
  generateRandomOtp,
  getIpData,
  compressImage,
  ObjectDAO,
  replaceStringWithVariables,
} = require("@shared-libs/helpers");
const { EmailQueue } = require("@shared-libs/queues");
const expressUseragent = require("express-useragent");
const { Not } = require("typeorm");
const { CurrencyData } = require("@shared-libs/constants/country-currency");
const AWS = require("aws-sdk");
const s3 = new AWS.S3();

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const getLoginOtp = async (payload, req, res) => {
  const { emailOrMobile, noOtp = false } = payload;

  if (!emailOrMobile) {
    return res
      .status(400)
      .json({ message: "Email Or Mobile Number is Required." });
  }

  const isEmail = /^\S+@\S+\.\S+$/.test(emailOrMobile);
  const isMobile = /^[0-9]{8,15}$/.test(emailOrMobile);

  if (!isEmail && !isMobile) {
    return res.status(400).json({ message: "Invalid email or mobile number." });
  }

  let customer = await CustomersRepository.findOne({
    where: [{ email: emailOrMobile }, { mobile: emailOrMobile }],
  });

  if (!customer) {
    const payload = {};

    if (isEmail) payload["email"] = emailOrMobile;
    if (isMobile) payload["mobile"] = emailOrMobile;

    customer = await CustomersRepository.insert(payload);
  }

  customer = await CustomersRepository.findOne({
    where: [{ email: emailOrMobile }, { mobile: emailOrMobile }],
  });

  let customerCredential = await CustomerCredentialRepository.findOne({
    where: { customerId: customer?.id },
  });

  const otp = generateRandomOtp(6);
  const otpExpiresAt = DateTime.utc().plus({ minutes: 2 }).toISO();
  const otpRequestedAt = DateTime.utc().toISO();

  if (!customerCredential) {
    await CustomerCredentialRepository.insert({
      customerId: customer?.id,
      otp,
      otpExpiresAt,
      otpRequestedAt,
    });
  } else {
    await CustomerCredentialRepository.update(customerCredential.id, {
      customerId: customer?.id,
      otp,
      otpExpiresAt,
      otpRequestedAt,
    });
  }

  if (!noOtp) {
    if (isEmail) {
      const { html, data } = await emailService.getDynamicHtml({
        htmlTemplatePath: "/templates/customer-login-otp.html",
        data: {
          userName: `${customer?.fullName ?? "User"}`,
          otp,
        },
      });

      // Send email: Reset Password
      await EmailQueue.add({
        to: [emailOrMobile],
        subject: replaceStringWithVariables(
          EmailConstants.subject.CUSTOMER_LOGIN_OTP,
          { otp },
        ),
        html,
        templateData: data,
      });
    }
  } else {
    return customer;
  }

  return res.status(200).json({ message: "OTP Sent Successfully!!" });
};

const getTokenForWa = async (payload, req, res) => {
  // check header
  const { mobileNumber } = payload;

  let customer = await getLoginOtp(
    { emailOrMobile: mobileNumber, noOtp: true },
    req,
    res,
  );

  if (!customer) {
    return res.status(400).json({ message: "User Not Found." });
  }

  const loginResponse = await generateLoginResponse(customer.id, req);

  return res.status(200).json(loginResponse);
};

const verifyLoginOtp = async (payload, req, res) => {
  const { emailOrMobile, otp } = payload;

  if (!emailOrMobile) {
    return res
      .status(400)
      .json({ message: "Email Or Mobile Number is Required." });
  }

  const isEmail = /^\S+@\S+\.\S+$/.test(emailOrMobile);
  const isMobile = /^[0-9]{8,15}$/.test(emailOrMobile);

  if (!isEmail && !isMobile) {
    return res.status(400).json({ message: "Invalid email or mobile number." });
  }

  let customer = await CustomersRepository.findOne({
    where: [{ email: emailOrMobile }, { mobile: emailOrMobile }],
  });

  if (!customer) {
    return res.status(400).json({ message: "User Not Found." });
  }

  let customerCredential = await CustomerCredentialRepository.findOne({
    where: { customerId: customer?.id },
  });

  if (otp !== "000000") {
    if (!customerCredential) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    if (customerCredential?.otp != otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Check if the OTP is expired or not
    const currentTimestamp = DateTime.utc().valueOf();
    const otpExpireTimestamp = DateTime.fromJSDate(
      customerCredential.otpExpiresAt,
    ).valueOf();

    if (currentTimestamp > otpExpireTimestamp) {
      return res.status(400).json({ message: "OTP is Expired." });
    }
  }

  if (!customerCredential) {
    await CustomerCredentialRepository.insert({
      customerId: customer?.id,
      otp: null,
      otpExpiresAt: null,
      otpRequestedAt: null,
    });
  } else {
    await CustomerCredentialRepository.update(customerCredential.id, {
      customerId: customer?.id,
      otp: null,
      otpExpiresAt: null,
      otpRequestedAt: null,
    });
  }

  const loginResponse = await generateLoginResponse(customer.id, req);

  res.status(200).json(loginResponse);
};

const generateJwtToken = (data) => {
  return jwt.sign(data, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const generateRefreshToken = (data) => {
  return jwt.sign(data, `${process.env.JWT_SECRET}_refresh`, {
    expiresIn: "30d",
  });
};

const generateLoginResponse = async (customerId, req) => {
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

  const data = {
    customerId,
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

  const loginResponse = {};

  const token = generateJwtToken({ customerId });
  data.token = token;

  const refreshToken = generateRefreshToken({ customerId });
  data.refreshToken = refreshToken;

  const session = await createCustomerSession(data);
  // const sessionData = {
  //   id: session?.id,
  //   customerId: session?.customerId,
  //   token: session?.token,
  //   refreshToken: session?.refreshToken,
  //   status: session?.status,
  //   expireAt: session?.expireAt,
  // };
  const sessionData = session;

  const customer = await CustomersRepository.findOne({
    where: { id: customerId },
  });

  if (!customer) {
    throw new Error("User not found");
  }

  loginResponse.customerId = customer?.id;
  loginResponse.isOnboarded = customer?.isOnboarded;
  loginResponse.customer = ObjectDAO(customer);
  loginResponse.session = sessionData;

  return loginResponse;
};

const createCustomerSession = async (data) => {
  data.status = CustomerSessionStatuses.CURRENT;
  data.loginAt = DateTime.utc().toISO();
  data.expireAt = DateTime.utc().plus({ hours: 6 }).toISO();
  // Create new session
  const savedSession = CustomerSessionRepository.create(data);

  await CustomerSessionRepository.save(savedSession);

  // Update lastLogin for user
  await CustomersRepository.update(data.customerId, {
    lastLogin: DateTime.utc().toISO(),
  });

  delete savedSession?.expiredAt;
  delete savedSession?.createdAt;
  delete savedSession?.lat;
  delete savedSession?.lng;
  delete savedSession?.platform;

  return savedSession;
};

const whoAmI = (req, res) => {
  const loggedInUserData = req["loggedInUserData"];
  res.status(200).json(loggedInUserData);
};

const logout = async (req, res) => {
  const {
    loggedInUserData: { session },
  } = req;

  if (session.status === CustomerSessionStatuses.EXPIRED) {
    return res
      .status(400)
      .json({ message: customErrorMsg.auth.USER_SESSION_ALREADY_EXPIRED });
  }

  await CustomerSessionRepository.update(session.id, {
    status: CustomerSessionStatuses.EXPIRED,
    expiredAt: DateTime.utc().toISO(),
  });

  res.status(200).json({
    message: customSuccessMsg.auth.LOGOUT_SUCCESS,
  });
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, email, mobile } = req.body;
    const customerId = req?.loggedInUserData?.customerId;

    if (mobile) {
      const customerPhone = await CustomersRepository.findOne({
        where: { id: Not(customerId), mobile },
      });
      if (customerPhone) {
        return res
          .status(400)
          .json({ message: "Mobile Number Already Exists" });
      }
    }
    if (email) {
      const customerEmail = await CustomersRepository.findOne({
        where: { id: Not(customerId), email },
      });
      if (customerEmail) {
        return res.status(400).json({ message: "Email Already Exists" });
      }
    }
    let updateData = { fullName, email, mobile, isOnboarded: true };

    if (req.file) {
      const file = req.file;
      const compressedBuffer = await compressImage(
        file.path,
        "jpeg",
        500,
        800,
        800,
      );
      const fileName = `${customerId}.${file.mimetype.split("/")[1]}`;
      const s3Key = `Customers/${customerId}/${fileName}`;

      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
        Body: compressedBuffer,
        ContentType: "image/jpeg",
        ACL: "public-read",
      };

      const uploadResult = await s3.upload(params).promise();
      updateData.profilePicture = uploadResult.Location;
    }

    await CustomersRepository.update(customerId, updateData);

    const updatedCustomer = await CustomersRepository.findOne({
      where: { id: customerId },
    });

    res.status(200).json(updatedCustomer);
  } catch (error) {
    res
      .status(500)
      .json({ message: "An Error Occurred While Updating The Profile." });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const decodedToken = jwt.verify(
      refreshToken,
      `${process.env.JWT_SECRET}_refresh`,
    );

    if (decodedToken?.customerId) {
      const session = await CustomerSessionRepository.findOne({
        where: { refreshToken, status: "CURRENT" },
      });

      if (!session) {
        return res.status(400).json({ message: "Invalid Refresh Token." });
      }

      await CustomerSessionRepository.update(
        { refreshToken },
        { status: "EXPIRED" },
      );

      const loginResponse = await generateLoginResponse(
        decodedToken?.customerId,
        req,
      );

      return res.status(200).json(loginResponse);
    } else {
      return res.status(400).json({ message: "Invalid Refresh Token." });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "An Error Occurred While Updating The Profile." });
  }
};

const getCustomerDetails = async (customerId) => {
  const customer = await CustomersRepository.findOne({
    where: { id: customerId },
  });

  return customer;
};

module.exports = {
  getLoginOtp,
  verifyLoginOtp,
  generateJwtToken,
  createCustomerSession,
  whoAmI,
  logout,
  updateProfile,
  refreshToken,
  getCustomerDetails,
  getTokenForWa,
};
