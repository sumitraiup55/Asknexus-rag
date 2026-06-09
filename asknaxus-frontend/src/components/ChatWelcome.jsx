import { Sparkles } from "lucide-react";

import SuggestedQuestions from "./SuggestedQuestions";

const ChatWelcome = ({ onQuestionSelect }) => {
  return (
    <div className="empty-chat enhanced-empty-chat">
      <div className="empty-chat-icon">
        <Sparkles size={34} />
      </div>

      <h2>Ask anything from your company documents</h2>

      <p>
        AskNexus searches your uploaded PDFs/TXT files and gives answers with
        clean source document names.
      </p>

      <SuggestedQuestions onSelect={onQuestionSelect} />
    </div>
  );
};

export default ChatWelcome;