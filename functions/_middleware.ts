const BOT_AGENTS = [
  "googlebot",
  "bingbot",
  "yandex",
  "baiduspider",
  "duckduckbot",
  "sogou",
  "slurp",
  "facebookexternalhit",
  "facebot",
  "whatsapp",
  "twitterbot",
  "linkedinbot",
  "telegrambot",
  "slackbot",
  "discordbot",
  "pinterestbot"
];

// Type definition for Cloudflare Pages context
export async function onRequest(context: any) {
  const { request, next } = context;
  const url = new URL(request.url);
  const userAgent = request.headers.get("User-Agent") || "";

  // 1. Check if the requester is a known search engine or social bot
  const isBot = BOT_AGENTS.some(bot => userAgent.toLowerCase().includes(bot));

  // 2. Intercept homepage or products root for search engines & bots (Server-Side Prerendering)
  if (isBot && (url.pathname === "/" || url.pathname === "/products" || url.pathname === "/products/")) {
    try {
      // Fetch both products and categories in parallel from backend API
      const [prodRes, catRes] = await Promise.all([
        fetch("https://api.bafnatoys.com/api/products"),
        fetch("https://api.bafnatoys.com/api/categories")
      ]);

      let products: any[] = [];
      let categories: any[] = [];

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        // Handle products key if array is wrapped
        products = prodData.products || prodData || [];
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        categories = catData.categories || catData || [];
      }

      const baseUrl = "https://bafnatoys.com";
      const title = "Toys Manufacturers in India - Bafna Toys | Leading Toy Manufacturer";
      const description = "Looking for top toys manufacturers in India? Bafna Toys is a leading wholesale toy manufacturer and supplier. Buy premium pullback cars, PVC dolls, rattles & board games at factory-direct rates.";

      let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${baseUrl}/" />
  
  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Bafna Toys" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${baseUrl}/" />
  <meta property="og:image" content="${baseUrl}/logo.webp" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${baseUrl}/logo.webp" />
</head>
<body style="font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #333;">
  
  <header style="text-align: center; border-bottom: 2px solid #eaeaea; padding-bottom: 20px; margin-bottom: 30px;">
    <img src="${baseUrl}/logo.webp" alt="Bafna Toys" style="max-width: 150px; height: auto;" />
    <h1 style="color: #059669; font-size: 2.2rem; margin: 15px 0 5px 0;">Leading Toys Manufacturers in India</h1>
    <p style="font-size: 1.2rem; color: #666; margin: 0;">Premium Wholesale Toys Supplier in India | Direct Factory Prices</p>
  </header>

  <main>
    <!-- Rich Keyword-Optimized Content for Search Engine Crawlers -->
    <section style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 5px solid #059669;">
      <h2 style="margin-top: 0; color: #0f172a;">Your Trusted Toy Manufacturer &amp; Direct Supplier in India</h2>
      <p>
        Welcome to <strong>Bafna Toys</strong>, one of the top <strong>toys manufacturers in India</strong>. Based in Coimbatore, Tamil Nadu, we are a leading <strong>toys manufacturer in Coimbatore</strong> and a prominent <strong>wholesale toys supplier in India</strong>. 
      </p>
      <p>
        As a dedicated <strong>toy manufacturer direct supplier India</strong>, we manufacture and supply high-quality, BIS-certified toys directly to retail stores, supermarkets, toy shops, and distributors. By eliminating middlemen, we provide premium-quality toys at <strong>toys factory price wholesale India</strong>.
      </p>
      <p>
        Our comprehensive B2B catalog makes us the ultimate <strong>bulk toys supplier for retailers India</strong>. We specialize in manufacturing:
      </p>
      <ul>
        <li><strong>PVC dolls manufacturer in India</strong>: Safe, high-grade soft vinyl PVC dolls for infants and children.</li>
        <li><strong>Windup key toys manufacturer</strong>: Fun, interactive wind-up mechanical toys built to last.</li>
        <li><strong>Pullback toy cars wholesale</strong>: High-speed, heavy-duty friction pullback plastic cars in bulk quantities.</li>
      </ul>
    </section>

    <!-- Product Categories Section -->
    <section style="margin-bottom: 35px;">
      <h2 style="color: #0f172a; border-bottom: 1px solid #eee; padding-bottom: 8px;">Browse Product Categories</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
        ${categories.map(c => `
        <div style="padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
          <h3 style="margin: 0; font-size: 1.1rem;"><a href="${baseUrl}/category/${c.slug || c._id}" style="color: #059669; text-decoration: none;">Wholesale ${c.name}</a></h3>
          <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: #666;">Buy bulk ${c.name} at wholesale prices.</p>
        </div>
        `).join('')}
      </div>
    </section>

    <!-- Product Catalog Section (Direct Links for Deep Crawling) -->
    <section>
      <h2 style="color: #0f172a; border-bottom: 1px solid #eee; padding-bottom: 8px;">Wholesale Product Catalog</h2>
      <p style="font-size: 0.95rem; color: #555;">Discover our live inventory of high-quality products directly from the manufacturing unit:</p>
      <div style="margin-top: 15px;">
        ${products.map(p => {
          const productUrl = p.slug ? `${baseUrl}/product/${p.slug}` : `${baseUrl}/product/${p._id}`;
          const pPrice = typeof p.price === "number" ? `₹${p.price}` : "";
          const pMrp = p.mrp ? ` (MRP: ₹${p.mrp})` : "";
          return `
          <div style="padding: 15px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <h3 style="margin: 0; font-size: 1.1rem;"><a href="${productUrl}" style="color: #059669; text-decoration: none;">${p.name}</a></h3>
              <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: #666;">
                ${p.tagline || ""} ${p.packSize ? `| Pack Size: ${p.packSize}` : ""}
              </p>
            </div>
            <div style="text-align: right; font-weight: bold; color: #333;">
              ${pPrice}${pMrp}
            </div>
          </div>
          `;
        }).join('')}
      </div>
    </section>
  </main>

  <footer style="text-align: center; border-top: 2px solid #eaeaea; margin-top: 40px; padding-top: 20px; font-size: 0.85rem; color: #666;">
    <p>&copy; ${new Date().getFullYear()} Bafna Toys. All rights reserved. Kalikkanaicken Palayam, Coimbatore, Tamil Nadu, India.</p>
    <p>Contact No: +91-9043347300 | Email: bafnatoys@gmail.com</p>
  </footer>

</body>
</html>`;

      return new Response(html, {
        headers: {
          "Content-Type": "text/html;charset=UTF-8",
          "Cache-Control": "public, max-age=3600"
        }
      });

    } catch (err) {
      console.error("Bot homepage middleware error:", err);
      return next();
    }
  }

  // 3. Intercept category pages for bots
  if (isBot && url.pathname.startsWith("/category/")) {
    const parts = url.pathname.split("/").filter(Boolean);
    const slug = parts[1];

    if (slug) {
      try {
        const res = await fetch(`https://api.bafnatoys.com/api/categories/${slug}`);
        if (!res.ok) {
          return next();
        }

        const data = await res.json();
        const category = data.category;
        if (!category) {
          return next();
        }

        const baseUrl = "https://bafnatoys.com";
        const title = `Wholesale ${category.name} | Buy Bulk Toys at Factory Price - Bafna Toys`;
        const description = `Buy ${category.name} wholesale from India's leading B2B toy supplier. High-quality, BIS-certified plastic toys, pullback cars, rattles, dolls & more at factory prices.`;
        
        let imageUrl = `${baseUrl}/logo.webp`;
        const rawImg = category.image || category.imageUrl;
        if (rawImg) {
          imageUrl = rawImg.startsWith("http") 
            ? rawImg 
            : `https://api.bafnatoys.com/api/uploads/${rawImg.replace(/^\/+/, "")}`;
        }

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Bafna Toys" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${baseUrl}${url.pathname}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:secure_url" content="${imageUrl}" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <img src="${imageUrl}" alt="${title}" />
  <p>Please use a regular browser to view our website.</p>
</body>
</html>`;

        return new Response(html, {
          headers: {
            "Content-Type": "text/html;charset=UTF-8",
            "Cache-Control": "public, max-age=3600"
          }
        });

      } catch (err) {
        console.error("Bot category middleware error:", err);
        return next();
      }
    }
  }

  // 4. We only want to intercept specific product pages for bots
  if (isBot && url.pathname.startsWith("/product/")) {
    const parts = url.pathname.split("/").filter(Boolean);
    const slug = parts[1];

    if (slug) {
      try {
        const res = await fetch(`https://api.bafnatoys.com/api/products/${slug}`);
        if (!res.ok) {
          return next();
        }

        const product = await res.json();
        const baseUrl = "https://bafnatoys.com";

        const title = product.name ? `${product.name} - Wholesale Toy Supplier in India | Bafna Toys` : "Bafna Toys Wholesale";
        const description = product.description || product.tagline || `Buy ${product.name || 'this product'} wholesale from Bafna Toys. Best wholesale toy supplier in India.`;
        
        let imageUrl = `${baseUrl}/logo.webp`;
        if (product.images && product.images.length > 0) {
          imageUrl = product.images[0].startsWith("http") 
            ? product.images[0] 
            : `https://api.bafnatoys.com/api/uploads/${product.images[0].replace(/^\/+/, "")}`;
        }

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="Bafna Toys" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${baseUrl}${url.pathname}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:secure_url" content="${imageUrl}" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <img src="${imageUrl}" alt="${title}" />
  <p>Please use a regular browser to view our website.</p>
</body>
</html>`;

        return new Response(html, {
          headers: {
            "Content-Type": "text/html;charset=UTF-8",
            "Cache-Control": "public, max-age=3600"
          }
        });

      } catch (err) {
        console.error("Bot middleware error:", err);
        return next();
      }
    }
  }

  // 5. Normal users (or non-product routes) get passed through to the React SPA
  return next();
}
