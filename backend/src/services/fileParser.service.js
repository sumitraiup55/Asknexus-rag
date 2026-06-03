const fs = require("fs/promises");
const path = require("path");
const pdfParse = require("pdf-parse");

/**
 * Extract text from PDF file
 */
const extractTextFromPDF = async (filePath) => {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(fileBuffer);

    return {
      text: pdfData.text,
      totalPages: pdfData.numpages,
      fileType: "pdf",
    };
  } catch (error) {
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
};

/**
 * Extract text from TXT file
 */
const extractTextFromTXT = async (filePath) => {
  try {
    const text = await fs.readFile(filePath, "utf-8");

    return {
      text,
      totalPages: 1,
      fileType: "txt",
    };
  } catch (error) {
    throw new Error(`TXT text extraction failed: ${error.message}`);
  }
};

/**
 * Main file parser function
 */
const parseFile = async (file) => {
  try {
    if (!file) {
      throw new Error("File is required");
    }

    const filePath = file.path;
    const fileExtension = path.extname(file.originalname).toLowerCase();

    let parsedData;

    if (fileExtension === ".pdf") {
      parsedData = await extractTextFromPDF(filePath);
    } else if (fileExtension === ".txt") {
      parsedData = await extractTextFromTXT(filePath);
    } else {
      throw new Error("Unsupported file type. Only PDF and TXT are supported.");
    }

    // Clean extracted text
    const cleanedText = parsedData.text
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanedText) {
      throw new Error("No readable text found in this file");
    }

    return {
      text: cleanedText,
      totalPages: parsedData.totalPages,
      fileType: parsedData.fileType,
      originalFileName: file.originalname,
      storedFileName: file.filename,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  } catch (error) {
    throw new Error(`File parsing failed: ${error.message}`);
  }
};

module.exports = {
  parseFile,
  extractTextFromPDF,
  extractTextFromTXT,
};