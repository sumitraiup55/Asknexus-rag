import { useState } from "react";
import { Bot, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { successToast, errorToast } = useFeedback();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Please enter email and password.");
      errorToast("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await login(formData);

      successToast("Login successful. Welcome back to AskNexus.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = err.message || "Login failed. Please try again.";
      setError(message);
      errorToast(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card glass-card">
        <Link to="/" className="auth-logo">
          <Bot size={24} />
          <span>AskNexus</span>
        </Link>

        <div className="auth-heading">
          <h1>Welcome back</h1>
          <p>Login to access your company AI knowledge assistant.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>

            <div className="input-box">
              <Mail size={18} />
              <input
                type="email"
                name="email"
                placeholder="sumit@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>

            <div className="input-box">
              <Lock size={18} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-btn"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account? <Link to="/register">Create account</Link>
        </p>
      </section>
    </main>
  );
};

export default Login;