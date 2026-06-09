const fs = require("fs");
const { Readable } = require("stream");
const mongoose = require("mongoose");
const { GridFSBucket, ObjectId } = require("mongodb");

const GRIDFS_BUCKET_NAME = process.env.GRIDFS_BUCKET_NAME || "asknexus_original_documents";

let bucket = null;

const getGridFSBucket = () => {
  if (bucket) {
    return bucket;
  }

  if (!mongoose.connection.db) {
    throw new Error("MongoDB connection is not ready for GridFS");
  }

  bucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: GRIDFS_BUCKET_NAME,
  });

  return bucket;
};

const uploadBufferToGridFS = async ({
  buffer,
  filename,
  contentType,
  metadata = {},
}) => {
  if (!buffer) {
    throw new Error("File buffer is required for GridFS upload");
  }

  return new Promise((resolve, reject) => {
    const gridFSBucket = getGridFSBucket();

    const uploadStream = gridFSBucket.openUploadStream(filename, {
      contentType,
      metadata,
    });

    Readable.from(buffer)
      .pipe(uploadStream)
      .on("error", reject);

    uploadStream.on("error", reject);

    uploadStream.on("finish", () => {
      resolve({
        fileId: uploadStream.id,
        filename: uploadStream.filename,
        bucketName: GRIDFS_BUCKET_NAME,
        contentType,
        length: uploadStream.length,
        uploadDate: new Date(),
      });
    });
  });
};

const uploadLocalFileToGridFS = async ({
  filePath,
  filename,
  contentType,
  metadata = {},
}) => {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error("Local file path is invalid for GridFS upload");
  }

  return new Promise((resolve, reject) => {
    const gridFSBucket = getGridFSBucket();

    const uploadStream = gridFSBucket.openUploadStream(filename, {
      contentType,
      metadata,
    });

    fs.createReadStream(filePath)
      .pipe(uploadStream)
      .on("error", reject);

    uploadStream.on("error", reject);

    uploadStream.on("finish", () => {
      resolve({
        fileId: uploadStream.id,
        filename: uploadStream.filename,
        bucketName: GRIDFS_BUCKET_NAME,
        contentType,
        length: uploadStream.length,
        uploadDate: new Date(),
      });
    });
  });
};

const uploadFileToGridFS = async ({ file, metadata = {} }) => {
  if (!file) {
    throw new Error("File is required for GridFS upload");
  }

  const filename = file.originalname || file.filename || "document";
  const contentType = file.mimetype || "application/octet-stream";

  if (file.buffer) {
    return uploadBufferToGridFS({
      buffer: file.buffer,
      filename,
      contentType,
      metadata,
    });
  }

  if (file.path) {
    return uploadLocalFileToGridFS({
      filePath: file.path,
      filename,
      contentType,
      metadata,
    });
  }

  throw new Error("Unsupported file upload type. No buffer or path found.");
};

const deleteFileFromGridFS = async (fileId) => {
  if (!fileId) {
    return;
  }

  try {
    const gridFSBucket = getGridFSBucket();

    const objectId =
      typeof fileId === "string" ? new ObjectId(fileId) : fileId;

    await gridFSBucket.delete(objectId);

    console.log("GridFS original file deleted:", objectId.toString());
  } catch (error) {
    if (
      error?.message?.toLowerCase()?.includes("file not found") ||
      error?.code === "ENOENT"
    ) {
      console.log("GridFS file already missing:", fileId);
      return;
    }

    throw error;
  }
};

module.exports = {
  uploadFileToGridFS,
  deleteFileFromGridFS,
};