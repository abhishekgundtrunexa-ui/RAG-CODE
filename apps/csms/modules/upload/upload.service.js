const AWS = require("aws-sdk");
const fs = require("fs");
const { compressImage } = require("@shared-libs/helpers");
const {
  UserRepository,
  StoreUserMappingRepository,
  TenantRepository,
  MultiMediaRepository,
} = require("@shared-libs/db/mysql");
const { extname } = require("path");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

exports.uploadFile = async (req, res) => {
  const file = req.file;
  const fileContent = fs.readFileSync(file.path);
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: file.filename,
    Body: fileContent,
    ContentType: file?.mimetype,
    ACL: "public-read",
  };
  const s3UploadResponse = await new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
      // Remove file from server after upload
      fs.unlinkSync(file.path);
    });
  });
  res.status(200).json(s3UploadResponse);
};

exports.uploadChargerEmbeddedSoftwareFirmware = async (req, res) => {
  const file = req.file;
  const fileContent = fs.readFileSync(file.path);

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `embedded_software_firmware_management/Diagnosics/${file.filename}`,
    Body: fileContent,
    ContentType: file?.mimetype,
    ACL: "public-read",
  };
  const s3UploadResponse = await new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
      // Remove file from server after upload
      fs.unlinkSync(file.path);
    });
  });

  return res.status(200).json(s3UploadResponse);
};

exports.uploadCtvReport = async (req, res) => {
  const file = req.file;
  const fileContent = fs.readFileSync(file.path);

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `ctv_reports/${file.filename}`,
    Body: fileContent,
    ContentType: file?.mimetype,
    ACL: "public-read",
  };
  const s3UploadResponse = await new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
      // Remove file from server after upload
      fs.unlinkSync(file.path);
    });
  });

  return res.status(200).json(s3UploadResponse);
};

exports.uploadProfilePicture = async (req, res) => {
  const file = req.file;
  const userId = req.loggedInUserData.user.id;

  try {
    const compressedBuffer = await compressImage(
      file.path,
      "jpeg",
      500,
      800,
      800
    );

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: file.filename,
      Body: compressedBuffer,
      ACL: "public-read",
      ContentType: "image/jpeg",
    };

    const s3UploadResponse = await new Promise((resolve, reject) => {
      s3.upload(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    const profileImageUrl = s3UploadResponse.Location;

    await UserRepository.update(
      { id: userId },
      { profilePicture: profileImageUrl }
    );

    res.status(200).json({
      message: "Profile Picture Uploaded Successfully",
      imageUrl: profileImageUrl,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed To Upload Profile Picture", error });
  }
};

exports.uploadBusinessImage = async (req, res) => {
  const file = req.file;
  const userId = req.loggedInUserData.user.id;

  try {
    const compressedBuffer = await compressImage(
      file.path,
      "jpeg",
      500,
      800,
      800
    );

    const s3Params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: file.filename,
      Body: compressedBuffer,
      ACL: "public-read",
      ContentType: "image/jpeg",
    };

    const s3UploadResponse = await new Promise((resolve, reject) => {
      s3.upload(s3Params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    const businessImageUrl = s3UploadResponse.Location;

    const storeUserMapping = await StoreUserMappingRepository.findOne({
      where: { userId: userId },
    });

    await TenantRepository.update(
      { id: storeUserMapping.storeId },
      { businessImage: businessImageUrl }
    );

    res.status(200).json({
      message: "Business Image Uploaded Successfully",
      imageUrl: businessImageUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed To Upload Business Image", error });
  }
};

exports.uploadBusinessPhotos = async (req, res) => {
  const files = req.files;
  const userId = req.loggedInUserData.user.id;
  const videoUrls = req.body.videoUrl ? JSON.parse(req.body.videoUrl) : [];

  try {
    const storeUserMapping = await StoreUserMappingRepository.findOne({
      where: { userId: userId },
    });
    const storeId = storeUserMapping.storeId;

    const uploadPromises = files.map(async (file, index) => {
      let mediaUrl;
      let mediaType;

      try {
        if (file.mimetype.startsWith("image/")) {
          const compressedBuffer = await compressImage(
            file.path,
            "jpeg",
            500,
            800,
            800
          );

          const s3Params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: file.filename,
            Body: compressedBuffer,
            ACL: "public-read",
            ContentType: "image/jpeg",
          };

          const s3UploadResponse = await new Promise((resolve, reject) => {
            s3.upload(s3Params, (err, data) => {
              if (err) {
                reject(err);
              } else {
                resolve(data);
              }
            });
          });

          mediaUrl = s3UploadResponse.Location;
          mediaType = "img";
        }

        await MultiMediaRepository.save({
          storeId: storeId,
          url: mediaType === "img" ? mediaUrl : "",
          mediaType: mediaType === "img" ? "img" : "",
          sequence: index + 1,
        });

        return mediaType === "img" ? mediaUrl : null;
      } catch (error) {
        console.error(
          `Error uploading media for index ${index}: ${error.message}`
        );
        return null;
      }
    });

    const videoUploadPromises = videoUrls.map(async (videoUrl, index) => {
      await MultiMediaRepository.save({
        storeId: storeId,
        url: videoUrl,
        mediaType: "video",
        sequence: files.length + index + 1,
      });
      return videoUrl;
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    const uploadedVideoUrls = await Promise.all(videoUploadPromises);

    const allUploadedUrls = [
      ...uploadedUrls.filter((url) => url !== null),
      ...uploadedVideoUrls,
    ];

    res.status(200).json({
      message: "Business media uploaded successfully",
      mediaUrls: allUploadedUrls.filter((url) => url !== null),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed To Upload Business Media", error });
  }
};

exports.uploadReleaseNote = async (req, res) => {
  const file = req?.file;
  // Validate file
  if (!file) {
    return res.status(400).json({ error: "File Is Required." });
  }
  const ext = extname(file.originalname);
  if (ext !== ".md") {
    return res.status(400).json({
      message: "Only .md files are allowed.",
    });
  }

  const version = req?.body?.version;
  // Validate version
  if (!version) {
    return res.status(400).json({ message: "Version Is Required." });
  }
  // Validate version format
  const versionPattern = /^v\d+\.\d+\.\d+$/; // Matches patterns like v1.0.0, v2.3.4, etc.
  if (!version || !versionPattern.test(version)) {
    return res.status(400).json({
      error:
        "Invalid version format. It must be in the format v1.0.0, v1.0.1, etc.",
    });
  }

  const fileContent = fs.readFileSync(file.path);
  const fileName = `release-notes/${version}.md`;
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: fileContent,
    ACL: "public-read",
    ContentType: file.mimetype,
  };
  const s3UploadResponse = await new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
      // Remove file from server after upload
      fs.unlinkSync(file.path);
    });
  });

  res.status(200).json(s3UploadResponse);
};
