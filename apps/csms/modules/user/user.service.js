const { DateTime } = require("luxon");
const {
  UserStatuses,
  ExpireTimeConstants,
  EmailConstants,
  PusherConstants,
} = require("@shared-libs/constants");
const {
  UserRepository,
  UserCredentialRepository,
  UserRoleRepository,
  EMspRepository,
  CpoUserRepository,
  CpoRepository,
  ChargerViewRepository,
} = require("@shared-libs/db/mysql");
const {
  generateRandomCode,
  arrayObjStr,
  compressImage,
  checkUserEmail,
  checkUserPhone,
  ObjectDAO,
  convertDateTimezone,
} = require("@shared-libs/helpers");
const { EmailQueue } = require("@shared-libs/queues");
const { HandleMySqlList } = require("@shared-libs/db");
const { In } = require("typeorm");
const { getDynamicHtml } = require("@shared-libs/email");
const AWS = require("aws-sdk");
const { sendDataToPusher } = require("@shared-libs/pusher");
const s3 = new AWS.S3();

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber } = req.body;
    const loggedInUserId = req?.loggedInUserData?.user?.id;
    const loggedInEMspId = req?.loggedInUserData?.user?.eMspId;
    const userRole = req?.loggedInUserData?.user?.userRole;

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

    // club firstname and lastname in fullname
    const fullName = `${firstName} ${lastName}`;

    let updateData = { fullName, email, phoneNumber };

    if (fullName) {
      updateData["fullName"] = fullName;
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
      const s3Key = `${loggedInEMspId}/${fileName}`;

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

    if (!updateData?.profilePicture && req.body?.file) {
      updateData["profilePicture"] = req.body?.file;
    }

    await UserRepository.update(loggedInUserId, updateData);

    let updatedUser = await UserRepository.findOne({
      where: { id: loggedInUserId },
    });

    updatedUser = await getUserDetails([updatedUser]);

    await sendDataToPusher({
      channelName: loggedInEMspId,
      eventName: `${PusherConstants.events.eMsp.PROFILE_UPDATED}-${loggedInUserId}`,
      data: updatedUser,
    });
    await sendDataToPusher({
      channelName: PusherConstants.channels.PUSHER_NODE_APP,
      eventName: `${PusherConstants.events.eMsp.PROFILE_UPDATED}-${loggedInUserId}`,
      data: updatedUser,
    });

    res.status(200).json(updatedUser[0]);
  } catch (error) {
    console.error("Error updating profile:", error);
    res
      .status(500)
      .json({ message: "An Error Occurred While Updating The Profile." });
  }
};

const updateProfilePhoto = async (req, res) => {
  try {
    const { file: profilePicture } = req.body;
    const loggedInUserId = req?.loggedInUserData?.user?.id;

    await UserRepository.update(loggedInUserId, { profilePicture });

    let updatedUser = await UserRepository.findOne({
      where: { id: loggedInUserId },
    });

    updatedUser = await getUserDetails([updatedUser]);

    await sendDataToPusher({
      channelName: PusherConstants.channels.PUSHER_NODE_APP,
      eventName: `${PusherConstants.events.eMsp.PROFILE_UPDATED}-${loggedInUserId}`,
      data: updatedUser,
    });

    res.status(200).json(updatedUser[0]);
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

    let updateData = {};
    const fieldsToUpdate = {
      name,
      taxation,
      billingAddress,
      country,
      currency,
      language,
    };

    Object.entries(fieldsToUpdate).forEach(([key, value]) => {
      if (value) updateData[key] = value;
    });

    if (req.file) {
      const { file } = req;
      const fileName = `${loggedInUser.eMspId}.${file.mimetype.split("/")[1]}`;
      const s3Key = `${loggedInUser.eMspId}/${fileName}`;

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

    await EMspRepository.update(loggedInUser.eMspId, updateData);

    const updatedEMsp = await EMspRepository.findOne({
      where: { id: loggedInUser.eMspId },
    });

    await sendDataToPusher({
      channelName: loggedInUser.eMspId,
      eventName: `${PusherConstants.events.eMsp.ACCOUNT_UPDATED}`,
      data: updatedEMsp,
    });
    await sendDataToPusher({
      channelName: PusherConstants.channels.PUSHER_NODE_APP,
      eventName: `${PusherConstants.events.eMsp.ACCOUNT_UPDATED}`,
      data: updatedEMsp,
    });

    res.status(200).json(updatedEMsp);
  } catch (error) {
    console.error("Error updating account settings:", error);
    res
      .status(500)
      .json({ message: "An Error Occurred While Updating Account Settings." });
  }
};

const addUser = async (req, res) => {
  const payload = req.body;

  try {
    const { fullName, email, phoneNumber, userRoleId, country, department } =
      payload;

    const existingUser = await UserRepository.findOne({
      where: { email, isDeleted: false },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const [firstName, lastName] = fullName.split(" ");
    const codeToSend = generateRandomCode(6);
    const resetPasswordExpiresAt = DateTime.utc()
      .plus({ day: ExpireTimeConstants.USER_SET_PASSWORD_CODE })
      .toISO();
    const resetPasswordRequestedAt = DateTime.utc().toISO();

    const loggedInUser = req?.loggedInUserData?.user;

    const createUserPayload = {
      eMspId: loggedInUser.eMspId,
      userRoleId,
      department,
      firstName,
      lastName,
      email,
      phoneNumber,
      resetPasswordCode: codeToSend,
      resetPasswordExpiresAt: resetPasswordExpiresAt,
      resetPasswordRequestedAt: resetPasswordRequestedAt,
      country,
    };

    let createdUser = await UserRepository.save(createUserPayload);
    await UserCredentialRepository.save({ userId: createdUser.id });

    const { html, data } = await getDynamicHtml({
      htmlTemplatePath: "/templates/invite-user.html",
      data: {
        userName: `${createdUser.firstName} ${createdUser.lastName}`,
        inviteCode: codeToSend,
        registrationLink: `${process.env.CORE_BASEURL}/set-password?email=${email}`,
      },
    });

    // Send registration email
    await EmailQueue.add({
      to: [createdUser.email],
      subject: EmailConstants.subject.WELCOME_TO_CHARGE_NEX,
      html,
      templateData: data,
    });

    createdUser = getUserDetails([createdUser]);
    res.status(200).json(createdUser[0]);
  } catch (error) {
    console.error("Error registering user:", error);
    res
      .status(500)
      .json({ message: "An Error Occurred While Registering The User." });
  }
};

const getUserList = async (req, res) => {
  try {
    const loggedInUser = req?.loggedInUserData?.user;

    const listParams = {
      entityName: "UserView",
      baseQuery: { isDeleted: false },
      req,
    };

    const listResponse = await HandleMySqlList(listParams);

    if (listResponse.list.length > 0) {
      listResponse.list = await getUserDetails(listResponse.list);
    }
    res.status(200).json(listResponse);
  } catch (error) {
    console.error("Error fetching User list:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getUserListForDeletedChargers = async (req, res) => {
  try {
    const query = await ChargerViewRepository.createQueryBuilder("c")
      .select("c.deletedBy", "id")
      .addSelect("c.deletedByUserName", "name")
      .addSelect("c.deletedByUserEmail", "email")
      .where("c.isDeleted=1")
      .andWhere("c.deletedBy IS NOT NULL");

    let users = await query.groupBy("c.deletedBy").getRawMany();
    if (users.length == 0) {
      const tmpUser = await UserRepository.findOne({
        where: { email: "admin@chargnex.com" },
      });
      users = [
        {
          id: tmpUser?.id,
          name: "Aagam Jain",
          email: "admin@chargnex.com",
        },
      ];
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching User list:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getFilterStatus = async (req, res) => {
  try {
    // NOTE: update required as per status enum of user.status
    const statusList = ["Registered", "Active", "Inactive", "Disabled"];
    res.status(200).json({ success: true, status: statusList });
  } catch (error) {
    console.error("Error fetching User list:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getUserInfo = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "User ID Is Required" });
    }

    const cpoUser = await CpoUserRepository.findOne({
      where: { id: userId },
      select: ["firstName", "lastName"],
    });
    if (cpoUser) {
      return res.status(200).json({
        userId,
        name: `${cpoUser["firstName"]} ${cpoUser["lastName"]}`,
      });
    }
    const cpo = await CpoRepository.findOne({
      where: { id: userId },
      select: ["name"],
    });
    if (cpo) {
      return res.status(200).json({
        userId,
        name: cpo["name"],
      });
    }
    const userData = await UserRepository.findOne({
      where: { id: userId },
      select: ["firstName", "lastName"],
    });
    if (userData) {
      return res.status(200).json({
        userId,
        name: `${userData["firstName"]} ${userData["lastName"]}`,
      });
    }
    res.status(404).json({
      success: false,
      message: "User not found!",
    });
  } catch (error) {
    console.error("Error fetching User list:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getUserById = async (userId, req, res) => {
  try {
    let user = await UserRepository.findOne({
      where: { id: userId, isDeleted: false },
    });

    user = await getUserDetails([user]);

    res.status(200).json(ObjectDAO(user[0]));
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateUserById = async (userId, req, res) => {
  try {
    const payload = req.body;
    let {
      firstName,
      lastName,
      email,
      phoneNumber,
      userRoleId,
      department,
      country,
    } = payload;
    if (payload?.fullName) {
      const nameData = payload?.fullName?.split(" ");
      firstName = nameData[0] ?? "";
      lastName = nameData[1] ?? "";
    }

    const existingUser = await UserRepository.findOne({
      where: { id: userId, isDeleted: false },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is being changed and if new email already exists
    if (email && email !== existingUser.email) {
      const emailExists = await UserRepository.findOne({
        where: { email, isDeleted: false },
      });
      if (emailExists) {
        return res
          .status(400)
          .json({ message: "User with this email already exists" });
      }
    }

    await UserRepository.update(userId, {
      firstName,
      lastName,
      email,
      country,
      phoneNumber,
      department,
      userRoleId,
    });

    let updatedUser = await UserRepository.findOne({
      where: { id: userId },
    });

    updatedUser = await getUserDetails([updatedUser]);

    res.status(200).json(updatedUser[0]);
  } catch (error) {
    console.error("Error Updating User:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteUserById = async (userId, req, res) => {
  try {
    await UserRepository.update(userId, {
      isDeleted: true,
    });

    const updatedUser = await UserRepository.findOne({
      where: { id: userId },
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteUserBulk = async (userIds, req, res) => {
  try {
    const loggedInUser = req?.loggedInUserData?.user;
    let users = await UserRepository.count({
      where: { id: In(userIds), isDeleted: false },
    });

    let eMspOwner = await UserRepository.findOne({
      where: { eMspId: loggedInUser.eMspId, isDeleted: 0, isOwner: 1 },
    });

    if (userIds.includes(eMspOwner?.id)) {
      return res
        .status(400)
        .json({ message: "Super Admin/CPO Admin cannot be deleted" });
    }

    if (userIds.includes(loggedInUser?.id)) {
      return res.status(400).json({ message: "You cannot delete yourself." });
    }

    await UserRepository.update(userIds, {
      isDeleted: true,
    });

    const deletedUsers = await UserRepository.find({
      where: { id: In(userIds) },
    });
    const finalList = deletedUsers.map((usr) => ObjectDAO(usr));
    res.status(200).json(finalList);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const resendUserInvitation = async (userId, req, res) => {
  try {
    let user = await UserRepository.findOne({
      where: { id: userId, isDeleted: false },
    });

    const email = user.email;

    if (user.status !== UserStatuses.REGISTERED) {
      return res.status(400).json({
        message: "Cannot Resend Invite. User Not Registered",
      });
    }

    const codeToSend = generateRandomCode(6);

    await UserRepository.update(userId, {
      resetPasswordCode: codeToSend,
      resetPasswordExpiresAt: DateTime.utc().plus({ days: 7 }).toISO(),
      resetPasswordRequestedAt: DateTime.utc().toISO(),
    });

    const updatedUser = await UserRepository.findOne({
      where: { id: userId },
    });

    const { html, data } = await getDynamicHtml({
      htmlTemplatePath: "/templates/invite-user.html",
      data: {
        userName: `${updatedUser.firstName} ${updatedUser.lastName}`,
        inviteCode: codeToSend,
        registrationLink: `${process.env.CORE_BASEURL}/set-password?email=${email}`,
      },
    });

    await EmailQueue.add({
      to: [updatedUser.email],
      subject: EmailConstants.subject.WELCOME_TO_CHARGE_NEX,
      html,
      templateData: data,
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error Resending User Invite:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const enableUserById = async (userId, req, res) => {
  try {
    let user = await UserRepository.findOne({
      where: { id: userId, isDeleted: false },
    });

    if (user.status === UserStatuses.REGISTERED) {
      return res.status(400).json({
        message: "User Status Is Invited; Cannot Enable User",
      });
    }

    if (user.status === UserStatuses.ACTIVE) {
      return res.status(400).json({
        message: "User Is Already Enabled And Active",
      });
    }

    await UserRepository.update(userId, {
      status: UserStatuses.ACTIVE,
    });

    let updatedUser = await UserRepository.findOne({
      where: { id: userId },
    });

    updatedUser = await getUserDetails([updatedUser]);

    res.status(200).json(updatedUser[0]);
  } catch (error) {
    console.error("Error Enabling user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const disableUserById = async (userId, req, res) => {
  try {
    let user = await UserRepository.findOne({
      where: { id: userId, isDeleted: false },
    });

    if (user.status === UserStatuses.REGISTERED) {
      return res.status(400).json({
        message: "User Status Is Invited; Cannot Disable User",
      });
    }

    if (user.status === UserStatuses.DISABLED) {
      return res.status(400).json({
        message: "User Is Already Disabled",
      });
    }

    await UserRepository.update(userId, {
      status: UserStatuses.DISABLED,
    });

    let updatedUser = await UserRepository.findOne({
      where: { id: userId },
    });

    updatedUser = await getUserDetails([updatedUser]);

    res.status(200).json(updatedUser[0]);
  } catch (error) {
    console.error("Error Enabling user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getUserDetails = async (list) => {
  const userRoleIds = list.map(({ userRoleId }) => userRoleId);

  const userRoles = await UserRoleRepository.find({
    where: { id: In([...userRoleIds]) },
    select: ["id", "name", "code", "permissions"],
  });

  const userRoleData = arrayObjStr(userRoles, "id");

  const returnList = list.map((d) => {
    const lastLogin = d.lastLogin;
    const resetPasswordExpiresAt = d.resetPasswordExpiresAt;
    const resetPasswordRequestedAt = d.resetPasswordRequestedAt;
    const createdAt = d.createdAt;
    const updatedAt = d.updatedAt;

    const lastLoginLocal = convertDateTimezone(
      DateTime.fromJSDate(lastLogin),
      d?.timezone ?? "UTC"
    );

    const resetPasswordExpiresAtLocal = convertDateTimezone(
      DateTime.fromJSDate(resetPasswordExpiresAt),
      d?.timezone ?? "UTC"
    );

    const resetPasswordRequestedAtLocal = convertDateTimezone(
      DateTime.fromJSDate(resetPasswordRequestedAt),
      d?.timezone ?? "UTC"
    );

    const createdAtLocal = convertDateTimezone(
      DateTime.fromJSDate(createdAt),
      d?.timezone ?? "UTC"
    );

    const updatedAtLocal = convertDateTimezone(
      DateTime.fromJSDate(updatedAt),
      d?.timezone ?? "UTC"
    );

    return ObjectDAO({
      ...d,
      roleData: d.userRoleId ? userRoleData[d.userRoleId] : null,
      lastLoginLocal: lastLoginLocal,
      resetPasswordExpiresAtLocal: resetPasswordExpiresAtLocal,
      resetPasswordRequestedAtLocal: resetPasswordRequestedAtLocal,
      createdAtLocal: createdAtLocal,
      updatedAtLocal: updatedAtLocal,
    });
  });

  return returnList;
};

module.exports = {
  updateProfile,
  updateAccountSettings,
  addUser,
  getUserList,
  getUserListForDeletedChargers,
  getUserById,
  updateUserById,
  deleteUserById,
  resendUserInvitation,
  enableUserById,
  disableUserById,
  getUserDetails,
  deleteUserBulk,
  getUserInfo,
  getFilterStatus,
  updateProfilePhoto,
};
