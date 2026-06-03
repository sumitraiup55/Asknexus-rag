const express = require("express");

const {
  register,
  login,
  logout,
  getMe,
} = require("../controllers/auth.controller");

const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

module.exports = router;