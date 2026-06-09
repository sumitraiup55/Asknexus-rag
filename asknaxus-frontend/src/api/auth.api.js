import axiosInstance from "./axiosInstance";

export const sendLoginOtp = async (payload) => {
  return axiosInstance.post("/auth/send-otp", payload);
};

export const verifyLoginOtp = async (payload) => {
  const response = await axiosInstance.post("/auth/verify-otp", payload);

  const token = response?.data?.token;
  const user = response?.data?.user;

  if (token) {
    localStorage.setItem("asknexus_token", token);
  }

  if (user) {
    localStorage.setItem("asknexus_user", JSON.stringify(user));
  }

  return response;
};

export const registerUser = async (payload) => {
  const response = await axiosInstance.post("/auth/register", payload);

  const token = response?.data?.token;
  const user = response?.data?.user;

  if (token) {
    localStorage.setItem("asknexus_token", token);
  }

  if (user) {
    localStorage.setItem("asknexus_user", JSON.stringify(user));
  }

  return response;
};

export const loginUser = async (payload) => {
  const response = await axiosInstance.post("/auth/login", payload);

  const token = response?.data?.token;
  const user = response?.data?.user;

  if (token) {
    localStorage.setItem("asknexus_token", token);
  }

  if (user) {
    localStorage.setItem("asknexus_user", JSON.stringify(user));
  }

  return response;
};

export const getMe = async () => {
  return axiosInstance.get("/auth/me");
};

export const logoutUser = async () => {
  try {
    await axiosInstance.post("/auth/logout");
  } catch (error) {
    console.log("Logout API failed:", error.message);
  } finally {
    localStorage.removeItem("asknexus_token");
    localStorage.removeItem("asknexus_user");
  }
};