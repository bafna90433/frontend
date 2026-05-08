const BOT_AGENTS = [
  "facebookexternalhit",
  "Facebot",
  "WhatsApp",
  "Twitterbot",
  "LinkedInBot",
  "TelegramBot",
  "Slackbot",
  "Discordbot",
  "Pinterestbot"
];

// Type definition for Cloudflare Pages context
export async function onRequest(context: any) {
  const { request, next } = context;
  const url = new URL(request.url);
  const userAgent = request.headers.get("User-Agent") || "";

  // 1. Check if the requester is a known social bot
  const isBot = BOT_AGENTS.some(bot => userAgent.toLowerCase().includes(bot.toLowerCase()));

  // 2. We only want to intercept specific product pages for bots
  if (isBot && url.pathname.startsWith("/product/")) {
    const parts = url.pathname.split("/").filter(Boolean);
    const slug = parts[1]; // e.g., ["product", "my-slug"] -> "my-slug"

    if (slug) {
      try {
        // Fetch product data directly from the backend
        const res = await fetch(`https://api.bafnatoys.com/api/products/${slug}`);
        if (!res.ok) {
          // If the product fetch fails, let the normal SPA handle it
          return next();
        }

        const product = await res.json();
        const baseUrl = "https://bafnatoys.com";

        // Fallback or specific details
        const title = product.name ? `${product.name} - Wholesale Toy Supplier in India | Bafna Toys` : "Bafna Toys Wholesale";
        const description = product.description || product.tagline || `Buy ${product.name || 'this product'} wholesale from Bafna Toys. Best wholesale toy supplier in India.`;
        
        let imageUrl = `${baseUrl}/logo.webp`;
        if (product.images && product.images.length > 0) {
          imageUrl = product.images[0].startsWith("http") 
            ? product.images[0] 
            : `https://api.bafnatoys.com/api/uploads/${product.images[0].replace(/^\/+/, "")}`;
        }

        // Return pure, lightweight HTML for the bot to parse
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
  <!-- This response is only served to social bots for rich link previews. -->
  <script>
    // Just in case a real browser accidentally gets here (it shouldn't), 
    // redirect them to the same URL to break the cycle or just do nothing,
    // actually doing nothing is safer, they will see a blank page. 
    // We can add a fallback link.
  </script>
  <h1>${title}</h1>
  <p>${description}</p>
  <img src="${imageUrl}" alt="${title}" />
  <p>Please use a regular browser to view our website.</p>
</body>
</html>`;

        return new Response(html, {
          headers: {
            "Content-Type": "text/html;charset=UTF-8",
            // Don't cache bot responses aggressively to avoid accidental poisoning, 
            // though Cloudflare edge handles user-agent varying based on plan.
            "Cache-Control": "public, max-age=3600"
          }
        });

      } catch (err) {
        console.error("Bot middleware error:", err);
        // On error, fallback to normal React app rendering
        return next();
      }
    }
  }

  // 3. Normal users (or non-product routes) get passed through to the React SPA
  return next();
}
