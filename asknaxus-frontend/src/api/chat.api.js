import axiosInstance from "./axiosInstance";

export const askQuestion = async ({ question, sessionId, topK = 5 }) => {
  return axiosInstance.post("/chat/ask", {
    question,
    sessionId,
    topK,
  });
};

export const getChatSessions = async () => {
  return axiosInstance.get("/chat/sessions");
};

export const getChatSessionMessages = async (sessionId) => {
  return axiosInstance.get(`/chat/sessions/${sessionId}`);
};

export const deleteChatSession = async (sessionId) => {
  return axiosInstance.delete(`/chat/sessions/${sessionId}`);
};