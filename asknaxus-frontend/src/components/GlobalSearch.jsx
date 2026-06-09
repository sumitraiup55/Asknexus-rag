import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, MessageCircle, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getChatSessions } from "../api/chat.api";
import { getDocuments } from "../api/document.api";
import { useAuth } from "../context/AuthContext";

const GlobalSearch = () => {
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const role = user?.role || "user";
  const isAdmin = role === "admin" || role === "super_admin";

  const handleSearch = async (searchText) => {
    const cleanSearch = searchText.trim();

    if (cleanSearch.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    try {
      setLoading(true);

      const finalResults = [];

      const chatResponse = await getChatSessions();
      const sessions =
        chatResponse?.data?.sessions || chatResponse?.sessions || [];

      const matchedSessions = sessions
        .filter((session) =>
          session?.title?.toLowerCase().includes(cleanSearch.toLowerCase())
        )
        .slice(0, 4)
        .map((session) => ({
          id: session._id,
          type: "chat",
          title: session.title || "Untitled chat",
          subtitle: "Chat session",
          path: "/chat",
        }));

      finalResults.push(...matchedSessions);

      if (isAdmin) {
        const docsResponse = await getDocuments({
          search: cleanSearch,
          page: 1,
          limit: 5,
        });

        const docsData = docsResponse?.data || docsResponse;
        const documents = docsData?.documents || [];

        const matchedDocuments = documents.slice(0, 5).map((doc) => ({
          id: doc._id,
          type: "document",
          title: doc.title || doc.originalFileName,
          subtitle: `${doc.department || "general"} · ${doc.status || "N/A"}`,
          path: `/documents/${doc._id}`,
        }));

        finalResults.push(...matchedDocuments);
      }

      setResults(finalResults.slice(0, 8));
      setOpen(true);
    } catch (error) {
      console.log("Global search failed:", error.message);
      setResults([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = (result) => {
    setQuery("");
    setResults([]);
    setOpen(false);
    navigate(result.path);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="global-search" ref={searchRef}>
      <div className="global-search-input">
        <Search size={18} />

        <input
          type="text"
          placeholder={
            isAdmin
              ? "Search chats and documents..."
              : "Search chat sessions..."
          }
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
        />

        {loading ? (
          <Loader2 size={17} className="search-loader" />
        ) : query ? (
          <button
            type="button"
            className="clear-search-btn"
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
            }}
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {open && (
        <div className="global-search-results">
          {results.length === 0 ? (
            <div className="search-empty-result">No results found</div>
          ) : (
            results.map((result) => {
              const Icon = result.type === "document" ? FileText : MessageCircle;

              return (
                <button
                  type="button"
                  key={`${result.type}-${result.id}`}
                  className="global-search-item"
                  onClick={() => handleSelectResult(result)}
                >
                  <div className="search-result-icon">
                    <Icon size={17} />
                  </div>

                  <div>
                    <h4>{result.title}</h4>
                    <p>{result.subtitle}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;