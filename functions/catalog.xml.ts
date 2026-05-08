export async function onRequestGet(context: any) {
  try {
    // Fetch products from the backend API
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

    let xml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Bafna Toys Wholesale</title>
    <link>${baseUrl}</link>
    <description>Live product catalog feed for Bafna Toys Wholesale business</description>\n`;

    products.forEach((p: any) => {
      const id = p._id;
      const title = escapeXml(p.name);
      const description = escapeXml(p.description || p.tagline || `Buy ${p.name} wholesale at best price in India from Bafna Toys.`);
      const link = p.slug ? `${baseUrl}/product/${p.slug}` : `${baseUrl}/product/${p._id}`;
      
      let imageUrl = `${baseUrl}/logo.webp`;
      if (p.images && p.images.length > 0) {
        imageUrl = p.images[0].startsWith("http") 
          ? p.images[0] 
          : `https://api.bafnatoys.com/api/uploads/${p.images[0].replace(/^\/+/, "")}`;
      } else if (p.image) {
        imageUrl = p.image.startsWith("http") 
          ? p.image 
          : `https://api.bafnatoys.com/api/uploads/${p.image.replace(/^\/+/, "")}`;
      }
      
      const priceVal = typeof p.price === "number" ? p.price : 0;
      // Format price correctly with ISO currency code (e.g., "99.00 INR")
      const price = `${priceVal.toFixed(2)} INR`;
      
      // Availability: "in stock" or "out of stock"
      const availability = (p.stock === undefined || p.stock > 0) ? "in stock" : "out of stock";
      const condition = "new";
      const brand = escapeXml(p.brand || "Bafna Toys");

      xml += `    <item>
      <g:id>${id}</g:id>
      <title>${title}</title>
      <description>${description}</description>
      <link>${escapeXml(link)}</link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      <g:price>${price}</g:price>
      <g:condition>${condition}</g:condition>
      <g:availability>${availability}</g:availability>
      <g:brand>${brand}</g:brand>
    </item>\n`;
    });

    xml += `  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600" // Cache for 1 hour at the edge
      }
    });

  } catch (error) {
    console.error("Facebook catalog feed generation failed:", error);
    return new Response(`<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Bafna Toys Wholesale</title>
    <link>https://bafnatoys.com</link>
    <description>Facebook catalog feed error</description>
  </channel>
</rss>`, {
      status: 500,
      headers: { "Content-Type": "application/xml; charset=utf-8" }
    });
  }
}
