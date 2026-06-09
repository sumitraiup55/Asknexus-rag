import { AlertTriangle, ArrowLeft, Home, LockKeyhole } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import "../styles/profile.css";

export const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <main className="error-page">
      <section className="error-card">
        <div className="error-icon warning">
          <LockKeyhole size={38} />
        </div>

        <h1>Access Denied</h1>

        <p>
          You do not have permission to access this page. Document management is
          available only for admin and super admin users.
        </p>

        <div className="error-actions">
          <button className="btn btn-outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            Go Back
          </button>

          <Link to="/dashboard" className="btn btn-primary">
            <Home size={18} />
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
};

export const NotFound = () => {
  return (
    <main className="error-page">
      <section className="error-card">
        <div className="error-icon">
          <AlertTriangle size={38} />
        </div>

        <h1>404</h1>

        <p>
          The page you are looking for does not exist or may have been moved.
        </p>

        <Link to="/dashboard" className="btn btn-primary">
          <Home size={18} />
          Back to Dashboard
        </Link>
      </section>
    </main>
  );
};