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
import Register from "./pages/Register";
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
            Upload company documents, ask questions, get AI-powered answers with
            trusted source citations, and manage role-based document access.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>

            <Link to="/login" className="btn btn-outline">
              Login
            </Link>
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
                What is the leave policy?
              </div>

              <div className="message ai-message">
                According to the HR Policy, employees can apply for leave based
                on company rules and department approval.
              </div>
            </div>

            <div className="source-box">
              <FileText size={18} />
              Source: HR Policy · Chunk #2 · 87% match
            </div>
          </div>

          <div className="floating-card card-one">
            <ShieldCheck size={20} />
            Role Based Access
          </div>

          <div className="floating-card card-two">
            <MessageSquareText size={20} />
            Chat History
          </div>

          <div className="floating-card card-three">
            <Building2 size={20} />
            Organization Workspace
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

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

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