export async function onRequestGet(context: any) {
  try {
    // Backend API se products, categories, aur blogs fetch karo
    const [productsRes, categoriesRes, blogsRes] = await Promise.all([
      fetch("https://api.bafnatoys.com/api/products"),
      fetch("https://api.bafnatoys.com/api/categories"),
      fetch("https://api.bafnatoys.com/api/blogs")
    ]);
    
    if (!productsRes.ok) {
      throw new Error(`Failed to fetch products: ${productsRes.status}`);
    }

    const productsData = await productsRes.json();
    const products = productsData.products || productsData || [];

    let categories = [];
    if (categoriesRes.ok) {
      const categoriesData = await categoriesRes.json();
      categories = categoriesData.categories || categoriesData || [];
    }

    let blogs = [];
    if (blogsRes.ok) {
      try {
        blogs = await blogsRes.json();
      } catch (err) {
        console.error("Error parsing blogs for sitemap:", err);
      }
    }

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
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/toys-manufacturers-in-india</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/blogs</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
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
      
      if (p.images && p.images.length > 0) {
         const imageUrl = p.images[0].startsWith("http") ? p.images[0] : `https://api.bafnatoys.com/api/uploads/${p.images[0].replace(/^\/+/, "")}`;
         imageXml = `
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:title>${escapeXml(p.name)}</image:title>
    </image:image>`;
      } else if (p.image) {
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

    // Dynamic Category Routes
    categories.forEach((cat: any) => {
      const categoryUrl = cat.slug ? `${baseUrl}/category/${cat.slug}` : `${baseUrl}/?category=${cat._id}`;
      let imageXml = "";
      
      const rawImg = cat.image || cat.imageUrl;
      if (rawImg) {
         const imageUrl = rawImg.startsWith("http") ? rawImg : `https://api.bafnatoys.com/api/uploads/${rawImg.replace(/^\/+/, "")}`;
         imageXml = `
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:title>${escapeXml(cat.name)}</image:title>
    </image:image>`;
      }

      xml += `
  <url>
    <loc>${escapeXml(categoryUrl)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>${imageXml}
  </url>`;
    });

    // Dynamic Blog Routes
    blogs.forEach((b: any) => {
      const blogUrl = `${baseUrl}/blog/${b.slug}`;
      let imageXml = "";
      
      if (b.coverImage) {
         const imageUrl = b.coverImage.startsWith("http") ? b.coverImage : `https://api.bafnatoys.com/api/uploads/${b.coverImage.replace(/^\/+/, "")}`;
         imageXml = `
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:title>${escapeXml(b.title)}</image:title>
    </image:image>`;
      }

      xml += `
  <url>
    <loc>${escapeXml(blogUrl)}</loc>
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
