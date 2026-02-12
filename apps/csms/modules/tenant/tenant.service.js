const { In } = require("typeorm");
const {
  TenantRepository,
  StoreUserMappingRepository,
  TenantAccountRepository,
  MultiMediaRepository,
} = require("@shared-libs/db/mysql");
const { arrayObjArr, ObjectDAO } = require("@shared-libs/helpers");
const { HandleMySqlList } = require("@shared-libs/db");

const addTenant = async (req, res) => {
  let bodyData = req.body;
  let loggedInUserData = req.loggedInUserData;

  const accounts = bodyData.accounts || [];
  let tenantAccountId = null;
  delete bodyData.accounts;

  const existingTenant = await StoreUserMappingRepository.findOne({
    where: { userId: loggedInUserData.user.id },
  });

  if (existingTenant) {
    await TenantRepository.update(existingTenant.storeId, bodyData);
    const updatedTenant = await TenantRepository.findOne({
      where: { id: existingTenant.storeId },
    });

    if (accounts.length > 0) {
      for (let account of accounts) {
        const existingAccount = await TenantAccountRepository.findOne({
          where: {
            accountName: account.accountName,
            accountNumber: account.accountNumber,
          },
        });

        if (existingAccount) {
          existingAccount.isDefault = account.isDefault;
          await TenantAccountRepository.save(existingAccount);

          if (existingAccount.isDefault) {
            tenantAccountId = existingAccount.id;
          }
        } else {
          const savedAccount = await TenantAccountRepository.save({
            ...account,
            tenantId: existingTenant.storeId,
          });

          if (account.isDefault) {
            tenantAccountId = savedAccount.id;
          }
        }
      }

      await TenantRepository.update(existingTenant.storeId, {
        tenantAccountId,
      });
    }

    return res.status(200).json(updatedTenant);
  } else {
    bodyData.ownerId = loggedInUserData.user.id;
    const tenant = await TenantRepository.save(bodyData);

    let storeUserMappingObject = {
      storeId: tenant.id,
      userId: loggedInUserData.user.id,
    };

    await StoreUserMappingRepository.save(storeUserMappingObject);

    if (accounts.length > 0) {
      for (let account of accounts) {
        const existingAccount = await TenantAccountRepository.findOne({
          where: {
            accountName: account.accountName,
            accountNumber: account.accountNumber,
          },
        });

        if (existingAccount) {
          existingAccount.isDefault = account.isDefault;
          await TenantAccountRepository.save(existingAccount);

          if (existingAccount.isDefault) {
            tenantAccountId = existingAccount.id;
          }
        } else {
          const savedAccount = await TenantAccountRepository.save({
            ...account,
          });

          if (account.isDefault) {
            tenantAccountId = savedAccount.id;
          }
        }
      }

      await TenantRepository.update(tenant.id, { tenantAccountId });
    }

    return res.status(201).json(tenant);
  }
};

const getTenantMultiMedia = async (list) => {
  const ids = list.map(({ id }) => id);

  const multiMedias = await MultiMediaRepository.find({
    where: { storeId: In([...ids]) },
  });

  const multiMediaLists = arrayObjArr(multiMedias, "storeId");
  const returnList = list.map((d) => {
    return ObjectDAO({
      ...d,
      multiMediaList: d.id ? multiMediaLists[d.id] : [],
    });
  });

  return returnList;
};

const getTenant = async (req, res) => {
  try {
    const listParams = {
      entityName: "Tenant",
      baseQuery: {
        isDeleted: false,
      },
      req,
    };

    const tenantResponse = await HandleMySqlList(listParams);
    if (tenantResponse.list.length > 0) {
      tenantResponse.list = await getTenantMultiMedia(tenantResponse.list);
    }

    res.status(200).json(tenantResponse);
  } catch (error) {
    console.error("Error fetching tenent list:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  addTenant,
  getTenant,
};
