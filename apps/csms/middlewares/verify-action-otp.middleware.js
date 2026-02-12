const { ActionOtpModel } = require("@shared-libs/db/mongo-db");

const VerifyActionOTP = (action) => async (req, res, next) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "Action requires OTP verification.",
      });
    }

    const loggedInUser = req?.loggedInUserData?.user;

    const actionOtpData = await ActionOtpModel.findOne({
      otp,
      action,
      userId: loggedInUser?.id,
      email: loggedInUser?.email,
    });

    if (!actionOtpData) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    await ActionOtpModel.deleteOne({
      otp,
      action,
      userId: loggedInUser?.id,
      email: loggedInUser?.email,
    });

    next();
  } catch (error) {
    console.error("OTP Middleware Error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while verifying the OTP",
      error: error.message,
    });
  }
};

module.exports = { VerifyActionOTP };
