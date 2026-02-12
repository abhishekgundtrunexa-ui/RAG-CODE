const { Router } = require("express");
const router = Router();
const userRoleController = require("./user-role.controller");
const { Authenticate } = require("../../middlewares/authenticate.middleware");

router.post("/", Authenticate, userRoleController.addUserRole);
router.get("/", Authenticate, userRoleController.getUserRoleList);
router.get("/:userRoleId", Authenticate, userRoleController.getUserRoleById);
router.patch(
  "/:userRoleId",
  Authenticate,
  userRoleController.updateUserRoleById
);
router.delete(
  "/:userRoleId",
  Authenticate,
  userRoleController.deleteUserRoleById
);

module.exports = router;
