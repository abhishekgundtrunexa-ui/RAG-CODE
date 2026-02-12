const bcrypt = require("bcrypt");
const {
  DefaultCpoUserRole,
  DefaultCpoPermissions,
} = require("@shared-libs/constants/cpo");
const {
  CpoRepository,
  CpoUserRoleRepository,
  CpoUserRepository,
  CpoUserCredentialRepository,
} = require("@shared-libs/db/mysql");
const { UserStatuses } = require("@shared-libs/constants");
const { toSnakeCase } = require("@shared-libs/helpers");

const SeedCpo = async () => {
  try {
    const cpoData = await CpoRepository.find();

    if (cpoData.length === 0) {
      const createdCpo = await CpoRepository.save({
        name: "Flownex",
        endpoint: "flow",
        taxation: "TXN17117729",
        billingAddress: "Malaysia",
        country: "MY",
        currency: "MYR",
        language: "English",
      });
      const createdCpoUserRole = await CpoUserRoleRepository.save({
        cpoId: createdCpo.id,
        name: DefaultCpoUserRole,
        code: toSnakeCase(DefaultCpoUserRole),
        permissions: DefaultCpoPermissions,
        isDefault: true,
      });

      const createUserPayload = {
        cpoId: createdCpo.id,
        cpoUserRoleId: createdCpoUserRole.id,
        firstName: "Aagam",
        lastName: "Jain",
        email: "admin@flownex.io",
        phoneNumber: "9632814570",
        isOwner: true,
        status: UserStatuses.ACTIVE,
      };

      const createdCpoUser = await CpoUserRepository.save(createUserPayload);

      const plainPassword = "Flownex@1234";
      const defaultUserPassword = await bcrypt.hash(
        plainPassword,
        await bcrypt.genSalt()
      );
      await CpoUserCredentialRepository.save({
        cpoUserId: createdCpoUser.id,
        password: defaultUserPassword,
      });

      console.log("CPO seeding done.");
    }
  } catch (error) {
    console.error("Error seeding CPO in database:", error);
  }
};

module.exports = { SeedCpo };
