const { EmailLogModel } = require("@shared-libs/db/mongo-db");
const { replaceStringWithVariables } = require("@shared-libs/helpers");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const { DateTime } = require("luxon");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // add this if you have issues with self-signed certificates
  },
});

const sendEmail = async (params) => {
  const {
    to,
    subject,
    html,
    templateData = {},
    cc = [],
    bcc = [],
    attachments = [],
  } = params;

  const filteredEmails = to.filter(
    (email) => !email.endsWith("@t.com") && !email.endsWith("@test.com")
  );

  if (filteredEmails?.length === 0) {
    return true;
  }

  const from = process.env.SMTP_SENDER_EMAIL;
  const fromName = process.env.SMTP_SENDER_NAME;

  // Convert your custom attachments → nodemailer format
  const formattedAttachments = attachments.map((file) => ({
    filename: file.fileName,
    path: file.fileUrl, // fileUrl can be local or remote
  }));

  const mailOptions = {
    from: { name: fromName, address: from },
    to: filteredEmails,
    subject,
    html,
  };

  if (attachments?.length > 0) {
    mailOptions["attachments"] = formattedAttachments;
  }

  const emailLogCreateData = {
    from,
    fromName,
    to: filteredEmails,
    cc,
    bcc,
    subject,
    templateData,
  };

  try {
    const emailSentResponse = await transporter.sendMail(mailOptions);
    emailLogCreateData["emailSentResponse"] = emailSentResponse;
    emailLogCreateData["emailSent"] = true;
    emailLogCreateData["emailSentAt"] = DateTime.utc();
    await EmailLogModel.create(emailLogCreateData);
  } catch (error) {
    emailLogCreateData["emailSent"] = false;
    emailLogCreateData["emailSentError"] = error.message ? error.message : null;
    await EmailLogModel.create(emailLogCreateData);
  }
};

const getDynamicHtml = async (params) => {
  const { htmlTemplatePath, data } = params;
  const templatePath = path.join(__dirname, htmlTemplatePath);
  let htmlTemplate = fs.readFileSync(templatePath, "utf-8");
  htmlTemplate = replaceStringWithVariables(htmlTemplate, data);
  return {
    html: htmlTemplate,
    data,
  };
};

module.exports = {
  sendEmail,
  getDynamicHtml,
};
