const express = require("express");

const {
  uploadDocument,
  getAllDocuments,
  getDocumentById,
  deleteDocument,
  hardDeleteDocument,
} = require("../controllers/document.controller");

const upload = require("../middlewares/upload.middleware");
const {
  protect,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

const router = express.Router();

// All document routes are protected
router.use(protect);

// Admin-only routes
router.post(
  "/upload",
  authorizeRoles("super_admin", "admin"),
  upload.single("file"),
  uploadDocument
);

router.get(
  "/",
  authorizeRoles("super_admin", "admin"),
  getAllDocuments
);

router.get(
  "/:documentId",
  authorizeRoles("super_admin", "admin"),
  getDocumentById
);

router.delete(
  "/:documentId",
  authorizeRoles("super_admin", "admin"),
  deleteDocument
);

// Permanent delete
router.delete(
  "/:documentId/hard",
  authorizeRoles("super_admin", "admin"),
  hardDeleteDocument
);

module.exports = router;