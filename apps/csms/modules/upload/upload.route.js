const { Router } = require("express");
const router = Router();
const uploadController = require("./upload.controller");
const { Upload } = require("../../middlewares/upload.middleware");
const { Authenticate } = require("../../middlewares/authenticate.middleware");

router.post("/upload", Upload.single("file"), uploadController.uploadFile);

router.post("/upload-charger-embedded-software-firmware", Upload.single("file"), uploadController.uploadChargerEmbeddedSoftwareFirmware);

router.post("/upload-ctv-report", Upload.single("file"), uploadController.uploadCtvReport);

router.post(
  "/upload-profile-picture",
  Authenticate,
  Upload.single("file"),
  uploadController.uploadProfilePicture
);

router.post(
  "/upload-business-image",
  Authenticate,
  Upload.single("file"),
  uploadController.uploadBusinessImage
);

router.post(
  "/upload-business-photos",
  Authenticate,
  Upload.array("files"),
  uploadController.uploadBusinessPhotos
);

router.post(
  "/upload-release-note",
  Upload.single("file"),
  uploadController.uploadReleaseNote
);

module.exports = router;
