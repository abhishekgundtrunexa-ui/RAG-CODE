const { sendEmail } = require("@shared-libs/email");
const { QueueNames } = require("@shared-libs/constants");
const { CreateQueue } = require("./config");

const EmailQueue = CreateQueue(QueueNames.EMAIL_QUEUE, async (jobData) => {
  const { to, subject, html, templateData, attachments=[] } = jobData;
  await sendEmail({
    to,
    subject,
    html,
    templateData,
    attachments,
  });
});

module.exports = { EmailQueue };
