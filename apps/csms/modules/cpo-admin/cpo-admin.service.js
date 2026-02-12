const { DateTime } = require("luxon");
const {
  CpoRepository,
  CpoUserRepository,
  CpoUserRoleRepository,
  CpoUserCredentialRepository,
  UniversalBaseRateRepository,
  CpoBaseRateRepository,
  EvseStationViewRepository,
  ChargerViewRepository,
  OcppTransactionsRepository,
} = require("@shared-libs/db/mysql");
const {
  ExpireTimeConstants,
  EmailConstants,
  NotificationTypes,
} = require("@shared-libs/constants");
const {
  DefaultCpoUserRole,
  DefaultCpoPermissions,
} = require("@shared-libs/constants/cpo");
const {
  toSnakeCase,
  generateRandomCode,
  checkUserPhone,
  checkUserEmail,
  ObjectDAO,
} = require("@shared-libs/helpers");
const { HandleMySqlList } = require("@shared-libs/db");
const { getDynamicHtml } = require("@shared-libs/email");
const { EmailQueue } = require("@shared-libs/queues");
const { In } = require("typeorm");
const { saveNotification } = require("@shared-libs/notification");
const { CountryModel } = require("@shared-libs/db/mongo-db");

const addCpo = async (payload, req, res) => {
  const {
    cpoName = "",
    cpoCountry = "",
    name,
    email,
    phoneNumber,
    multipartyRevenue = false,
  } = payload;

  try {
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
    const [firstName, lastName] = name.split(" ");
    // get additional details using country
    const countryData = await CountryModel.findOne({
      isoCode: cpoCountry,
    }).lean();
    if (!countryData) {
      return res.status(400).json({
        success: false,
        message: `Country data not found for country Code ${cpoCountry}`,
      });
    }
    const createdCpo = await CpoRepository.save({
      name: cpoName,
      country: cpoCountry,
      currency: countryData["currency"],
      language: countryData["language"],
      currencyName: countryData["currencyName"],
      currencySymbol: countryData["currencySymbol"],
      multipartyRevenue,
    });
    // Now also create default baseRate for the cpo
    if (!countryData["baseRate"]) {
      const universalBaseRate = await UniversalBaseRateRepository.findOne({
        where: {},
        select: [
          "baseRateKWH",
          "parkingRate",
          "taxRate",
          "discount",
          "penalty",
        ],
      });
      universalBaseRate["currency"] = countryData["currency"];
      universalBaseRate["currencyName"] = countryData["currencyName"];
      universalBaseRate["currencySymbol"] = countryData["currencySymbol"];
      countryData["baseRate"] = universalBaseRate;
    }
    const baseRatePayload = { ...countryData["baseRate"] };
    baseRatePayload["name"] = "Default";
    baseRatePayload["isDefault"] = 1;
    baseRatePayload["cpoId"] = createdCpo.id;
    await CpoBaseRateRepository.save({ ...baseRatePayload });

    const createdCpoUserRole = await CpoUserRoleRepository.save({
      cpoId: createdCpo.id,
      name: DefaultCpoUserRole,
      code: toSnakeCase(DefaultCpoUserRole),
      permissions: DefaultCpoPermissions,
      isDefault: true,
    });

    const codeToSend = generateRandomCode(6);
    const resetPasswordExpiresAt = DateTime.utc()
      .plus({ day: ExpireTimeConstants.USER_SET_PASSWORD_CODE })
      .toISO();
    const resetPasswordRequestedAt = DateTime.utc().toISO();

    const createUserPayload = {
      cpoId: createdCpo.id,
      cpoUserRoleId: createdCpoUserRole.id,
      firstName,
      lastName,
      email,
      phoneNumber,
      resetPasswordCode: codeToSend,
      resetPasswordExpiresAt: resetPasswordExpiresAt,
      resetPasswordRequestedAt: resetPasswordRequestedAt,
      isOwner: true,
    };

    const createdCpoUser = await CpoUserRepository.save(createUserPayload);
    await CpoUserCredentialRepository.save({ cpoUserId: createdCpoUser.id });

    const { html, data } = await getDynamicHtml({
      htmlTemplatePath: "/templates/invite-user.html",
      data: {
        userName: `${createdCpoUser.firstName} ${createdCpoUser.lastName}`,
        inviteCode: codeToSend,
        registrationLink: `${process.env.CORE_BASEURL}/set-password?email=${email}`,
      },
    });

    // Send registration email
    await EmailQueue.add({
      to: [createdCpoUser.email],
      subject: EmailConstants.subject.WELCOME_TO_CHARGE_NEX,
      html,
      templateData: data,
    });

    await saveNotification({
      data: {
        cpoId: createdCpo.id,
        cpoUserId: createdCpoUser.id,
        name: `${createdCpoUser.firstName} ${createdCpoUser.lastName}`,
        email: createdCpoUser.email,
      },
      type: NotificationTypes.CPO_REGISTERED,
    });

    res.status(200).json(createdCpoUser);
  } catch (error) {
    console.error("Error adding CPO:", error);
    res.status(500).send({
      message: "Internal Server Error",
    });
  }
};

const getCpoById = async (cpoAdminUserId, req, res) => {
  try {
    const cpoUser = await CpoUserRepository.findOne({
      where: { id: cpoAdminUserId },
      relations: ["cpoUserRoleId"],
    });

    if (!cpoUser) {
      return res.status(404).json({ message: "CPO Admin Not Found" });
    }
    const cpoAdminInfo = await CpoRepository.findOne({
      where: { id: cpoUser["cpoId"] },
      select: ["country", "name"],
    });
    cpoUser["businessName"] = cpoAdminInfo["name"];
    cpoUser["country"] = cpoAdminInfo["country"];
    cpoUser.roleData = ObjectDAO(cpoUser.cpoUserRoleId);
    cpoUser.cpoUserRoleId = cpoUser.roleData.id;

    const stations = await EvseStationViewRepository.find({
      where: {
        cpoId: cpoUser["cpoId"],
      },
      select: ["id"],
    });
    if (stations.length === 0) {
      return res.status(200).json({
        ...ObjectDAO(cpoUser),
        totalChargers: 0,
        totalSessions: 0,
        totalStations: 0,
        totalTransactions: 0,
      });
    }
    const StationIds = stations.map((station) => station.id);
    const chargersCount = await ChargerViewRepository.count({
      where: {
        evseStationId: In(StationIds),
        isDeleted: false,
      },
    });
    const sessionsCount = await OcppTransactionsRepository.count({
      where: {
        evseStationId: In(StationIds),
        isDeleted: false,
      },
    });
    const responsePayload = {
      ...ObjectDAO(cpoUser),
      totalChargers: chargersCount,
      totalSessions: sessionsCount,
      totalStations: StationIds.length,
      totalTransactions: sessionsCount,
    };
    res.status(200).json(responsePayload);
  } catch (error) {
    console.error("Error fetching CPO:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateCpo = async (cpoAdminUserId, req, res) => {
  const payload = req.body;
  const { cpoName, cpoCountry, name, email, phoneNumber, multipartyRevenue } =
    payload;
  try {
    let [firstName, lastName] = name.split(" ");
    const cpoUser = await CpoUserRepository.findOne({
      where: { id: cpoAdminUserId },
    });
    if (!cpoUser) {
      return res.status(404).json({ message: "CPO Admin Not Found" });
    }

    if (email) {
      const checkEmail = await checkUserEmail({
        email,
        userId: cpoAdminUserId,
      });
      if (checkEmail?.code == 400) {
        return res.status(checkEmail?.code).json(checkEmail?.data);
      }
    }

    if (phoneNumber) {
      const checkPhone = await checkUserPhone({
        phoneNumber,
        userId: cpoAdminUserId,
      });
      if (checkPhone?.code == 400) {
        return res.status(checkPhone?.code).json(checkPhone?.data);
      }
    }

    if (cpoName) {
      await CpoRepository.update(cpoUser.cpoId, { name: cpoName });
    }
    if (cpoCountry) {
      await CpoRepository.update(cpoUser.cpoId, { country: cpoCountry });
    }
    if (multipartyRevenue != null) {
      await CpoRepository.update(cpoUser.cpoId, {
        multypartyRevenue: multipartyRevenue,
      });
    }

    await CpoUserRepository.update(cpoUser.id, {
      firstName,
      lastName,
      email,
      phoneNumber,
    });

    const updatedCpoUser = await CpoUserRepository.findOne({
      where: { id: cpoUser.id },
    });

    res.status(200).json(updatedCpoUser);
  } catch (error) {
    console.error("Error updating CPO:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getCpoList = async (req, res) => {
  try {
    const listParams = {
      entityName: "CpoUserView",
      baseQuery: {
        isDeleted: false,
        isCpoDeleted: false,
        isOwner: true,
      },
      req,
    };

    const listResponse = await HandleMySqlList(listParams);
    if (listResponse.list && listResponse.list.length > 0) {
      // attach cpoUserRoles
      const finalListResponse = await Promise.all(
        listResponse.list.map(async (cpo) => {
          const role = await CpoUserRoleRepository.findOne({
            where: { id: cpo.cpoUserRoleId },
          });
          return ObjectDAO({
            ...cpo,
            roleData: ObjectDAO(role),
          });
        })
      );
      listResponse.list = finalListResponse;
    }
    res.status(200).json(listResponse);
  } catch (error) {
    console.error("Error fetching CPO list:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const listCpoAdmins = async (req, res) => {
  try {
    const listParams = {
      entityName: "CpoUserView",
      baseQuery: {
        isDeleted: false,
        cpoUserRoleCode: "cpo_admin",
      },
      req,
    };

    const listResponse = await HandleMySqlList(listParams);
    if (listResponse.list && listResponse.list.length > 0) {
      // attach cpoUserRoles
      const finalListResponse = await Promise.all(
        listResponse.list.map(async (cpo) => {
          const role = await CpoUserRoleRepository.findOne({
            where: { id: cpo.cpoUserRoleId },
          });
          return ObjectDAO({
            ...cpo,
            roleData: ObjectDAO(role),
          });
        })
      );
      listResponse.list = finalListResponse;
    }
    res.status(200).json(listResponse);
  } catch (error) {
    console.error("Error fetching CPO list:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteCpo = async (cpoId, req, res) => {
  try {
    const cpo = await CpoRepository.findOne({
      where: { id: cpoId, isDeleted: false },
    });
    if (!cpo) {
      return res.status(404).json({ message: "CPO Not Found" });
    }

    await CpoRepository.update(cpoId, { isDeleted: true });
    // also mark all cpoUsers as deleted
    const cpoUserIdsRaw = await CpoUserRepository.find({
      where: { cpoId, isDeleted: false },
      select: ["id"],
    });
    const cpoUserIds = cpoUserIdsRaw.map((id) => id.id);
    if (cpoUserIds.length > 0) {
      await CpoUserRepository.update(
        { id: In(cpoUserIds) },
        { isDeleted: true }
      );
    }
    const updatedCpo = await CpoRepository.findOne({
      where: { id: cpoId },
    });

    res.status(200).json(updatedCpo);
  } catch (error) {
    console.error("Error deleting CPO:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteCpoBulk = async (cpoIds, req, res) => {
  try {
    const length = cpoIds.length;

    const cpos = await CpoUserRepository.find({
      where: { id: In(cpoIds), isDeleted: false },
      select: ["id", "cpoId"],
    });

    if (cpos.length !== length) {
      return res.status(400).json({
        success: false,
        message: "Unknown cpoId provided!",
      });
    }
    const CpoIds = cpos.map((cpo) => cpo.cpoId);
    if (CpoIds.length > 0) {
      // now soft delete the cpoAdmins
      await CpoRepository.update({ id: In(CpoIds) }, { isDeleted: true });
    }

    await CpoUserRepository.update({ id: In(cpoIds) }, { isDeleted: true });

    const updatedCpo = await CpoUserRepository.find({
      where: { id: In(cpoIds) },
    });

    // also delete cpoUsers under cpoAdmins
    const cpoUserIdsRaw = await CpoUserRepository.find({
      where: { cpoId: In(cpoIds), isDeleted: false },
      select: ["id"],
    });
    const cpoUserIds = cpoUserIdsRaw.map((id) => id.id);
    if (cpoUserIds.length > 0) {
      await CpoUserRepository.update(
        { id: In(cpoUserIds) },
        { isDeleted: true }
      );
    }

    res.status(200).json(updatedCpo);
  } catch (error) {
    console.error("Error deleting CPO:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  addCpo,
  getCpoById,
  updateCpo,
  getCpoList,
  listCpoAdmins,
  deleteCpo,
  deleteCpoBulk,
};
