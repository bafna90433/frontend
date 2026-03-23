import React, { useEffect, useMemo, useState } from "react";
import api from "../utils/api";
import ProductCard from "../components/ProductCard";
import "../styles/HotDealsPage.css";
// 👇 Floating Button Import yahan add kiya hai
import FloatingCheckoutButton from "../components/FloatingCheckoutButton"; 

type DealType = "PERCENT" | "FLAT" | "NONE";

type Product = {
  _id: string;
  name: string;
  price: number;
  mrp?: number;
  images?: string[];
  slug?: string;
  stock?: number;
  sale_end_time?: string;
  hotDealValue?: number;
  hotDealType?: DealType;
};

type HotDealItem = {
  productId: string;
  endsAt: string | null;
  discountType: DealType;
  discountValue: number;
  product?: Product | null;
};

async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];

  // Try all endpoints simultaneously but take the first successful one to speed up
  try {
     const promises = [
        api.post("/products/by-ids", { ids }).catch(() => null),
        api.post("/products/ids", { ids }).catch(() => null),
        api.get(`/products?ids=${encodeURIComponent(ids.join(","))}`).catch(() => null)
     ];

     const results = await Promise.all(promises);
     
     for (const r of results) {
        if (r && r.data) {
            const list = Array.isArray(r.data) ? r.data : r.data.products;
            if (Array.isArray(list)) return list;
        }
     }
  } catch (err) {
      console.error("Failed to fetch products by IDs", err);
  }

  return [];
}

const HotDealsPage: React.FC = () => {
  const [rawItems, setRawItems] = useState<HotDealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Deals Of The Day");

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        const { data } = await api.get("/home-config");
        if (!isMounted) return;

        setTitle(data?.hotDealsTitle || "Deals Of The Day");

        const resolved = Array.isArray(data?.hotDealsItemsResolved)
          ? data.hotDealsItemsResolved
          : [];

        if (resolved.length) {
          const valid = resolved
            .filter((it: any) => it?.product?._id)
            .map((it: any) => ({
              productId: it.productId || it.product?._id,
              endsAt: it.endsAt ?? null,
              discountType: it.discountType ?? "NONE",
              discountValue: Number(it.discountValue ?? 0),
              product: it.product,
            })) as HotDealItem[];

          setRawItems(valid);
          return;
        }

        const cfgItems = Array.isArray(data?.hotDealsItems) ? data.hotDealsItems : [];
        const ids = cfgItems.map((x: any) => x.productId).filter(Boolean);

        const products = await fetchProductsByIds(ids);
        if (!isMounted) return;

        // Use a Map for O(1) lookups instead of O(N^2) Array.find
        const productMap = new Map(products.map(p => [p._id, p]));

        const joined: HotDealItem[] = cfgItems.map((it: any) => {
          const p = productMap.get(it.productId) || null;
          return {
            productId: it.productId,
            endsAt: it.endsAt ?? null,
            discountType: it.discountType ?? "NONE",
            discountValue: Number(it.discountValue ?? 0),
            product: p,
          };
        });

        setRawItems(joined.filter((x) => x.product));
      } catch (err) {
        console.error("Error fetching deals:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
        isMounted = false;
    };
  }, []);

  const items = useMemo(() => {
    return rawItems
      .map((it) => {
        if (!it.product) return null;

        const cloned: Product = {
          ...it.product,
          sale_end_time: it.endsAt || undefined,
          hotDealType: it.discountType,
          hotDealValue: it.discountValue,
        };

        return { ...it, product: cloned };
      })
      .filter(Boolean) as HotDealItem[];
  }, [rawItems]);

  return (
    <div className="hd-page">
      <div className="hd-pageInner">
        <section className="hd-hero">
          <div className="hd-heroBadge">Limited Time Offers</div>
          <h1 className="hd-pageTitle">🔥 {title}</h1>
          <p className="hd-pageSub">
            Grab the best deals before they’re gone. Fresh offers, limited stock, fast checkout.
          </p>
        </section>

        {loading ? (
          <div className="hd-pageGrid">
            {/* 👇 10 ki jagah 12 skeleton load kiye taaki 2 full rows dikhein */}
            {Array.from({ length: 12 }).map((_, idx) => (
              <div key={idx} className="hd-skeleton-card">
                <div className="hd-skeleton-image shimmer" />
                <div className="hd-skeleton-line shimmer" />
                <div className="hd-skeleton-line short shimmer" />
                <div className="hd-skeleton-btn shimmer" />
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="hd-pageGrid">
            {items.map((item, index) => (
              <div className="hd-cardWrap" key={item.productId}>
                <ProductCard product={item.product as any} index={index} />
              </div>
            ))}
          </div>
        ) : (
          <div className="hd-empty">
            <div className="hd-emptyIcon">🎁</div>
            <h3>No active deals right now</h3>
            <p>New hot deals will appear here soon. Please check back later.</p>
          </div>
        )}
      </div>

      {/* 👇 Button Yahan Render hoga */}
      <FloatingCheckoutButton />
    </div>
  );
};

export default HotDealsPage;