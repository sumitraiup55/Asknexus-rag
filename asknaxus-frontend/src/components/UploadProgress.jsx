import { CheckCircle2, Database, FileText, Loader2, Sparkles } from "lucide-react";

const UploadProgress = ({ progress = 0, loading = false }) => {
  const steps = [
    {
      label: "Uploading file",
      icon: FileText,
      activeAt: 1,
    },
    {
      label: "Parsing document",
      icon: Sparkles,
      activeAt: 35,
    },
    {
      label: "Generating embeddings",
      icon: Loader2,
      activeAt: 65,
    },
    {
      label: "Saving to vector DB",
      icon: Database,
      activeAt: 85,
    },
  ];

  if (!loading && progress === 0) {
    return null;
  }

  return (
    <div className="upload-progress-card">
      <div className="progress-header">
        <div>
          <h3>Processing Document</h3>
          <p>AskNexus is preparing your file for RAG search.</p>
        </div>

        <strong>{progress}%</strong>
      </div>

      <div className="progress-bar">
        <div style={{ width: `${progress}%` }}></div>
      </div>

      <div className="progress-steps">
        {steps.map((step) => {
          const Icon = step.icon;
          const isDone = progress >= step.activeAt;

          return (
            <div
              key={step.label}
              className={isDone ? "progress-step done" : "progress-step"}
            >
              <div className="progress-step-icon">
                {isDone ? <CheckCircle2 size={18} /> : <Icon size={18} />}
              </div>

              <span>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UploadProgress;