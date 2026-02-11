import React, { useEffect, useState } from "react";
import api from "../utils/api";
import ProductCard from "../components/ProductCard";
import "../styles/HotDealsPage.css";

type Product = {
  _id: string;
  name: string;
  price: number;
  mrp?: number;
  images?: string[];
  slug?: string;
  stock?: number;
  sale_end_time?: string;
};

type HotDealItem = {
  productId: string;
  endsAt: string | null;
  discountType: "PERCENT" | "FLAT" | "NONE";
  discountValue: number;
  product?: Product | null;
};

const HotDealsPage: React.FC = () => {
  const [items, setItems] = useState<HotDealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Deals Of The Day");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/home-config");

        if (data) {
          setTitle(data.hotDealsTitle || "Deals Of The Day");
          const validItems = (data.hotDealsItemsResolved || []).filter(
            (it: any) => it.product
          );
          setItems(validItems);
        }
      } catch (err) {
        console.error("Error fetching deals:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="hd-loading">Loading Hot Deals...</div>;

  return (
    <div className="hd-page">
      <div className="hd-pageInner">
        {/* Header */}
        <div className="hd-pageHead">
          <h1 className="hd-pageTitle">🔥 {title}</h1>
          <p className="hd-pageSub">Hurry up! These offers end soon.</p>
        </div>

        {/* Grid */}
        {items.length > 0 ? (
          <div className="hd-grid">
            {items.map((item) => {
              if (!item.product) return null;
              return (
                <div className="hd-cardWrap" key={item.productId}>
                  <ProductCard product={item.product} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="hd-empty">No active deals right now.</div>
        )}
      </div>
    </div>
  );
};

export default HotDealsPage;
