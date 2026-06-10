const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

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
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "AskNexus";

  if (!apiKey) {
    throw new Error("BREVO_API_KEY is missing");
  }

  if (!senderEmail) {
    throw new Error("BREVO_SENDER_EMAIL is missing");
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          email,
        },
      ],
      subject: "Your AskNexus Login OTP",
      htmlContent: createOtpEmailHtml(otp),
    }),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("Brevo Email Error:", result);

    throw new Error(
      result?.message ||
        result?.error ||
        "Failed to send OTP email using Brevo"
    );
  }

  return result;
};

module.exports = {
  sendOtpEmail,
};