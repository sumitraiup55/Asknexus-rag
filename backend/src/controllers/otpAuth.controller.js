const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("../models/user.model");
const { createAndSendOtp, verifyOtpCode } = require("../services/otp.service");

const getAdminEmails = () => {
  const emails = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "";

  return emails
    .split(",")
    .map((email) => email.toLowerCase().trim())
    .filter(Boolean);
};

const isAdminEmail = (email) => {
  return getAdminEmails().includes(email.toLowerCase().trim());
};

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT secret is missing");
  }

  return jwt.sign(
    {
      id: user._id,
      userId: user._id,
      role: user.role,
      organizationId: user.organizationId,
    },
    secret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

const buildUserResponse = (user) => {
  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    department: user.department,
    organizationId: user.organizationId,
  };
};

const getPrimaryAdminUser = async () => {
  const adminEmails = getAdminEmails();

  if (adminEmails.length === 0) {
    throw new Error("ADMIN_EMAIL is missing in .env");
  }

  const adminUser = await User.findOne({
    email: { $in: adminEmails },
    role: { $in: ["admin", "super_admin"] },
  });

  if (!adminUser) {
    throw new Error(
      "Admin user not found. Please create one admin user manually in database first."
    );
  }

  if (!adminUser.organizationId) {
    throw new Error("Admin user does not have organizationId");
  }

  return adminUser;
};

const findOrCreateOtpUser = async (email) => {
  const cleanEmail = email.toLowerCase().trim();

  const adminLogin = isAdminEmail(cleanEmail);

  if (adminLogin) {
    const adminUser = await User.findOne({
      email: cleanEmail,
      role: { $in: ["admin", "super_admin"] },
    });

    if (!adminUser) {
      throw new Error(
        "This admin email is not registered as admin in database."
      );
    }

    return adminUser;
  }

  let user = await User.findOne({ email: cleanEmail });

  if (user) {
    if (user.role === "admin" || user.role === "super_admin") {
      user.role = "employee";
      await user.save();
    }

    return user;
  }

  const adminUser = await getPrimaryAdminUser();

  const emailName = cleanEmail.split("@")[0];

  user = await User.create({
    fullName: emailName,
    email: cleanEmail,
    password: crypto.randomBytes(24).toString("hex"),
    role: "employee",
    department: "general",
    organizationId: adminUser.organizationId,
  });

  return user;
};

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    await createAndSendOtp(email);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: {
        email: email.toLowerCase().trim(),
      },
    });
  } catch (error) {
    console.error("Send OTP Error:", error);

    return res.status(error.statusCode || 500).json({
       success: false,
       message: error.message || "Failed to send OTP",
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    await verifyOtpCode({
      email: cleanEmail,
      otp,
    });

    const user = await findOrCreateOtpUser(cleanEmail);

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: {
        user: buildUserResponse(user),
        token,
      },
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "OTP verification failed",
    });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
};