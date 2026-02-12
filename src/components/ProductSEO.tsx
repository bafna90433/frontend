import React from "react";
import { Helmet } from "react-helmet";

type ProductSEOProps = {
  name: string;
  description?: string;
  price?: number;
  image?: string; // Yeh sirf filename ya path ho sakta hai
  url: string;    // Page ka full URL (window.location.href)
};

// 1. Apna Backend ya Cloudinary URL yahan set karein
const IMAGE_BASE_URL = "https://bafnatoys.com/api/uploads"; 

const ProductSEO: React.FC<ProductSEOProps> = ({ name, description, price, image, url }) => {
  const seoTitle = `${name} | Wholesale Toy Supplier - Bafna Toys`;
  const seoDescription =
    description ||
    `Buy ${name} wholesale from Bafna Toys, Coimbatore. Available in bulk at the best wholesale prices for shops and distributors in India.`;
  
  const seoKeywords = `wholesale ${name}, bulk ${name}, ${name} supplier India, Bafna Toys wholesale`;

  // ✅ 2. Logic: Ensure Image URL is ALWAYS Absolute
  let seoImage = "https://bafnatoys.com/logo.webp"; // Default Logo
  
  if (image) {
    if (image.startsWith("http")) {
      seoImage = image; // Agar pehle se full URL hai
    } else {
      seoImage = `${IMAGE_BASE_URL}/${image}`; // Agar sirf filename hai toh base path lagao
    }
  }

  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: name,
    image: seoImage,
    description: seoDescription,
    brand: { "@type": "Brand", name: "Bafna Toys" },
    offers: {
      "@type": "Offer",
      url: url,
      priceCurrency: "INR",
      price: price ? price.toString() : "0",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <Helmet>
      {/* --- Basic SEO --- */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      <link rel="canonical" href={url} />

      {/* --- Open Graph (WhatsApp/Facebook) --- */}
      <meta property="og:type" content="product" />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:image:secure_url" content={seoImage} />
      <meta property="og:image:type" content="image/jpeg" />
      {price && <meta property="product:price:amount" content={price.toString()} />}
      {price && <meta property="product:price:currency" content="INR" />}

      {/* --- Twitter --- */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />

      {/* --- JSON-LD Schema --- */}
      <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
    </Helmet>
  );
};

export default ProductSEO;