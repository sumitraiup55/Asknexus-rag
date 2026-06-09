const crypto = require("crypto");

const Otp = require("../models/otp.model");
const { sendOtpEmail } = require("./email.service");

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);
const OTP_RATE_LIMIT_WINDOW_MINUTES = Number(
  process.env.OTP_RATE_LIMIT_WINDOW_MINUTES || 10
);
const OTP_MAX_REQUESTS_PER_WINDOW = Number(
  process.env.OTP_MAX_REQUESTS_PER_WINDOW || 5
);

const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const checkOtpRateLimit = async (email) => {
  const windowStart = new Date(
    Date.now() - OTP_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
  );

  const recentOtpCount = await Otp.countDocuments({
    email,
    createdAt: { $gte: windowStart },
  });

  if (recentOtpCount >= OTP_MAX_REQUESTS_PER_WINDOW) {
    const error = new Error(
      `Too many OTP requests. Please try again after ${OTP_RATE_LIMIT_WINDOW_MINUTES} minutes.`
    );

    error.statusCode = 429;
    throw error;
  }
};

const createAndSendOtp = async (email) => {
  const cleanEmail = email.toLowerCase().trim();

  await checkOtpRateLimit(cleanEmail);

  const otp = generateOtp();

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Old OTPs should not remain valid after a new OTP is requested
  await Otp.updateMany(
    {
      email: cleanEmail,
      isUsed: false,
    },
    {
      $set: {
        isUsed: true,
      },
    }
  );

  await Otp.create({
    email: cleanEmail,
    otp,
    expiresAt,
  });

  await sendOtpEmail({
    email: cleanEmail,
    otp,
  });

  return {
    email: cleanEmail,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
  };
};

const verifyOtpCode = async ({ email, otp }) => {
  const cleanEmail = email.toLowerCase().trim();

  const otpRecord = await Otp.findOne({
    email: cleanEmail,
    otp,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  if (!otpRecord) {
    throw new Error("Invalid or expired OTP");
  }

  otpRecord.isUsed = true;
  await otpRecord.save();

  return true;
};

module.exports = {
  createAndSendOtp,
  verifyOtpCode,
};