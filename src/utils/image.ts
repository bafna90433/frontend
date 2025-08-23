const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL as string;

export const getImageUrl = (path?: string): string => {
  if (!path) return "https://via.placeholder.com/200x200?text=No+Image";

  // agar already full http/https URL hai → direct use karo
  if (path.startsWith("http")) return path;

  // ensure ki double / na ho
  return `${IMAGE_BASE_URL}/${path.replace(/^\/+/, "")}`;
};
