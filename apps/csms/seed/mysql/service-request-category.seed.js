const {
  ServiceRequestCategories,
  ServiceRequestCategoriesLabelMapping,
  ServiceRequestCategoriesSequenceMapping,
} = require("@shared-libs/constants");
const { ServiceRequestCategoryRepository } = require("@shared-libs/db/mysql");

const SeedServiceRequestCategories = async () => {
  try {
    const dbServiceCategories = await ServiceRequestCategoryRepository.find();

    if (dbServiceCategories.length === 0) {
      const serviceCategories = Object.values(ServiceRequestCategories);
      let categoryData = [];

      serviceCategories.forEach((c) => {
        const eachCategoryObj = {
          mappingText: c,
          displayText: ServiceRequestCategoriesLabelMapping[c],
          srNo: ServiceRequestCategoriesSequenceMapping[c],
        };
        categoryData.push(eachCategoryObj);
      });

      if (categoryData.length > 0) {
        await ServiceRequestCategoryRepository.insert(categoryData);
        console.log("Service request categories seeding done.");
      }
    }
  } catch (error) {
    console.error(
      "Error seeding service request categories in database:",
      error
    );
  }
};

module.exports = { SeedServiceRequestCategories };
