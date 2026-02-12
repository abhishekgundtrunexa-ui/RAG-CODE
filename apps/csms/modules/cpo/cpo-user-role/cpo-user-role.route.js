const { Router } = require("express");
const router = Router();
const cpoUserRoleController = require("./cpo-user-role.controller");
const {
  Authenticate,
} = require("../../../middlewares/authenticate.middleware");

router.post("/", Authenticate, cpoUserRoleController.addCpoUserRole);
router.get("/", Authenticate, cpoUserRoleController.getCpoUserRoleList);
router.get("/:cpoUserRoleId", Authenticate, cpoUserRoleController.getCpoUserRoleById);
router.patch("/:cpoUserRoleId", Authenticate, cpoUserRoleController.updateCpoUserRoleById);
router.delete("/:cpoUserRoleId", Authenticate, cpoUserRoleController.deleteCpoUserRoleById);

module.exports = router;
