
 const dotenv = require("dotenv");
 // Load environment variables
dotenv.config();

const { ensureCollection } = require("./services/vector.service");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

const chatRoutes = require("./routes/chat.routes");
const authRoutes = require("./routes/auth.routes");

// temporary route
const upload = require("./middlewares/upload.middleware");
const { parseFile } = require("./services/fileParser.service");
const { createDocumentChunks } = require("./services/chunk.service");
const { generateEmbeddingsForChunks } = require("./services/embedding.service");
const { upsertEmbeddedChunks } = require("./services/vector.service");






// Connect MongoDB
connectDB();

ensureCollection()
  .then(() => {
    console.log("Qdrant vector database connected");
  })
  .catch((error) => {
    console.error("Qdrant connection failed:", error.message);
  });

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AskNexus backend is running",
  });
});

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    project: "AskNexus",
  });
});

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/chat", chatRoutes);


//temporary route
// Later you will delete this route after testing upload + text extraction
app.post("/api/v1/test/upload", upload.single("file"), async (req, res) => {
  try {
    const parsedData = await parseFile(req.file);

    return res.status(200).json({
      success: true,
      message: "File uploaded and parsed successfully",
      data: {
        originalFileName: parsedData.originalFileName,
        fileType: parsedData.fileType,
        fileSize: parsedData.fileSize,
        totalPages: parsedData.totalPages,
        textPreview: parsedData.text.slice(0, 500),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

//temporary route
app.post("/api/v1/test/index", upload.single("file"), async (req, res) => {
  try {
    const parsedData = await parseFile(req.file);

    const fakeDocumentId = "test-document-" + Date.now();
    const fakeOrganizationId = "test-org";
    const fakeUploadedBy = "test-user";

    const chunks = createDocumentChunks({
      text: parsedData.text,
      documentId: fakeDocumentId,
      organizationId: fakeOrganizationId,
      uploadedBy: fakeUploadedBy,
      originalFileName: parsedData.originalFileName,
      fileType: parsedData.fileType,
      accessRoles: ["admin", "employee"],
      department: "general",
      chunkSize: 400,
      chunkOverlap: 80,
    });

    const embeddedChunks = await generateEmbeddingsForChunks(chunks);

    const storedVectors = await upsertEmbeddedChunks(embeddedChunks);

    return res.status(200).json({
      success: true,
      message: "File parsed, chunked, embedded, and stored in Qdrant successfully",
      data: {
        originalFileName: parsedData.originalFileName,
        fileType: parsedData.fileType,
        totalChunks: chunks.length,
        embeddingSize: embeddedChunks[0].embedding.length,
        storedVectors,
      },
    });
  } catch (error) {
    console.error("Index Test Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});






// Handle invalid routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`AskNexus server running on port ${PORT}`);
});