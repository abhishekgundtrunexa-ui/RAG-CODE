const AWS = require("aws-sdk");
const Showdown = require("showdown");
const { getDynamicHtml } = require("@shared-libs/email");
const { DateTime } = require("luxon");
const { EmailQueue } = require("@shared-libs/queues");

const converter = new Showdown.Converter();
const s3 = new AWS.S3();

const releaseNoteService = async (req, res) => {
  try {
    const { action, object_kind, name, released_at, tag, project } = req.body;

    if (object_kind !== "release") {
      return res.status(400).json({
        success: false,
        message: "Webhook only supports for release.",
      });
    }
    if (action === "create") {
      const Bucket = process.env.S3_BUCKET_NAME;
      const Key = `release-notes/${tag}.md`;
      const params = { Bucket, Key };

      // Fetch Markdown file from S3
      const fileData = await s3.getObject(params).promise();
      let fileContent = fileData.Body;
      fileContent = fileContent.toString("utf-8");

      if (!fileContent) {
        return res.status(400).json({
          success: false,
          message: "Release notes not found!",
        });
      }
      const htmlRaw = converter.makeHtml(fileContent);
      if (!htmlRaw) {
        return res.status(400).json({
          success: true,
          message: "Markdown file is corrupted",
        });
      }

      const htmlTemplatePath = "/templates/release-note.html";
      const released_date_raw = DateTime.fromISO(released_at, { zone: "utc" });
      const formatted_date = released_date_raw.toFormat("dd LLL yyyy");
      const dataToReplace = {
        releaseNotes: htmlRaw,
        version: tag,
        releaseDate: formatted_date,
      };
      const { html } = await getDynamicHtml({
        htmlTemplatePath,
        data: dataToReplace,
      });

      // now get all platform emails
      const adminEmail = ["admin@chargnex.com"];
      await EmailQueue.add({
        to: adminEmail,
        subject: name,
        html,
        templateData: dataToReplace,
      });
      return res.json({
        success: true,
        message: "Release notes send successfully",
      });
    }
    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Failed to log webhook request:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};

module.exports = {
  releaseNoteService,
};
