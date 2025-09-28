import React from "react";
import { Helmet } from "react-helmet";

type CategorySEOProps = {
  title: string;
  description: string;
  keywords?: string;
  url: string;
  image?: string;
};

const CategorySEO: React.FC<CategorySEOProps> = ({
  title,
  description,
  keywords,
  url,
  image,
}) => {
  return (
    <Helmet>
      {/* Title + Meta */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image || "https://bafnatoys.com/logo.webp"} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image || "https://bafnatoys.com/logo.webp"} />
    </Helmet>
  );
};

export default CategorySEO;
