import { useState } from "react";
import {
  Bot,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { successToast, errorToast } = useFeedback();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    organizationName: "",
    department: "engineering",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const departments = [
    "engineering",
    "hr",
    "support",
    "sales",
    "marketing",
    "finance",
    "general",
  ];

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

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.organizationName ||
      !formData.department
    ) {
      setError("Please fill all required fields.");
      errorToast("Please fill all required fields.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      errorToast("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await register(formData);

      successToast("Workspace created successfully.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = err.message || "Registration failed. Please try again.";
      setError(message);
      errorToast(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card register-card glass-card">
        <Link to="/" className="auth-logo">
          <Bot size={24} />
          <span>AskNexus</span>
        </Link>

        <div className="auth-heading">
          <h1>Create workspace</h1>
          <p>
            Register your organization and start using your private RAG
            assistant.
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>

            <div className="input-box">
              <User size={18} />
              <input
                type="text"
                name="fullName"
                placeholder="Sumit Rai"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
          </div>

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
                placeholder="Minimum 6 characters"
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

          <div className="form-group">
            <label>Organization Name</label>

            <div className="input-box">
              <Building2 size={18} />
              <input
                type="text"
                name="organizationName"
                placeholder="AskNexus Workspace"
                value={formData.organizationName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Department</label>

            <div className="input-box">
              <Users size={18} />
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
              >
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-btn"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  );
};

export default Register;