declare global {
  interface Window {
    fbq?: ((...args: any[]) => void) & { queue?: any[]; loaded?: boolean; version?: string; push?: Function; callMethod?: Function };
    _fbq?: any;
    __bafnaPixel?: { id: string; events: PixelEvents } | null;
  }
}

export type PixelEvents = {
  pageView: boolean;
  viewContent: boolean;
  addToCart: boolean;
  initiateCheckout: boolean;
  purchase: boolean;
};

const DEFAULT_EVENTS: PixelEvents = {
  pageView: true,
  viewContent: true,
  addToCart: true,
  initiateCheckout: true,
  purchase: true,
};

let _inited = false;

export function initMetaPixel(pixelId: string, events: Partial<PixelEvents> = {}) {
  if (_inited || typeof window === "undefined") return;
  if (!pixelId) return;

  window.__bafnaPixel = { id: pixelId, events: { ...DEFAULT_EVENTS, ...events } };

  // Standard Facebook Pixel base script
  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
    t = b.createElement(e); t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  window.fbq!("init", pixelId);
  if (window.__bafnaPixel.events.pageView) window.fbq!("track", "PageView");
  _inited = true;
}

function canFire(event: keyof PixelEvents): boolean {
  const cfg = window.__bafnaPixel;
  if (!cfg || !cfg.id || typeof window.fbq !== "function") return false;
  return Boolean(cfg.events[event]);
}

export function trackPageView() {
  if (canFire("pageView")) window.fbq!("track", "PageView");
}

export function trackViewContent(data: { id?: string; name?: string; price?: number; currency?: string }) {
  if (!canFire("viewContent")) return;
  window.fbq!("track", "ViewContent", {
    content_ids: data.id ? [data.id] : undefined,
    content_name: data.name,
    content_type: "product",
    value: data.price,
    currency: data.currency || "INR",
  });
}

export function trackAddToCart(data: { id?: string; name?: string; price?: number; quantity?: number; currency?: string }) {
  if (!canFire("addToCart")) return;
  window.fbq!("track", "AddToCart", {
    content_ids: data.id ? [data.id] : undefined,
    content_name: data.name,
    content_type: "product",
    value: (data.price || 0) * (data.quantity || 1),
    currency: data.currency || "INR",
  });
}

export function trackInitiateCheckout(data: { value: number; numItems?: number; currency?: string }) {
  if (!canFire("initiateCheckout")) return;
  window.fbq!("track", "InitiateCheckout", {
    value: data.value,
    num_items: data.numItems,
    currency: data.currency || "INR",
  });
}

export function trackPurchase(data: { value: number; orderId?: string; contentIds?: string[]; currency?: string }) {
  if (!canFire("purchase")) return;
  window.fbq!("track", "Purchase", {
    value: data.value,
    currency: data.currency || "INR",
    content_ids: data.contentIds,
    content_type: "product",
    order_id: data.orderId,
  });
}
