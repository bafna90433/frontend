import { useEffect } from "react";

/**
 * ✅ JsonLd component — injects structured data directly into <head>
 *
 * Why not use react-helmet-async for this?
 * react-helmet-async has a known limitation: <script type="application/ld+json">
 * with dangerouslySetInnerHTML sometimes fails to render into the DOM. Meta tags
 * work fine, but inline JSON-LD scripts get stripped. So we bypass Helmet and
 * inject directly via useEffect + document.head.appendChild.
 *
 * Usage:
 *   <JsonLd id="product-breadcrumb" data={breadcrumbSchema} />
 */
interface JsonLdProps {
  id: string; // unique key — used as script element id to avoid duplicates
  data: Record<string, any> | Record<string, any>[] | null | undefined;
}

const JsonLd: React.FC<JsonLdProps> = ({ id, data }) => {
  useEffect(() => {
    if (!data) return;

    const scriptId = `jsonld-${id}`;
    // Remove any existing script with same id (SPA nav / data updates)
    const existing = document.getElementById(scriptId);
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.id = scriptId;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [id, data]);

  return null;
};

export default JsonLd;
