import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileText, Search } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { getDocumentById } from "../api/document.api";
import DashboardLayout from "../components/DashboardLayout";

const DocumentChunks = () => {
  const { documentId } = useParams();

  const [documentData, setDocumentData] = useState(null);
  const [chunks, setChunks] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadChunks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getDocumentById(documentId);
      const data = response?.data || response;

      setDocumentData(data?.document || null);
      setChunks(data?.chunks || []);
    } catch (err) {
      setError(err.message || "Failed to load chunks.");
    } finally {
      setLoading(false);
    }
  };

  const filteredChunks = useMemo(() => {
    if (!search.trim()) return chunks;

    return chunks.filter((chunk) =>
      chunk.text?.toLowerCase().includes(search.toLowerCase())
    );
  }, [chunks, search]);

  useEffect(() => {
    loadChunks();
  }, [documentId]);

  return (
    <DashboardLayout
      title="Document Chunks"
      subtitle="Preview parsed chunks stored for RAG search."
    >
      <section className="document-details-page">
        <div className="details-top-actions">
          <Link to={`/documents/${documentId}`} className="mini-action">
            <ArrowLeft size={18} />
            Back to Details
          </Link>

          <div className="filter-input chunk-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search inside chunks..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {error && <div className="documents-error">{error}</div>}

        {loading ? (
          <div className="documents-empty">Loading chunks...</div>
        ) : (
          <>
            <div className="document-hero-card">
              <div className="document-hero-icon">
                <FileText size={34} />
              </div>

              <div>
                <h2>{documentData?.title || "Document Chunks"}</h2>
                <p>
                  Showing {filteredChunks.length} of {chunks.length} chunks
                </p>
              </div>
            </div>

            {filteredChunks.length === 0 ? (
              <div className="documents-empty">
                <FileText size={42} />
                <h3>No chunks found</h3>
                <p>No chunk matched your search.</p>
              </div>
            ) : (
              <div className="chunks-list">
                {filteredChunks.map((chunk) => (
                  <article className="chunk-card" key={chunk._id}>
                    <div className="chunk-card-header">
                      <div>
                        <h3>Chunk #{chunk.chunkIndex}</h3>
                        <p>{chunk.wordCount || 0} words</p>
                      </div>

                      <span>{chunk.vectorId ? "Vector stored" : "No vector"}</span>
                    </div>

                    <p className="chunk-text">{chunk.text}</p>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </DashboardLayout>
  );
};

export default DocumentChunks;