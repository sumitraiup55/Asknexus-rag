import { useEffect, useRef, useState } from "react";
import {
  MessageSquarePlus,
  Send,
  Trash2,
  MessageCircle,
  Sparkles,
  RotateCcw,
} from "lucide-react";

import {
  askQuestion,
  deleteChatSession,
  getChatSessionMessages,
  getChatSessions,
} from "../api/chat.api";
import ChatMessage from "../components/ChatMessage";
import ChatWelcome from "../components/ChatWelcome";
import DashboardLayout from "../components/DashboardLayout";
import { useFeedback } from "../context/FeedbackContext";

import "../styles/chat.css";

const Chat = () => {
  const bottomRef = useRef(null);

  const { confirm, successToast, errorToast, infoToast } = useFeedback();

  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState("");
  const [messages, setMessages] = useState([]);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [error, setError] = useState("");

  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const getCleanErrorMessage = (err) => {
    const rawMessage = err?.message || "";

    const isGeminiBusy =
      rawMessage.includes("503") ||
      rawMessage.toLowerCase().includes("high demand") ||
      rawMessage.toLowerCase().includes("unavailable") ||
      rawMessage.toLowerCase().includes("gemini answer generation failed");

    if (isGeminiBusy) {
      return "AskNexus AI is temporarily busy due to high model demand. Please try again in a few seconds.";
    }

    return rawMessage || "Sorry, I could not answer right now. Please try again.";
  };

  const loadSessions = async () => {
    try {
      setSessionsLoading(true);

      const response = await getChatSessions();
      const loadedSessions = response?.data?.sessions || response?.sessions || [];

      setSessions(loadedSessions);
    } catch (err) {
      console.log("Failed to load sessions:", err.message);
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadSessionMessages = async (sessionId) => {
    try {
      setError("");
      setCurrentSessionId(sessionId);

      const response = await getChatSessionMessages(sessionId);
      const loadedMessages = response?.data?.messages || response?.messages || [];

      setMessages(loadedMessages);
      scrollToBottom();
    } catch (err) {
      const message = err.message || "Failed to load chat messages.";
      setError(message);
      errorToast(message);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId("");
    setMessages([]);
    setQuestion("");
    setError("");
    infoToast("New chat started.", "AskNexus Chat");
  };

  const handleClearCurrentChat = async () => {
    if (!messages.length) return;

    const allowClear = await confirm({
      title: "Clear current chat?",
      message:
        "This will only clear messages from your current screen. Saved sessions will stay in history unless you delete them.",
      confirmText: "Clear",
      cancelText: "Cancel",
      danger: false,
    });

    if (!allowClear) return;

    setMessages([]);
    setQuestion("");
    setError("");
    infoToast("Current chat screen cleared.", "AskNexus Chat");
  };

  const handleDeleteSession = async (event, sessionId) => {
    event.stopPropagation();

    const allowDelete = await confirm({
      title: "Delete chat session?",
      message:
        "This will delete this chat session and its messages permanently.",
      confirmText: "Delete",
      cancelText: "Cancel",
      danger: true,
    });

    if (!allowDelete) return;

    try {
      await deleteChatSession(sessionId);

      if (currentSessionId === sessionId) {
        setCurrentSessionId("");
        setMessages([]);
        setQuestion("");
        setError("");
      }

      successToast("Chat session deleted successfully.");
      await loadSessions();
    } catch (err) {
      const message = err.message || "Failed to delete session.";
      setError(message);
      errorToast(message);
    }
  };

  const submitQuestion = async (questionText) => {
    const cleanQuestion = questionText.trim();

    if (!cleanQuestion) {
      const message = "Please write a question first.";
      setError(message);
      errorToast(message);
      return;
    }

    const tempUserMessage = {
      _id: crypto.randomUUID(),
      role: "user",
      question: cleanQuestion,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);
    setQuestion("");
    setError("");
    setLoading(true);
    scrollToBottom();

    try {
      const response = await askQuestion({
        question: cleanQuestion,
        sessionId: currentSessionId || undefined,
        topK: 5,
      });

      const data = response?.data || response;

      const assistantMessage =
        data?.messages?.assistantMessage || {
          _id: crypto.randomUUID(),
          role: "assistant",
          answer: data?.answer || "No answer received.",
          sources: data?.sources || [],
          createdAt: new Date().toISOString(),
        };

      setMessages((prev) => [...prev, assistantMessage]);

      const newSessionId = data?.session?.id || data?.session?._id;

      if (newSessionId) {
        setCurrentSessionId(newSessionId);
      }

      await loadSessions();

      if (assistantMessage?.sources?.length > 0) {
        infoToast("Answer generated with document sources.", "AskNexus AI");
      } else {
        infoToast("Answer generated successfully.", "AskNexus AI");
      }

      scrollToBottom();
    } catch (err) {
      const cleanMessage = getCleanErrorMessage(err);

      setMessages((prev) => [
        ...prev,
        {
          _id: crypto.randomUUID(),
          role: "assistant",
          answer: cleanMessage,
          sources: [],
          createdAt: new Date().toISOString(),
        },
      ]);

      setError(cleanMessage);
      errorToast(cleanMessage);
      scrollToBottom();
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (event) => {
    event.preventDefault();
    await submitQuestion(question);
  };

  const handleSuggestedQuestion = async (selectedQuestion) => {
    setQuestion(selectedQuestion);
    await submitQuestion(selectedQuestion);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <DashboardLayout
      title="AI Chat"
      subtitle="Ask questions from uploaded company documents with source citations."
    >
      <section className="chat-page">
        <aside className="chat-history-panel">
          <button className="new-chat-btn" onClick={handleNewChat}>
            <MessageSquarePlus size={18} />
            New Chat
          </button>

          <div className="history-title">
            <h3>Chat History</h3>
            <p>{sessions.length} sessions</p>
          </div>

          <div className="session-list">
            {sessionsLoading ? (
              <>
                <div className="session-skeleton"></div>
                <div className="session-skeleton"></div>
                <div className="session-skeleton"></div>
              </>
            ) : sessions.length === 0 ? (
              <div className="chat-empty-small">No previous chats</div>
            ) : (
              sessions.map((session) => (
                <button
                  key={session._id}
                  className={
                    currentSessionId === session._id
                      ? "session-item active"
                      : "session-item"
                  }
                  onClick={() => loadSessionMessages(session._id)}
                >
                  <MessageCircle size={17} />

                  <span>{session.title || "Untitled chat"}</span>

                  <Trash2
                    size={16}
                    className="delete-session-icon"
                    onClick={(event) => handleDeleteSession(event, session._id)}
                  />
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="chat-window">
          <div className="chat-window-header improved-chat-header">
            <div>
              <span>
                <Sparkles size={16} />
                RAG Assistant
              </span>

              <h2>AskNexus Knowledge Chat</h2>
            </div>

            <button
              type="button"
              className="clear-chat-btn"
              onClick={handleClearCurrentChat}
              disabled={messages.length === 0}
            >
              <RotateCcw size={17} />
              Clear
            </button>
          </div>

          {error && <div className="chat-error">{error}</div>}

          <div className="messages-area">
            {messages.length === 0 ? (
              <ChatWelcome onQuestionSelect={handleSuggestedQuestion} />
            ) : (
              messages.map((message) => (
                <ChatMessage key={message._id} message={message} />
              ))
            )}

            {loading && (
              <div className="typing-box">
                <span></span>
                <span></span>
                <span></span>
                AskNexus is thinking...
              </div>
            )}

            <div ref={bottomRef}></div>
          </div>

          <form className="chat-input-form" onSubmit={handleAskQuestion}>
            <textarea
              placeholder="Ask your question here..."
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleAskQuestion(event);
                }
              }}
              disabled={loading}
            />

            <button type="submit" disabled={loading}>
              <Send size={20} />
            </button>
          </form>
        </main>
      </section>
    </DashboardLayout>
  );
};

export default Chat;