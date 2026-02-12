const bcrypt = require("bcrypt");
const { UserStatuses } = require("@shared-libs/constants");
const {
  UserRepository,
  UserCredentialRepository,
  UserRoleRepository,
  EMspRepository,
} = require("@shared-libs/db/mysql");
const {
  DefaultEMspUserRole,
  DefaultEMspPermissions,
} = require("@shared-libs/constants/e-msp");
const { toSnakeCase } = require("@shared-libs/helpers");

const SeedSuperAdmin = async () => {
  try {
    const plainPassword = "Cgx@1234";
    const defaultUserPassword = await bcrypt.hash(
      plainPassword,
      await bcrypt.genSalt()
    );

    // ============================================
    const userRoleData = await UserRoleRepository.find();

    if (userRoleData.length === 0) {
      await UserRoleRepository.save({
        name: DefaultEMspUserRole,
        code: toSnakeCase(DefaultEMspUserRole),
        permissions: DefaultEMspPermissions,
        isDefault: true,
      });
      console.log("UserRoles seeding done.");
    }

    // ============================================

    const userData = await UserRepository.find();

    if (userData.length === 0) {
      const createdUser = await UserRepository.save({
        firstName: "Aagam",
        lastName: "Jain",
        email: "admin@chargnex.com",
        status: UserStatuses.ACTIVE,
        isOwner: true,
        userRoleId: (
          await UserRoleRepository.findOne({
            where: { code: "super_admin" },
          })
        ).id,
      });

      await UserCredentialRepository.save({
        userId: createdUser.id,
        password: defaultUserPassword,
      });

      console.log("Users seeding done.");
    }
  } catch (error) {
    console.error("Error seeding E-MSP in database:", error);
  }
};

module.exports = { SeedSuperAdmin };
