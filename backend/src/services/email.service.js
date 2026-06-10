const { Resend } = require("resend");

const createOtpEmailHtml = (otp) => {
  return `
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
  `;
};

const sendOtpEmail = async ({ email, otp }) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "AskNexus <onboarding@resend.dev>";

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: [email],
    subject: "Your AskNexus Login OTP",
    html: createOtpEmailHtml(otp),
  });

  if (error) {
    console.error("Resend Email Error:", error);
    throw new Error(error.message || "Failed to send OTP email");
  }

  return data;
};

module.exports = {
  sendOtpEmail,
};