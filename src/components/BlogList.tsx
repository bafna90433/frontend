import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import axios from "axios";
import { API_URL, MEDIA_URL } from "../utils/api";
import { Calendar, User, ChevronRight } from "lucide-react";

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  author: string;
  createdAt: string;
  metaTitle?: string;
  metaDescription?: string;
}

const BlogList: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/blogs`);
        setBlogs(data);
      } catch (err) {
        console.error("Failed to fetch blogs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const getImageUrl = (path?: string) => {
    if (!path) return "/logo.webp";
    if (path.startsWith("http")) return path;
    return `${MEDIA_URL}/uploads/${path}`;
  };

  return (
    <div className="container" style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
      <Helmet>
        <title>Bafna Toys Blog - News, Updates & Toy Industry Insights</title>
        <meta name="description" content="Read the latest news, updates, and toy industry insights from Bafna Toys. Tips for wholesalers, retailers, and distributors." />
      </Helmet>

      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "36px", fontWeight: "bold", color: "#1e293b", marginBottom: "15px" }}>Our Blog</h1>
        <p style={{ fontSize: "16px", color: "#64748b", maxWidth: "600px", margin: "0 auto" }}>
          Stay up to date with the latest toy trends, wholesale business tips, and company news.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "50px 0" }}>Loading blogs...</div>
      ) : blogs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "#64748b" }}>No blog posts available right now.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "30px" }}>
          {blogs.map((blog) => (
            <Link to={`/blog/${blog.slug}`} key={blog._id} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", transition: "transform 0.2s" }}>
              
              <div style={{ height: "200px", overflow: "hidden" }}>
                <img 
                  src={getImageUrl(blog.coverImage)} 
                  alt={blog.title} 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  loading="lazy"
                />
              </div>

              <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
                <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#0f172a", marginBottom: "10px", lineHeight: "1.4" }}>
                  {blog.title}
                </h3>
                
                <div style={{ display: "flex", alignItems: "center", gap: "15px", fontSize: "13px", color: "#64748b", marginBottom: "15px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Calendar size={14} /> {new Date(blog.createdAt).toLocaleDateString()}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><User size={14} /> {blog.author}</span>
                </div>

                <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6", marginBottom: "20px", flex: 1 }}>
                  {blog.excerpt || (blog.metaDescription || "").substring(0, 100) + "..."}
                </p>

                <div style={{ display: "flex", alignItems: "center", color: "#3b82f6", fontWeight: "500", fontSize: "14px", marginTop: "auto" }}>
                  Read Article <ChevronRight size={16} />
                </div>
              </div>

            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogList;
