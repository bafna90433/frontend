// src/components/Home.tsx
import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import ProductCard from './ProductCard';
import '../styles/Home.css';
import { Skeleton } from '@mui/material';
import ErrorMessage from './ErrorMessage';
import { Link } from 'react-router-dom';

interface Category { _id: string; name: string; }
interface Product {
  _id: string;
  name: string;
  image: string;
  price: number;
  category: { _id: string; name: string };
  bulkPricing: { inner: number; qty: number; price: number }[];
  innerQty: number;
  images?: string[];
}

const Home: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [catRes, prodRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products'),
        ]);

        if (catRes.status === 200 && prodRes.status === 200) {
          setCategories(catRes.data);
          setProducts(prodRes.data);
        } else {
          throw new Error('Failed to fetch data');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="home-container">
      {loading ? (
        Array(3).fill(0).map((_, i) => (
          <div key={i} className="category-block">
            <Skeleton variant="text" width={200} height={40} />
            <div className="product-scroll">
              {Array(4).fill(0).map((_, j) => (
                <Skeleton key={j} variant="rectangular" width={240} height={320} sx={{ marginRight: '1rem' }} />
              ))}
            </div>
          </div>
        ))
      ) : (
        categories.map(cat => (
          <div key={cat._id} className="category-block">
            <h2 className="category-title">{cat.name}</h2>
            <div className="product-scroll">
              {products
                .filter(p => p.category._id === cat._id)
                .map(product => (
                  <Link to={`/product/${product._id}`} key={product._id} style={{ textDecoration: 'none' }}>
                    <ProductCard product={product} />
                  </Link>
                ))}
              {products.filter(p => p.category._id === cat._id).length === 0 && (
                <div className="empty-category-message">No products in this category</div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Home;