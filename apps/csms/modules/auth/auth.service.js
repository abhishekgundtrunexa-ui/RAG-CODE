const { getDynamicHtml, sendEmail } = require("@shared-libs/email");
const {
  UserRepository,
  UserCredentialRepository,
  UserSessionRepository,
  CpoUserRepository,
  CpoUserCredentialRepository,
  CpoUserRoleRepository,
  CpoUserSessionRepository,
  CpoRepository,
  UserRoleRepository,
  CpoSubscriptionRepository,
  SubscriptionPlanRepository,
  ContractPartnersRepository,
  ContractRepository,
  ContractEvseStationsRepository,
  ChargerRepository,
  EvseStationRepository,
  PartnerAccessViewRepository,
  EMspRepository,
} = require("@shared-libs/db/mysql");
const {
  UserSessionStatuses,
  UserStatuses,
  customErrorMsg,
  customSuccessMsg,
  EmailConstants,
  NotificationTypes,
} = require("@shared-libs/constants");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { DateTime } = require("luxon");
const {
  generateRandomCode,
  getIpData,
  getSubscriptionUsage,
  generateOtp,
  convertDateTimezone,
  getTimezoneByCountry,
} = require("@shared-libs/helpers");
const expressUseragent = require("express-useragent");
const { saveNotification } = require("@shared-libs/notification");
const { EmailQueue } = require("@shared-libs/queues");
const { ActionOtpModel } = require("@shared-libs/db/mongo-db");
const { LessThan, Not, In } = require("typeorm");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const login = async (payload, req, res) => {
  const { email, password } = payload;

  const [user, cpoUser] = await Promise.all([
    UserRepository.findOne({
      where: { email, isDeleted: false },
    }),
    CpoUserRepository.findOne({
      where: { email, isDeleted: false },
    }),
  ]);

  if (!user && !cpoUser) {
    return res
      .status(404)
      .json({ message: customErrorMsg.user.USER_NOT_FOUND });
  }

  let userCredential = {};
  let userId = null;
  if (user) {
    userId = user.id;
    userCredential = await UserCredentialRepository.findOne({
      where: { userId: user.id },
    });
  } else if (cpoUser) {
    userId = cpoUser.id;
    userCredential = await CpoUserCredentialRepository.findOne({
      where: { cpoUserId: cpoUser.id },
    });
  } else {
    return res
      .status(404)
      .json({ message: customErrorMsg.user.USER_NOT_FOUND });
  }

  if (!userCredential) {
    return res
      .status(404)
      .json({ message: customErrorMsg.auth.USER_CREDENTIAL_NOT_FOUND });
  }
  if (!userCredential.password) {
    return res
      .status(401)
      .json({ message: customErrorMsg.auth.USER_CREDENTIAL_NOT_FOUND });
  }

  const validPassword = await bcrypt.compare(password, userCredential.password);

  if (!validPassword) {
    return res
      .status(401)
      .json({ message: customErrorMsg.auth.INVALID_PASSWORD });
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

  const responseObj = {
    userId,
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

  const loginResponse = await generateLoginResponse(responseObj);

  loginResponse.user.lastLoginLocal = convertDateTimezone(
    DateTime.fromJSDate(loginResponse.user.lastLogin),
    loginResponse.user.timezone ?? "UTC"
  );

  // update user status to active
  await UserRepository.update({ id: userId }, { status: "ACTIVE" });

  res.status(200).json(loginResponse);
};

const generateJwtToken = (data) => {
  return jwt.sign(data, process.env.JWT_SECRET, {
    expiresIn: "6h",
  });
};

const getLoggedInUserFromToken = async (userId, token) => {
  const [user, cpoUser] = await Promise.all([
    UserRepository.findOne({
      where: { id: userId, isDeleted: false },
    }),
    CpoUserRepository.findOne({
      where: { id: userId, isDeleted: false },
    }),
  ]);

  let returnData = {
    code: 401,
    data: { message: customErrorMsg.auth.UNAUTHORIZED },
  };

  if (!user && !cpoUser) {
    return returnData;
  }

  const [userSession, cpoUserSession] = await Promise.all([
    UserSessionRepository.findOne({
      where: { token },
    }),
    CpoUserSessionRepository.findOne({
      where: { token },
    }),
  ]);

  if (!userSession && !cpoUserSession) {
    return returnData;
  }

  returnData = {
    code: 200,
    data: {
      userId,
      userEmail: null,
      partnerId: null,
      user: {},
      isSuperAdmin: false,
      isCpo: false,
      isPartner: false,
      isPartnerTeam: false,
      session: {},
      userType: null,
      userRole: null,
      permissions: [],
    },
  };

  if (user) {
    let userRoleName = "";
    let userTypeName = "";
    let userRoleNamePermissions = [];
    let isSuperAdmin = false;
    let isPartner = false;
    let isPartnerTeam = false;
    let partnerId = null;
    let userEmail = user?.email;

    if (user.isSuperAdmin) {
      isSuperAdmin = true;
      userRoleName = "Super Admin";
      userTypeName = "Super Admin";
    } else if (user.isPartner) {
      isPartner = true;
      partnerId = user?.id;
      userRoleName = "Partner";
      userTypeName = "Partner";
    } else {
      const userRole = await UserRoleRepository.findOne({
        where: { id: user?.userRoleId },
      });

      userRoleName = userRole?.name;
      userTypeName = userRole?.code;
      userRoleNamePermissions = userRole?.permissions ?? [];
    }

    if (!isPartner && !isSuperAdmin && user?.partnerId) {
      isPartnerTeam = true;
      partnerId = user?.partnerId;
    }

    // add userRole in user object
    user.userRole = userRoleName;

    returnData.data = {
      ...returnData.data,
      partnerId,
      userEmail,
      user,
      isSuperAdmin,
      isPartner,
      isPartnerTeam,
      session: userSession,
      userRole: userRoleName,
      userType: userTypeName,
      permissions: userRoleNamePermissions,
    };
  } else if (cpoUser) {
    const cpoUserRole = await CpoUserRoleRepository.findOne({
      where: { id: cpoUser.cpoUserRoleId },
    });

    const cpo = await CpoRepository.findOne({
      where: { id: cpoUser.cpoId },
    });
    delete cpo.createdAt;
    delete cpo.updatedAt;
    delete cpo.isDeleted;
    if (!cpo["profilePicture"]) {
      cpo["profilePicture"] =
        "https://cgx-storage.s3.amazonaws.com/1741849442115-logo.svg";
    }

    let cardDetails = [];
    let subscriptionData = {};
    try {
      const subscription = await CpoSubscriptionRepository.findOne({
        where: { cpoId: cpo.id },
      });

      if (subscription) {
        delete subscription.createdAt;
        delete subscription.updatedAt;
        delete subscription.isDeleted;

        const subscriptionPlan = await SubscriptionPlanRepository.findOne({
          where: { id: subscription.subscriptionPlanId },
        });
        delete subscriptionPlan.createdAt;
        delete subscriptionPlan.updatedAt;
        delete subscriptionPlan.isDeleted;

        subscriptionData = {
          subscriptionId: subscription.id,
          purchaseDate: subscription.purchaseDate,
          purchaseDateLocal: subscription.purchaseDateLocal,
          expiryDate: subscription.expiryDate,
          expiryDateLocal: subscription.expiryDateLocal,
          country: subscription.country,
          timezone: subscription.timezone,
          pdfUrl: subscription.pdfUrl,
          subscriptionPlanId: subscriptionPlan.id,
          planName: subscriptionPlan.name,
          allowedMaxCharger: subscriptionPlan.allowedMaxCharger,
          allowedMaxUserAccounts: subscriptionPlan.allowedMaxUserAccounts,
          allowedMaxEvseStations: subscriptionPlan.allowedMaxEvseStations,
          allowedMaxRoles: subscriptionPlan.allowedMaxRoles,
          amount: subscriptionPlan.amount,
          days: subscriptionPlan.days,
        };
      }
    } catch (error) {
      console.log("🚀 -----------------🚀");
      console.log("🚀 ~ error:", error);
      console.log("🚀 -----------------🚀");
      cardDetails = [];
      subscriptionData = {};
    }

    const subscriptionUsage = await getSubscriptionUsage(cpo.id);

    returnData.data = {
      ...returnData.data,
      user: cpoUser,
      isCpo: true,
      session: cpoUserSession,
      userType: cpoUserRole?.code,
      userRole: cpoUserRole?.name,
      permissions: cpoUserRole?.permissions,
      settings: { cpo, subscriptionUsage },
      subscription: subscriptionData ? subscriptionData : {},
      cardDetails: cardDetails,
    };
  }

  return returnData;
};

const getPartnerAccessData = async (partnerId) => {
  const repo = PartnerAccessViewRepository;

  let [
    contractIds,
    partnerIds,
    contractEvseStationIds,
    directEvseStationIds,
    chargerIds,
    chargeBoxIds,
  ] = await Promise.all([
    // contractIds
    repo
      .createQueryBuilder("p")
      .select("DISTINCT p.contractId", "id")
      .where("p.partnerId = :partnerId", { partnerId })
      .getRawMany()
      .then((rows) => rows.map((r) => r.id).filter(Boolean)),

    // partnerIds
    repo
      .createQueryBuilder("p")
      .select("DISTINCT p.relatedPartnerId", "id")
      .where("p.partnerId = :partnerId", { partnerId })
      .getRawMany()
      .then((rows) => rows.map((r) => r.id).filter(Boolean)),

    // contractEvseStationIds
    repo
      .createQueryBuilder("p")
      .select("DISTINCT p.contractEvseStationId", "id")
      .where("p.partnerId = :partnerId", { partnerId })
      .getRawMany()
      .then((rows) => rows.map((r) => r.id).filter(Boolean)),

    // directEvseStationIds
    repo
      .createQueryBuilder("p")
      .select("DISTINCT p.directEvseStationId", "id")
      .where("p.partnerId = :partnerId", { partnerId })
      .getRawMany()
      .then((rows) => rows.map((r) => r.id).filter(Boolean)),

    // chargerIds
    repo
      .createQueryBuilder("p")
      .select("DISTINCT p.chargerId", "id")
      .where("p.partnerId = :partnerId", { partnerId })
      .getRawMany()
      .then((rows) => rows.map((r) => r.id).filter(Boolean)),

    // chargeBoxIds
    repo
      .createQueryBuilder("p")
      .select("DISTINCT p.chargeBoxId", "id")
      .where("p.partnerId = :partnerId", { partnerId })
      .getRawMany()
      .then((rows) => rows.map((r) => r.id).filter(Boolean)),
  ]);

  const evseStationIds = [...contractEvseStationIds, ...directEvseStationIds];

  if (partnerIds?.length == 0) {
    partnerIds = [partnerId];
  }

  return {
    code: 200,
    data: {
      partnerId,
      contractIds,
      partnerIds,
      evseStationIds,
      chargerIds,
      chargeBoxIds,
    },
  };
};

const generateLoginResponse = async (data) => {
  const userId = data.userId;

  const token = generateJwtToken({ userId });
  data.token = token;

  const session = await createUserSession(data);

  if (session?.token) {
    const { code, data } = await getLoggedInUserFromToken(userId, token);

    if (code === 200) {
      return data;
    } else {
      throw new Error("User not found");
    }
  } else {
    throw new Error("User not found");
  }
};

const createUserSession = async (data) => {
  // Create new session
  const {
    userId,
    country,
    city,
    state,
    lat,
    lng,
    platform,
    browser,
    agent,
    timezone,
    browserversion,
    os,
    token,
  } = data;

  const [user, cpoUser] = await Promise.all([
    UserRepository.findOne({
      where: { id: userId, isDeleted: false },
    }),
    CpoUserRepository.findOne({
      where: { id: userId, isDeleted: false },
    }),
  ]);

  if (!user && !cpoUser) {
    throw new Error("User not found");
  }

  if (user) {
    const savedSession = await UserSessionRepository.save({
      userId,
      country,
      city,
      state,
      lat,
      lng,
      platform,
      browser,
      agent,
      timezone,
      token,
      browserversion,
      os,
      status: UserSessionStatuses.CURRENT,
      loginAt: DateTime.utc().toISO(),
      expireAt: DateTime.utc().plus({ hours: 6 }).toISO(),
    });

    // Update lastLogin for user
    await UserRepository.update(userId, {
      lastLogin: DateTime.utc().toISO(),
    });

    return savedSession;
  } else if (cpoUser) {
    const savedSession = await CpoUserSessionRepository.save({
      cpoId: cpoUser.cpoId,
      cpoUserId: cpoUser.id,
      country,
      city,
      state,
      lat,
      lng,
      platform,
      browser,
      agent,
      timezone,
      token,
      browserversion,
      os,
      status: UserSessionStatuses.CURRENT,
      loginAt: DateTime.utc().toISO(),
      expireAt: DateTime.utc().plus({ hours: 6 }).toISO(),
    });

    // Update lastLogin for user
    await CpoUserRepository.update(userId, {
      lastLogin: DateTime.utc().toISO(),
    });

    return savedSession;
  } else {
    throw new Error("User not found");
  }
};

const whoAmI = (req, res) => {
  const loggedInUserData = req["loggedInUserData"];
  res.status(200).json(loggedInUserData);
};

const getProfileConfiguration = async (req, res) => {
  // attach country and currencySymbol from emsp Setting details
  const { emspSettingId } = req["query"];
  const loggedInUserData = req["loggedInUserData"];
  let countryConfig = {};
  let userCountry = null;
  if (emspSettingId) {
    const emspData = await EMspRepository.findOne({
      where: { id: emspSettingId },
    });
    userCountry = emspData?.country;
  } else {
    userCountry = loggedInUserData["user"]["country"];
  }
  const data = await getTimezoneByCountry(userCountry, true);
  countryConfig = {
    country: userCountry,
    currencySymbol: data?.currencySymbol,
  };
  res.status(200).json(countryConfig);
};

const logout = async (req, res) => {
  const {
    loggedInUserData: { session },
  } = req;

  if (session.status === UserSessionStatuses.EXPIRED) {
    return res
      .status(400)
      .json({ message: customErrorMsg.auth.USER_SESSION_ALREADY_EXPIRED });
  }

  await Promise.all([
    UserSessionRepository.update(session.id, {
      status: UserSessionStatuses.EXPIRED,
      expiredAt: DateTime.utc().toISO(),
    }),
    CpoUserSessionRepository.update(session.id, {
      status: UserSessionStatuses.EXPIRED,
      expiredAt: DateTime.utc().toISO(),
    }),
  ]);

  res.status(200).json({
    message: customSuccessMsg.auth.LOGOUT_SUCCESS,
  });
};

const forgotPassword = async (payload, req, res) => {
  const { email } = payload;

  const [user, cpoUser] = await Promise.all([
    UserRepository.findOne({
      where: { email, isDeleted: false },
    }),
    CpoUserRepository.findOne({
      where: { email, isDeleted: false },
    }),
  ]);

  if (!user && !cpoUser) {
    return res
      .status(404)
      .json({ message: customErrorMsg.user.USER_NOT_FOUND });
  }

  const resetPasswordCode = generateRandomCode(6);
  const resetPasswordExpiresAt = DateTime.utc().plus({ minutes: 2 }).toISO();
  const resetPasswordRequestedAt = DateTime.utc().toISO();

  let updatedUser = {};
  let userName = "";
  if (user) {
    updatedUser = await UserRepository.update(user.id, {
      resetPasswordCode,
      resetPasswordExpiresAt,
      resetPasswordRequestedAt,
    });

    userName = `${user.fullName}`;
  } else if (cpoUser) {
    updatedUser = await CpoUserRepository.update(cpoUser.id, {
      resetPasswordCode,
      resetPasswordExpiresAt,
      resetPasswordRequestedAt,
    });

    userName = `${cpoUser.firstName} ${cpoUser.lastName}`;
  } else {
    return res
      .status(404)
      .json({ message: customErrorMsg.user.USER_NOT_FOUND });
  }

  const { html, data } = await getDynamicHtml({
    htmlTemplatePath: "/templates/reset-password.html",
    data: {
      userName,
      resetPasswordCode,
      resetPasswordLink: `${process.env.CORE_BASEURL}/reset-password?email=${email}`,
    },
  });

  // Send email: Reset Password
  await EmailQueue.add({
    to: [email],
    subject: EmailConstants.subject.RESET_PASSWORD,
    html,
    templateData: data,
  });

  res.status(200).json(updatedUser);
};

const sendTestMail = async (payload, req, res) => {
  const { toEmail, subject, content } = payload;

  const { html, data } = await getDynamicHtml({
    htmlTemplatePath: "/templates/reset-password.html",
    data: {
      userName: "asas",
      resetPasswordCode: "asasassss",
      resetPasswordLink: `${process.env.CORE_BASEURL}/set-password`,
    },
  });

  // Send email: Reset Password
  await EmailQueue.add({
    to: [toEmail],
    subject: EmailConstants.subject.RESET_PASSWORD,
    html,
    templateData: data,
  });

  res.status(200).json({ updatedUser: "as" });
};

const sendActionOtp = async (payload, req, res) => {
  const loggedInUser = req.loggedInUserData?.user;

  let { action = "Take Action" } = payload;
  const emails = [
    loggedInUser.email,
    "shraddha.wagh@trunexa.com",
    // "jatin.chaudhari@trunexa.com",
    // "abhishek.gund@trunexa.com",
    //"gulnaz.ghanchi@trunexa.com",
  ];

  const { otp } = generateOtp({ length: 4 });

  await ActionOtpModel.create({
    userId: loggedInUser.id,
    email: loggedInUser.email,
    action,
    otp,
  });

  await sendEmail({
    to: emails,
    subject: `${action} verification OTP: ${otp}`,
    html: `<p>Your OTP to <b>${action}</b> is: <b>${otp}</b><br><br>This OTP will expire in 5 minutes.</p>`,
  });

  res.status(200).json({ message: "OTP sent to your email." });
};

const onboardUser = async (payload, req, res) => {
  const { userId } = req.loggedInUserData;

  const existingUSer = await UserRepository.findOne({ where: { id: userId } });

  if (!existingUSer) {
    return res
      .status(404)
      .json({ message: customErrorMsg.user.USER_NOT_FOUND });
  }

  const {
    fullName = existingUSer?.fullName,
    phoneNumber = existingUSer?.phoneNumber,
    profilePicture = existingUSer?.profilePicture,
  } = payload;

  await UserRepository.update(userId, {
    fullName,
    phoneNumber,
    profilePicture,
    isOnboarded: true,
  });

  res.status(200).json({ message: "User Onboarded." });
};

const skipOnboarding = async (req, res) => {
  const { userId } = req.loggedInUserData;

  await UserRepository.update(userId, {
    isOnboarded: true,
  });

  res.status(200).json({ message: "Onboarding Skipped." });
};

const resetPassword = async (payload, req, res) => {
  const { code, newPassword, confirmPassword } = payload;

  if (newPassword !== confirmPassword) {
    return res
      .status(400)
      .json({ message: customErrorMsg.auth.NEW_PASSWORD_MISMATCH });
  }

  const [user, cpoUser] = await Promise.all([
    UserRepository.findOne({
      where: { resetPasswordCode: code, isDeleted: false },
    }),
    CpoUserRepository.findOne({
      where: { resetPasswordCode: code, isDeleted: false },
    }),
  ]);

  if (!user && !cpoUser) {
    return res.status(400).json({ message: customErrorMsg.auth.INVALID_CODE });
  }

  if (user) {
    // Check if the reset password token is expired or not
    const currentTimestamp = DateTime.utc().valueOf();
    const tokenExpireTimestamp = DateTime.fromJSDate(
      user.resetPasswordExpiresAt
    ).valueOf();

    if (currentTimestamp > tokenExpireTimestamp) {
      return res
        .status(400)
        .json({ message: customErrorMsg.auth.CODE_EXPIRED });
    }

    const userCredential = await UserCredentialRepository.findOne({
      where: { userId: user.id },
    });

    const passwordToUpdate = await bcrypt.hash(
      newPassword,
      await bcrypt.genSalt()
    );

    if (userCredential) {
      userCredential.password = passwordToUpdate;
      await UserCredentialRepository.save(userCredential);
    } else {
      await UserCredentialRepository.save({
        userId: user.id,
        password: passwordToUpdate,
      });
    }

    const userUpdatePayload = {
      resetPasswordCode: null,
      resetPasswordExpiresAt: null,
      resetPasswordRequestedAt: null,
    };

    // If user is registered and the password is set, change user status to active
    if (user.status === UserStatuses.REGISTERED) {
      userUpdatePayload.status = UserStatuses.ACTIVE;
      userUpdatePayload.onboardedAt = DateTime.utc().toISO();
    }

    await UserRepository.update(user.id, userUpdatePayload);

    const loginResponse = await generateLoginResponse({ userId: user.id });

    res.status(200).json(loginResponse);
  } else if (cpoUser) {
    // Check if the reset password token is expired or not
    const currentTimestamp = DateTime.utc().valueOf();
    const tokenExpireTimestamp = DateTime.fromJSDate(
      cpoUser.resetPasswordExpiresAt
    ).valueOf();

    if (currentTimestamp > tokenExpireTimestamp) {
      return res
        .status(400)
        .json({ message: customErrorMsg.auth.CODE_EXPIRED });
    }

    const cpoUserCredential = await CpoUserCredentialRepository.findOne({
      where: { cpoUserId: cpoUser.id },
    });

    const passwordToUpdate = await bcrypt.hash(
      newPassword,
      await bcrypt.genSalt()
    );

    if (cpoUserCredential) {
      cpoUserCredential.password = passwordToUpdate;
      await CpoUserCredentialRepository.save(cpoUserCredential);
    } else {
      await CpoUserCredentialRepository.save({
        cpoUserId: cpoUser.id,
        password: passwordToUpdate,
      });
    }

    if (cpoUser.status !== UserStatuses.ACTIVE) {
      await saveNotification({
        data: {
          cpoId: cpoUser.cpoId,
          cpoUserId: cpoUser.id,
          name: `${cpoUser.firstName} ${cpoUser.lastName}`,
          email: cpoUser.email,
        },
        type: NotificationTypes.CPO_ACTIVATED,
      });
    }

    const cpoUserUpdatePayload = {
      resetPasswordCode: null,
      resetPasswordExpiresAt: null,
      resetPasswordRequestedAt: null,
    };

    cpoUserUpdatePayload.status = UserStatuses.ACTIVE;

    await CpoUserRepository.update(cpoUser.id, cpoUserUpdatePayload);

    const loginResponse = await generateLoginResponse({ userId: cpoUser.id });

    res.status(200).json(loginResponse);
  } else {
    res
      .status(400)
      .json({ message: customErrorMsg.auth.NEW_PASSWORD_MISMATCH });
  }
};

const checkLogin = async (payload, req, res) => {
  const { email } = payload;
  const checkLoginResponse = { email };

  const [foundUser, foundCpoUser] = await Promise.all([
    UserRepository.findOne({
      where: { email, isDeleted: false },
    }),
    CpoUserRepository.findOne({
      where: { email, isDeleted: false },
    }),
  ]);

  if (!foundUser && !foundCpoUser) {
    return res
      .status(400)
      .json({ message: customErrorMsg.user.USER_NOT_FOUND });
  }

  if (foundUser) {
    if (foundUser.status === UserStatuses.DISABLED) {
      return res
        .status(400)
        .json({ message: customErrorMsg.auth.LOGIN_DISABLED });
    }

    const userCredential = await UserCredentialRepository.findOne({
      where: { userId: foundUser.id },
    });

    checkLoginResponse["isPasswordSet"] = userCredential?.password
      ? true
      : false;

    res.status(200).json(checkLoginResponse);
  } else if (foundCpoUser) {
    if (foundCpoUser.status === UserStatuses.DISABLED) {
      return res
        .status(400)
        .json({ message: customErrorMsg.auth.LOGIN_DISABLED });
    }

    const cpoUserCredential = await CpoUserCredentialRepository.findOne({
      where: { cpoUserId: foundCpoUser.id },
    });

    checkLoginResponse["isPasswordSet"] = cpoUserCredential?.password
      ? true
      : false;

    res.status(200).json(checkLoginResponse);
  } else {
    return res
      .status(400)
      .json({ message: customErrorMsg.user.USER_NOT_FOUND });
  }
};

const setProfileConfiguration = async (req, res) => {
  const { userId } = req.loggedInUserData;
  const { profileConfig } = req.body;
  if (!profileConfig) {
    return res.status(400).json({ message: "Profile Config is required" });
  }

  await UserRepository.update(userId, {
    profileConfig: profileConfig,
  });

  res.status(200).json({ message: "Profile Configuration Set." });
};

module.exports = {
  login,
  generateJwtToken,
  createUserSession,
  whoAmI,
  logout,
  forgotPassword,
  resetPassword,
  checkLogin,
  getLoggedInUserFromToken,
  sendTestMail,
  sendActionOtp,
  getPartnerAccessData,
  onboardUser,
  skipOnboarding,
  setProfileConfiguration,
  getProfileConfiguration,
};
