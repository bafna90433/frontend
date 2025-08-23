const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL as string;

export const getImageUrl = (path?: string): string => {
  if (!path) return "https://via.placeholder.com/200x200?text=No+Image";

  // agar already http/https hai
  if (path.startsWith("http")) return path;

  // final URL generate
  return `${IMAGE_BASE_URL}/${path.replace(/^\/+/, "")}`;
};
