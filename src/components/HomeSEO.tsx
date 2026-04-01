import React, { useMemo } from "react";
import { Helmet } from "react-helmet-async";

type CategoryItem = {
  name: string;
  url: string;
};

type HomeSEOProps = {
  url: string;
  categories: CategoryItem[];
};

const HomeSEO: React.FC<HomeSEOProps> = ({ url, categories }) => {
  // SEO Optimized Text with target keywords ("toys manufacturers in india", "wholesale")
  const title = "Top Toy Manufacturers in India | Wholesale Toys Supplier - Bafna Toys";
  const description =
    "Bafna Toys is a leading toy manufacturer and wholesale supplier in India. Buy premium quality, BIS certified plastic toys, pullback cars, dolls, and more at factory prices.";
  const image = "https://bafnatoys.com/logo.webp";

  // Performance Fix: useMemo prevents unnecessary re-calculations on every render
  const schema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    url,
    description,
    publisher: {
      "@type": "Organization",
      name: "Bafna Toys",
      url: "https://bafnatoys.com",
      logo: {
        "@type": "ImageObject",
        url: image,
      },
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: categories.map((cat, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: cat.name,
        url: cat.url,
      })),
    },
  }), [url, categories, title, description, image]);

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Bafna Toys" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Schema (Safe Injection) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </Helmet>
  );
};

export default HomeSEO;