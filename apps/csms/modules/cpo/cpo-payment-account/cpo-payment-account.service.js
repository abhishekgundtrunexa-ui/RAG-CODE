const { CpoPaymentAccountRepository } = require("@shared-libs/db/mysql");
const { ObjectDAO } = require("@shared-libs/helpers");
const { HandleMySqlList } = require("@shared-libs/db");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const listCpoPaymentAccount = async (req, res) => {
  const loggedInUser = req["loggedInUserData"]["user"];

  const listParams = {
    entityName: "CpoPaymentAccount",
    baseQuery: {
      cpoId: loggedInUser.cpoId,
      isDeleted: false,
    },
    req,
  };

  const userListResponse = await HandleMySqlList(listParams);
  if (userListResponse.list && userListResponse.list.length > 0) {
    userListResponse.list = userListResponse.list.map((userList) => {
      return ObjectDAO(userList, ["cpoId"]);
    });
  }

  res.status(200).json(userListResponse);
};

const addCpoPaymentAccount = async (req, res) => {
  const { fullName, accountNo, bankName, swiftCode, ifscCode, document } =
    req.body;
  const loggedInUser = req["loggedInUserData"]["user"];

  const isExist = await CpoPaymentAccountRepository.findOne({
    where: {
      cpoId: loggedInUser.cpoId,
      isDeleted: false,
      accountNo,
    },
    select: ["id"],
  });
  if (isExist) {
    return res.status(400).json({
      success: false,
      message: "Account already exist",
    });
  }

  let isDefault = false;
  const allPaymentAccounts = await CpoPaymentAccountRepository.find({
    where: {
      cpoId: loggedInUser.cpoId,
      isDeleted: false,
    },
    select: ["id"],
  });
  if (allPaymentAccounts.length === 0) {
    isDefault = true;
  }

  await CpoPaymentAccountRepository.save({
    cpoId: loggedInUser.cpoId,
    fullName,
    accountNo,
    bankName,
    swiftCode,
    ifscCode,
    document,
    isDefault,
  });

  const listParams = {
    entityName: "CpoPaymentAccount",
    baseQuery: {
      cpoId: loggedInUser.cpoId,
      isDeleted: false,
    },
    req,
  };

  // Handle the MySQL-based listing
  const userListResponse = await HandleMySqlList(listParams);

  res.status(200).json(userListResponse);
};

const getCpoPaymentAccountById = async (cpoPaymentAccountId, req, res) => {
  const loggedInUser = req["loggedInUserData"]["user"];
  const paymentAccount = await CpoPaymentAccountRepository.findOne({
    where: {
      id: cpoPaymentAccountId,
      cpoId: loggedInUser.cpoId,
      isDeleted: false,
    },
  });
  if (!paymentAccount) {
    return res.status(400).json({ message: "Card details not found!" });
  }
  res.status(200).json(ObjectDAO(paymentAccount, ["cpoId"]));
};

const updateCpoPaymentAccountById = async (cpoPaymentAccountId, req, res) => {
  const { fullName, accountNo, bankName, swiftCode, ifscCode, document } =
    req.body;
  const loggedInUser = req["loggedInUserData"]["user"];

  const existingAccount = await CpoPaymentAccountRepository.findOne({
    where: {
      id: cpoPaymentAccountId,
      cpoId: loggedInUser.cpoId,
      isDeleted: false,
    },
  });

  if (!existingAccount) {
    return res.status(404).json({
      success: false,
      message: "Payment account not found",
    });
  }

  await CpoPaymentAccountRepository.update(cpoPaymentAccountId, {
    fullName,
    accountNo,
    bankName,
    swiftCode,
    ifscCode,
    document,
  });

  const updatedPaymentAccount = await CpoPaymentAccountRepository.findOne({
    where: { id: cpoPaymentAccountId },
  });

  res.status(200).json(updatedPaymentAccount);
};

const deleteCpoPaymentAccountById = async (cpoPaymentAccountId, req, res) => {
  const loggedInUser = req["loggedInUserData"]["user"];
  const paymentAccount = await CpoPaymentAccountRepository.findOne({
    where: {
      id: cpoPaymentAccountId,
      cpoId: loggedInUser.cpoId,
      isDeleted: false,
    },
  });

  if (!paymentAccount) {
    return res.status(404).json({ message: "Payment Account Not Found" });
  }

  await CpoPaymentAccountRepository.update(cpoPaymentAccountId, {
    isDeleted: true,
  });

  const updatedPaymentAccount = await CpoPaymentAccountRepository.findOne({
    where: { id: cpoPaymentAccountId },
  });

  res.status(200).json(updatedPaymentAccount);
};

const makeDefaultCpoPaymentAccountById = async (
  cpoPaymentAccountId,
  req,
  res
) => {
  const loggedInUser = req["loggedInUserData"]["user"];
  const paymentAccount = await CpoPaymentAccountRepository.findOne({
    where: {
      id: cpoPaymentAccountId,
      cpoId: loggedInUser.cpoId,
      isDeleted: false,
    },
  });

  if (!paymentAccount) {
    return res.status(404).json({ message: "Payment Account Not Found" });
  }

  await CpoPaymentAccountRepository.update(
    { cpoId: loggedInUser.cpoId, isDeleted: false },
    { isDefault: false }
  );

  await CpoPaymentAccountRepository.update(cpoPaymentAccountId, {
    isDefault: true,
  });

  const updatedPaymentAccount = await CpoPaymentAccountRepository.findOne({
    where: { id: cpoPaymentAccountId },
  });

  res.status(200).json(updatedPaymentAccount);
};

module.exports = {
  listCpoPaymentAccount,
  addCpoPaymentAccount,
  getCpoPaymentAccountById,
  updateCpoPaymentAccountById,
  deleteCpoPaymentAccountById,
  makeDefaultCpoPaymentAccountById,
};
