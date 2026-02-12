const { Router } = require("express");
const router = Router();
const cpoAdminController = require("./cpo-admin.controller");
const { Authenticate } = require("../../middlewares/authenticate.middleware");

router.post("/", Authenticate, cpoAdminController.addCpo);
router.get("/", Authenticate, cpoAdminController.getCpoList);
router.get("/list-cpo-admins", Authenticate, cpoAdminController.listCpoAdmins);
router.get("/:cpoAdminUserId", Authenticate, cpoAdminController.getCpoById);
router.patch("/:cpoAdminUserId", Authenticate, cpoAdminController.updateCpo);
router.delete("/bulk-delete", Authenticate, cpoAdminController.deleteCpoBulk);
router.delete("/:cpoId", Authenticate, cpoAdminController.deleteCpo);

module.exports = router;
