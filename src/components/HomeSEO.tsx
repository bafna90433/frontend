import React from "react";
import { Helmet } from "react-helmet";

type CategoryItem = {
  name: string;
  url: string;
};

type HomeSEOProps = {
  url: string;
  categories: CategoryItem[];
};

const HomeSEO: React.FC<HomeSEOProps> = ({ url, categories }) => {
  const title = "Bafna Toys - Toy Manufacturer & Wholesale Supplier in India";
  const description =
    "Bafna Toys is a trusted toy manufacturer and wholesale supplier in India. Explore rattles, pullback cars, dolls, jumping toys, windup toys, squeeze toys and more.";
  const image = "https://bafnatoys.com/logo.webp";

  const schema = {
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
  };

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export default HomeSEO;