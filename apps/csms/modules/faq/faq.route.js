const { Router } = require("express");
const router = Router();
const faqController = require("./faq.controller");
const { Authenticate } = require("../../middlewares/authenticate.middleware");

router.post("/", Authenticate, faqController.addFaq);
router.get("/:faqId", Authenticate, faqController.getFaqById);
router.patch("/:faqId", Authenticate, faqController.updateFaq);
router.get("/", Authenticate, faqController.getFaqList);
router.delete("/:faqId", Authenticate, faqController.softDeleteFaq);

module.exports = router;
