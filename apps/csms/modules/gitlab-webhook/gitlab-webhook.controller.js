const gitlabWebhookService = require("./gitlab-webhook.service");

exports.releaseNote = async (req, res) => {
  try {
    const API_KEY = process.env.X_GITLAB_KEY;
    const req_api_key = req.headers["x-gitlab-token"];
    if (!req_api_key || API_KEY !== req_api_key) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access!",
      });
    }
    await gitlabWebhookService.releaseNoteService(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
