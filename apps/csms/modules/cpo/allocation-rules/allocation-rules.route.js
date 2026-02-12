const { Router } = require("express");
const router = Router();
const allocationRulesController = require("./allocation-rules.controller");

const {
  Authenticate,
} = require("../../../middlewares/authenticate.middleware");

router.post("/", Authenticate, allocationRulesController.addAllocationRule);
router.get("/", Authenticate, allocationRulesController.getAllocationRules);
router.delete("/:allocationRuleId", Authenticate, allocationRulesController.deleteAllocationRule);
router.patch("/:allocationRuleId", Authenticate, allocationRulesController.updateAllocationRule);


module.exports = router;
