const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL as string;

export const getImageUrl = (path?: string): string => {
  if (!path) return "https://via.placeholder.com/200x200?text=No+Image";

  // 🔹 Agar backend ne full localhost URL bhej diya hai → force production URL use karo
  if (path.startsWith("http://localhost") || path.startsWith("https://localhost")) {
    const clean = path.split("/uploads/")[1]; // sirf file name nikal lo
    return `${IMAGE_BASE_URL}/uploads/${clean}`;
  }

  // 🔹 Agar full http/https URL hai aur localhost nahi hai → waise hi use karo
  if (path.startsWith("http")) return path;

  // 🔹 Agar relative path hai (jaise "/uploads/xyz.png") → base prepend karo
  return `${IMAGE_BASE_URL}/${path.replace(/^\/+/, "")}`;
};
