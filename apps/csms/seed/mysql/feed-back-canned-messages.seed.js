const { FeedbackCannedMessagesRepository } = require("@shared-libs/db/mysql");

const SeedFeedBackCannedMessages = async () => {
  const existingData = await FeedbackCannedMessagesRepository.find();

  if (existingData.length === 0) {
    const feedbackMessagesData = [
      {
        title: "Charging Speed",
        description: "Charging Speed",
      },
      {
        title: "Payment Experience",
        description: "Payment Experience",
      },
      // {
      //   title: "Plug or Connector Quality",
      //   description: "Plug or Connector Quality",
      // },
      {
        title: "Charging Cost",
        description: "Charging Cost",
      },
      // {
      //   title: "Customer Support",
      //   description: "Customer Support",
      // },
      {
        title: "Station Cleanliness",
        description: "Station Cleanliness",
      },
      {
        title: "Ease of Use",
        description: "Ease of Use",
      },
    ];
    await FeedbackCannedMessagesRepository.save(feedbackMessagesData);
    console.log("Feedback Canned Messages Seed Done");
  }
};

module.exports = { SeedFeedBackCannedMessages };
