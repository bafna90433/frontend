import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import axios from "axios";
import { API_URL, MEDIA_URL } from "../utils/api";
import { Calendar, User, ArrowLeft, Tag } from "lucide-react";

interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  coverImage?: string;
  author: string;
  tags?: string[];
  createdAt: string;
  metaTitle?: string;
  metaDescription?: string;
}

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/blogs/${slug}`);
        setBlog(data);
      } catch (err) {
        console.error("Failed to fetch blog post", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [slug]);

  const getImageUrl = (path?: string) => {
    if (!path) return "/logo.webp";
    if (path.startsWith("http")) return path;
    return `${MEDIA_URL}/uploads/${path}`;
  };

  if (loading) return <div style={{ textAlign: "center", padding: "100px 0" }}>Loading...</div>;
  if (error || !blog) return (
    <div style={{ textAlign: "center", padding: "100px 20px" }}>
      <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>Blog Post Not Found</h2>
      <Link to="/blogs" style={{ color: "#3b82f6", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "5px" }}>
        <ArrowLeft size={16} /> Back to Blogs
      </Link>
    </div>
  );

  return (
    <article className="container" style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto" }}>
      <Helmet>
        <title>{blog.metaTitle || `${blog.title} | Bafna Toys Blog`}</title>
        <meta name="description" content={blog.metaDescription || "Read our latest blog post."} />
        {blog.coverImage && <meta property="og:image" content={getImageUrl(blog.coverImage)} />}
      </Helmet>

      <Link to="/blogs" style={{ color: "#64748b", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "5px", marginBottom: "30px", fontSize: "14px", fontWeight: "500" }}>
        <ArrowLeft size={16} /> Back to all posts
      </Link>

      <h1 style={{ fontSize: "32px", md: { fontSize: "40px" }, fontWeight: "bold", color: "#0f172a", marginBottom: "20px", lineHeight: "1.3" }}>
        {blog.title}
      </h1>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "20px", fontSize: "14px", color: "#64748b", marginBottom: "30px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><User size={16} /> By {blog.author}</span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Calendar size={16} /> {new Date(blog.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>

      {blog.coverImage && (
        <div style={{ width: "100%", borderRadius: "12px", overflow: "hidden", marginBottom: "40px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
          <img 
            src={getImageUrl(blog.coverImage)} 
            alt={blog.title} 
            style={{ width: "100%", height: "auto", maxHeight: "500px", objectFit: "cover" }} 
          />
        </div>
      )}

      {/* Blog Content */}
      <div 
        className="blog-content" 
        style={{ fontSize: "16px", lineHeight: "1.8", color: "#334155", display: "flex", flexDirection: "column", gap: "20px" }}
        dangerouslySetInnerHTML={{ __html: blog.content }} 
      />

      {/* Tags */}
      {blog.tags && blog.tags.length > 0 && (
        <div style={{ marginTop: "50px", paddingTop: "30px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <Tag size={16} color="#64748b" />
          {blog.tags.map(tag => (
            <span key={tag} style={{ background: "#f1f5f9", padding: "4px 12px", borderRadius: "20px", fontSize: "13px", color: "#475569" }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
};

export default BlogPost;
