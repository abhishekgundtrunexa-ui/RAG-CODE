const {
  ExpireTimeConstants,
  EmailConstants,
} = require("@shared-libs/constants");
const {
  generateRandomCode,
  ObjectDAO,
  convertDateTimezone,
} = require("@shared-libs/helpers");
const { getDynamicHtml } = require("@shared-libs/email");
const { UserRepository } = require("@shared-libs/db/mysql");
const { DateTime } = require("luxon");
const { EmailQueue } = require("@shared-libs/queues");
const { HandleMySqlList } = require("@shared-libs/db");

const addUser = async (req, res) => {
  const { userId: createdBy } = req?.loggedInUserData;
  let partnerId = null;

  const { isPartner, isPartnerTeam } = req?.loggedInUserData;

  if (isPartner || isPartnerTeam) {
    if (isPartner) {
      partnerId = createdBy;
    } else {
      partnerId = req?.loggedInUserData?.partnerId;
    }
  }

  try {
    const {
      fullName,
      email,
      country,
      phoneNumber,
      departmentId,
      userRoleId,
      permissions,
    } = req.body;

    const existingUser = await UserRepository.findOne({
      where: { email, isDeleted: false },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const codeToSend = generateRandomCode(6);
    const resetPasswordExpiresAt = DateTime.utc()
      .plus({ day: ExpireTimeConstants.USER_SET_PASSWORD_CODE })
      .toISO();
    const resetPasswordRequestedAt = DateTime.utc().toISO();

    const user = UserRepository.create({
      fullName,
      email,
      country,
      phoneNumber,
      departmentId,
      userRoleId,
      timezone: "UTC",
      dateFormat: "dd-MM-yyyy",
      permissions: permissions || [],
      isSuperAdmin: false,
      isOwner: false,
      createdBy: createdBy,
      status: "INACTIVE",
      partnerId,
      resetPasswordCode: codeToSend,
      resetPasswordExpiresAt: resetPasswordExpiresAt,
      resetPasswordRequestedAt: resetPasswordRequestedAt,
    });

    const saved = await UserRepository.save(user);

    const { html, data } = await getDynamicHtml({
      htmlTemplatePath: "/templates/invite-user.html",
      data: {
        userName: `${saved.fullName}`,
        inviteCode: codeToSend,
        registrationLink: `${process.env.CORE_BASEURL}/set-password?email=${email}`,
      },
    });

    // Send registration email
    await EmailQueue.add({
      to: [saved.email],
      subject: EmailConstants.subject.WELCOME_TO_CHARGE_NEX,
      html,
      templateData: data,
    });

    res.status(201).json(saved);
  } catch (error) {
    console.error("Error adding user:", error);
    res
      .status(500)
      .json({ message: "Failed to add user", error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId: updatedBy } = req?.loggedInUserData;

    const { id } = req.params;
    const {
      fullName,
      email,
      country,
      phoneNumber,
      departmentId,
      userRoleId,
      permissions,
    } = req.body;

    const existingUser = await UserRepository.findOne({
      where: { id, isDeleted: false },
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

    await UserRepository.update(
      { id },
      {
        fullName,
        email,
        country,
        phoneNumber,
        departmentId,
        userRoleId,
        timezone: "UTC",
        dateFormat: "dd-MM-yyyy",
        permissions: permissions || [],
        updatedBy: updatedBy,
      }
    );

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res
      .status(500)
      .json({ message: "Failed to update user", error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId: deletedBy } = req?.loggedInUserData;
    // Accept either a single id (from params) or multiple ids (from body)
    const ids = req.body.ids || (req.params.id ? [req.params.id] : []);

    let deleted = [];
    let notFound = [];

    for (const id of ids) {
      // Check if user exists
      const existingUser = await UserRepository.findOne({
        where: { id, isDeleted: false },
      });
      if (!existingUser) {
        notFound.push(id);
        continue;
      }
      // Soft delete
      await UserRepository.update(
        { id },
        {
          isDeleted: true,
          updatedBy: deletedBy,
        }
      );
      deleted.push(id);
    }

    res.status(200).json({
      message: "Users deleted successfully",
      deleted,
      notFound,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res
      .status(500)
      .json({ message: "Failed to delete user(s)", error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const order = { createdAt: "DESC" };

    let baseQuery = { isDeleted: false, isSuperAdmin: false, isPartner: false };

    const { isPartner, isPartnerTeam } = req?.loggedInUserData;

    if (isPartner || isPartnerTeam) {
      const { partnerIds = [] } = req?.allowedIds;

      if (partnerIds.length == 0) {
        return res.status(200).json({
          list: [],
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
        });
      }

      // baseQuery["partnerId"] = {
      //   custom: true,
      //   value: `in("${partnerIds.join('", "')}")`,
      // };

      baseQuery["partnerId"] = req?.loggedInUserData?.partnerId;
    } else {
      baseQuery["partnerId"] = {
        custom: true,
        value: `IS NULL`,
      };
    }

    const cgxTeam = {
      entityName: "UserView",
      baseQuery,
      req,
    };
    cgxTeam.order = order;

    const listResponse = await HandleMySqlList(cgxTeam);

    if (listResponse.list.length > 0) {
      listResponse.list = listResponse.list.map((d) => {
        const lastLogin = d.lastLogin;
        const resetPasswordExpiresAt = d.resetPasswordExpiresAt;
        const resetPasswordRequestedAt = d.resetPasswordRequestedAt;
        const createdAt = d.createdAt;
        const updatedAt = d.updatedAt;

        const lastLoginLocal = convertDateTimezone(
          DateTime.fromJSDate(lastLogin),
          d.timezone ?? "UTC"
        );

        const resetPasswordExpiresAtLocal = convertDateTimezone(
          DateTime.fromJSDate(resetPasswordExpiresAt),
          d.timezone ?? "UTC"
        );

        const resetPasswordRequestedAtLocal = convertDateTimezone(
          DateTime.fromJSDate(resetPasswordRequestedAt),
          d.timezone ?? "UTC"
        );

        const createdAtLocal = convertDateTimezone(
          DateTime.fromJSDate(createdAt),
          d.timezone ?? "UTC"
        );

        const updatedAtLocal = convertDateTimezone(
          DateTime.fromJSDate(updatedAt),
          d.timezone ?? "UTC"
        );

        return ObjectDAO({
          ...d,
          userRoleId: null,
          lastLoginLocal: lastLoginLocal,
          resetPasswordExpiresAtLocal: resetPasswordExpiresAtLocal,
          resetPasswordRequestedAtLocal: resetPasswordRequestedAtLocal,
          createdAtLocal: createdAtLocal,
          updatedAtLocal: updatedAtLocal,
        });
      });
    }

    res.status(200).json(listResponse);
  } catch (error) {
    console.error("Error getting users:", error);
    res
      .status(500)
      .json({ message: "Failed to get users", error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await UserRepository.findOne({
      where: { id, isDeleted: false },
    });

    const lastLogin = user.lastLogin;
    const resetPasswordExpiresAt = user.resetPasswordExpiresAt;
    const resetPasswordRequestedAt = user.resetPasswordRequestedAt;
    const createdAt = user.createdAt;
    const updatedAt = user.updatedAt;

    const lastLoginLocal = convertDateTimezone(
      DateTime.fromJSDate(lastLogin),
      user.timezone ?? "UTC"
    );

    const resetPasswordExpiresAtLocal = convertDateTimezone(
      DateTime.fromJSDate(resetPasswordExpiresAt),
      user.timezone ?? "UTC"
    );

    const resetPasswordRequestedAtLocal = convertDateTimezone(
      DateTime.fromJSDate(resetPasswordRequestedAt),
      user.timezone ?? "UTC"
    );

    const createdAtLocal = convertDateTimezone(
      DateTime.fromJSDate(createdAt),
      user.timezone ?? "UTC"
    );

    const updatedAtLocal = convertDateTimezone(
      DateTime.fromJSDate(updatedAt),
      user.timezone ?? "UTC"
    );

    user.lastLoginLocal = lastLoginLocal;
    user.resetPasswordExpiresAtLocal = resetPasswordExpiresAtLocal;
    user.resetPasswordRequestedAtLocal = resetPasswordRequestedAtLocal;
    user.createdAtLocal = createdAtLocal;
    user.updatedAtLocal = updatedAtLocal;

    res.status(200).json(user);
  } catch (error) {
    console.error("Error getting user by ID:", error);
    res
      .status(500)
      .json({ message: "Failed to get user", error: error.message });
  }
};

module.exports = {
  addUser,
  updateUser,
  deleteUser,
  getUsers,
  getUserById,
};
