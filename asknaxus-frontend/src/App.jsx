import {
  Bot,
  Building2,
  FileText,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import DocumentChunks from "./pages/DocumentChunks";
import DocumentDetails from "./pages/DocumentDetails";
import Documents from "./pages/Documents";
import { NotFound, Unauthorized } from "./pages/ErrorPages";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import UploadDocument from "./pages/UploadDocument";

import { useAuth } from "./context/AuthContext";

import "./styles/auth.css";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="center-screen">
        <div className="loader"></div>
        <p>Checking session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="center-screen">
        <div className="loader"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="center-screen">
        <div className="loader"></div>
        <p>Checking permission...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

const LandingPage = () => {
  return (
    <main className="app-shell">
      <section className="hero-section">
        <div className="hero-left">
          <div className="brand-badge">
            <Bot size={18} />
            AskNexus AI Workspace
          </div>

          <h1>
            Smart Company Knowledge Assistant using <span>RAG</span>
          </h1>

          <p>
            Login with OTP to access your company knowledge assistant. Admin
            access is assigned by company email, while employees can use AI chat
            based on their allowed documents.
          </p>

          <div className="hero-actions">
            <Link to="/login" className="btn btn-primary">
              Login to AskNexus
            </Link>
          </div>

          <div className="landing-note">
            <ShieldCheck size={18} />
            <span>
              No public registration. Admin access is controlled securely from
              backend configuration.
            </span>
          </div>
        </div>

        <div className="hero-card">
          <div className="glass-card main-card">
            <div className="card-header">
              <div>
                <h3>AskNexus Assistant</h3>
                <p>Connected to your company knowledge base</p>
              </div>

              <span className="status-pill">Active</span>
            </div>

            <div className="chat-preview">
              <div className="message user-message">
                What is the company leave policy?
              </div>

              <div className="message ai-message">
                AskNexus searches your uploaded documents and gives a clean
                answer with source document names.
              </div>
            </div>

            <div className="source-box">
              <FileText size={18} />
              Sources: HR Policy.pdf, Company Guide.txt
            </div>
          </div>

          <div className="floating-card card-one">
            <ShieldCheck size={20} />
            Role Based Access
          </div>

          <div className="floating-card card-two">
            <MessageSquareText size={20} />
            OTP Login
          </div>

          <div className="floating-card card-three">
            <Building2 size={20} />
            Company Workspace
          </div>
        </div>
      </section>
    </main>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route path="/register" element={<Navigate to="/login" replace />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/unauthorized"
          element={
            <ProtectedRoute>
              <Unauthorized />
            </ProtectedRoute>
          }
        />

        <Route
          path="/documents"
          element={
            <AdminRoute>
              <Documents />
            </AdminRoute>
          }
        />

        <Route
          path="/documents/upload"
          element={
            <AdminRoute>
              <UploadDocument />
            </AdminRoute>
          }
        />

        <Route
          path="/documents/:documentId"
          element={
            <AdminRoute>
              <DocumentDetails />
            </AdminRoute>
          }
        />

        <Route
          path="/documents/:documentId/chunks"
          element={
            <AdminRoute>
              <DocumentChunks />
            </AdminRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;