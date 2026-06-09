import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Database,
  Eye,
  FileText,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getDocumentById, hardDeleteDocument } from "../api/document.api";
import DashboardLayout from "../components/DashboardLayout";

const DocumentDetails = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();

  const [documentData, setDocumentData] = useState(null);
  const [chunks, setChunks] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getDocumentById(documentId);
      const data = response?.data || response;

      setDocumentData(data?.document || null);
      setChunks(data?.chunks || []);
    } catch (err) {
      setError(err.message || "Failed to load document details.");
    } finally {
      setLoading(false);
    }
  };

  const handleHardDelete = async () => {
    const confirmDelete = window.confirm(
      "Permanently delete this document, chunks, vectors, and uploaded file?"
    );

    if (!confirmDelete) return;

    try {
      await hardDeleteDocument(documentId);
      navigate("/documents");
    } catch (err) {
      setError(err.message || "Failed to delete document.");
    }
  };

  const formatSize = (size = 0) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  return (
    <DashboardLayout
      title="Document Details"
      subtitle="View document metadata, access settings, and chunk summary."
    >
      <section className="document-details-page">
        <div className="details-top-actions">
          <Link to="/documents" className="mini-action">
            <ArrowLeft size={18} />
            Back to Documents
          </Link>

          <div className="details-action-group">
            <Link to={`/documents/${documentId}/chunks`} className="mini-action">
              <Eye size={18} />
              View Chunks
            </Link>

            <button className="danger-action-btn" onClick={handleHardDelete}>
              <Trash2 size={18} />
              Hard Delete
            </button>
          </div>
        </div>

        {error && <div className="documents-error">{error}</div>}

        {loading ? (
          <div className="documents-empty">Loading document details...</div>
        ) : !documentData ? (
          <div className="documents-empty">
            <FileText size={42} />
            <h3>Document not found</h3>
            <p>This document may be deleted or unavailable.</p>
          </div>
        ) : (
          <>
            <div className="document-hero-card">
              <div className="document-hero-icon">
                <FileText size={34} />
              </div>

              <div>
                <h2>{documentData.title}</h2>
                <p>{documentData.originalFileName}</p>

                <div className="document-meta-pills">
                  <span>{documentData.fileType?.toUpperCase()}</span>
                  <span>{documentData.department}</span>
                  <span>{documentData.status}</span>
                </div>
              </div>
            </div>

            <div className="details-grid">
              <article className="details-info-card">
                <Database size={26} />

                <div>
                  <p>Total Chunks</p>
                  <h3>{documentData.totalChunks || chunks.length || 0}</h3>
                </div>
              </article>

              <article className="details-info-card">
                <FileText size={26} />

                <div>
                  <p>File Size</p>
                  <h3>{formatSize(documentData.fileSize)}</h3>
                </div>
              </article>

              <article className="details-info-card">
                <ShieldCheck size={26} />

                <div>
                  <p>Access Roles</p>

                  <div className="role-list">
                    {documentData.accessRoles?.map((role) => (
                      <span key={role}>{role}</span>
                    ))}
                  </div>
                </div>
              </article>
            </div>

            <div className="details-panel">
              <h3>Document Summary</h3>

              <div className="summary-table">
                <div>
                  <span>Title</span>
                  <strong>{documentData.title}</strong>
                </div>

                <div>
                  <span>Original File Name</span>
                  <strong>{documentData.originalFileName}</strong>
                </div>

                <div>
                  <span>Department</span>
                  <strong>{documentData.department}</strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>{documentData.status}</strong>
                </div>

                <div>
                  <span>Total Chunks</span>
                  <strong>{documentData.totalChunks || chunks.length || 0}</strong>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </DashboardLayout>
  );
};

export default DocumentDetails;