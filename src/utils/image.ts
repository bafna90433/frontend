const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL as string || "";

// ✅ Local Placeholder (Better than network request to via.placeholder.com)
const FALLBACK_IMAGE = "/images/placeholder.webp"; 

export const getImageUrl = (
  path?: string,
  width: number = 400,
  height?: number,
  // 🔹 'q_auto' (good quality) aur 'f_auto' (WebP/AVIF) sabse zaroori hain
  // 🔹 'c_limit' ensure karta hai ki image stretch na ho
  options: string = "f_auto,q_auto,c_limit" 
): string => {
  if (!path) return FALLBACK_IMAGE;

  try {
    // ---------------------------------------------------------
    // 1. CLOUDINARY IMAGES (Sabse Badi Win 🚀)
    // ---------------------------------------------------------
    if (path.includes("cloudinary.com")) {
      // Agar pehle se optimized hai (e.g. database mein full URL saved hai), toh chedkhani mat karo
      if (path.includes("/upload/w_") || path.includes("/upload/q_")) {
        return path;
      }

      // Naya Size Parameter banao
      let sizeParams = `w_${width}`;
      if (height) {
        // Agar height di hai, toh crop karna padega (c_fill) taaki box mein fit aaye
        sizeParams += `,h_${height},c_fill`;
      } else {
        // Agar sirf width di hai, toh aspect ratio maintain karo (c_limit)
        sizeParams += `,c_limit`;
      }

      // URL mein parameters inject karo
      return path.replace("/upload/", `/upload/${options},${sizeParams}/`);
    }

    // ---------------------------------------------------------
    // 2. CLEAN LOCALHOST / ABSOLUTE URLS
    // ---------------------------------------------------------
    // Agar backend ne galti se 'http://localhost:5000/uploads/img.jpg' bhej diya
    if (path.startsWith("http")) {
      const urlObj = new URL(path);
      
      // Agar ye hamara hi backend domain/localhost hai, toh relative path nikalo
      if (urlObj.hostname === "localhost" || urlObj.hostname === "127.0.0.1" || path.includes(IMAGE_BASE_URL)) {
         // '/uploads/image.jpg' nikal lo
         const relativePath = urlObj.pathname;
         return `${IMAGE_BASE_URL}${relativePath.startsWith("/") ? "" : "/"}${relativePath}`;
      }
      
      // Agar ye koi third party image hai (e.g. Google User Profile), waisa hi return karo
      return path;
    }

    // ---------------------------------------------------------
    // 3. RELATIVE PATHS (e.g. "uploads/toy.jpg")
    // ---------------------------------------------------------
    // Leading slash hatao taaki double slash (//) na bane
    const cleanPath = path.replace(/^\/+/, "");
    
    // Agar path already 'uploads' se shuru nahi hota aur local hai, toh shayad uploads lagana padega
    // (Yeh aapke backend structure par depend karta hai)
    if (!cleanPath.startsWith("uploads/") && !cleanPath.startsWith("images/")) {
       return `${IMAGE_BASE_URL}/uploads/${cleanPath}`;
    }

    return `${IMAGE_BASE_URL}/${cleanPath}`;

  } catch (error) {
    console.error("Image URL Error:", error);
    return FALLBACK_IMAGE;
  }
};