import { useEffect, useState } from "react";
import {
  Eye,
  FileText,
  Filter,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getDocuments, hardDeleteDocument } from "../api/document.api";
import DashboardLayout from "../components/DashboardLayout";
import { useFeedback } from "../context/FeedbackContext";

import "../styles/documents.css";

const Documents = () => {
  const { confirm, successToast, errorToast } = useFeedback();

  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    department: "",
    page: 1,
    limit: 10,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const departments = [
    "general",
    "engineering",
    "hr",
    "support",
    "sales",
    "marketing",
    "finance",
  ];

  const statuses = ["ready", "processing", "failed", "deleted"];

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== "")
      );

      const response = await getDocuments(cleanParams);
      const data = response?.data || response;

      setDocuments(data?.documents || []);
      setPagination(data?.pagination || null);
    } catch (err) {
      setError(err.message || "Failed to load documents.");
      errorToast(err.message || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const handleDelete = async (documentId) => {
    const allowDelete = await confirm({
      title: "Delete document permanently?",
      message:
        "This will delete the document, chunks, vectors, and uploaded file. This action cannot be undone.",
      confirmText: "Delete Permanently",
      cancelText: "Cancel",
      danger: true,
    });

    if (!allowDelete) return;

    try {
      await hardDeleteDocument(documentId);
      successToast("Document deleted successfully.");
      await loadDocuments();
    } catch (err) {
      errorToast(err.message || "Failed to delete document.");
      setError(err.message || "Failed to delete document.");
    }
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  useEffect(() => {
    loadDocuments();
  }, [filters.page]);

  return (
    <DashboardLayout
      title="Documents"
      subtitle="Manage company files used by AskNexus RAG assistant."
    >
      <section className="documents-page">
        <div className="documents-toolbar">
          <div className="filter-input">
            <Search size={18} />
            <input
              type="text"
              name="search"
              placeholder="Search by title..."
              value={filters.search}
              onChange={handleFilterChange}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  loadDocuments();
                }
              }}
            />
          </div>

          <div className="filter-select">
            <Filter size={18} />
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Status</option>

              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-select">
            <Filter size={18} />
            <select
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
            >
              <option value="">All Departments</option>

              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </div>

          <button className="refresh-btn" onClick={loadDocuments}>
            <RefreshCcw size={18} />
            Apply
          </button>

          <Link to="/documents/upload" className="upload-link-btn">
            <Plus size={18} />
            Upload
          </Link>
        </div>

        {error && <div className="documents-error">{error}</div>}

        <div className="documents-table-card">
          {loading ? (
            <div className="documents-empty">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="documents-empty">
              <FileText size={42} />

              <h3>No documents found</h3>

              <p>Upload your first PDF or TXT file to start using RAG chat.</p>

              <Link to="/documents/upload" className="btn btn-primary">
                Upload Document
              </Link>
            </div>
          ) : (
            <div className="documents-table-wrap">
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Department</th>
                    <th>Roles</th>
                    <th>Status</th>
                    <th>Chunks</th>
                    <th>Size</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc._id}>
                      <td>
                        <div className="doc-title-cell">
                          <div className="doc-icon">
                            <FileText size={18} />
                          </div>

                          <div>
                            <h4>{doc.title}</h4>
                            <p>{doc.originalFileName}</p>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="soft-pill">
                          {doc.department || "general"}
                        </span>
                      </td>

                      <td>
                        <div className="role-list">
                          {doc.accessRoles?.map((role) => (
                            <span key={role}>{role}</span>
                          ))}
                        </div>
                      </td>

                      <td>
                        <span className={`status-badge ${doc.status}`}>
                          {doc.status}
                        </span>
                      </td>

                      <td>{doc.totalChunks || 0}</td>

                      <td>{Math.ceil((doc.fileSize || 0) / 1024)} KB</td>

                      <td>
                        <div className="table-action-group">
                          <Link
                            to={`/documents/${doc._id}`}
                            className="view-doc-btn"
                            title="View document details"
                          >
                            <Eye size={17} />
                          </Link>

                          <button
                            className="delete-doc-btn"
                            onClick={() => handleDelete(doc._id)}
                            title="Delete document"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={pagination.currentPage <= 1}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
            >
              Previous
            </button>

            <span>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>

            <button
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
            >
              Next
            </button>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};

export default Documents;