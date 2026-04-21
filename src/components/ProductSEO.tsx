import React, { useMemo } from "react";
import { Helmet } from "react-helmet-async";

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
  // 1. Strings ko define kiya
  // ✅ Enhanced title template — captures long-tail "wholesale price" queries
  const seoTitle =
    typeof price === "number" && price > 0
      ? `${name} — Wholesale Price ₹${price} | Bafna Toys`
      : `${name} | Wholesale Toy Supplier - Bafna Toys`;
  const seoDescription =
    description ||
    `Buy ${name} wholesale from Bafna Toys, Coimbatore. Available in bulk at the best wholesale prices for shops and distributors in India.`;
  const seoKeywords = `wholesale ${name}, bulk ${name}, ${name} supplier India, ${name} wholesale price, Bafna Toys wholesale`;

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
      url,
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
        url,
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
  }, [name, seoDescription, seoImage, url, sku, category, price, stock, rating, reviews]); // Dependencies

  // ✅ NEW: BreadcrumbList schema — Google SERP shows breadcrumb trail above product link,
  // boosting click-through-rate. Gracefully falls back to Home > Product if no category.
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
        item: `https://bafnatoys.com/?category=${encodeURIComponent(categoryId)}`,
      });
    }
    items.push({
      "@type": "ListItem",
      position: items.length + 1,
      name,
      item: url,
    });

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items,
    };
  }, [name, url, category, categoryId]);

  return (
    <Helmet>
      {/* Primary Meta */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      
      {/* 3. SEO Fix: Image Preview directive for Google Discover/Images */}
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content="product" />
      <meta property="og:site_name" content="Bafna Toys" />
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

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />

      {/* 4. BUG FIX: Safe injection using dangerouslySetInnerHTML */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      {/* ✅ SEO: BreadcrumbList schema — Google renders breadcrumb trail in SERP */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </Helmet>
  );
};

export default ProductSEO;