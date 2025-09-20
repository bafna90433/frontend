const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL as string;

export const getImageUrl = (
  path?: string,
  width: number = 400,
  height?: number,
  options: string = "q_auto:eco,f_auto,dpr_auto"
): string => {
  if (!path) return "https://via.placeholder.com/200x200?text=No+Image";

  // 🔹 Agar backend ne localhost URL bhej diya hai → clean karo
  if (path.startsWith("http://localhost") || path.startsWith("https://localhost")) {
    const clean = path.split("/uploads/")[1];
    return `${IMAGE_BASE_URL}/uploads/${clean}`;
  }

  // 🔹 Agar already Cloudinary ka URL hai → optimize transforms add karo
  if (path.startsWith("http") && path.includes("cloudinary.com")) {
    let size = `w_${width}`;
    if (height) size += `,h_${height},c_fill`;
    return path.replace("/upload/", `/upload/${options},${size}/`);
  }

  // 🔹 Agar relative path hai → base prepend karo
  return `${IMAGE_BASE_URL}/${path.replace(/^\/+/, "")}`;
};
