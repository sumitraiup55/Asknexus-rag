import { createContext, useContext, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

import "../styles/feedback.css";

const FeedbackContext = createContext(null);

export const FeedbackProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  const confirmResolver = useRef(null);

  const showToast = ({ type = "info", title = "", message = "" }) => {
    const id = crypto.randomUUID();

    setToasts((prev) => [
      ...prev,
      {
        id,
        type,
        title,
        message,
      },
    ]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  };

  const successToast = (message, title = "Success") => {
    showToast({ type: "success", title, message });
  };

  const errorToast = (message, title = "Error") => {
    showToast({ type: "error", title, message });
  };

  const infoToast = (message, title = "Info") => {
    showToast({ type: "info", title, message });
  };

  const confirm = ({
    title = "Are you sure?",
    message = "This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    danger = false,
  }) => {
    setConfirmState({
      title,
      message,
      confirmText,
      cancelText,
      danger,
    });

    return new Promise((resolve) => {
      confirmResolver.current = resolve;
    });
  };

  const handleConfirm = () => {
    confirmResolver.current?.(true);
    confirmResolver.current = null;
    setConfirmState(null);
  };

  const handleCancel = () => {
    confirmResolver.current?.(false);
    confirmResolver.current = null;
    setConfirmState(null);
  };

  const getToastIcon = (type) => {
    if (type === "success") return <CheckCircle2 size={20} />;
    if (type === "error") return <XCircle size={20} />;
    return <Info size={20} />;
  };

  return (
    <FeedbackContext.Provider
      value={{
        showToast,
        successToast,
        errorToast,
        infoToast,
        confirm,
      }}
    >
      {children}

      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card ${toast.type}`}>
            <div className="toast-icon">{getToastIcon(toast.type)}</div>

            <div className="toast-content">
              <h4>{toast.title}</h4>
              <p>{toast.message}</p>
            </div>

            <button
              className="toast-close"
              onClick={() =>
                setToasts((prev) => prev.filter((item) => item.id !== toast.id))
              }
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {confirmState && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <div
              className={
                confirmState.danger
                  ? "confirm-icon danger"
                  : "confirm-icon"
              }
            >
              <AlertTriangle size={34} />
            </div>

            <h2>{confirmState.title}</h2>
            <p>{confirmState.message}</p>

            <div className="confirm-actions">
              <button className="btn btn-outline" onClick={handleCancel}>
                {confirmState.cancelText}
              </button>

              <button
                className={
                  confirmState.danger
                    ? "confirm-danger-btn"
                    : "btn btn-primary"
                }
                onClick={handleConfirm}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error("useFeedback must be used inside FeedbackProvider");
  }

  return context;
};