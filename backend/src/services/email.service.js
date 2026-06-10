const dns = require("dns");
const nodemailer = require("nodemailer");

const createTransporter = () => {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpEmail || !smtpPassword) {
    throw new Error("SMTP email credentials are missing");
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || "true") === "true",

    auth: {
      user: smtpEmail,
      pass: smtpPassword,
    },

    // Force IPv4 because Render may fail with Gmail IPv6 address
    family: 4,

    lookup: (hostname, options, callback) => {
      return dns.lookup(hostname, { family: 4 }, callback);
    },

    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
};

const sendOtpEmail = async ({ email, otp }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"AskNexus" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: "Your AskNexus Login OTP",
    html: `
      <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 30px;">
        <div style="max-width: 520px; margin: auto; background: white; padding: 28px; border-radius: 16px;">
          <h2 style="color: #111827;">AskNexus Login OTP</h2>

          <p style="color: #475569; font-size: 15px;">
            Use the OTP below to login to your AskNexus workspace.
          </p>

          <div style="font-size: 34px; font-weight: bold; letter-spacing: 8px; color: #6d28d9; margin: 24px 0;">
            ${otp}
          </div>

          <p style="color: #64748b; font-size: 14px;">
            This OTP is valid for 10 minutes. Do not share it with anyone.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendOtpEmail,
};