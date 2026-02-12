const {
  UserRoleRepository,
  ServiceRequestCategoryRepository,
  FaqRepository,
  FaqUserRelationRepository,
} = require("@shared-libs/db/mysql");
const { customErrorMsg } = require("@shared-libs/constants");
const { ObjectDAO } = require("@shared-libs/helpers");
const { HandleMySqlList } = require("@shared-libs/db");

const addFaq = async (payload, req, res) => {
  const { title, description, categoryId, userTypeId, userRoleId } = payload;

  try {
    // Check if the ServiceRequestCategory exists
    const serviceReqCategory = await ServiceRequestCategoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!serviceReqCategory) {
      return res.status(404).send({
        message:
          customErrorMsg.serviceRequest.SERVICE_REQUEST_CATEGORY_NOT_FOUND, // Replace with your custom error message
      });
    }

    // Check if the UserRole exists
    const userRole = await UserRoleRepository.findOne({
      where: { id: userRoleId },
    });
    if (!userRole) {
      return res.status(404).send({
        message: "Invalid User Role In Payload", // Replace with your custom error message
      });
    }

    // Get logged-in user ID
    const loggedInUserId = req.loggedInUserData.user.id;

    // Create the FAQ
    const newFaq = FaqRepository.create({
      title,
      description,
      categoryId,
      createdBy: loggedInUserId,
    });
    const createdFaq = await FaqRepository.save(newFaq);

    // Create the FAQ User Relation
    const faqUserRelation = FaqUserRelationRepository.create({
      faqId: createdFaq.id,
      userTypeId,
      userRoleId,
    });
    const createdFaqUserRelation = await FaqUserRelationRepository.save(
      faqUserRelation
    );

    // Retrieve and populate the created FAQ and relations
    const faqWithRelations = await FaqRepository.findOne({
      where: { id: createdFaq.id },
    });

    const faqUserRelationWithPopulatedRelations =
      await FaqUserRelationRepository.findOne({
        where: { id: createdFaqUserRelation.id },
      });

    res.status(200).json({
      faq: faqWithRelations,
      faqUserRelation: faqUserRelationWithPopulatedRelations,
    });
  } catch (error) {
    console.error("Error adding FAQ:", error);
    res.status(500).send({
      message: "Internal Server Error",
    });
  }
};

const getFaqById = async (faqId, req, res) => {
  try {
    const faq = await FaqRepository.findOne({
      where: { id: faqId },
    });

    if (!faq) {
      return res.status(404).json({ message: "FAQ Not Found" });
    }

    res.status(200).json(ObjectDAO(faq));
  } catch (error) {
    console.error("Error fetching FAQ:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateFaq = async (faqId, payload, req, res) => {
  const { title, description, categoryId } = payload;
  const loggedInUserId = req.loggedInUserData.user.id;

  try {
    const faq = await FaqRepository.findOne({
      where: { id: faqId },
    });

    if (!faq) {
      return res.status(404).json({ message: "FAQ Not Found" });
    }

    if (categoryId) {
      const serviceReqCategory = await ServiceRequestCategoryRepository.findOne(
        categoryId
      );
      if (!serviceReqCategory) {
        return res.status(404).json({
          message: "Service Request Category Not Found",
        });
      }
    }

    await FaqRepository.update(faqId, {
      ...payload,
      updatedBy: loggedInUserId,
    });

    const updatedFaq = await FaqRepository.findOne({
      where: { id: faqId },
    });

    res.status(200).json(updatedFaq);
  } catch (error) {
    console.error("Error updating FAQ:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getFaqList = async (req, res) => {
  try {
    const listParams = {
      entityName: "Faq",
      baseQuery: {
        isDeleted: false,
      },
      req,
    };

    const faqListResponse = await HandleMySqlList(listParams);

    if (faqListResponse.list && faqListResponse.list.length > 0) {
      const newList = faqListResponse.list.map((faq) => {
        return ObjectDAO(faq);
      });
      faqListResponse.list = newList;
    }

    res.status(200).json(faqListResponse);
  } catch (error) {
    console.error("Error fetching FAQ list:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const softDeleteFaq = async (faqId, req, res) => {
  try {
    const faq = await FaqRepository.findOne({
      where: { id: faqId },
    });

    if (!faq) {
      return res.status(404).json({ message: "FAQ Not Found" });
    }

    if (faq.isDeleted) {
      return res.status(400).json({ message: "FAQ Already Deleted" });
    }

    await FaqRepository.update(faqId, { isDeleted: true });

    const deletedFaq = await FaqRepository.findOne({
      where: { id: faqId },
    });

    res.status(200).json(deletedFaq);
  } catch (error) {
    console.error("Error soft deleting FAQ:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  addFaq,
  getFaqById,
  updateFaq,
  getFaqList,
  softDeleteFaq,
};
