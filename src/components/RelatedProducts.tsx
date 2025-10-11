import React from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "./ProductCard";
import "../styles/RelatedProducts.css";

interface Product {
  _id: string;
  name: string;
  slug?: string;
  sku?: string;
  images?: string[];
  price: number;
  innerQty?: number;
  bulkPricing: { inner: number; qty: number; price: number }[];
  category?: { _id: string; name: string } | string;
  taxFields?: string[];
}

interface RelatedProductsProps {
  related: Product[];
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({ related }) => {
  const navigate = useNavigate();

  if (!related || related.length === 0) return null;

  return (
    <div className="related-products-wrapper">
      <h2 className="related-products-title">🧸 Related Products</h2>

      <div className="related-products-scroll">
        {related.map((prod, i) => (
          <div key={prod._id} className="related-product-card">
            <ProductCard product={prod} userRole="customer" index={i} />
          </div>
        ))}
      </div>

      <div className="view-all-wrapper">
        <button
          className="view-all-btn"
          onClick={() =>
            navigate(
              prod.category && typeof prod.category !== "string"
                ? `/category/${prod.category._id}`
                : "/products"
            )
          }
        >
          View All →
        </button>
      </div>
    </div>
  );
};

export default RelatedProducts;
