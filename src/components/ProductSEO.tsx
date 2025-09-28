import React from "react";
import { Helmet } from "react-helmet";

type ProductSEOProps = {
  name: string;
  description?: string;
  price?: number;
  image?: string;
  url: string;
};

const ProductSEO: React.FC<ProductSEOProps> = ({ name, description, price, image, url }) => {
  const seoTitle = `${name} | Wholesale Toy Supplier - Bafna Toys`;
  const seoDescription =
    description ||
    `Buy ${name} wholesale from Bafna Toys, Coimbatore. Available in bulk at the best wholesale prices for shops and distributors in India.`;
  const seoKeywords = `wholesale ${name}, bulk ${name}, ${name} supplier India, Bafna Toys wholesale`;
  const seoImage = image || "https://bafnatoys.com/logo.webp";

  // ✅ schema.org Product JSON-LD
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: name,
    image: seoImage,
    description: seoDescription,
    brand: {
      "@type": "Brand",
      name: "Bafna Toys",
    },
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
      {/* Basic SEO */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content="product" />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={seoImage} />
      {price && <meta property="product:price:amount" content={price.toString()} />}
      {price && <meta property="product:price:currency" content="INR" />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />

      {/* ✅ JSON-LD Schema */}
      <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
    </Helmet>
  );
};

export default ProductSEO;
