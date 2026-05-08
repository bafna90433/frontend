export async function onRequestGet(context: any) {
  try {
    // Backend API se products fetch karo
    const res = await fetch("https://api.bafnatoys.com/api/products");
    
    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.status}`);
    }

    const data = await res.json();
    const products = data.products || data || [];

    const baseUrl = "https://bafnatoys.com";
    
    // Escape special characters for XML
    const escapeXml = (unsafe: string) => {
      if (!unsafe) return "";
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    // Basic Static Routes
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/products</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/categories</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/hot-deals</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy-policy</loc>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms-conditions</loc>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/shipping-delivery</loc>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/cancellation-refund</loc>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/faq</loc>
    <priority>0.5</priority>
  </url>`;

    // Dynamic Product Routes
    products.forEach((p: any) => {
      const productUrl = p.slug ? `${baseUrl}/product/${p.slug}` : `${baseUrl}/product/${p._id}`;
      let imageXml = "";
      
      if (p.image) {
         const imageUrl = p.image.startsWith("http") ? p.image : `https://api.bafnatoys.com/api/uploads/${p.image.replace(/^\/+/, "")}`;
         imageXml = `
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:title>${escapeXml(p.name)}</image:title>
    </image:image>`;
      }

      xml += `
  <url>
    <loc>${escapeXml(productUrl)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>${imageXml}
  </url>`;
    });

    xml += `\n</urlset>`;

    // Return the XML response
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600" // Cache for 1 hour at the edge
      }
    });
  } catch (error) {
    console.error("Sitemap generation failed:", error);
    // Return a fallback basic sitemap if fetching fails
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://bafnatoys.com/</loc></url>
</urlset>`, {
      status: 500,
      headers: { "Content-Type": "application/xml" }
    });
  }
}
