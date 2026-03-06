import React from "react";
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

  const schema = {
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
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: item.url,
      })),
    },
  };

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:image:secure_url" content={seoImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={seoImage} />

      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

export default CategorySEO;