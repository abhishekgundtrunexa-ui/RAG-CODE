const faqService = require("./faq.service");

exports.addFaq = async (req, res) => {
  try {
    await faqService.addFaq(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getFaqById = async (req, res) => {
  try {
    const faqId = req.params.faqId;
    await faqService.getFaqById(faqId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getFaqList = async (req, res) => {
  try {
    await faqService.getFaqList(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateFaq = async (req, res) => {
  try {
    const faqId = req.params.faqId;
    const payload = req.body;
    await faqService.updateFaq(faqId, payload, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.softDeleteFaq = async (req, res) => {
  try {
    const faqId = req.params.faqId;
    await faqService.softDeleteFaq(faqId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
