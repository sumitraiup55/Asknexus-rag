import axiosInstance from "./axiosInstance";

export const uploadDocument = async (formData, options = {}) => {
  return axiosInstance.post("/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    ...options,
  });
};

export const getDocuments = async (params = {}) => {
  return axiosInstance.get("/documents", { params });
};

export const getDocumentById = async (documentId) => {
  return axiosInstance.get(`/documents/${documentId}`);
};

export const deleteDocument = async (documentId) => {
  return axiosInstance.delete(`/documents/${documentId}`);
};

export const hardDeleteDocument = async (documentId) => {
  return axiosInstance.delete(`/documents/${documentId}/hard`);
};