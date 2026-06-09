import { Lightbulb } from "lucide-react";

const SuggestedQuestions = ({ onSelect }) => {
  const questions = [
    "What is the company name?",
    "What is the leave policy?",
    "Summarize this document.",
    "What are Sumit's technical skills?",
    "Which department can access this document?",
  ];

  return (
    <div className="suggested-questions">
      <div className="suggested-heading">
        <Lightbulb size={16} />
        <span>Try asking</span>
      </div>

      <div className="suggested-grid">
        {questions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => onSelect(question)}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedQuestions;