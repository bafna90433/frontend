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

  // 3. Intercept dedicated landing page for bots (Toys Manufacturers in India)
  if (isBot && url.pathname === "/toys-manufacturers-in-india") {
    const baseUrl = "https://bafnatoys.com";
    const title = "Toys Manufacturers in India | Wholesale Toy Supplier - Bafna Toys";
    const description = "Looking for top toys manufacturers in India? Bafna Toys is a leading wholesale toy manufacturer and supplier. Buy premium pullback cars, PVC dolls, rattles & board games at factory-direct rates.";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${baseUrl}/toys-manufacturers-in-india" />
  
  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Bafna Toys" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${baseUrl}/toys-manufacturers-in-india" />
  <meta property="og:image" content="${baseUrl}/logo.webp" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${baseUrl}/logo.webp" />
</head>
<body style="font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #333;">
  
  <header style="text-align: center; border-bottom: 2px solid #eaeaea; padding-bottom: 20px; margin-bottom: 30px;">
    <img src="${baseUrl}/logo.webp" alt="Bafna Toys Logo" style="max-width: 150px; height: auto;" />
    <h1 style="color: #059669; font-size: 2.2rem; margin: 15px 0 5px 0;">Toys Manufacturers in India</h1>
    <p style="font-size: 1.2rem; color: #666; margin: 0;">Bafna Toys Wholesale - Direct Factory Supplier in India</p>
  </header>

  <main>
    <section style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 5px solid #059669;">
      <h2 style="margin-top: 0; color: #0f172a;">India's Fast-Growing B2B Wholesale Toy Supply Chain</h2>
      <p>
        In recent years, the Indian toy industry has witnessed a paradigm shift, transitioning from cheap, unchecked imported items to high-quality, indigenous, and strictly certified domestic manufacturing. Bafna Toys stands at the forefront of this revolution as one of the leading <strong>toys manufacturers in India</strong>. By integrating cutting-edge manufacturing automation with high-grade materials, we deliver premium products that retailers can trust blindly.
      </p>
      <p>
        Our specialized production plants utilize premium injection molding, advanced rotomolding, and rigorous tension and drop testing to ensure every single toy is indestructible and completely safe for children. From vibrant mechanical wind-up key toys to dynamic pullback friction vehicles, we build happiness that lasts.
      </p>
    </section>

    <section style="margin-bottom: 30px;">
      <h3 style="color: #0f172a;">Why Partner Directly With Bafna Toys?</h3>
      <p>
        Finding a reliable <strong>toy manufacturer direct supplier India</strong> can be difficult. Many suppliers act as wholesale intermediaries, adding significant markup percentages to each unit. When you partner with Bafna Toys, you work directly with the creators. This direct relationship guarantees you access to <strong>toys factory price wholesale India</strong>, enabling retail businesses to enjoy high-yield margins and pass on amazing retail discounts to end customers.
      </p>
      <p>
        We cater to a vast customer profile, functioning as a dedicated <strong>bulk toys supplier for retailers India</strong>, supermarkets, multi-brand department stores, and independent toyshops. With our structured logistics team, we guarantee swift shipments with robust tracking from our dispatch dock.
      </p>
    </section>

    <section style="margin-bottom: 30px;">
      <h3 style="color: #0f172a;">Our Toy Manufacturing Specializations</h3>
      
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 8px;">
        <h4 style="margin: 0; color: #059669;">PVC Dolls Manufacturer in India</h4>
        <p style="margin: 5px 0 0 0;">
          We are an industry-leading <strong>PVC dolls manufacturer in India</strong>. Our state-of-the-art rotomolding machinery produces non-toxic, safe, and skin-friendly vinyl dolls with soft-touch finishes and high structural durability for infants and toddlers.
        </p>
      </div>

      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 8px;">
        <h4 style="margin: 0; color: #059669;">Windup Key Toys Manufacturer</h4>
        <p style="margin: 5px 0 0 0;">
          As a seasoned <strong>windup key toys manufacturer</strong>, we specialize in high-precision mechanical clockwork keys. Our gears and spring systems are engineered for prolonged movement cycles, ensuring repetitive hopping, jumping, and walking animations without breaking.
        </p>
      </div>

      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 8px;">
        <h4 style="margin: 0; color: #059669;">Pullback Toy Cars Wholesale</h4>
        <p style="margin: 5px 0 0 0;">
          Get <strong>pullback toy cars wholesale</strong> from our friction-powered manufacturing division. We produce aerodynamic pullback cars, racing buggies, heavy-duty dumper trucks, and utility vehicles equipped with high-friction rubberized wheels and powerful double-geared motors.
        </p>
      </div>
    </section>

    <section style="margin-bottom: 30px;">
      <h3 style="color: #0f172a;">The Coimbatore Manufacturing Excellence</h3>
      <p>
        Located in the industrial city of Coimbatore, Tamil Nadu, Bafna Toys is proudly established as a high-performance <strong>toys manufacturer in Coimbatore</strong>. Coimbatore's engineering heritage allows us to source high-grade steel molds, maintain precision machinery, and operate with maximum power efficiency. Our facility is run by highly skilled assembly line professionals who ensure rigorous checking of every PVC doll, friction gearbox, and rattles set before they are packed for transport.
      </p>
    </section>

    <section style="margin-bottom: 30px; background-color: #f0fdf4; padding: 20px; border-radius: 8px;">
      <h3 style="color: #065f46; margin-top: 0;">Partner Highlights &amp; Retailer Benefits:</h3>
      <ul>
        <li>BIS Certified Safe Products (Bureau of Indian Standards approval for 100% security)</li>
        <li>Direct Factory Wholesale Prices (No distributors or middle-men markups)</li>
        <li>Ultra-Low MOQ requirements tailored specifically for retail stores and startup toy outlets</li>
        <li>Coimbatore manufacturing hub offering super-fast transit times across South India and pan-India</li>
        <li>High-grade virgin food-safe plastics and non-toxic lead-free pigments</li>
        <li>Dedicated premium packing boxes optimized to withstand harsh shipping conditions</li>
      </ul>
    </section>

    <section style="margin-bottom: 30px;">
      <h3 style="color: #0f172a;">Frequently Asked Questions (FAQ)</h3>
      <div style="margin-top: 15px;">
        <p><strong>Q: What makes Bafna Toys a reliable toys manufacturers in India?</strong><br/>
        A: Unlike trading entities, we own our full injection and rotomolding manufacturing unit. This ensures absolute oversight over chemical and structural safety, BIS standard certifications, and constant inventory availability, making us a top <strong>wholesale toys supplier in India</strong>.</p>
        
        <p><strong>Q: Do you supply pullback toy cars wholesale in customizable batches?</strong><br/>
        A: Yes! We offer bulk configurations of <strong>pullback toy cars wholesale</strong> with customizable colors, box packaging types, and bundle quantities. All our friction gearboxes are made of heavy-duty nylon for durable performance.</p>
        
        <p><strong>Q: What is your manufacturing safety rating for PVC dolls?</strong><br/>
        A: As a primary <strong>PVC dolls manufacturer in India</strong>, we use 100% medical-grade phthalate-free PVC materials. Every doll passes through thermal disinfection and high quality color-fast coatings to ensure safety for children.</p>
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
  }

  // 3b. Static policy/info pages for bots
  const staticBotPages: Record<string, { title: string; description: string; canonical: string; h1: string; body: string }> = {
    "/privacy-policy": {
      title: "Privacy Policy | Bafna Toys",
      description: "Read the Bafna Toys privacy policy. We protect your personal data and explain how we collect, use, and secure your information.",
      canonical: "https://bafnatoys.com/privacy-policy",
      h1: "Privacy Policy",
      body: `<p>We respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use, and secure your information.</p>
<h2>Information We Collect</h2><ul><li>Name</li><li>Email Address</li><li>Phone Number</li><li>Shipping Address</li><li>Payment Information (handled securely by Razorpay)</li></ul>
<h2>How We Use Your Information</h2><p>We use your information to process orders, provide support, and send notifications regarding products or purchases.</p>
<h2>Data Protection</h2><p>We do not store or share payment details. All payments are encrypted and processed securely via Razorpay.</p>
<h2>Contact</h2><p>Questions? Email us at bafnatoysphotos@gmail.com</p>`
    },
    "/terms-conditions": {
      title: "Terms & Conditions | Bafna Toys",
      description: "Read Bafna Toys terms and conditions. By using our website or placing orders you agree to our guidelines for a smooth wholesale experience.",
      canonical: "https://bafnatoys.com/terms-conditions",
      h1: "Terms & Conditions",
      body: `<p>By accessing or purchasing from our website, you agree to follow our terms, guidelines, and policies.</p>
<h2>General Conditions</h2><p>All orders are subject to product availability. Prices may change without notice. We reserve the right to cancel orders that violate our policies.</p>
<h2>Intellectual Property</h2><p>All content on this website is the property of Bafna Toys. Unauthorized use is prohibited.</p>
<h2>Contact</h2><p>For queries: bafnatoysphotos@gmail.com | +91-9043347300</p>`
    },
    "/shipping-delivery": {
      title: "Shipping & Delivery Policy | Bafna Toys",
      description: "Read Bafna Toys shipping and delivery policy. We deliver wholesale toys across India within 3-9 days via trusted courier partners like Delhivery and DTDC.",
      canonical: "https://bafnatoys.com/shipping-delivery",
      h1: "Shipping & Delivery Policy",
      body: `<p>We deliver wholesale toys PAN India via Delhivery, DTDC, and Blue Dart. Orders are dispatched within 24-48 hours.</p>
<h2>Delivery Timeline</h2><ul><li>South India: 2-3 business days</li><li>Rest of India: 4-7 business days</li><li>Remote areas: up to 9 business days</li></ul>
<h2>Free Shipping</h2><p>Orders above ₹3,000 qualify for free shipping. Smaller orders attract a nominal shipping charge.</p>
<h2>Contact</h2><p>For shipping queries: bafnatoysphotos@gmail.com | +91-9043347300</p>`
    },
    "/cancellation-refund": {
      title: "Cancellation & Refund Policy | Bafna Toys",
      description: "Read Bafna Toys cancellation and refund policy. Learn about return eligibility, refund process, and how to cancel your wholesale toy order.",
      canonical: "https://bafnatoys.com/cancellation-refund",
      h1: "Cancellation & Refund Policy",
      body: `<p>We aim to provide a seamless shopping experience. Please review our guidelines regarding returns and refunds.</p>
<h2>Refund Eligibility</h2><ul><li>Damaged or defective products reported within 48 hours of delivery</li><li>Wrong product delivered</li><li>Missing items from order</li></ul>
<h2>How to Raise a Request</h2><p>Contact us via WhatsApp or email with your order ID and photos of the issue. Refunds are processed within 5-7 business days.</p>
<h2>Contact</h2><p>Email: bafnatoysphotos@gmail.com | WhatsApp: +91-9043347300</p>`
    },
    "/faq": {
      title: "FAQ - Frequently Asked Questions | Bafna Toys Wholesale",
      description: "Get answers to common questions about Bafna Toys wholesale ordering, minimum order quantity, BIS certification, delivery, payment methods, and GST invoices.",
      canonical: "https://bafnatoys.com/faq",
      h1: "Frequently Asked Questions",
      body: `<h2>Is Bafna Toys a manufacturer or a trader?</h2><p>Bafna Toys is a direct toy manufacturer based in Coimbatore, Tamil Nadu. We own our manufacturing unit and offer factory-direct wholesale prices to retailers across India.</p>
<h2>What types of toys does Bafna Toys manufacture?</h2><p>We manufacture PVC dolls, pullback friction cars, windup key toys, rattle sets, soft toys, and educational toys. All products are BIS certified.</p>
<h2>What is the minimum order quantity (MOQ)?</h2><p>Very low MOQ — order from 1 inner box (typically 6-12 pieces). Bulk orders get additional factory-price discounts.</p>
<h2>Do you deliver across India?</h2><p>Yes. We ship PAN India via Delhivery, DTDC, and other logistics partners. Orders dispatched within 24-48 hours.</p>
<h2>Are Bafna Toys products BIS certified?</h2><p>Yes. All toys comply with Bureau of Indian Standards (BIS) IS 9873 safety regulations. We use non-toxic, phthalate-free PVC materials.</p>
<h2>What payment methods are accepted?</h2><p>UPI, NEFT/RTGS, debit/credit cards via Razorpay, and Cash on Delivery (COD) for eligible orders. GST invoice provided for every order.</p>`
    }
  };

  if (isBot && staticBotPages[url.pathname]) {
    const page = staticBotPages[url.pathname];
    const baseUrl = "https://bafnatoys.com";
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${page.title}</title>
  <meta name="description" content="${page.description}">
  <link rel="canonical" href="${page.canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Bafna Toys" />
  <meta property="og:title" content="${page.title}" />
  <meta property="og:description" content="${page.description}" />
  <meta property="og:url" content="${page.canonical}" />
  <meta property="og:image" content="${baseUrl}/logo.webp" />
</head>
<body style="font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #333;">
  <header style="text-align: center; border-bottom: 2px solid #eaeaea; padding-bottom: 20px; margin-bottom: 30px;">
    <a href="${baseUrl}"><img src="${baseUrl}/logo.webp" alt="Bafna Toys" style="max-width: 120px; height: auto;" /></a>
  </header>
  <main>
    <h1 style="color: #059669;">${page.h1}</h1>
    ${page.body}
  </main>
  <footer style="text-align: center; border-top: 2px solid #eaeaea; margin-top: 40px; padding-top: 20px; font-size: 0.85rem; color: #666;">
    <p>&copy; ${new Date().getFullYear()} Bafna Toys. All rights reserved. Coimbatore, Tamil Nadu, India.</p>
    <p><a href="${baseUrl}">Home</a> | <a href="${baseUrl}/toys-manufacturers-in-india">About Us</a> | <a href="${baseUrl}/faq">FAQ</a></p>
  </footer>
</body>
</html>`;
    return new Response(html, {
      headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "public, max-age=3600" }
    });
  }

  // 4. Intercept category pages for bots
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
