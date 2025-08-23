const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL as string;

export const getImageUrl = (path?: string): string => {
  if (!path) return "https://via.placeholder.com/200x200?text=No+Image";

  // Agar backend ne full URL diya hai (http/https)
  if (path.startsWith("http")) return path;

  // Warna relative path ko base ke sath join karo
  return `${IMAGE_BASE_URL}/${path.replace(/^\/+/, "")}`;
};
