import React, { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import JsonLd from "./JsonLd";

type ProductSEOProps = {
  name: string;
  description?: string;
  price?: number;
  image?: string;
  url: string;
  sku?: string;
  category?: string;
  categoryId?: string; // ✅ NEW — enables BreadcrumbList schema
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
  categoryId,
  stock,
  rating,
  reviews,
}) => {
  // ✅ SEO title updated for Google ranking
  // Example: PVC Doll Toy B66 - Wholesale Toy Supplier in India | Bafna Toys
  const seoTitle = `${name} - Wholesale Toy Supplier in India | Bafna Toys`;

  // ✅ Clean URL to avoid query parameters in canonical tags
  const cleanUrl = url.split("?")[0].split("#")[0];

  const seoDescription =
    description ||
    `Buy ${name} wholesale from Bafna Toys. Best wholesale toy supplier in India for retailers, toy shops and distributors. Available for bulk order at wholesale price.`;

  const seoKeywords = `wholesale ${name}, bulk ${name}, ${name} supplier India, ${name} wholesale price, toys manufacturer India, wholesale toys India, toy supplier India, Bafna Toys`;

  let seoImage = "https://bafnatoys.com/logo.webp";
  if (image) {
    if (image.startsWith("http")) {
      seoImage = image;
    } else {
      seoImage = `${IMAGE_BASE_URL}/${image.replace(/^\/+/, "")}`;
    }
  }

  // 2. PERFORMANCE & SEO: useMemo se schema object create kiya
  const productSchema = useMemo(() => {
    const schema: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": "Product",
      name,
      image: [seoImage],
      description: seoDescription,
      brand: {
        "@type": "Brand",
        name: "Bafna Toys",
      },
      url: cleanUrl,
    };

    if (sku) {
      schema.sku = sku;
    }

    if (category) {
      schema.category = category;
    }

    if (typeof price === "number" && price > 0) {
      // GSC fix: Ek default valid date lagani padti hai (e.g., 1 year from now)
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      schema.offers = {
        "@type": "Offer",
        url: cleanUrl,
        priceCurrency: "INR",
        price: price.toString(),
        priceValidUntil: validUntil.toISOString().split("T")[0], // YYYY-MM-DD
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
      schema.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: rating.toString(),
        reviewCount: reviews.toString(),
      };
    }

    return schema;
  }, [
    name,
    seoDescription,
    seoImage,
    cleanUrl,
    sku,
    category,
    price,
    stock,
    rating,
    reviews,
  ]);

  // ✅ BreadcrumbList schema
  const breadcrumbSchema = useMemo(() => {
    const items: Array<Record<string, any>> = [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://bafnatoys.com/",
      },
    ];

    if (category && categoryId) {
      items.push({
        "@type": "ListItem",
        position: 2,
        name: category,
        item: `https://bafnatoys.com/?category=${encodeURIComponent(
          categoryId
        )}`,
      });
    }

    items.push({
      "@type": "ListItem",
      position: items.length + 1,
      name,
      item: cleanUrl,
    });

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items,
    };
  }, [name, cleanUrl, category, categoryId]);

  return (
    <>
      <Helmet>
        {/* Primary Meta */}
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={seoKeywords} />

        {/* SEO Fix: Image Preview directive for Google Discover/Images */}
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={cleanUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="product" />
        <meta property="og:site_name" content="Bafna Toys" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={cleanUrl} />
        <meta property="og:image" content={seoImage} />
        <meta property="og:image:secure_url" content={seoImage} />

        {typeof price === "number" && price > 0 && (
          <meta property="product:price:amount" content={price.toString()} />
        )}
        {typeof price === "number" && price > 0 && (
          <meta property="product:price:currency" content="INR" />
        )}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={seoImage} />
      </Helmet>

      {/* ✅ JSON-LD injected via direct DOM */}
      <JsonLd id="product" data={productSchema} />
      <JsonLd id="product-breadcrumb" data={breadcrumbSchema} />
    </>
  );
};

export default ProductSEO;