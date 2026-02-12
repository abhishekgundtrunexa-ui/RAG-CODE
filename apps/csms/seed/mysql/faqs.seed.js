const { FaqRepository } = require("@shared-libs/db/mysql");

const SeedFaq = async () => {
  try {
    // Check if there are existing records
    const faqData = await FaqRepository.find();

    if (faqData.length === 0) {
      const faqs = [
        {
          category: "End User FAQ’s",
          title: "Why is my car not charging? What should I do?",
          description:
            "Please ensure that the charging cable is securely plugged into both the vehicle and the charger. If the issue persists, try using a different charging station or contact customer support for assistance.",
        },
        {
          category: "End User FAQ’s",
          title: "How do I report a problem with the charger?",
          description:
            "If you encounter a problem with the charger, such as a malfunction or charging issue, contact the operator or owner of the charging station immediately. You can also call the number provided or email the network provider to report the same",
        },
        {
          category: "End User FAQ’s",
          title: "Why is my charging speed slower than expected?",
          description:
            "Check connection, verify charging station operation, consider vehicle limitations.",
        },
        {
          category: "End User FAQ’s",
          title:
            "What should I do if the charging connector is stuck in my vehicle's charging port?",
          description:
            "Gently wiggle the cable while pressing the release button. Avoid force. Contact support if stuck.",
        },
        {
          category: "End User FAQ’s",
          title: "How can I troubleshoot if charging won't start?",
          description:
            "Verify connection integrity and power availability; try restarting the charging session or   contact support.",
        },
        {
          category: "End User FAQ’s",
          title: "What should I do if the plug-in fail error persists?",
          description:
            "Verify proper insertion and check for any visible damage; contact support if error persists.",
        },
        {
          category: "End User FAQ’s",
          title: "How do I resolve a booking ID failure?",
          description:
            "Double-check the entered information and try again; contact support if the issue persists.",
        },
        {
          category: "Site Host FAQ’s",
          title: "How does the installation process happen?",
          description:
            "Installation typically involves site assessment, permitting, equipment delivery, electrical installation, and commissioning by qualified technicians.",
        },
        {
          category: "Site Host FAQ’s",
          title: "How do I request for maintenance?",
          description:
            "You can request maintenance by contacting your charging station provider or manufacturer, who will dispatch technicians to address any issues.",
        },
        {
          category: "Site Host FAQ’s",
          title: "How do I report issues?",
          description:
            "Report issues by contacting your charging station provider or manufacturer, providing details of the problem for swift resolution.",
        },
        {
          category: "Site Host FAQ’s",
          title: "How do I power my cycle stations?",
          description:
            "Cycle stations are powered by electricity, typically connected to the grid through a dedicated electrical circuit.",
        },
        {
          category: "Site Host FAQ’s",
          title: "How do I ask for part replacement?",
          description:
            "Request part replacement by contacting your charging station provider or manufacturer, specifying the required part and serial number of the unit.",
        },
        {
          category: "Site Host FAQ’s",
          title: "Why doesn’t my dashboard update?",
          description:
            "The dashboard may not update due to connectivity issues, software glitches, or scheduled maintenance. Contact technical support for assistance.",
        },
        {
          category: "Site Host FAQ’s",
          title: "Why isn’t my revenue being collected?",
          description:
            "Revenue collection issues may arise from payment gateway malfunctions or connectivity problems. Contact technical support for resolution.",
        },
        {
          category: "Site Host FAQ’s",
          title:
            "Why aren’t I able to view XYZ (anything related in the dashboard)?",
          description:
            "Inability to view specific information on the dashboard may result from permissions settings or system errors. Contact technical support for assistance.",
        },
        {
          category: "Site Host FAQ’s",
          title: "What if the power goes out?",
          description:
            "If the power goes out, charging sessions will be interrupted. Once power is restored, charging resumes automatically without manual intervention.",
        },
        {
          category: "Site Host FAQ’s",
          title: "How do I know if my unit is working?",
          description:
            "Check the status indicators on the charging station. Green lights typically indicate operational status. Additionally, monitor the dashboard for real-time updates.",
        },
        {
          category: "Site Host FAQ’s",
          title: "Does my station need WiFi and/or Ethernet?",
          description: "test",
        },
        {
          category: "Site Host FAQ’s",
          title: "What happens if the power goes out?",
          description:
            "If the power goes out, charging sessions will be interrupted temporarily. Once power is restored, charging resumes automatically without manual intervention.",
        },
        {
          category: "Site Host FAQ’s",
          title: "What happens if the charger is damaged?",
          description:
            "If the charger is damaged, immediately report it to your charging station provider or manufacturer for assessment and repair by qualified technicians.",
        },
        {
          category: "EVSE Owner FAQ’s",
          title:
            "What are the potential benefits of investing in EV chargers as an EVSE owner?",
          description:
            "As an EVSE owner, you can generate revenue from charging fees paid by EV drivers. Additionally, you contribute to the expansion of EV infrastructure, which is crucial for supporting the growth of electric vehicle adoption.",
        },
        {
          category: "EVSE Owner FAQ’s",
          title:
            "How can I ensure the profitability and success of my EV charging network as an EVSE owner?",
          description:
            "It's essential to carefully select locations for your charging stations, considering factors such as visibility, accessibility, and demand for EV charging. Offering competitive pricing and reliable service can also attract more customers.",
        },
        {
          category: "EVSE Owner FAQ’s",
          title:
            "Is white labeling an available option for the chargers in my network?",
          description:
            "Yes, whitelabeling is offered as an option, enabling you to customize the chargers with your own branding throughout your network.This not only fosters brand promotion but also ensures a cohesive brand identity across your network.",
        },
        {
          category: "EVSE Owner FAQ’s",
          title:
            "What is the potential return on investment (ROI) for investing in an EVSE network?",
          description:
            "The potential returns on investment in an EVSE network can vary depending on factors such as location, usage patterns, pricing strategies, and operating costs. However, with the increasing adoption of electric vehicles and the growing demand for charging infrastructure, there is significant potential for long-term profitability.",
        },
      ];

      await FaqRepository.save(faqs);
      console.log("FAQs seeding done.");
    }
  } catch (error) {
    console.error("Error FAQs in database:", error);
  }
};

module.exports = { SeedFaq };
