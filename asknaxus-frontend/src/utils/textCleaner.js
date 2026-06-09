export const cleanSourcePreview = (text = "") => {
  if (!text) return "";

  return text
    .replace(/ASKNEXUS\s*/gi, "")
    .replace(/GENERAL COMPANY INFO DOCUMENT/gi, "")
    .replace(/DOCUMENT\s*Title[:\s]*/gi, "")
    .replace(/Department\s+\w+/gi, "")
    .replace(/Access Roles[:\s\w,]+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
};

export const truncateText = (text = "", maxLength = 180) => {
  if (!text) return "";

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
};