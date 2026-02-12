const {
  PartnerRepository,
  UserRepository,
  PartnerViewRepository,
} = require("@shared-libs/db/mysql");
const {
  generateRandomCode,
  formatDateString,
} = require("@shared-libs/helpers");
const { DateTime } = require("luxon");
const { EmailQueue } = require("@shared-libs/queues");
const { getDynamicHtml } = require("@shared-libs/email");
const {
  ExpireTimeConstants,
  EmailConstants,
  BankVerificationStatuses,
} = require("@shared-libs/constants");
const { HandleMySqlList } = require("@shared-libs/db");

const addPartner = async (req, res) => {
  try {
    const {
      fullName,
      companyName,
      country,
      phoneNumber,
      email,
      state,
      pincode,
      businessNumber,
      companyGstAccountNumber,
      federalTaxPercentage,
      provincialSalesTaxPercentage,
      harmonizedSalesTaxPercentage,
      taxCertificate,
      incorporationCertificate,
      businessPanNumber,
      centralGstPercentage,
      stateGstPercentage,
      integratedGstPercentage,
      profilePicture,
      // Bank details - all mandatory
      bankName,
      branchNumber,
      institutionNumber,
      accountNumber,
      ifscCode,
      accountType,
      bankAddress,
      bankVerificationLetter,
    } = req.body;

    if (country.toLowerCase() === "ca") {
      if (
        !fullName ||
        !companyName ||
        !country ||
        !phoneNumber ||
        !email ||
        !state ||
        !pincode ||
        !businessNumber ||
        !companyGstAccountNumber ||
        !federalTaxPercentage ||
        !provincialSalesTaxPercentage ||
        !harmonizedSalesTaxPercentage ||
        !taxCertificate ||
        !incorporationCertificate ||
        !bankName ||
        !institutionNumber ||
        !accountNumber ||
        !accountType ||
        !bankVerificationLetter
      ) {
        return res.status(400).json({
          message:
            "All partner fields are mandatory: fullName, companyName, country, phoneNumber, email, state, pincode, businessNumber, companyGstAccountNumber, federalTaxPercentage, provincialSalesTaxPercentage, harmonizedSalesTaxPercentage, taxCertificate, incorporationCertificate, bankName, institutionNumber, accountNumber, accountType, bankVerificationLetter",
        });
      }
    } else if (country.toLowerCase() === "in") {
      if (
        !fullName ||
        !companyName ||
        !country ||
        !phoneNumber ||
        !email ||
        !state ||
        !pincode ||
        !businessPanNumber ||
        !companyGstAccountNumber ||
        !centralGstPercentage ||
        !stateGstPercentage ||
        !integratedGstPercentage ||
        !taxCertificate ||
        !incorporationCertificate ||
        !bankName ||
        !accountNumber ||
        !ifscCode ||
        !accountType ||
        !bankVerificationLetter
      ) {
        return res.status(400).json({
          message:
            "All partner fields are mandatory: fullName, companyName, country, phoneNumber, email, state, pincode, businessPanNumber, companyGstAccountNumber, centralGstPercentage, stateGstPercentage, integratedGstPercentage, taxCertificate, incorporationCertificate, bankName, accountNumber, ifscCode, accountType, bankVerificationLetter",
        });
      }
    }

    const { userId: createdBy } = req?.loggedInUserData;

    const codeToSend = generateRandomCode(6);
    const resetPasswordExpiresAt = DateTime.utc()
      .plus({ day: ExpireTimeConstants.USER_SET_PASSWORD_CODE })
      .toISO();
    const resetPasswordRequestedAt = DateTime.utc().toISO();

    // Check if partner with same email already exists
    const existingPartner = await UserRepository.findOne({
      where: { email, isDeleted: false },
    });

    if (existingPartner) {
      return res
        .status(400)
        .json({ message: "Partner with this email already exists" });
    }

    const createdAtLocal = formatDateString(DateTime.utc(), "UTC");

    const savedUser = await UserRepository.save({
      fullName,
      email,
      country,
      phoneNumber,
      timezone: "UTC",
      dateFormat: "dd-MM-yyyy",
      permissions: [],
      isPartner: true,
      isOwner: false,
      profilePicture,
      createdBy: createdBy,
      createdAtLocal: createdAtLocal,
      resetPasswordCode: codeToSend,
      resetPasswordExpiresAt: resetPasswordExpiresAt,
      resetPasswordRequestedAt: resetPasswordRequestedAt,
    });

    const partnerCode = generateRandomCode(6).toUpperCase();

    await PartnerRepository.save({
      userId: savedUser?.id,
      partnerCode,
      companyName,
      country,
      state,
      pincode,
      businessNumber,
      companyGstAccountNumber,
      federalTaxPercentage,
      provincialSalesTaxPercentage,
      harmonizedSalesTaxPercentage,
      taxCertificate,
      incorporationCertificate,
      businessPanNumber,
      centralGstPercentage,
      stateGstPercentage,
      integratedGstPercentage,
      bankName,
      branchNumber,
      institutionNumber,
      accountNumber,
      ifscCode,
      accountType,
      bankAddress,
      bankVerificationLetter,
      createdBy,
    });

    const { html, data } = await getDynamicHtml({
      htmlTemplatePath: "/templates/invite-user.html",
      data: {
        userName: `${savedUser.fullName}`,
        inviteCode: codeToSend,
        registrationLink: `${process.env.CORE_BASEURL}/set-password?email=${email}`,
      },
    });

    // Send registration email
    await EmailQueue.add({
      to: [savedUser.email],
      subject: EmailConstants.subject.WELCOME_TO_CHARGE_NEX,
      html,
      templateData: data,
    });

    const partnerData = await PartnerViewRepository.findOne({
      where: { id: savedUser?.id },
    });

    res.status(201).json(partnerData);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add partner", error: error.message });
  }
};

const updatePartner = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      fullName,
      companyName,
      country,
      phoneNumber,
      email,
      state,
      pincode,
      businessNumber,
      companyGstAccountNumber,
      federalTaxPercentage,
      provincialSalesTaxPercentage,
      harmonizedSalesTaxPercentage,
      taxCertificate,
      incorporationCertificate,
      businessPanNumber,
      centralGstPercentage,
      stateGstPercentage,
      integratedGstPercentage,
      profilePicture,
      // Bank details - all mandatory
      bankName,
      branchNumber,
      institutionNumber,
      accountNumber,
      ifscCode,
      accountType,
      bankAddress,
      bankVerificationLetter,
    } = req.body;

    if (country.toLowerCase() === "ca") {
      if (
        !fullName ||
        !companyName ||
        !country ||
        !phoneNumber ||
        !email ||
        !state ||
        !pincode ||
        !businessNumber ||
        !companyGstAccountNumber ||
        !federalTaxPercentage ||
        !provincialSalesTaxPercentage ||
        !harmonizedSalesTaxPercentage ||
        !taxCertificate ||
        !incorporationCertificate ||
        !bankName ||
        !institutionNumber ||
        !accountNumber ||
        !accountType ||
        !bankVerificationLetter
      ) {
        return res.status(400).json({
          message:
            "All partner fields are mandatory: fullName, companyName, country, phoneNumber, email, state, pincode, businessNumber, companyGstAccountNumber, federalTaxPercentage, provincialSalesTaxPercentage, harmonizedSalesTaxPercentage, taxCertificate, incorporationCertificate, bankName, institutionNumber, accountNumber, accountType, bankVerificationLetter",
        });
      }
    } else if (country.toLowerCase() === "in") {
      if (
        !fullName ||
        !companyName ||
        !country ||
        !phoneNumber ||
        !email ||
        !state ||
        !pincode ||
        !businessPanNumber ||
        !companyGstAccountNumber ||
        !centralGstPercentage ||
        !stateGstPercentage ||
        !integratedGstPercentage ||
        !taxCertificate ||
        !incorporationCertificate ||
        !bankName ||
        !accountNumber ||
        !ifscCode ||
        !accountType ||
        !bankVerificationLetter
      ) {
        return res.status(400).json({
          message:
            "All partner fields are mandatory: fullName, companyName, country, phoneNumber, email, state, pincode, businessPanNumber, companyGstAccountNumber, centralGstPercentage, stateGstPercentage, integratedGstPercentage, taxCertificate, incorporationCertificate, bankName, accountNumber, ifscCode, accountType, bankVerificationLetter",
        });
      }
    }

    const { userId: updatedBy } = req?.loggedInUserData;

    // Check if partner exists
    const existingPartner = await UserRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!existingPartner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // Check if email is being changed and if new email already exists
    if (email && email !== existingPartner.email) {
      const emailExists = await UserRepository.findOne({
        where: { email, isDeleted: false },
      });
      if (emailExists) {
        return res
          .status(400)
          .json({ message: "Partner with this email already exists" });
      }
    }

    await UserRepository.update(
      { id },
      {
        fullName,
        email,
        country,
        phoneNumber,
        profilePicture,
        permissions: [],
        updatedBy,
      }
    );

    // Update partner
    await PartnerRepository.update(
      { userId: id },
      {
        companyName,
        country,
        state,
        pincode,
        businessNumber,
        companyGstAccountNumber,
        federalTaxPercentage,
        provincialSalesTaxPercentage,
        harmonizedSalesTaxPercentage,
        taxCertificate,
        incorporationCertificate,
        businessPanNumber,
        centralGstPercentage,
        stateGstPercentage,
        integratedGstPercentage,
        bankName,
        branchNumber,
        institutionNumber,
        accountNumber,
        ifscCode,
        accountType,
        bankAddress,
        bankVerificationLetter,
        updatedBy,
      }
    );

    const partnerData = await PartnerViewRepository.findOne({
      where: { id },
    });

    res.status(201).json(partnerData);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update partner", error: error.message });
  }
};

const updatePartnerProfile = async (req, res) => {
  try {
    const { profilePicture } = req.body;
    const { id } = req.params;
    const user = await UserRepository.findOne({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "Partner not found" });
    }
    await UserRepository.update({ id }, { profilePicture });
    res.status(200).json({ message: "Partner profile updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update partner profile", error: error.message });
  }
};

const deletePartner = async (req, res) => {
  try {
    // Accept either a single id (from params) or multiple ids (from body)
    const ids = req.body.ids || (req.params.id ? [req.params.id] : []);

    if (!ids.length) {
      return res.status(400).json({ message: "No partner IDs provided" });
    }

    const { userId: updatedBy } = req?.loggedInUserData;

    let deleted = [];
    let notFound = [];

    for (const id of ids) {
      // Check if partner exists
      const existingPartner = await UserRepository.findOne({
        where: { id, isDeleted: false },
      });

      if (!existingPartner) {
        notFound.push(id);
        continue;
      }

      await UserRepository.update(
        { id },
        {
          isDeleted: true,
          updatedBy,
        }
      );

      await PartnerRepository.update(
        { userId: id },
        {
          isDeleted: true,
          updatedBy,
        }
      );

      deleted.push(id);
    }

    res.status(200).json({
      message: "Partners deleted successfully",
      deleted,
      notFound,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete partner(s)", error: error.message });
  }
};

const getPartners = async (req, res) => {
  try {
    let baseQuery = { isDeleted: false };

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

      baseQuery["id"] = {
        custom: true,
        value: `in("${partnerIds.join('", "')}")`,
      };
    }

    const listParams = {
      entityName: "PartnerView",
      baseQuery,
      req,
    };

    const listResponse = await HandleMySqlList(listParams);

    res.status(200).json(listResponse);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get partners", error: error.message });
  }
};

const getPartnerById = async (req, res) => {
  try {
    const { id } = req.params;

    const partnerData = await PartnerViewRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!partnerData) {
      return res.status(404).json({ message: "Partner not found" });
    }

    const subscriptionData = {
      planName: "Free Subscription Plan",
      description:
        "You're running out of space to manage. Upgrade to manage without a worry!",
      chargers: { used: 3, limit: 5 },
      users: { used: 3, limit: 5 },
      chargingStations: { used: 4, limit: 5 },
      departments: { used: 4, limit: 5 },
    };

    res.status(200).json({ ...partnerData, subscriptionData });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get partner", error: error.message });
  }
};

const resendPartnerInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    const partner = await UserRepository.findOne({
      where: { id, isDeleted: false, isPartner: false },
    });
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    const { html, data } = await getDynamicHtml({
      htmlTemplatePath: "/templates/invite-user.html",
      data: {
        userName: `${partner.fullName}`,
        inviteCode: partner.resetPasswordCode,
        registrationLink: `${process.env.CORE_BASEURL}/set-password?email=${email}`,
      },
    });

    await EmailQueue.add({
      to: [partner.email],
      subject: EmailConstants.subject.WELCOME_TO_CHARGE_NEX,
      html,
      templateData: data,
    });

    res.status(200).json({ message: "Partner invitation resent successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to resend partner invitation",
      error: error.message,
    });
  }
};

const rejectBankVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId: updatedBy } = req?.loggedInUserData;

    await PartnerRepository.update(
      { userId: id },
      {
        bankVerificationStatus: BankVerificationStatuses.REJECTED,
        bankVerificationActionTakenBy: updatedBy,
      }
    );

    res
      .status(200)
      .json({ message: "Bank verification rejected successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to reject bank verification",
      error: error.message,
    });
  }
};

const approveBankVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      taxCertificateDocumentId,
      incorporationCertificateDocumentId,
      bankVerificationLetterDocumentId,
    } = req.body;
    const { userId: updatedBy } = req?.loggedInUserData;

    await PartnerRepository.update(
      { userId: id },
      {
        bankVerificationStatus: BankVerificationStatuses.APPROVED,
        taxCertificateDocumentId: taxCertificateDocumentId,
        incorporationCertificateDocumentId: incorporationCertificateDocumentId,
        bankVerificationLetterDocumentId: bankVerificationLetterDocumentId,
        bankVerificationActionTakenBy: updatedBy,
      }
    );

    res
      .status(200)
      .json({ message: "Bank verification approved successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to approve bank verification",
      error: error.message,
    });
  }
};

module.exports = {
  addPartner,
  updatePartner,
  deletePartner,
  getPartners,
  getPartnerById,
  resendPartnerInvitation,
  rejectBankVerification,
  approveBankVerification,
  updatePartnerProfile
};
