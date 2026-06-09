import {
  getMe,
  loginUser,
  logoutUser,
  registerUser,
  sendLoginOtp,
  verifyLoginOtp,
} from "../api/auth.api";
import { createContext, useContext, useEffect, useState } from "react";

// import { getMe, loginUser, logoutUser, registerUser } from "../api/auth.api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const isAuthenticated = Boolean(user);

  const loadUserFromStorage = () => {
    const storedUser = localStorage.getItem("asknexus_user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("asknexus_user");
      }
    }
  };

  const refreshUser = async () => {
    const token = localStorage.getItem("asknexus_token");
 
    if (!token) {
      setAuthLoading(false);
      return;
    }

     try {
       const response = await getMe();
       const currentUser = response?.data?.user;

       if (currentUser) {
         setUser(currentUser);
         localStorage.setItem("asknexus_user", JSON.stringify(currentUser));
       }
     } catch (error) {
       localStorage.removeItem("asknexus_token");
       localStorage.removeItem("asknexus_user");
       setUser(null);
     } finally {
       setAuthLoading(false);
     }
   };
   const sendOtp = async (email) => {
   return sendLoginOtp({ email });
  };

  const verifyOtpLogin = async ({ email, otp }) => {
   const response = await verifyLoginOtp({ email, otp });

   const loggedInUser =
     response?.data?.user ||
     response?.user ||
     JSON.parse(localStorage.getItem("asknexus_user"));

   if (loggedInUser) {
     setUser(loggedInUser);
     localStorage.setItem("asknexus_user", JSON.stringify(loggedInUser));
   }

   return response;
 };
  const login = async (payload) => {
  const response = await loginUser(payload);

  const loggedInUser =
    response?.data?.user ||
    response?.user ||
    JSON.parse(localStorage.getItem("asknexus_user"));

  if (loggedInUser) {
    setUser(loggedInUser);
    localStorage.setItem("asknexus_user", JSON.stringify(loggedInUser));
  }

  return response;
};


  const register = async (payload) => {
  const response = await registerUser(payload);

  const registeredUser =
    response?.data?.user ||
    response?.user ||
    JSON.parse(localStorage.getItem("asknexus_user"));

  if (registeredUser) {
    setUser(registeredUser);
    localStorage.setItem("asknexus_user", JSON.stringify(registeredUser));
  }

  return response;
};

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  useEffect(() => {
    loadUserFromStorage();
    refreshUser();
  }, []);

  const value = {
    user,
    setUser,
    authLoading,
    isAuthenticated,
    sendOtp,
    verifyOtpLogin,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};