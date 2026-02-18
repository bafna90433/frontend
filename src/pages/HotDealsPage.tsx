import React, { useEffect, useMemo, useState } from "react";
import api from "../utils/api";
import ProductCard from "../components/ProductCard";
import "../styles/HotDealsPage.css";

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

  try {
    const r = await api.post("/products/by-ids", { ids });
    const list = Array.isArray(r.data) ? r.data : r.data?.products;
    return Array.isArray(list) ? list : [];
  } catch (e) {}

  try {
    const r = await api.post("/products/ids", { ids });
    const list = Array.isArray(r.data) ? r.data : r.data?.products;
    return Array.isArray(list) ? list : [];
  } catch (e) {}

  try {
    const r = await api.get(`/products?ids=${encodeURIComponent(ids.join(","))}`);
    const list = Array.isArray(r.data) ? r.data : r.data?.products;
    return Array.isArray(list) ? list : [];
  } catch (e) {}

  return [];
}

const HotDealsPage: React.FC = () => {
  const [rawItems, setRawItems] = useState<HotDealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Deals Of The Day");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/home-config");

        setTitle(data?.hotDealsTitle || "Deals Of The Day");

        const resolved = Array.isArray(data?.hotDealsItemsResolved)
          ? data.hotDealsItemsResolved
          : [];

        // Case A: resolved already has product
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

        // Case B: only config items (no product)
        const cfgItems = Array.isArray(data?.hotDealsItems) ? data.hotDealsItems : [];
        const ids = cfgItems.map((x: any) => x.productId).filter(Boolean);

        const products = await fetchProductsByIds(ids);

        const joined: HotDealItem[] = cfgItems.map((it: any) => {
          const p = products.find((x) => x._id === it.productId) || null;
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
        setLoading(false);
      }
    };

    fetchData();
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

  if (loading) return <div className="hd-loading">Loading Hot Deals...</div>;

  return (
    <div className="hd-page">
      <div className="hd-pageInner">
        <div className="hd-pageHead">
          <h1 className="hd-pageTitle">🔥 {title}</h1>
          <p className="hd-pageSub">Hurry up! These offers end soon.</p>
        </div>

        {items.length > 0 ? (
          <div className="hd-pageGrid">
            {items.map((item) => (
              <div className="hd-cardWrap" key={item.productId}>
                <ProductCard product={item.product as any} />
              </div>
            ))}
          </div>
        ) : (
          <div className="hd-empty">No active deals right now.</div>
        )}
      </div>
    </div>
  );
};

export default HotDealsPage;
