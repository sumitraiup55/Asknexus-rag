const nodemailer = require("nodemailer");

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

const sendOtpEmail = async ({ email, otp }) => {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    throw new Error("SMTP email credentials are missing");
  }

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