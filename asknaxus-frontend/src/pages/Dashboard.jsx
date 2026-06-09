import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  Building2,
  Database,
  FileText,
  MessageSquareText,
  RefreshCcw,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getChatSessions } from "../api/chat.api";
import { getDocuments } from "../api/document.api";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";

const Dashboard = () => {
  const { user } = useAuth();
  const { errorToast, infoToast } = useFeedback();

  const [chatSessionsCount, setChatSessionsCount] = useState(0);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [readyDocumentsCount, setReadyDocumentsCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);

  const role = user?.role || "user";
  const isAdmin = role === "admin" || role === "super_admin";

  const organization =
    user?.organization?.name ||
    user?.organizationId?.name ||
    "AskNexus Workspace";

  const loadDashboardStats = async () => {
    try {
      setLoadingStats(true);

      const chatResponse = await getChatSessions();
      const sessions =
        chatResponse?.data?.sessions || chatResponse?.sessions || [];

      setChatSessionsCount(sessions.length);

      if (isAdmin) {
        const docsResponse = await getDocuments({
          page: 1,
          limit: 100,
        });

        const docsData = docsResponse?.data || docsResponse;
        const docs = docsData?.documents || [];

        setDocumentsCount(
          docsData?.pagination?.totalDocuments || docs.length || 0
        );

        setReadyDocumentsCount(
          docs.filter((doc) => doc.status === "ready").length
        );
      }
    } catch (err) {
      errorToast(err.message || "Failed to load dashboard stats.");
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const stats = useMemo(() => {
    const baseStats = [
      {
        label: "AI Assistant",
        value: "Active",
        icon: Bot,
        description: "RAG chatbot ready",
      },
      {
        label: "Chat Sessions",
        value: loadingStats ? "..." : chatSessionsCount,
        icon: MessageSquareText,
        description: "Your saved conversations",
      },
      {
        label: "Your Role",
        value: role.replace("_", " "),
        icon: ShieldCheck,
        description: "Access controlled by role",
      },
      {
        label: "Department",
        value: user?.department || "general",
        icon: Building2,
        description: "Department-based answers",
      },
    ];

    if (isAdmin) {
      return [
        {
          label: "Total Documents",
          value: loadingStats ? "..." : documentsCount,
          icon: FileText,
          description: "Uploaded company files",
        },
        {
          label: "Ready Documents",
          value: loadingStats ? "..." : readyDocumentsCount,
          icon: Database,
          description: "Available for AI search",
        },
        ...baseStats.slice(1),
      ];
    }

    return baseStats;
  }, [
    chatSessionsCount,
    documentsCount,
    readyDocumentsCount,
    loadingStats,
    role,
    user?.department,
    isAdmin,
  ]);

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Monitor your AskNexus AI workspace from one place."
    >
      <div className="dashboard-refresh-row">
        <div>
          <h2>Workspace Overview</h2>
          <p>{organization}</p>
        </div>

        <button
          className="refresh-dashboard-btn"
          onClick={() => {
            loadDashboardStats();
            infoToast("Dashboard stats refreshed.", "Dashboard");
          }}
          disabled={loadingStats}
        >
          <RefreshCcw size={18} />
          {loadingStats ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <section className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article className="stat-card" key={stat.label}>
              <div className="stat-icon">
                <Icon size={24} />
              </div>

              <div>
                <p>{stat.label}</p>
                <h3>{stat.value}</h3>
                <span>{stat.description}</span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-panel large-panel">
          <div className="panel-header">
            <div>
              <h2>Start asking questions</h2>
              <p>
                AskNexus searches uploaded company documents and returns answers
                with clean source document names.
              </p>
            </div>

            <MessageSquareText size={28} />
          </div>

          <div className="sample-questions">
            <span>What is the company name?</span>
            <span>What is the leave policy?</span>
            <span>Summarize uploaded documents.</span>
          </div>

          <Link to="/chat" className="btn btn-primary">
            Open AI Chat
          </Link>
        </div>

        {isAdmin ? (
          <div className="dashboard-panel">
            <div className="panel-header">
              <div>
                <h2>Manage documents</h2>
                <p>Upload PDFs/TXT files and control who can access them.</p>
              </div>

              <FileText size={28} />
            </div>

            <div className="admin-mini-stats">
              <div>
                <strong>{documentsCount}</strong>
                <span>Total Documents</span>
              </div>

              <div>
                <strong>{readyDocumentsCount}</strong>
                <span>Ready for RAG</span>
              </div>
            </div>

            <div className="panel-actions">
              <Link to="/documents/upload" className="mini-action">
                <UploadCloud size={18} />
                Upload Document
              </Link>

              <Link to="/documents" className="mini-action">
                <FileText size={18} />
                View Documents
              </Link>
            </div>
          </div>
        ) : (
          <div className="dashboard-panel">
            <div className="panel-header">
              <div>
                <h2>Chat access enabled</h2>
                <p>
                  You can ask questions from documents allowed for your role and
                  department.
                </p>
              </div>

              <ShieldCheck size={28} />
            </div>

            <div className="admin-mini-stats">
              <div>
                <strong>{chatSessionsCount}</strong>
                <span>Your Chat Sessions</span>
              </div>

              <div>
                <strong>{user?.department || "general"}</strong>
                <span>Department</span>
              </div>
            </div>

            <Link to="/chat" className="mini-action">
              <MessageSquareText size={18} />
              Go to Chat
            </Link>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};

export default Dashboard;