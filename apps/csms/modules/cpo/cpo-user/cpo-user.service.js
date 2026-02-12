const { DateTime } = require("luxon");
const {
  CpoUserRepository,
  CpoRepository,
  CpoUserRoleRepository,
  CpoUserCredentialRepository,
} = require("@shared-libs/db/mysql");
const { Not, In } = require("typeorm");
const {
  ExpireTimeConstants,
  EmailConstants,
  UserStatuses,
  PusherConstants,
} = require("@shared-libs/constants");
const {
  generateRandomCode,
  compressImage,
  arrayObjStr,
  checkUserEmail,
  checkUserPhone,
  getSubscriptionUsage,
  ObjectDAO,
} = require("@shared-libs/helpers");
const { getDynamicHtml } = require("@shared-libs/email");
const { EmailQueue } = require("@shared-libs/queues");
const { HandleMySqlList } = require("@shared-libs/db");
const AWS = require("aws-sdk");
const { sendDataToPusher } = require("@shared-libs/pusher");
const { CurrencyData } = require("@shared-libs/constants/country-currency");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const s3 = new AWS.S3();

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber } = req.body;
    const loggedInUserId = req?.loggedInUserData?.user?.id;
    const loggedInCPOId = req?.loggedInUserData?.user?.cpoId;

    if (email) {
      const checkEmail = await checkUserEmail({
        email,
        userId: loggedInUserId,
      });
      if (checkEmail?.code == 400) {
        return res.status(checkEmail?.code).json(checkEmail?.data);
      }
    }

    if (phoneNumber) {
      const checkPhone = await checkUserPhone({
        phoneNumber,
        userId: loggedInUserId,
      });
      if (checkPhone?.code == 400) {
        return res.status(checkPhone?.code).json(checkPhone?.data);
      }
    }

    let updateData = { firstName, lastName, email, phoneNumber };

    if (firstName) {
      updateData["firstName"] = firstName;
    }
    if (lastName) {
      updateData["lastName"] = lastName;
    }
    if (email) {
      updateData["email"] = email;
    }
    if (phoneNumber) {
      updateData["phoneNumber"] = phoneNumber;
    }

    if (req.file) {
      const file = req.file;
      const compressedBuffer = await compressImage(
        file.path,
        "jpeg",
        500,
        800,
        800
      );
      const fileName = `${loggedInUserId}.${file.mimetype.split("/")[1]}`;
      const s3Key = `${loggedInCPOId}/${fileName}`;

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

    await CpoUserRepository.update(loggedInUserId, updateData);

    let updatedCpoUser = await CpoUserRepository.findOne({
      where: { id: loggedInUserId },
    });

    updatedCpoUser = await getCpoUserDetails([updatedCpoUser]);

    await sendDataToPusher({
      channelName: loggedInCPOId,
      eventName: `${PusherConstants.events.cpo.PROFILE_UPDATED}-${loggedInUserId}`,
      data: updatedCpoUser,
    });
    await sendDataToPusher({
      channelName: PusherConstants.channels.PUSHER_NODE_APP,
      eventName: `${PusherConstants.events.cpo.PROFILE_UPDATED}-${loggedInUserId}`,
      data: updatedCpoUser,
    });

    res.status(200).json(updatedCpoUser[0]);
  } catch (error) {
    console.error("Error updating profile:", error);
    res
      .status(500)
      .json({ message: "An Error Occurred While Updating The Profile." });
  }
};

const updateAccountSettings = async (req, res) => {
  try {
    const { name, taxation, billingAddress, country, currency, language } =
      req.body;

    const loggedInUser = req?.loggedInUserData?.user;

    if (!loggedInUser?.isOwner) {
      return res
        .status(401)
        .json({ message: "You Are Not Allowed To Update This Data" });
    }

    let currencyName = null;
    let currencySymbol = null;
    if (currency) {
      const currencyDetails = CurrencyData[currency] ?? null;

      if (currencyDetails) {
        currencyName = currencyDetails.name;
        currencySymbol = currencyDetails.symbol;
      }
    }

    let updateData = {};
    const fieldsToUpdate = {
      name,
      taxation,
      billingAddress,
      country,
      currency,
      language,
      currencyName,
      currencySymbol,
    };

    Object.entries(fieldsToUpdate).forEach(([key, value]) => {
      if (value) updateData[key] = value;
    });

    if (req.file) {
      const { file } = req;
      const fileName = `${loggedInUser.cpoId}.${file.mimetype.split("/")[1]}`;
      const s3Key = `${loggedInUser.cpoId}/${fileName}`;

      const compressedBuffer = await compressImage(
        file.path,
        "jpeg",
        500,
        800,
        800
      );

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

    await CpoRepository.update(loggedInUser.cpoId, updateData);

    const updatedCpo = await CpoRepository.findOne({
      where: { id: loggedInUser.cpoId },
    });

    await sendDataToPusher({
      channelName: loggedInUser.cpoId,
      eventName: `${PusherConstants.events.cpo.ACCOUNT_UPDATED}`,
      data: updatedCpo,
    });
    await sendDataToPusher({
      channelName: PusherConstants.channels.PUSHER_NODE_APP,
      eventName: `${PusherConstants.events.cpo.ACCOUNT_UPDATED}`,
      data: updatedCpo,
    });

    res.status(200).json(updatedCpo);
  } catch (error) {
    console.error("Error updating account settings:", error);
    res
      .status(500)
      .json({ message: "An Error Occurred While Updating Account Settings." });
  }
};

const addCpoUser = async (req, res) => {
  const payload = req.body;

  try {
    const {
      name,
      email,
      phoneNumber,
      cpoUserRoleId,
      department,
      businessName,
      country,
      taxationId,
    } = payload;
    if (!cpoUserRoleId) {
      return res.status(400).json({ message: "CPO Role Is Required" });
    }

    const loggedInUserData = req["loggedInUserData"];
    const loggedInUser = loggedInUserData["user"];

    let subscriptionUsage = {};
    if (loggedInUserData?.settings?.subscriptionUsage) {
      subscriptionUsage = loggedInUserData?.settings?.subscriptionUsage;
    } else {
      subscriptionUsage = await getSubscriptionUsage(loggedInUser.cpoId);
    }

    // Check Subscription Limit
    subscriptionUsage = subscriptionUsage?.users;

    if (subscriptionUsage?.limit - subscriptionUsage?.used <= 0) {
      return res.status(400).json({
        message: "CPO Has Exceeded The Limit Of Creating Users.",
      });
    }

    if (email) {
      const checkEmail = await checkUserEmail({ email });
      if (checkEmail?.code == 400) {
        return res.status(checkEmail?.code).json(checkEmail?.data);
      }
    }

    if (phoneNumber) {
      const checkPhone = await checkUserPhone({ phoneNumber });
      if (checkPhone?.code == 400) {
        return res.status(checkPhone?.code).json(checkPhone?.data);
      }
    }

    const cpoUserRole = await CpoUserRoleRepository.findOne({
      where: { id: cpoUserRoleId, cpoId: loggedInUser.cpoId },
    });
    if (!cpoUserRole) {
      return res.status(400).json({ message: "Invalid CPO Role Provided" });
    }
    const [firstName, lastName] = name.split(" ");
    const codeToSend = generateRandomCode(6);
    const resetPasswordExpiresAt = DateTime.utc()
      .plus({ day: ExpireTimeConstants.USER_SET_PASSWORD_CODE })
      .toISO();
    const resetPasswordRequestedAt = DateTime.utc().toISO();

    const createUserPayload = {
      cpoId: loggedInUser.cpoId,
      cpoUserRoleId,
      firstName,
      lastName,
      email,
      phoneNumber,
      resetPasswordCode: codeToSend,
      resetPasswordExpiresAt: resetPasswordExpiresAt,
      resetPasswordRequestedAt: resetPasswordRequestedAt,
      department,
      businessName,
      country,
      taxationId,
      isPartner: cpoUserRole.isPartnerRole == true ? true : false,
    };

    let createdCpoUser = await CpoUserRepository.save(createUserPayload);
    await CpoUserCredentialRepository.save({ cpoUserId: createdCpoUser.id });

    const { html, data } = await getDynamicHtml({
      htmlTemplatePath: "/templates/invite-user.html",
      data: {
        userName: `${createdCpoUser.firstName} ${createdCpoUser.lastName}`,
        inviteCode: codeToSend,
        registrationLink: `${process.env.CORE_BASEURL}`,
      },
    });

    // Send registration email
    await EmailQueue.add({
      to: [createdCpoUser.email],
      subject: EmailConstants.subject.WELCOME_TO_CHARGE_NEX,
      html,
      templateData: data,
    });

    createdCpoUser = await getCpoUserDetails([createdCpoUser]);
    res.status(200).json(createdCpoUser[0]);
  } catch (error) {
    console.error("Error registering user:", error);
    res
      .status(500)
      .json({ message: "An Error Occurred While Registering The User." });
  }
};

const getCpoUserList = async (req, res) => {
  try {
    const query = req.query;
    const loggedInUser = req["loggedInUserData"]["user"];
    const listParams = {
      entityName: "CpoUserView",
      baseQuery: {
        isDeleted: false,
        // isOwner: false,
        cpoId: loggedInUser.cpoId,
        isPartner: query["partner"] == "true" ? true : false,
      },
      req,
    };
    let userRoleCode = null;
    let parsedFilters;
    const filters = req["query"]?.["filter"];
    if (filters) {
      parsedFilters = JSON.parse(filters);
      userRoleCode = parsedFilters["userRoleCode"];
    }
    if (userRoleCode) {
      listParams["baseQuery"]["cpoUserRoleCode"] = userRoleCode;
      delete parsedFilters["userRoleCode"];
      req["query"]["filter"] = JSON.stringify(parsedFilters);
      listParams["req"] = req;
    } else {
      listParams["entityName"] = "CpoUser";
    }

    const listResponse = await HandleMySqlList(listParams);

    if (listResponse.list.length > 0) {
      listResponse.list = await getCpoUserDetails(listResponse.list);
    }
    res.status(200).json(listResponse);
  } catch (error) {
    console.error("Error fetching CPO list:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getCpoUserById = async (cpoUserId, req, res) => {
  try {
    const loggedInUser = req["loggedInUserData"]["user"];
    let cpoUser = await CpoUserRepository.findOne({
      where: { id: cpoUserId, cpoId: loggedInUser.cpoId },
    });

    if (!cpoUser) {
      return res.status(404).json({ message: "CPO User Not Found" });
    }

    cpoUser = await getCpoUserDetails([cpoUser]);

    res.status(200).json(cpoUser[0]);
  } catch (error) {
    console.error("Error fetching CPO:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateCpoUserById = async (cpoUserId, req, res) => {
  try {
    const payload = req.body;
    let {
      firstName,
      lastName,
      email,
      phoneNumber,
      cpoUserRoleId,
      country,
      businessName,
      taxationId,
      department,
    } = payload;
    if (payload?.name) {
      const nameData = payload?.name?.split(" ");
      firstName = nameData[0] ?? "";
      lastName = nameData[1] ?? "";
    }

    const loggedInUser = req["loggedInUserData"]["user"];
    const cpoUser = await CpoUserRepository.findOne({
      where: { id: cpoUserId, cpoId: loggedInUser.cpoId },
    });

    if (!cpoUser) {
      return res.status(404).json({ message: "CPO User Not Found" });
    }

    if (cpoUserRoleId) {
      if (cpoUser.isOwner && cpoUser.cpoUserRoleId !== cpoUserRoleId) {
        return res
          .status(400)
          .json({ message: "Cannot Change The Role Of CPO Owner." });
      }

      const cpoUserRole = await CpoUserRoleRepository.findOne({
        where: { id: cpoUserRoleId, cpoId: loggedInUser.cpoId },
      });
      if (!cpoUserRole) {
        return res.status(400).json({ message: "Invalid CPO Role Provided" });
      }
    }

    if (email) {
      const checkEmail = await checkUserEmail({ email, userId: cpoUserId });
      if (checkEmail?.code == 400) {
        return res.status(checkEmail?.code).json(checkEmail?.data);
      }
    }

    if (phoneNumber) {
      const checkPhone = await checkUserPhone({
        phoneNumber,
        userId: cpoUserId,
      });
      if (checkPhone?.code == 400) {
        return res.status(checkPhone?.code).json(checkPhone?.data);
      }
    }

    await CpoUserRepository.update(cpoUserId, {
      firstName,
      lastName,
      email,
      phoneNumber,
      cpoUserRoleId,
      country,
      businessName,
      taxationId,
      department,
    });

    let updatedCpoUser = await CpoUserRepository.findOne({
      where: { id: cpoUserId },
    });

    updatedCpoUser = await getCpoUserDetails([updatedCpoUser]);

    res.status(200).json(updatedCpoUser[0]);
  } catch (error) {
    console.error("Error Updating CPO:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteCpoUserById = async (cpoUserId, req, res) => {
  try {
    const loggedInUser = req["loggedInUserData"]["user"];
    const cpoUser = await CpoUserRepository.findOne({
      where: { id: cpoUserId, cpoId: loggedInUser.cpoId, isDeleted: false },
    });

    if (!cpoUser) {
      return res.status(404).json({ message: "CPO User Not Found" });
    }

    await CpoUserRepository.update(cpoUserId, {
      isDeleted: true,
    });

    const updatedCpoUser = await CpoUserRepository.findOne({
      where: { id: cpoUserId },
    });

    res.status(200).json(updatedCpoUser);
  } catch (error) {
    console.error("Error fetching CPO:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const resendCpoUserInvitation = async (cpoUserId, req, res) => {
  try {
    const loggedInUser = req["loggedInUserData"]["user"];
    const cpoUser = await CpoUserRepository.findOne({
      where: { id: cpoUserId, cpoId: loggedInUser.cpoId },
    });

    if (!cpoUser) {
      return res.status(404).json({ message: "CPO User Not Found" });
    }

    if (cpoUser.status !== UserStatuses.REGISTERED) {
      return res.status(400).json({
        message: "Cannot Resend Invite. User Not Registered.",
      });
    }

    const codeToSend = generateRandomCode(6);

    await CpoUserRepository.update(cpoUserId, {
      resetPasswordCode: codeToSend,
      resetPasswordExpiresAt: DateTime.utc().plus({ days: 7 }).toISO(),
      resetPasswordRequestedAt: DateTime.utc().toISO(),
    });

    const updatedCpoUser = await CpoUserRepository.findOne({
      where: { id: cpoUserId },
    });

    const { html, data } = await getDynamicHtml({
      htmlTemplatePath: "/templates/invite-user.html",
      data: {
        userName: `${updatedCpoUser.firstName} ${updatedCpoUser.lastName}`,
        inviteCode: codeToSend,
        registrationLink: `${process.env.CORE_BASEURL}`,
      },
    });

    await EmailQueue.add({
      to: [updatedCpoUser.email],
      subject: EmailConstants.subject.WELCOME_TO_CHARGE_NEX,
      html,
      templateData: data,
    });

    res.status(200).json(updatedCpoUser);
  } catch (error) {
    console.error("Error Resending CPO Invite:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const enableCpoUserById = async (cpoUserId, req, res) => {
  try {
    const loggedInUser = req["loggedInUserData"]["user"];
    const cpoUser = await CpoUserRepository.findOne({
      where: { id: cpoUserId, cpoId: loggedInUser.cpoId },
    });

    if (!cpoUser) {
      return res.status(404).json({ message: "CPO User Not Found" });
    }

    if (cpoUser.status === UserStatuses.REGISTERED) {
      return res.status(400).json({
        message: "User Status Is Invited; Cannot Enable User",
      });
    }

    if (cpoUser.status === UserStatuses.ACTIVE) {
      return res.status(400).json({
        message: "User Is Already Enabled And Active",
      });
    }

    await CpoUserRepository.update(cpoUserId, {
      status: UserStatuses.ACTIVE,
    });

    let updatedCpoUser = await CpoUserRepository.findOne({
      where: { id: cpoUserId },
    });

    updatedCpoUser = await getCpoUserDetails([updatedCpoUser]);

    res.status(200).json(updatedCpoUser[0]);
  } catch (error) {
    console.error("Error Enabling CPO:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const onboard = async (req, res) => {
  try {
    const { stepCount } = req.query;
    if (!stepCount) {
      return res.status(404).json({ message: "Status count required!" });
    }
    const loggedInUser = req["loggedInUserData"]["user"];
    const cpoUser = await CpoUserRepository.findOne({
      where: { id: loggedInUser.id, cpoId: loggedInUser.cpoId },
    });

    if (!cpoUser) {
      return res.status(404).json({ message: "CPO User Not Found" });
    }

    await CpoUserRepository.update(loggedInUser.id, {
      onBoardingStatus: stepCount,
    });

    let updatedCpoUser = await CpoUserRepository.findOne({
      where: { id: loggedInUser.id },
    });

    updatedCpoUser = await getCpoUserDetails([updatedCpoUser]);

    res.status(200).json(updatedCpoUser[0]);
  } catch (error) {
    console.error("Error Enabling CPO:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const disableCpoUserById = async (cpoUserId, req, res) => {
  try {
    const loggedInUser = req["loggedInUserData"]["user"];
    const cpoUser = await CpoUserRepository.findOne({
      where: { id: cpoUserId, cpoId: loggedInUser.cpoId },
    });

    if (!cpoUser) {
      return res.status(404).json({ message: "CPO User Not Found" });
    }

    if (cpoUser.status === UserStatuses.REGISTERED) {
      return res.status(400).json({
        message: "User Status Is Invited; Cannot Disable User",
      });
    }

    if (cpoUser.status === UserStatuses.DISABLED) {
      return res.status(400).json({
        message: "User Is Already Disabled",
      });
    }

    await CpoUserRepository.update(cpoUserId, {
      status: UserStatuses.DISABLED,
    });

    let updatedCpoUser = await CpoUserRepository.findOne({
      where: { id: cpoUserId },
    });

    updatedCpoUser = await getCpoUserDetails([updatedCpoUser]);

    res.status(200).json(updatedCpoUser[0]);
  } catch (error) {
    console.error("Error Enabling CPO:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getCpoUserDetails = async (list) => {
  const cpoIds = list.map(({ cpoId }) => cpoId);
  const cpoUserRoleIds = list.map(({ cpoUserRoleId }) => cpoUserRoleId);

  const cpos = await CpoRepository.find({
    where: { id: In([...cpoIds]) },
    select: ["id", "name"],
  });

  const cpoData = arrayObjStr(cpos, "id");

  const cpoUserRoles = await CpoUserRoleRepository.find({
    where: { id: In([...cpoUserRoleIds]) },
    select: ["id", "name", "code", "permissions"],
  });

  const cpoUserRoleData = arrayObjStr(cpoUserRoles, "id");

  const returnList = list.map((d) => {
    return ObjectDAO({
      ...d,
      cpo: d.cpoId ? cpoData[d.cpoId] : {},
      cpoName: d.cpoId ? cpoData[d.cpoId].name : null,
      roleData: d.cpoUserRoleId ? cpoUserRoleData[d.cpoUserRoleId] : null,
      roleName: d.cpoUserRoleId ? cpoUserRoleData[d.cpoUserRoleId].name : null,
      roleCode: d.cpoUserRoleId ? cpoUserRoleData[d.cpoUserRoleId].code : null,
    });
  });

  return returnList;
};

const verifyEndpointAvailability = async (endpoint, id = null) => {
  try {
    let where = { endpoint };
    if (id) {
      where = { endpoint, id: Not(id) };
    }

    const cpoData = await CpoRepository.findOne({ where });
    return cpoData === null;
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error:", error);
    console.log("🚀 -----------------🚀");
    return false;
  }
};

const checkEndpointAvailability = async (req, res) => {
  try {
    const { endpoint } = req.body;

    const isAvailable = await verifyEndpointAvailability(endpoint);

    res.status(200).json({ isAvailable });
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error:", error);
    console.log("🚀 -----------------🚀");
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getEndpointResponse = async (cpoId) => {
  const cpoData = await CpoRepository.findOne({
    where: { id: cpoId },
  });

  return {
    endpoint: cpoData.endpoint,
    baseUrl: `${process.env.CORE_BASEURL}/cms`,
    fullEndpoint: `${process.env.CORE_BASEURL}/cms/${cpoData.endpoint}`,
  };
};

const setEndpoint = async (req, res) => {
  try {
    const loggedInCPOId = req?.loggedInUserData?.user?.cpoId;
    const { endpoint } = req.body;

    const isAvailable = await verifyEndpointAvailability(
      endpoint,
      loggedInCPOId
    );
    if (!isAvailable) {
      return res.status(400).json({
        message: "Endpoint Already Exists",
      });
    }

    await CpoRepository.update(loggedInCPOId, { endpoint });

    const updatedCpo = await CpoRepository.findOne({
      where: { id: loggedInCPOId },
    });

    await sendDataToPusher({
      channelName: loggedInCPOId,
      eventName: `${PusherConstants.events.cpo.ACCOUNT_UPDATED}`,
      data: updatedCpo,
    });
    await sendDataToPusher({
      channelName: PusherConstants.channels.PUSHER_NODE_APP,
      eventName: `${PusherConstants.events.cpo.ACCOUNT_UPDATED}`,
      data: updatedCpo,
    });

    const endpointDataData = await getEndpointResponse(loggedInCPOId);
    res.status(200).json(endpointDataData);
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error:", error);
    console.log("🚀 -----------------🚀");
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getEndpoint = async (req, res) => {
  try {
    const loggedInCPOId = req?.loggedInUserData?.user?.cpoId;
    const endpointDataData = await getEndpointResponse(loggedInCPOId);
    res.status(200).json(endpointDataData);
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error:", error);
    console.log("🚀 -----------------🚀");
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  updateProfile,
  updateAccountSettings,
  addCpoUser,
  getCpoUserList,
  getCpoUserById,
  updateCpoUserById,
  deleteCpoUserById,
  resendCpoUserInvitation,
  enableCpoUserById,
  disableCpoUserById,
  checkEndpointAvailability,
  setEndpoint,
  getEndpoint,
  onboard,
};
