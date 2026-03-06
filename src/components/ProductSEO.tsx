import React from "react";
import { Helmet } from "react-helmet-async";

type ProductSEOProps = {
  name: string;
  description?: string;
  price?: number;
  image?: string;
  url: string;
  sku?: string;
  category?: string;
  stock?: number;
  rating?: number;
  reviews?: number;
};

const IMAGE_BASE_URL = "https://bafnatoys.com/api/uploads";

const ProductSEO: React.FC<ProductSEOProps> = ({
  name,
  description,
  price,
  image,
  url,
  sku,
  category,
  stock,
  rating,
  reviews,
}) => {
  const seoTitle = `${name} | Wholesale Toy Supplier - Bafna Toys`;

  const seoDescription =
    description ||
    `Buy ${name} wholesale from Bafna Toys, Coimbatore. Available in bulk at the best wholesale prices for shops and distributors in India.`;

  const seoKeywords = `wholesale ${name}, bulk ${name}, ${name} supplier India, Bafna Toys wholesale`;

  let seoImage = "https://bafnatoys.com/logo.webp";

  if (image) {
    if (image.startsWith("http")) {
      seoImage = image;
    } else {
      seoImage = `${IMAGE_BASE_URL}/${image.replace(/^\/+/, "")}`;
    }
  }

  const productSchema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    image: [seoImage],
    description: seoDescription,
    brand: {
      "@type": "Brand",
      name: "Bafna Toys",
    },
    url,
  };

  if (sku) {
    productSchema.sku = sku;
  }

  if (category) {
    productSchema.category = category;
  }

  if (typeof price === "number" && price > 0) {
    productSchema.offers = {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: price.toString(),
      availability:
        stock === 0
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",

      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "INR",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN",
        },
      },

      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IN",
        returnPolicyCategory:
          "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    };
  }

  if (
    typeof rating === "number" &&
    rating > 0 &&
    typeof reviews === "number" &&
    reviews > 0
  ) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating.toString(),
      reviewCount: reviews.toString(),
    };
  }

  return (
    <Helmet>
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="product" />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:image:secure_url" content={seoImage} />

      {typeof price === "number" && price > 0 && (
        <meta property="product:price:amount" content={price.toString()} />
      )}
      {typeof price === "number" && price > 0 && (
        <meta property="product:price:currency" content="INR" />
      )}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />

      <script type="application/ld+json">
        {JSON.stringify(productSchema)}
      </script>
    </Helmet>
  );
};

export default ProductSEO;