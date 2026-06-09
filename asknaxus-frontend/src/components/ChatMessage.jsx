import ReactMarkdown from "react-markdown";
import { AlertTriangle, Bot, FileText, UserRound } from "lucide-react";

import { useAuth } from "../context/AuthContext";

const getMessageText = (message, isUser) => {
  if (isUser) {
    return (
      message?.question ||
      message?.content ||
      message?.text ||
      ""
    );
  }

  return (
    message?.answer ||
    message?.content ||
    message?.text ||
    ""
  );
};

const getSourceTitle = (source) => {
  return (
    source?.title ||
    source?.documentTitle ||
    source?.documentName ||
    source?.originalFileName ||
    "Document Source"
  );
};

const getUniqueSources = (sources = []) => {
  const uniqueSources = [];
  const seen = new Set();

  sources.forEach((source, index) => {
    const title = getSourceTitle(source);
    const key = source?.documentId || source?._id || title || index;

    if (!seen.has(key)) {
      seen.add(key);

      uniqueSources.push({
        ...source,
        title,
      });
    }
  });

  return uniqueSources;
};

const ChatMessage = ({ message, isTyping = false }) => {
  const { user } = useAuth();

  const role = message?.role || "assistant";
  const isUser = role === "user";

  const messageText = getMessageText(message, isUser);
  const sources = getUniqueSources(message?.sources || []);

  const showNoSourceWarning =
    !isUser &&
    !isTyping &&
    messageText?.trim() &&
    sources.length === 0;

  return (
    <div
      className={
        isUser
          ? "chat-message chat-message-user"
          : "chat-message chat-message-ai"
      }
    >
      <div className="chat-message-avatar">
        {isUser ? <UserRound size={18} /> : <Bot size={18} />}
      </div>

      <div className="chat-message-body">
        <div className="chat-message-bubble">
          {isTyping ? (
            <div className="typing-loader">
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : isUser ? (
            <p>{messageText}</p>
          ) : (
            <ReactMarkdown>{messageText}</ReactMarkdown>
          )}
        </div>

        {!isUser && !isTyping && sources.length > 0 && (
          <div className="chat-sources">
            <div className="chat-sources-title">
              <FileText size={15} />
              Sources
            </div>

            <div className="chat-source-list">
              {sources.map((source, index) => (
                <span
                  key={source?.documentId || source?._id || index}
                  className="chat-source-pill"
                >
                  {source.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {showNoSourceWarning && (
          <div className="no-source-warning">
            <AlertTriangle size={17} />

            <div>
              <strong>No accessible document source found.</strong>

              <p>
                This can happen when no uploaded document matches your role,
                department, or organization access.
              </p>

              <small>
                Current access: {user?.role || "employee"} /{" "}
                {user?.department || "general"}
              </small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;