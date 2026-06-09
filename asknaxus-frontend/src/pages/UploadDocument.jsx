import { useState } from "react";
import { FileUp, ShieldCheck, UploadCloud, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { uploadDocument } from "../api/document.api";
import DashboardLayout from "../components/DashboardLayout";
import UploadProgress from "../components/UploadProgress";
import { useFeedback } from "../context/FeedbackContext";

import "../styles/documents.css";

const UploadDocument = () => {
  const navigate = useNavigate();
  const { successToast, errorToast } = useFeedback();

  const [formData, setFormData] = useState({
    title: "",
    department: "general",
    accessRoles: ["admin", "employee"],
  });

  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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

  const roles = ["admin", "employee", "customer", "super_admin"];

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleRoleToggle = (role) => {
    setFormData((prev) => {
      const exists = prev.accessRoles.includes(role);

      return {
        ...prev,
        accessRoles: exists
          ? prev.accessRoles.filter((item) => item !== role)
          : [...prev.accessRoles, role],
      };
    });
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    const allowedTypes = ["application/pdf", "text/plain"];
    const allowedExtensions = [".pdf", ".txt"];

    const fileName = selectedFile.name.toLowerCase();

    const isAllowed =
      allowedTypes.includes(selectedFile.type) ||
      allowedExtensions.some((ext) => fileName.endsWith(ext));

    if (!isAllowed) {
      const message = "Only PDF and TXT files are allowed.";
      setError(message);
      errorToast(message);
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setUploadProgress(0);

    if (!formData.title) {
      setFormData((prev) => ({
        ...prev,
        title: selectedFile.name.replace(/\.[^/.]+$/, ""),
      }));
    }

    setError("");
  };

  const validateForm = () => {
    if (!file) {
      return "Please select a PDF or TXT file.";
    }

    if (!formData.title.trim()) {
      return "Please enter document title.";
    }

    if (formData.accessRoles.length === 0) {
      return "Please select at least one access role.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      errorToast(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setUploadProgress(5);

      const payload = new FormData();

      payload.append("file", file);
      payload.append("title", formData.title.trim());
      payload.append("department", formData.department);
      payload.append("accessRoles", formData.accessRoles.join(","));

      await uploadDocument(payload, {
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;

          const percent = Math.round(
            (progressEvent.loaded * 60) / progressEvent.total
          );

          setUploadProgress(Math.min(percent, 60));
        },
      });

      setUploadProgress(100);
      successToast("Document uploaded and processed successfully.");

      setTimeout(() => {
        navigate("/documents");
      }, 900);
    } catch (err) {
      const message = err.message || "Document upload failed.";
      setError(message);
      errorToast(message);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Upload Document"
      subtitle="Add company knowledge files for RAG-based AI answers."
    >
      <section className="upload-page">
        <form className="upload-card" onSubmit={handleSubmit}>
          <div
            className={dragActive ? "upload-dropzone active" : "upload-dropzone"}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              handleFileSelect(event.dataTransfer.files?.[0]);
            }}
          >
            <UploadCloud size={42} />

            <h2>Drop your file here</h2>

            <p>
              Upload PDF or TXT document. AskNexus will parse, chunk, embed, and
              store it.
            </p>

            <label className="file-picker-btn">
              Choose File
              <input
                type="file"
                accept=".pdf,.txt"
                disabled={loading}
                onChange={(event) => handleFileSelect(event.target.files?.[0])}
              />
            </label>

            {file && (
              <div className="selected-file">
                <FileUp size={18} />
                <span>{file.name}</span>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setFile(null);
                    setUploadProgress(0);
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <UploadProgress progress={uploadProgress} loading={loading} />

          <div className="upload-form-grid">
            <div className="form-group">
              <label>Document Title</label>

              <input
                className="plain-input"
                type="text"
                name="title"
                placeholder="HR Policy"
                value={formData.title}
                disabled={loading}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Department</label>

              <select
                className="plain-input"
                name="department"
                value={formData.department}
                disabled={loading}
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

          <div className="access-role-box">
            <div className="role-box-title">
              <ShieldCheck size={19} />

              <div>
                <h3>Access Roles</h3>
                <p>Select who can use this document in chat.</p>
              </div>
            </div>

            <div className="role-checkbox-grid">
              {roles.map((role) => (
                <label key={role} className="role-checkbox">
                  <input
                    type="checkbox"
                    disabled={loading}
                    checked={formData.accessRoles.includes(role)}
                    onChange={() => handleRoleToggle(role)}
                  />
                  <span>{role}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <div className="documents-error">{error}</div>}

          <div className="upload-actions">
            <Link to="/documents" className="btn btn-outline">
              Cancel
            </Link>

            <button className="btn btn-primary" disabled={loading}>
              {loading ? "Processing..." : "Upload Document"}
            </button>
          </div>
        </form>
      </section>
    </DashboardLayout>
  );
};

export default UploadDocument;