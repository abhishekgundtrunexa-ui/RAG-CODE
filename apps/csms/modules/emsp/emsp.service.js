const { getDynamicHtml } = require("@shared-libs/email");
const {
  EMspBusinessTaxDetailsRepository,
  EMspBankAccountRepository,
  EMspPaymentConfigRepository,
  EMspChargerConfigRepository,
  MySQLDataSource,
  EMspRepository,
  EMspUserRepository,
  UserRepository,
} = require("@shared-libs/db/mysql");
const {
  generateRandomCode,
  calculatePreauthAmount,
  getTimezoneByCountry,
} = require("@shared-libs/helpers");
const {
  ExpireTimeConstants,
  BankVerificationStatuses,
} = require("@shared-libs/constants");
const { DateTime } = require("luxon");
const { HandleMySqlList } = require("@shared-libs/db");
const { In } = require("typeorm");

const addEmsp = async (req, res) => {
  const { userId: createdBy } = req?.loggedInUserData;
  const queryRunner = MySQLDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const {
      emspData = {},
      businessTaxDetails,
      bankAccount,
      paymentConfig,
      chargerConfig,
    } = req.body;

    const {
      companyName,
      emspAdminName,
      companyEmail,
      emspAdminEmail,
      phone,
      currency,
      country,
      language,
      registeredAddress,
      isBillingAddressSame,
      billingAddress,
      profilePicture,
      state,
      pincode,
    } = emspData;

    let emsp, defaultUser;

    // find country in emsp repository
    const countryExists = await EMspRepository.findOne({
      where: { country: country, isDeleted: false },
    });

    if (countryExists) {
      return res.status(400).json({
        message: `This country is already configured. Please edit the existing configuration.`,
      });
    }

    const existingEmsp = await EMspRepository.findOne({
      where: { email: companyEmail },
    });
    const existingUser = await EMspUserRepository.findOne({
      where: { email: emspAdminEmail },
    });

    // Block verified users
    if (existingUser?.apexEmailVerified) {
      return res.status(400).json({
        message: `User email ${emspAdminEmail} is already registered and verified!`,
      });
    }
    const companyNameWithPrefix = `Chargnex ${companyName}`;
    // Step 1: Create or Update EMSP
    if (existingEmsp) {
      emsp = {
        ...existingEmsp,
        name: companyNameWithPrefix,
        phone,
        currency,
        country,
        language,
        registeredAddress,
        billingAddress,
        profilePicture,
        createdBy,
      };
      await EMspRepository.save(emsp);
    } else {
      emsp = EMspRepository.create({
        name: companyNameWithPrefix,
        email: companyEmail,
        phone,
        currency,
        country,
        language,
        registeredAddress,
        billingAddress,
        profilePicture,
        createdBy,
      });
      await EMspRepository.save(emsp);
    }

    // Step 2: Business Tax
    if (businessTaxDetails) {
      const existingTax = await EMspBusinessTaxDetailsRepository.findOneBy({
        emspId: emsp.id,
      });
      if (existingTax) {
        await EMspBusinessTaxDetailsRepository.update(
          { emspId: emsp.id },
          businessTaxDetails
        );
      } else {
        const newTax = EMspBusinessTaxDetailsRepository.create({
          ...businessTaxDetails,
          emspId: emsp.id,
        });
        await EMspBusinessTaxDetailsRepository.save(newTax);
      }
    }

    // Step 3: Bank Account
    if (bankAccount) {
      const existingBank = await EMspBankAccountRepository.findOneBy({
        emspId: emsp.id,
      });
      if (existingBank) {
        await EMspBankAccountRepository.update(
          { emspId: emsp.id },
          bankAccount
        );
      } else {
        const newBank = EMspBankAccountRepository.create({
          ...bankAccount,
          emspId: emsp.id,
        });
        await EMspBankAccountRepository.save(newBank);
      }
    }

    // Step 4: Payment Config
    if (paymentConfig) {
      const existingPayment = await EMspPaymentConfigRepository.findOneBy({
        emspId: emsp.id,
      });
      if (existingPayment) {
        await EMspPaymentConfigRepository.update(
          { emspId: emsp.id },
          paymentConfig
        );
      } else {
        const newPayment = EMspPaymentConfigRepository.create({
          ...paymentConfig,
          emspId: emsp.id,
        });
        await EMspPaymentConfigRepository.save(newPayment);
      }
    }

    // Step 5: Charger Config
    if (chargerConfig) {
      const existingCharger = await EMspChargerConfigRepository.findOneBy({
        emspId: emsp.id,
      });
      if (existingCharger) {
        await EMspChargerConfigRepository.update(
          { emspId: emsp.id },
          chargerConfig
        );
      } else {
        const newCharger = EMspChargerConfigRepository.create({
          ...chargerConfig,
          emspId: emsp.id,
        });
        await EMspChargerConfigRepository.save(newCharger);
      }
    }

    // Step 7: Create or Update EMSP User
    const codeToSend = generateRandomCode(6);
    const resetPasswordExpiresAt = DateTime.utc()
      .plus({ day: ExpireTimeConstants.USER_SET_PASSWORD_CODE })
      .toISO();
    const resetPasswordRequestedAt = DateTime.utc().toISO();

    if (existingUser) {
      defaultUser = {
        ...existingUser,
        emspId: emsp.id,
        name: emspAdminName,
        email: emspAdminEmail,
        isBillingAddressSame,
        country,
        phone,
        state,
        pincode,
        isEmsp: true,
        status: "REGISTERED",
        resetPasswordCode: codeToSend,
        resetPasswordExpiresAt,
        resetPasswordRequestedAt,
      };
      await EMspUserRepository.save(defaultUser);
    } else {
      defaultUser = EMspUserRepository.create({
        emspId: emsp.id,
        name: emspAdminName,
        email: emspAdminEmail,
        isBillingAddressSame,
        country,
        phone,
        state,
        pincode,
        isDeleted: false,
        isEmsp: true,
        status: "REGISTERED",
        resetPasswordCode: codeToSend,
        resetPasswordExpiresAt,
        resetPasswordRequestedAt,
      });
      await EMspUserRepository.save(defaultUser);
    }

    // Step 8: Send Email (Optional)
    const { html, data } = await getDynamicHtml({
      htmlTemplatePath: "/templates/invite-user.html",
      data: {
        userName: `${emspAdminName}`,
        inviteCode: codeToSend,
        registrationLink: `${process.env.CORE_BASEURL}/set-password?email=${emspAdminEmail}&authCode=${codeToSend}`,
      },
    });

    // Disabled for now
    // await EmailQueue.add({
    //   to: [emspAdminEmail],
    //   subject: EmailConstants.subject.WELCOME_TO_CHARGE_NEX,
    //   html,
    //   templateData: data,
    // });

    await queryRunner.commitTransaction();
    res.status(201).json(defaultUser);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error("Error in add emsp:", error);
    res.status(500).json({
      message: "An Error Occurred While Adding The Emsp",
      error: error.message,
    });
  } finally {
    await queryRunner.release();
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { emspId } = req.body;

    const emspData = await EMspUserRepository.findOne({
      where: { id: emspId },
      select: ["id"],
    });
    if (!emspData?.id) {
      return res
        .status(400)
        .json({ success: false, message: "Emsp data not found!" });
    }
    await EMspUserRepository.update(
      { id: emspId },
      { apexEmailVerified: true }
    );

    res
      .status(201)
      .json({ success: true, message: "Otp verified successfully!" });
  } catch (error) {
    res.status(500).json({
      message: "An Error Occurred While Verifying The Otp",
      error: error.message,
    });
  }
};

const updateEmsp = async (req, res) => {
  const { emspId } = req.params;
  const queryRunner = MySQLDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const {
      emspData = {},
      businessTaxDetails,
      bankAccount,
      paymentConfig,
      chargerConfig,
    } = req.body;

    if (!emspId) {
      return res.status(400).json({ message: "emspId is required" });
    }

    // const EmspUser = await EMspUserRepository.findOne({
    //   where: { id: emspId, isEmsp: true },
    // });
    const existingEmsp = await EMspUserRepository.findOne({
      where: { id: emspId, isDeleted: false },
    });

    if (!existingEmsp) {
      return res
        .status(404)
        .json({ message: `eMSP with id ${emspId} not found` });
    }

    // Step 1: Update eMSP core data
    const {
      emspAdminName,
      emspAdminEmail,
      country,
      phone,
      state,
      pincode,
      isBillingAddressSame,
      ...restEmspData
    } = emspData;
    restEmspData.country = country;
    restEmspData.phone = phone;
    if (Object.keys(restEmspData).length > 0) {
      if (restEmspData.companyName !== undefined) {
        let cleanedCompanyName = restEmspData.companyName.trim();
        if (cleanedCompanyName.toLowerCase().startsWith("chargnex ")) {
          cleanedCompanyName = cleanedCompanyName.slice(9).trim();
        }
        restEmspData.name = `Chargnex ${cleanedCompanyName}`;
        delete restEmspData.companyName;
      }
      if (restEmspData.companyEmail !== undefined) {
        restEmspData.email = restEmspData.companyEmail;
        delete restEmspData.companyEmail;
      }
      await EMspRepository.update({ id: existingEmsp.emspId }, restEmspData);
    }

    // Step 2: Update default EMSP user's name and phone
    const defaultEmspUser = await EMspUserRepository.findOne({
      where: { id: existingEmsp.id, isEmsp: true },
    });

    if (defaultEmspUser) {
      const userUpdateData = {};
      if (emspAdminName !== undefined) {
        userUpdateData.name = emspAdminName;
      }
      if (emspAdminEmail !== undefined) {
        userUpdateData.email = emspAdminEmail;
      }
      if (phone !== undefined) {
        userUpdateData.phone = phone;
      }
      if (country !== undefined) {
        userUpdateData.country = country;
      }
      if (state !== undefined) {
        userUpdateData.state = state;
      }
      if (pincode !== undefined) {
        userUpdateData.pincode = pincode;
      }
      if (isBillingAddressSame !== undefined) {
        userUpdateData.isBillingAddressSame = isBillingAddressSame;
      }
      if (Object.keys(userUpdateData).length > 0) {
        await EMspUserRepository.update(
          { id: defaultEmspUser.id },
          userUpdateData
        );
      }
    }

    // Step 3: Update/Create Business Tax Details
    if (businessTaxDetails) {
      const existingTax = await EMspBusinessTaxDetailsRepository.findOneBy({
        emspId: existingEmsp.emspId,
      });
      if (existingTax) {
        await EMspBusinessTaxDetailsRepository.update(
          { emspId: existingEmsp.emspId },
          businessTaxDetails
        );
      } else {
        const newTax = EMspBusinessTaxDetailsRepository.create({
          ...businessTaxDetails,
          emspId: existingEmsp.emspId,
        });
        await EMspBusinessTaxDetailsRepository.save(newTax);
      }
    }

    // Step 4: Update/Create Bank Account
    if (bankAccount) {
      const existingBank = await EMspBankAccountRepository.findOneBy({
        emspId: existingEmsp.emspId,
      });
      if (existingBank) {
        await EMspBankAccountRepository.update(
          { emspId: existingEmsp.emspId },
          bankAccount
        );
      } else {
        const newBank = EMspBankAccountRepository.create({
          ...bankAccount,
          emspId: existingEmsp.emspId,
        });
        await EMspBankAccountRepository.save(newBank);
      }
    }

    // Step 5: Update/Create Payment Config
    if (paymentConfig) {
      const existingPayment = await EMspPaymentConfigRepository.findOneBy({
        emspId: existingEmsp.emspId,
      });
      if (existingPayment) {
        await EMspPaymentConfigRepository.update(
          { emspId: existingEmsp.emspId },
          paymentConfig
        );
      } else {
        const newPayment = EMspPaymentConfigRepository.create({
          ...paymentConfig,
          emspId: existingEmsp.emspId,
        });
        await EMspPaymentConfigRepository.save(newPayment);
      }
    }

    // Step 6: Update/Create Charger Config
    if (chargerConfig) {
      const existingCharger = await EMspChargerConfigRepository.findOneBy({
        emspId: existingEmsp.emspId,
      });
      if (existingCharger) {
        await EMspChargerConfigRepository.update(
          { emspId: existingEmsp.emspId },
          chargerConfig
        );
      } else {
        const newCharger = EMspChargerConfigRepository.create({
          ...chargerConfig,
          emspId: existingEmsp.emspId,
        });
        await EMspChargerConfigRepository.save(newCharger);
      }
    }

    await queryRunner.commitTransaction();

    res.status(200).json({ message: "eMSP updated successfully" });
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error("Error in update emsp:", error);
    res.status(500).json({
      message: "An Error Occurred While Updating The Emsp",
      error: error.message,
    });
  } finally {
    await queryRunner.release();
  }
};

const updateProfilePhoto = async (req, res) => {
  const { emspId } = req.params;
  const { profilePhoto } = req.body;

  if (!emspId) {
    return res.status(400).json({ message: "emspId is required" });
  }

  // const EmspUser = await EMspUserRepository.findOne({
  //   where: { id: emspId, isEmsp: true },
  // });
  const existingEmsp = await EMspRepository.findOne({
    where: { id: emspId },
  });

  if (!existingEmsp) {
    return res
      .status(404)
      .json({ message: `eMSP with id ${emspId} not found` });
  }

  await EMspRepository.update(
    { id: existingEmsp.id },
    { profilePicture: profilePhoto }
  );
  return res
    .status(200)
    .json({ message: "Profile photo updated successfully" });
};

const deleteEmsp = async (req, res) => {
  const { emspId } = req.params;

  if (!emspId) {
    return res.status(400).json({ message: "emspId is required" });
  }

  // Find EMSP by ID
  const emspUser = await EMspUserRepository.findOne({
    where: { id: emspId, isDeleted: false },
  });

  if (!emspUser) {
    return res.status(404).json({ message: "eMSP user not found" });
  }

  const emspData = await EMspRepository.findOne({
    where: { id: emspUser.emspId, isDeleted: false },
  });

  if (!emspData) {
    return res.status(404).json({ message: "eMSP not found" });
  }

  try {
    await EMspUserRepository.update({ id: emspId }, { isDeleted: true });
    return res.status(200).json({ message: "eMSP deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "An Error Occurred While Deleting The Emsp",
      error: error.message,
    });
  }
};

const upsertBusinessTaxDetails = async (req, res) => {
  const { emspId, ...data } = req.body;
  // const emspUser = await EMspUserRepository.findOne({
  //   where: { id: emspId },
  //   select: ["emspId"],
  // });

  const existing = await EMspBusinessTaxDetailsRepository.findOne({
    where: { emspId },
  });

  if (existing) {
    await EMspBusinessTaxDetailsRepository.update({ emspId }, data);
    return res.status(200).json({ message: "Business tax details updated" });
  }

  const entity = EMspBusinessTaxDetailsRepository.create({
    emspId,
    ...data,
  });
  await EMspBusinessTaxDetailsRepository.save(entity);
  res.status(201).json({ message: "Business tax details added" });
};

const upsertBankAccount = async (req, res) => {
  const { emspId, ...data } = req.body;

  // const emspUser = await EMspUserRepository.findOne({
  //   where: { id: emspId },
  //   select: ["emspId"],
  // });

  const existing = await EMspBankAccountRepository.findOne({
    where: { emspId },
  });

  if (existing) {
    await EMspBankAccountRepository.update({ emspId }, data);
    return res.status(200).json({ message: "Bank account updated" });
  }

  const entity = EMspBankAccountRepository.create({
    emspId,
    ...data,
  });
  await EMspBankAccountRepository.save(entity);
  return res.status(201).json({ message: "Bank account added" });
};

const upsertPaymentConfig = async (req, res) => {
  const { emspId, ...data } = req.body;

  // const emspUser = await EMspUserRepository.findOne({
  //   where: { id: emspId },
  //   select: ["emspId"],
  // });

  const existing = await EMspPaymentConfigRepository.findOne({
    where: { emspId },
  });

  if (existing) {
    await EMspPaymentConfigRepository.update({ emspId }, data);
    return res.status(200).json({ message: "Payment config updated" });
  }

  const entity = EMspPaymentConfigRepository.create({
    emspId,
    ...data,
  });
  await EMspPaymentConfigRepository.save(entity);
  return res.status(201).json({ message: "Payment config added" });
};

const upsertChargerConfig = async (req, res) => {
  const { emspId, ...data } = req.body;

  // const emspUser = await EMspUserRepository.findOne({
  //   where: { id: emspId },
  //   select: ["emspId"],
  // });

  const existing = await EMspChargerConfigRepository.findOne({
    where: { emspId },
  });

  if (existing) {
    await EMspChargerConfigRepository.update({ emspId }, data);
    return res.status(200).json({ message: "Charger config updated" });
  }

  const entity = EMspChargerConfigRepository.create({
    emspId,
    ...data,
  });
  await EMspChargerConfigRepository.save(entity);
  return res.status(201).json({ message: "Charger config added" });
};

const getEmspByQuery = async (req, res) => {
  try {
    const { email, phone } = req.query;

    // Build dynamic where clause
    const where = {};
    if (email) where.email = email;
    if (phone) where.phone = phone;

    if (Object.keys(where).length === 0) {
      return res
        .status(400)
        .json({ message: "At least one filter is required (email or phone)" });
    }

    let emsp = await EMspRepository.findOne({ where });
    let emspUser = await EMspUserRepository.findOne({ where });

    if (!emsp && !emspUser) {
      return res.status(404).json({ message: "eMSP not found" });
    }
    let emspId, emspUserId;
    if (emsp) {
      emspId = emsp.id;
      emspUser = await EMspUserRepository.findOne({ where: { emspId } });
      emspUserId = emspUser.id;
    } else {
      emspId = emspUser.emspId;
      emspUserId = emspUser.id;
      emsp = await EMspRepository.findOne({ where: { id: emspId } });
    }
    if (emspUser.apexEmailVerified == true) {
      return res
        .status(400)
        .json({ message: "Emsp setting exists in the system." });
    }

    // Fetch related onboarding data by emspId
    const [businessTaxDetails, bankAccount, paymentConfig, chargerConfig] =
      await Promise.all([
        EMspBusinessTaxDetailsRepository.findOneBy({ emspId }),
        EMspBankAccountRepository.findOneBy({ emspId }),
        EMspPaymentConfigRepository.findOneBy({ emspId }),
        EMspChargerConfigRepository.findOneBy({ emspId }),
      ]);
    return res.status(200).json({
      emspUserData: emspUser,
      emspCompanyData: emsp,
      businessTaxDetails,
      bankAccount,
      paymentConfig,
      chargerConfig,
    });
  } catch (error) {
    console.error("Error in getEmspByQuery:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve eMSP data", error: error.message });
  }
};

const getEmspById = async (req, res) => {
  try {
    const { emspId } = req.params;

    if (!emspId) {
      return res.status(400).json({ message: "emspId is required" });
    }

    // Find EMSP by ID
    const emsp = await EMspUserRepository.findOne({ where: { id: emspId } });

    if (!emsp) {
      return res.status(404).json({ message: "eMSP not found" });
    }
    const emspData = await EMspRepository.findOne({
      where: { id: emsp.emspId },
    });

    // Fetch related data
    const [businessTaxDetails, bankAccount, paymentConfig, chargerConfig] =
      await Promise.all([
        EMspBusinessTaxDetailsRepository.findOneBy({ emspId: emspData.id }),
        EMspBankAccountRepository.findOneBy({ emspId: emspData.id }),
        EMspPaymentConfigRepository.findOneBy({ emspId: emspData.id }),
        EMspChargerConfigRepository.findOneBy({ emspId: emspData.id }),
      ]);

    if (emspData?.createdBy) {
      const creator = await UserRepository.findOne({
        where: { id: emspData?.createdBy },
      });

      emspData["createdByUserName"] = creator?.fullName;
      emspData["createdByUserEmail"] = creator?.email;
    }

    if (emspData?.bankVerificationActionTakenBy) {
      const verifier = await UserRepository.findOne({
        where: { id: emspData?.bankVerificationActionTakenBy },
      });

      emspData["bankVerificationActionTakenByUserName"] = verifier?.fullName;
      emspData["bankVerificationActionTakenByUserEmail"] = verifier?.email;
    }

    res.status(200).json({
      emspUserData: emsp,
      emspCompanyData: emspData,
      businessTaxDetails,
      bankAccount,
      paymentConfig,
      chargerConfig,
    });
  } catch (error) {
    console.error("Error in getEmspById:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve eMSP by ID", error: error.message });
  }
};

const getPreauthAmount = async (req, res) => {
  try {
    const { regionalElectricityRate } = req.body;

    const preauthAmount = await calculatePreauthAmount({
      regionalElectricityRate: regionalElectricityRate ?? 0,
    });

    return res.status(200).json({
      preauthAmount,
    });
  } catch (error) {
    console.error("Error in getPreauthAmount:", error);
    res
      .status(500)
      .json({ message: "Failed to get Preauth Amount", error: error.message });
  }
};

const getFullEmspDetails = async (emspUser) => {
  try {
    if (!emspUser?.id || !emspUser?.emspId) {
      throw new Error("Invalid EMSP user object");
    }

    let [
      emspCompanyData,
      businessTaxDetails,
      bankAccount,
      paymentConfig,
      chargerConfig,
      countryData,
    ] = await Promise.all([
      EMspRepository.findOne({ where: { id: emspUser.emspId } }),
      EMspBusinessTaxDetailsRepository.findOneBy({ emspId: emspUser.emspId }),
      EMspBankAccountRepository.findOneBy({ emspId: emspUser.emspId }),
      EMspPaymentConfigRepository.findOneBy({ emspId: emspUser.emspId }),
      EMspChargerConfigRepository.findOneBy({ emspId: emspUser.emspId }),
      getTimezoneByCountry(emspUser?.country ?? "CA", true),
    ]);

    countryData = {
      currency: countryData?.currency ?? "CAD",
      currencyName: countryData?.currencyName ?? "Canadian Dollar",
      currencySymbol: countryData?.currencySymbol ?? "CAD$",
      timezone: countryData?.timezone ?? "America/Toronto",
      country: emspUser?.country ?? "CA",
    };

    emspCompanyData.pincode = emspUser?.pincode;
    emspCompanyData.state = emspUser?.state;

    if (emspCompanyData?.createdBy) {
      const creator = await UserRepository.findOne({
        where: { id: emspCompanyData?.createdBy },
      });

      emspCompanyData["createdByUserName"] = creator?.fullName;
      emspCompanyData["createdByUserEmail"] = creator?.email;
    }

    if (emspCompanyData?.bankVerificationActionTakenBy) {
      const verifier = await UserRepository.findOne({
        where: { id: emspCompanyData?.bankVerificationActionTakenBy },
      });

      emspCompanyData["bankVerificationActionTakenByUserName"] =
        verifier?.fullName;
      emspCompanyData["bankVerificationActionTakenByUserEmail"] =
        verifier?.email;
    }

    return {
      emspUserData: emspUser,
      emspCompanyData,
      businessTaxDetails,
      bankAccount,
      paymentConfig,
      chargerConfig,
      countryData,
    };
  } catch (error) {
    console.error("Error in getFullEmspUserDetails:", error);
    throw error;
  }
};

const getEmspUserList = async (req, res) => {
  try {
    const { list_unverified_bank = "false" } = req.query;

    let baseQuery = {
      isDeleted: false,
      isEmsp: true,
      apexEmailVerified: true,
    };

    if (list_unverified_bank == "true") {
      const emspData = await EMspRepository.find({
        where: {
          bankVerificationStatus: In([
            BankVerificationStatuses.PENDING,
            BankVerificationStatuses.REJECTED,
          ]),
        },
      });

      const emspIds = emspData.map(({ id }) => id);
      if (emspIds?.length == 0) {
        return res.status(200).json({
          list: [],
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
        });
      }

      baseQuery["emspId"] = {
        custom: true,
        value: `in("${emspIds.join('", "')}")`,
      };
    }

    const listParams = {
      entityName: "EmspUser",
      baseQuery,
      req,
    };

    const listResponse = await HandleMySqlList(listParams);

    if (listResponse.list.length > 0) {
      listResponse.list = await Promise.all(
        listResponse.list.map((user) => getFullEmspDetails(user))
      );
    }

    const search = req.query.search;
    if (search) {
      const searchTerm = search.trim().toLowerCase();
      listResponse.list = listResponse.list.filter((item) => {
        const company = item.emspCompanyData;
        const matchesCompanyName = company.name
          ?.toLowerCase()
          .includes(searchTerm);
        const matchesCompanyEmail = company.email
          ?.toLowerCase()
          .includes(searchTerm);
        return matchesCompanyName || matchesCompanyEmail;
      });
      listResponse.totalCount = listResponse.list.length;
    }

    res.status(200).json(listResponse);
  } catch (error) {
    console.error("Error fetching EMSP user list:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const rejectBankVerification = async (req, res) => {
  try {
    const { emspId } = req.params;
    const { userId: updatedBy } = req?.loggedInUserData;

    await EMspRepository.update(
      { id: emspId },
      {
        bankVerificationStatus: BankVerificationStatuses.REJECTED,
        bankVerificationActionTakenBy: updatedBy,
      }
    );

    res
      .status(200)
      .json({ message: "Bank verification rejected successfully" });
  } catch (error) {
    console.error("Error rejecting bank verification:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const approveBankVerification = async (req, res) => {
  try {
    const { emspId } = req.params;
    const {
      taxCertificateDocumentId,
      incorporationCertificateDocumentId,
      bankVerificationLetterDocumentId,
    } = req.body;
    const { userId: updatedBy } = req?.loggedInUserData;

    await EMspRepository.update(
      { id: emspId },
      {
        bankVerificationStatus: BankVerificationStatuses.APPROVED,
        bankVerificationActionTakenBy: updatedBy,
        taxCertificateDocumentId: taxCertificateDocumentId,
        incorporationCertificateDocumentId: incorporationCertificateDocumentId,
        bankVerificationLetterDocumentId: bankVerificationLetterDocumentId,
      }
    );

    res
      .status(200)
      .json({ message: "Bank verification approved successfully" });
  } catch (error) {
    console.error("Error approving bank verification:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const setSettlementSchedule = async (req, res) => {
  try {
    const { emspId } = req.params;
    const { settlementPeriod, nextSettlementDate } = req.body;

    await EMspRepository.update(
      { id: emspId },
      {
        settlementPeriod: settlementPeriod,
        nextSettlementDate: nextSettlementDate,
      }
    );

    res.status(200).json({ message: "Settlement schedule set successfully" });
  } catch (error) {
    console.error("Error setting settlement schedule:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  addEmsp,
  upsertBusinessTaxDetails,
  upsertBankAccount,
  upsertChargerConfig,
  upsertPaymentConfig,
  getEmspByQuery,
  updateEmsp,
  updateProfilePhoto,
  verifyOtp,
  getEmspById,
  getEmspUserList,
  deleteEmsp,
  rejectBankVerification,
  approveBankVerification,
  getPreauthAmount,
  setSettlementSchedule,
};
