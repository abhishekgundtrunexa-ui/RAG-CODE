const uploadService = require("./upload.service");

exports.uploadFile = async (req, res) => {
  try {
    await uploadService.uploadFile(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.uploadChargerEmbeddedSoftwareFirmware = async (req, res) => {
  try {
    await uploadService.uploadChargerEmbeddedSoftwareFirmware(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.uploadCtvReport = async (req, res) => {
  try {
    await uploadService.uploadCtvReport(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.uploadProfilePicture = async (req, res) => {
  try {
    await uploadService.uploadProfilePicture(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.uploadBusinessImage = async (req, res) => {
  try {
    await uploadService.uploadBusinessImage(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.uploadBusinessPhotos = async (req, res) => {
  try {
    await uploadService.uploadBusinessPhotos(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.uploadReleaseNote = async (req, res) => {
  try {
    await uploadService.uploadReleaseNote(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
