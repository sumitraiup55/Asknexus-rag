import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:8000/api/v1" : "");

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

axiosInstance.interceptors.request.use(
  (config) => {
    if (!API_BASE_URL) {
      return Promise.reject(
        new Error(
          "VITE_API_BASE_URL is missing. Please add backend URL in Vercel environment variables."
        )
      );
    }

    const token = localStorage.getItem("asknexus_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong";

    if (error?.response?.status === 401) {
      localStorage.removeItem("asknexus_token");
      localStorage.removeItem("asknexus_user");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default axiosInstance;