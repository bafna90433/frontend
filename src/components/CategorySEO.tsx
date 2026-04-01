import React, { useMemo } from "react";
import { Helmet } from "react-helmet-async";

type CategoryItem = {
  name: string;
  url: string;
};

type CategorySEOProps = {
  title: string;
  description: string;
  keywords?: string;
  url: string;
  image?: string;
  items?: CategoryItem[];
};

const CategorySEO: React.FC<CategorySEOProps> = ({
  title,
  description,
  keywords,
  url,
  image,
  items = [],
}) => {
  const seoImage = image || "https://bafnatoys.com/logo.webp";

  // ✅ PERFORMANCE FIX: useMemo se schema calculation ko block kiya (sirf dependency change par chalega)
  const schema = useMemo(() => {
    const baseSchema: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url,
      publisher: {
        "@type": "Organization",
        name: "Bafna Toys",
        url: "https://bafnatoys.com",
        logo: {
          "@type": "ImageObject",
          url: "https://bafnatoys.com/logo.webp",
        },
      },
    };

    // Agar items hain, tabhi ItemList generate karo
    if (items.length > 0) {
      baseSchema.mainEntity = {
        "@type": "ItemList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          url: item.url,
        })),
      };
    }

    return baseSchema;
  }, [title, description, url, items]); // Dependencies

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* ✅ SEO FIX: Bot indexing directives */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Bafna Toys" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:image:secure_url" content={seoImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={seoImage} />

      {/* ✅ BUG FIX: Safe schema injection without breaking quotes */}
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} 
      />
    </Helmet>
  );
};

export default CategorySEO;