import { useEffect, useState } from "react";
import { Bot, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";

const RESEND_TIME = 60;

const Login = () => {
  const navigate = useNavigate();

  const { sendOtp, verifyOtpLogin } = useAuth();
  const { successToast, errorToast, infoToast } = useFeedback();

  const [step, setStep] = useState("email");

  const [formData, setFormData] = useState({
    email: "",
    otp: "",
  });

  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canResendOtp = resendTimer === 0 && step === "otp";

  const startResendTimer = () => {
    setResendTimer(RESEND_TIME);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "otp") {
      const onlyNumbers = value.replace(/\D/g, "");

      setFormData((prev) => ({
        ...prev,
        otp: onlyNumbers,
      }));

      setError("");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const requestOtp = async () => {
    if (!formData.email.trim()) {
      const message = "Please enter your email address.";
      setError(message);
      errorToast(message);
      return;
    }

    try {
      setLoading(true);
      setError("");

      await sendOtp(formData.email.trim());

      successToast("OTP sent successfully. Please check your email.");
      setStep("otp");
      startResendTimer();
    } catch (err) {
      const message = err.message || "Failed to send OTP.";
      setError(message);
      errorToast(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (event) => {
    event.preventDefault();
    await requestOtp();
  };

  const handleResendOtp = async () => {
    if (!canResendOtp) return;

    infoToast("Sending a new OTP...", "OTP Login");
    await requestOtp();
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    if (!formData.otp.trim()) {
      const message = "Please enter the OTP.";
      setError(message);
      errorToast(message);
      return;
    }

    if (formData.otp.trim().length !== 6) {
      const message = "OTP must be 6 digits.";
      setError(message);
      errorToast(message);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await verifyOtpLogin({
        email: formData.email.trim(),
        otp: formData.otp.trim(),
      });

      const user = response?.data?.user;

      if (user?.role === "admin" || user?.role === "super_admin") {
        successToast("Admin login successful. Full access enabled.");
      } else {
        successToast("Login successful. AI chat access enabled.");
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = err.message || "Invalid or expired OTP.";
      setError(message);
      errorToast(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setResendTimer(0);

    setFormData((prev) => ({
      ...prev,
      otp: "",
    }));

    setError("");
    infoToast("You can enter a different email.", "OTP Login");
  };

  useEffect(() => {
    if (resendTimer <= 0) return;

    const timerId = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [resendTimer]);

  return (
    <main className="auth-page">
      <section className="auth-card glass-card">
        <Link to="/" className="auth-logo">
          <Bot size={24} />
          <span>AskNexus</span>
        </Link>

        <div className="auth-heading">
          <h1>Login with OTP</h1>

          <p>
            Enter your email to access AskNexus. Admin email gets full access.
            Other users get AI chat access.
          </p>
        </div>

        <div className="otp-flow-box">
          <div className={step === "email" ? "otp-step active" : "otp-step done"}>
            <Mail size={16} />
            Email
          </div>

          <div className={step === "otp" ? "otp-step active" : "otp-step"}>
            <KeyRound size={16} />
            OTP
          </div>

          <div className="otp-step">
            <ShieldCheck size={16} />
            Access
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {step === "email" ? (
          <form onSubmit={handleSendOtp} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>

              <div className="input-box">
                <Mail size={18} />

                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-btn"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="otp-email-preview">
              <span>OTP sent to</span>
              <strong>{formData.email}</strong>
            </div>

            <div className="form-group">
              <label>Enter OTP</label>

              <div className="input-box">
                <KeyRound size={18} />

                <input
                  type="text"
                  name="otp"
                  placeholder="6 digit OTP"
                  value={formData.otp}
                  maxLength={6}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-btn"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify & Login"}
            </button>

            <button
              type="button"
              className="auth-secondary-btn"
              onClick={handleResendOtp}
              disabled={loading || !canResendOtp}
            >
              {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
            </button>

            <button
              type="button"
              className="auth-text-btn"
              onClick={handleBackToEmail}
              disabled={loading}
            >
              Change email address
            </button>
          </form>
        )}

        <p className="auth-switch">
          Employees and customers should login with their email. No public
          registration is needed.
        </p>
      </section>
    </main>
  );
};

export default Login;