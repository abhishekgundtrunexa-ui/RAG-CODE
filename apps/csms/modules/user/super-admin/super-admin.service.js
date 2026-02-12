const { Not } = require("typeorm");
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

const addSuperAdmin = async (req, res) => {
  try {
    const { userId: createdBy } = req?.loggedInUserData;
    const { fullName, email, country, phoneNumber, permissions } = req.body;

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
      timezone: "UTC",
      dateFormat: "dd-MM-yyyy",
      permissions: permissions || [],
      isSuperAdmin: true, // Set as super admin
      isOwner: false,
      status: "INACTIVE",
      createdBy: createdBy,
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

    await EmailQueue.add({
      to: [saved.email],
      subject: EmailConstants.subject.WELCOME_TO_CHARGE_NEX,
      html,
      templateData: data,
    });

    res.status(201).json(saved);
  } catch (error) {
    console.error("Error adding super admin:", error);
    res
      .status(500)
      .json({ message: "Failed to add super admin", error: error.message });
  }
};

const updateSuperAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, country, phoneNumber, permissions } = req.body;
    const loggedInUser = req.loggedInUserData?.user;
    const updatedBy = loggedInUser.id;

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
        timezone: "UTC",
        dateFormat: "dd-MM-yyyy",
        permissions: permissions || [],
        updatedBy: updatedBy,
      }
    );

    res.status(200).json({ message: "Super admin updated successfully" });
  } catch (error) {
    console.error("Error updating super admin:", error);
    res
      .status(500)
      .json({ message: "Failed to update super admin", error: error.message });
  }
};

const deleteSuperAdmin = async (req, res) => {
  try {
    // Accept either a single id (from params) or multiple ids (from body)
    const ids = req.body.ids || (req.params.id ? [req.params.id] : []);
    const loggedInUser = req.loggedInUserData?.user;
    const deletedBy = loggedInUser.id;

    let deleted = [];
    let notFound = [];

    for (const id of ids) {
      // Check if user exists and is a super admin
      const existingUser = await UserRepository.findOne({
        where: { id, isDeleted: false, isSuperAdmin: true },
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
      message: "Super admins deleted successfully",
      deleted,
      notFound,
    });
  } catch (error) {
    console.error("Error deleting super admin:", error);
    res.status(500).json({
      message: "Failed to delete super admin(s)",
      error: error.message,
    });
  }
};

const getSuperAdmins = async (req, res) => {
  try {
    // add order in listParams
    const order = { createdAt: "DESC" };
    const superAdmins = {
      entityName: "User",
      baseQuery: { isDeleted: false, isSuperAdmin: true },
      req,
    };
    superAdmins.order = order;

    const listResponse = await HandleMySqlList(superAdmins);

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
    console.error("Error getting super admins:", error);
    res
      .status(500)
      .json({ message: "Failed to get super admins", error: error.message });
  }
};

const getSuperAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    const superAdmin = await UserRepository.findOne({
      where: { id, isDeleted: false, isSuperAdmin: true },
    });

    const lastLogin = superAdmin.lastLogin;
    const resetPasswordExpiresAt = superAdmin.resetPasswordExpiresAt;
    const resetPasswordRequestedAt = superAdmin.resetPasswordRequestedAt;
    const createdAt = superAdmin.createdAt;
    const updatedAt = superAdmin.updatedAt;

    const lastLoginLocal = convertDateTimezone(
      DateTime.fromJSDate(lastLogin),
      superAdmin.timezone ?? "UTC"
    );

    const resetPasswordExpiresAtLocal = convertDateTimezone(
      DateTime.fromJSDate(resetPasswordExpiresAt),
      superAdmin.timezone ?? "UTC"
    );

    const resetPasswordRequestedAtLocal = convertDateTimezone(
      DateTime.fromJSDate(resetPasswordRequestedAt),
      superAdmin.timezone ?? "UTC"
    );

    const createdAtLocal = convertDateTimezone(
      DateTime.fromJSDate(createdAt),
      superAdmin.timezone ?? "UTC"
    );

    const updatedAtLocal = convertDateTimezone(
      DateTime.fromJSDate(updatedAt),
      superAdmin.timezone ?? "UTC"
    );

    superAdmin.lastLoginLocal = lastLoginLocal;
    superAdmin.resetPasswordExpiresAtLocal = resetPasswordExpiresAtLocal;
    superAdmin.resetPasswordRequestedAtLocal = resetPasswordRequestedAtLocal;
    superAdmin.createdAtLocal = createdAtLocal;
    superAdmin.updatedAtLocal = updatedAtLocal;

    res.status(200).json(superAdmin);
  } catch (error) {
    console.error("Error getting super admin by ID:", error);
    res
      .status(500)
      .json({ message: "Failed to get super admin", error: error.message });
  }
};

module.exports = {
  addSuperAdmin,
  updateSuperAdmin,
  deleteSuperAdmin,
  getSuperAdmins,
  getSuperAdminById,
};
