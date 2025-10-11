import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api, { API_ROOT, MEDIA_URL } from "../utils/api";
import { useShop } from "../context/ShopContext";
import { 
  FiSearch, 
  FiUser, 
  FiShoppingCart, 
  FiMenu,
  FiX,
  FiChevronDown
} from "react-icons/fi";
import "../styles/Header.css";

const LOGO_IMG = "/logo.webp";

type Suggestion = {
  _id: string;
  name: string;
  sku?: string;
  images?: string[];
  price?: number;
};

type Category = {
  _id: string;
  name: string;
  subcategories?: Category[];
};

const IMAGE_BASE =
  (import.meta as any).env?.VITE_IMAGE_BASE_URL ||
  (import.meta as any).env?.VITE_MEDIA_URL ||
  MEDIA_URL ||
  "";

const getThumb = (p: Suggestion): string | null => {
  const f = p.images?.[0];
  if (!f) return null;
  if (/^https?:\/\//i.test(f)) return f;
  if (IMAGE_BASE) {
    const base = IMAGE_BASE.replace(/\/+$/, "");
    return `${base}/${f.replace(/^\/+/, "")}`;
  }
  if (f.includes("/uploads/")) {
    const root = API_ROOT.replace(/\/+$/, "");
    return `${root}${f.startsWith("/") ? "" : "/"}${f.replace(/^\/+/, "")}`;
  }
  return `${API_ROOT.replace(/\/+$/, "")}/uploads/${encodeURIComponent(f)}`;
};

const SearchForm = React.forwardRef(function SearchForm(
  props: {
    mobile?: boolean;
    q: string;
    setQ: React.Dispatch<React.SetStateAction<string>>;
    onSubmit: (e: React.FormEvent) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    openSug: boolean;
    setOpenSug: React.Dispatch<React.SetStateAction<boolean>>;
    loadingSug: boolean;
    sug: Suggestion[];
    activeIdx: number;
    setActiveIdx: React.Dispatch<React.SetStateAction<number>>;
    navigate: ReturnType<typeof useNavigate>;
  },
  ref: React.Ref<HTMLFormElement>
) {
  const {
    mobile,
    q,
    setQ,
    onSubmit,
    onKeyDown,
    openSug,
    setOpenSug,
    loadingSug,
    sug,
    activeIdx,
    setActiveIdx,
    navigate,
  } = props;

  return (
    <form
      className={`header-search ${mobile ? "header-search--mobile" : ""}`}
      onSubmit={onSubmit}
      role="search"
      ref={ref}
    >
      <div className="header-search__container">
        <FiSearch className="header-search__icon" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => sug.length > 0 && setOpenSug(true)}
          onKeyDown={onKeyDown}
          className="header-search__input"
          placeholder="Search products, SKUs..."
          aria-label="Search products"
        />
        <button className="header-search__button" type="submit">
          Search
        </button>
      </div>
      
      {openSug && (
        <div className="header-search__suggestions">
          {loadingSug && (
            <div className="header-search__loading">
              <div className="header-search__spinner"></div>
              Searching...
            </div>
          )}
          
          {!loadingSug && sug.length === 0 && q.trim() && (
            <div className="header-search__empty">
              No products found for "{q}"
            </div>
          )}
          
          {!loadingSug && sug.length > 0 && (
            <>
              <div className="header-search__suggestions-list">
                {sug.map((p, idx) => (
                  <div
                    key={p._id}
                    className={`header-search__suggestion-item ${
                      idx === activeIdx ? "header-search__suggestion-item--active" : ""
                    }`}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setOpenSug(false);
                      navigate(`/product/${p._id}`);
                    }}
                  >
                    <div className="header-search__suggestion-image">
                      {getThumb(p) ? (
                        <img
                          src={getThumb(p)!}
                          alt={p.name}
                          width="48"
                          height="48"
                          loading="lazy"
                        />
                      ) : (
                        <div className="header-search__suggestion-placeholder">
                          <FiShoppingCart />
                        </div>
                      )}
                    </div>
                    <div className="header-search__suggestion-content">
                      <div className="header-search__suggestion-name">
                        {p.name}
                      </div>
                      {p.sku && (
                        <div className="header-search__suggestion-sku">
                          SKU: {p.sku}
                        </div>
                      )}
                      {p.price && (
                        <div className="header-search__suggestion-price">
                          ₹{p.price}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                className="header-search__view-all"
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const query = q.trim();
                  setOpenSug(false);
                  navigate(
                    `/products${query ? `?search=${encodeURIComponent(query)}` : ""}`
                  );
                }}
              >
                View all results for "{q}"
              </button>
            </>
          )}
        </div>
      )}
    </form>
  );
});

SearchForm.displayName = "SearchForm";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems } = useShop();

  const cartCount = useMemo(() => {
    if (!Array.isArray(cartItems)) return 0;
    return cartItems.reduce((sum: number, it: any) => {
      const q = it?.quantity ?? it?.qty ?? 1;
      return sum + (Number.isFinite(q) ? q : 0);
    }, 0);
  }, [cartItems]);

  const [q, setQ] = useState("");
  const [sug, setSug] = useState<Suggestion[]>([]);
  const [loadingSug, setLoadingSug] = useState(false);
  const [openSug, setOpenSug] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  
  const deskRef = useRef<HTMLFormElement | null>(null);
  const mobRef = useRef<HTMLFormElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Parse user from localStorage
  const parseUser = (): any | null => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState<any | null>(() => parseUser());
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const onStorage = () => setUser(parseUser());
    window.addEventListener("storage", onStorage);
    window.addEventListener("user-changed", onStorage as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("user-changed", onStorage as EventListener);
    };
  }, []);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await api.get("/categories");
        if (res.status === 200) setCategories(res.data || []);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    }
    fetchCategories();
  }, []);

  // Search suggestions
  useEffect(() => {
    let t: any;
    let alive = true;

    const run = async () => {
      const needle = q.trim();
      if (needle.length < 2) {
        if (alive) {
          setSug([]);
          setOpenSug(false);
          setActiveIdx(-1);
        }
        return;
      }

      setLoadingSug(true);
      try {
        const res = await api.get("/products", {
          params: { search: needle, limit: 50 },
        });

        if (!alive) return;
        const arr: Suggestion[] = Array.isArray(res.data)
          ? res.data
          : Array.isArray((res.data as any)?.products)
          ? (res.data as any).products
          : [];

        const n = needle.toLowerCase();
        const filtered = arr.filter(
          (p) =>
            (p.name || "").toLowerCase().includes(n) ||
            (p.sku || "").toLowerCase().includes(n)
        );

        setSug(filtered.slice(0, 8));
        setOpenSug(true);
        setActiveIdx(-1);
      } catch {
        if (alive) {
          setSug([]);
          setOpenSug(true);
          setActiveIdx(-1);
        }
      } finally {
        if (alive) setLoadingSug(false);
      }
    };

    t = setTimeout(run, 200);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideDesk = deskRef.current?.contains(target);
      const insideMob = mobRef.current?.contains(target);
      if (insideDesk || insideMob) return;
      setOpenSug(false);
      setActiveIdx(-1);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    setOpenSug(false);
    navigate(`/products${query ? `?search=${encodeURIComponent(query)}` : ""}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!openSug || (!sug.length && !loadingSug)) return;
    
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIdx((i) => (i + 1 >= sug.length ? 0 : i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIdx((i) => (i - 1 < 0 ? sug.length - 1 : i - 1));
        break;
      case "Enter":
        if (activeIdx >= 0 && sug[activeIdx]) {
          setOpenSug(false);
          navigate(`/product/${sug[activeIdx]._id}`);
        } else {
          setOpenSug(false);
          const query = (e.currentTarget as HTMLInputElement).value.trim() || q.trim();
          navigate(`/products${query ? `?search=${encodeURIComponent(query)}` : ""}`);
        }
        break;
      case "Escape":
        setOpenSug(false);
        setActiveIdx(-1);
        break;
    }
  };

  const params = new URLSearchParams(location.search);
  const activeCategory = params.get("category");

  const formatName = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <header className="header">
      {/* Top Bar */}
      <div className="header__top-bar">
        <div className="header__container">
          <div className="header__logo-section">
            <button 
              className="header__menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>
            
            <Link to="/" className="header__logo">
              <img
                src={LOGO_IMG}
                alt="Bafna Toys"
                className="header__logo-image"
                width="160"
                height="45"
              />
              <span className="header__logo-text">Bafna Toys</span>
            </Link>
          </div>

          {/* Desktop Search */}
          <div className="header__search-section">
            <SearchForm
              ref={deskRef}
              q={q}
              setQ={setQ}
              onSubmit={onSubmit}
              onKeyDown={onKeyDown}
              openSug={openSug}
              setOpenSug={setOpenSug}
              loadingSug={loadingSug}
              sug={sug}
              activeIdx={activeIdx}
              setActiveIdx={setActiveIdx}
              navigate={navigate}
            />
          </div>

          {/* Desktop Actions */}
          <div className="header__actions">
            {user ? (
              <div className="header__account">
                <button
                  className="header__account-button"
                  onClick={() => navigate("/my-account")}
                >
                  <FiUser className="header__account-icon" />
                  <span className="header__account-text">Account</span>
                </button>
              </div>
            ) : (
              <Link className="header__login" to="/login">
                <FiUser />
                <span>Login</span>
              </Link>
            )}

            <Link className="header__cart" to="/cart">
              <div className="header__cart-icon-wrapper">
                <FiShoppingCart className="header__cart-icon" />
                {cartCount > 0 && (
                  <span className="header__cart-badge">{cartCount}</span>
                )}
              </div>
              <span className="header__cart-text">Cart</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="header__mobile-search">
        <SearchForm
          ref={mobRef}
          mobile
          q={q}
          setQ={setQ}
          onSubmit={onSubmit}
          onKeyDown={onKeyDown}
          openSug={openSug}
          setOpenSug={setOpenSug}
          loadingSug={loadingSug}
          sug={sug}
          activeIdx={activeIdx}
          setActiveIdx={setActiveIdx}
          navigate={navigate}
        />
      </div>

      {/* Navigation */}
      <nav className="header__navigation">
        <div className="header__container">
          <div className="header__categories">
            <button
              className="header__categories-toggle"
              onClick={() => setCategoriesOpen(!categoriesOpen)}
            >
              <span>All Categories</span>
              <FiChevronDown className={`header__categories-arrow ${categoriesOpen ? 'header__categories-arrow--open' : ''}`} />
            </button>

            <div className="header__nav-links">
              <Link to="/products" className="header__nav-link">
                All Products
              </Link>
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category._id}
                  to={`/products?category=${encodeURIComponent(category._id)}`}
                  className={`header__nav-link ${
                    activeCategory === category._id ? "header__nav-link--active" : ""
                  }`}
                >
                  {formatName(category.name)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="header__mobile-menu" ref={mobileMenuRef}>
          <div className="header__mobile-menu-content">
            <div className="header__mobile-menu-section">
              <h3>Categories</h3>
              <Link 
                to="/products" 
                className="header__mobile-menu-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                All Products
              </Link>
              {categories.map((category) => (
                <Link
                  key={category._id}
                  to={`/products?category=${encodeURIComponent(category._id)}`}
                  className={`header__mobile-menu-link ${
                    activeCategory === category._id ? "header__mobile-menu-link--active" : ""
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {formatName(category.name)}
                </Link>
              ))}
            </div>

            <div className="header__mobile-menu-section">
              <h3>Account</h3>
              {user ? (
                <Link 
                  to="/my-account" 
                  className="header__mobile-menu-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Account
                </Link>
              ) : (
                <Link 
                  to="/login" 
                  className="header__mobile-menu-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
              <Link 
                to="/cart" 
                className="header__mobile-menu-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cart ({cartCount})
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;