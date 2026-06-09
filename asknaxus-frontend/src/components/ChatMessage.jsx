import { Bot, FileText, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

const getUniqueSources = (sources = []) => {
  const seen = new Set();

  return sources.filter((source) => {
    const name = source?.title || "Document Source";

    if (seen.has(name)) {
      return false;
    }

    seen.add(name);
    return true;
  });
};

const SourceNames = ({ sources = [] }) => {
  const uniqueSources = getUniqueSources(sources);

  if (uniqueSources.length === 0) {
    return null;
  }

  return (
    <div className="source-name-box">
      <div className="source-name-heading">
        <FileText size={16} />
        <span>Sources</span>
      </div>

      <div className="source-name-list">
        {uniqueSources.map((source, index) => (
          <span key={`${source?.title || "source"}-${index}`}>
            {source?.title || "Document Source"}
          </span>
        ))}
      </div>
    </div>
  );
};

const ChatMessage = ({ message }) => {
  const isUser = message?.role === "user";

  const content = isUser
    ? message?.question || message?.text || ""
    : message?.answer || message?.text || "";

  return (
    <article className={isUser ? "chat-message user" : "chat-message assistant"}>
      <div className="message-avatar">
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      <div className="message-content">
        <div className="message-meta">
          <h4>{isUser ? "You" : "AskNexus AI"}</h4>
        </div>

        {isUser ? (
          <p>{content}</p>
        ) : (
          <div className="ai-answer-markdown">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}

        {!isUser && message?.sources?.length > 0 && (
          <SourceNames sources={message.sources} />
        )}
      </div>
    </article>
  );
};

export default ChatMessage;