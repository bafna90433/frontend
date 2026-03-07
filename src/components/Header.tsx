// src/components/Header.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api, { API_ROOT, MEDIA_URL } from "../utils/api";
import { useShop } from "../context/ShopContext";
import { useTheme } from "../context/ThemeContext";
import "../styles/Header.css";

const LOGO_IMG = "/logo.webp";

type Suggestion = {
  _id: string;
  name: string;
  type: "category" | "brand" | "product";
  sku?: string;
  images?: string[];
  price?: number;
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

const SearchForm = React.memo(React.forwardRef(function SearchForm(
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
    recentSearches: string[];
    popularSearches: { _id: string; name: string }[];
    handleQuickSearch: (term: string) => void;
    placeholderText: string;
  },
  ref: React.Ref<HTMLFormElement>
) {
  const {
    mobile, q, setQ, onSubmit, onKeyDown, openSug, setOpenSug,
    loadingSug, sug, activeIdx, setActiveIdx, navigate,
    recentSearches, popularSearches, handleQuickSearch, placeholderText
  } = props;

  const isQueryEmpty = q.trim().length < 2;

  return (
    <form
      className={`modern-search ${mobile ? "is-mobile" : ""} ${openSug ? "is-suggestions-open" : ""}`}
      onSubmit={onSubmit}
      role="search"
      ref={ref}
    >
      <div className="modern-search__wrapper">
        <svg className="modern-search__icon-left" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5 1.49-1.49-5-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpenSug(true)} 
          onKeyDown={onKeyDown}
          className="modern-search__input"
          placeholder={placeholderText}
          aria-label="Search"
        />
        
        {/* 🌟 CLOSE (X) ICON FOR MOBILE WHEN OPEN 🌟 */}
        {mobile && openSug && (
          <button 
            type="button" 
            className="modern-search__close-mob"
            onClick={() => setOpenSug(false)}
            aria-label="Close search"
          >
            ✕
          </button>
        )}

        {q.length > 0 && !mobile && (
          <button
            type="button"
            onClick={() => { setQ(""); setOpenSug(true); }}
            className="modern-search__clear-btn"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
        <button className="modern-search__btn" type="submit" aria-label="Search">
          {mobile ? "Go" : "Search"}
        </button>
      </div>

      {openSug && (
        <div className="modern-suggest">
          {isQueryEmpty ? (
            <div className="modern-suggest__empty-state">
              {recentSearches.length > 0 && (
                <div className="modern-suggest__section">
                  <div className="modern-suggest__section-title">Recent Searches</div>
                  <ul className="modern-suggest__recent-list">
                    {recentSearches.map((term, i) => (
                      <li key={i} className="modern-suggest__recent-item" onClick={() => handleQuickSearch(term)}>
                        <svg className="modern-suggest__history-icon" viewBox="0 0 24 24">
                          <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.25 2.52.75-1.23-3.5-2.07V8h-1.5z"/>
                        </svg>
                        {term}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {popularSearches.length > 0 && (
                <div className="modern-suggest__section">
                  <div className="modern-suggest__section-title">Popular Searches</div>
                  <div className="modern-suggest__popular-tags">
                    {popularSearches.map((cat) => (
                      <button 
                        type="button" 
                        key={cat._id} 
                        className="modern-suggest__popular-pill" 
                        onClick={() => {
                          setOpenSug(false);
                          setQ("");
                          navigate(`/products?category=${cat._id}`);
                        }}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {loadingSug && (
                <div className="modern-suggest__loading">
                  <div className="modern-spinner"></div> Looking for toys...
                </div>
              )}

              {!loadingSug && sug.length === 0 && (
                <div className="modern-suggest__empty">😕 No results found.</div>
              )}

              {!loadingSug && sug.length > 0 && (
                <ul className="modern-suggest__list" role="listbox">
                  {sug.map((p, idx) => {
                    const isFirstOfType = idx === 0 || sug[idx - 1].type !== p.type;
                    return (
                      <React.Fragment key={`${p.type}-${p._id}`}>
                        {isFirstOfType && (
                          <div className="modern-suggest__group-title">
                            {p.type === "category" ? "📁 Categories" : p.type === "brand" ? "🏷️ Brands" : "🧸 Products"}
                          </div>
                        )}
                        <li
                          className={`modern-suggest__item ${idx === activeIdx ? "is-active" : ""}`}
                          onMouseEnter={() => setActiveIdx(idx)}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setOpenSug(false);
                            if (p.type === "category") navigate(`/category/${p._id}`);
                            else if (p.type === "brand") navigate(`/brand/${p._id}`);
                            else navigate(`/product/${p._id}`);
                          }}
                        >
                          {p.type === "product" && getThumb(p) ? (
                            <img src={getThumb(p)!} alt="" className="modern-suggest__thumb" loading="lazy" width={48} height={48} />
                          ) : (
                            <div className="modern-suggest__thumb modern-suggest__thumb--ph">
                              {p.type === "category" ? "📁" : p.type === "brand" ? "🏷️" : "🧸"}
                            </div>
                          )}
                          <div className="modern-suggest__meta">
                            <div className="modern-suggest__name">{p.name}</div>
                            {p.sku && p.type === "product" && <div className="modern-suggest__sku">#{p.sku}</div>}
                          </div>
                          {p.price && p.type === "product" ? <div className="modern-suggest__price">₹{p.price}</div> : null}
                        </li>
                      </React.Fragment>
                    );
                  })}
                </ul>
              )}

              {sug.length > 0 && (
                <button
                  className="modern-suggest__more"
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleQuickSearch(q)}
                >
                  See all results
                </button>
              )}
            </>
          )}
        </div>
      )}
    </form>
  );
}));

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems } = useShop();
  const { theme, toggleTheme } = useTheme();

  const cartCount = useMemo(() => {
    if (!Array.isArray(cartItems)) return 0;
    return cartItems.reduce((sum: number, it: any) => sum + (Number.isFinite(it?.qty || it?.quantity) ? (it?.qty || it?.quantity) : 1), 0);
  }, [cartItems]);

  const [q, setQ] = useState("");
  const [sug, setSug] = useState<Suggestion[]>([]);
  const [loadingSug, setLoadingSug] = useState(false);
  const [openSug, setOpenSug] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<{ _id: string; name: string }[]>([]);
  
  const deskRef = useRef<HTMLFormElement | null>(null);
  const mobRef = useRef<HTMLFormElement | null>(null);

  // Animation States
  const [placeholderText, setPlaceholderText] = useState("");
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIdx, setCharIdx] = useState(0);

  // Typewriter Effect
  useEffect(() => {
    const words = popularSearches.length > 0 
      ? popularSearches.map(cat => `Try "${cat.name}"...`) 
      : ["Try Saree...", "Try Kurti...", "Search toys..."];

    const currentFullWord = words[currentWordIdx % words.length];
    const typingSpeed = isDeleting ? 50 : 100;

    const timeout = setTimeout(() => {
      if (!isDeleting && charIdx < currentFullWord.length) {
        setPlaceholderText(currentFullWord.substring(0, charIdx + 1));
        setCharIdx(prev => prev + 1);
      } else if (isDeleting && charIdx > 0) {
        setPlaceholderText(currentFullWord.substring(0, charIdx - 1));
        setCharIdx(prev => prev - 1);
      } else if (!isDeleting && charIdx === currentFullWord.length) {
        setTimeout(() => setIsDeleting(true), 1500);
      } else if (isDeleting && charIdx === 0) {
        setIsDeleting(false);
        setCurrentWordIdx(prev => prev + 1);
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [charIdx, isDeleting, currentWordIdx, popularSearches]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bafna_recent_searches");
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch (error) { console.error(error); }
  }, []);

  useEffect(() => {
    const fetchPopularData = async () => {
      try {
        const res = await api.get("/categories"); 
        if (Array.isArray(res.data)) {
          const catData = res.data.slice(0, 8).map((c: any) => ({ _id: c._id, name: c.name }));
          setPopularSearches(catData);
        }
      } catch (error) { console.error(error); }
    };
    fetchPopularData();
  }, []);

  const saveSearchTerm = useCallback((term: string) => {
    const cleanTerm = term.trim();
    if (!cleanTerm) return;
    setRecentSearches(prev => {
      const updated = [cleanTerm, ...prev.filter(t => t.toLowerCase() !== cleanTerm.toLowerCase())].slice(0, 5);
      localStorage.setItem("bafna_recent_searches", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleQuickSearch = useCallback((term: string) => {
    setQ(term);
    saveSearchTerm(term);
    setOpenSug(false);
    navigate(`/products?search=${encodeURIComponent(term)}`);
  }, [navigate, saveSearchTerm]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQ(params.get("search") || params.get("q") || "");
  }, [location.search]);

  useEffect(() => {
    let t: any;
    let alive = true;
    const run = async () => {
      const needle = q.trim();
      if (needle.length < 2) {
        if (alive) { setSug([]); setActiveIdx(-1); }
        return;
      }
      setLoadingSug(true);
      try {
        const res = await api.get("/products", { params: { search: needle, limit: 10 } });
        if (!alive) return;
        const backendData = res.data || {};
        const combinedArr: Suggestion[] = [];
        if (Array.isArray(backendData.categories)) backendData.categories.forEach((c: any) => combinedArr.push({ ...c, type: "category" }));
        if (Array.isArray(backendData.brands)) backendData.brands.forEach((b: any) => combinedArr.push({ ...b, type: "brand" }));
        const productsRaw = Array.isArray(backendData) ? backendData : Array.isArray(backendData.products) ? backendData.products : [];
        productsRaw.forEach((p: any) => combinedArr.push({ ...p, type: "product" }));
        const n = needle.toLowerCase();
        const filtered = combinedArr.filter(p => (p.name || "").toLowerCase().includes(n) || (p.sku || "").toLowerCase().includes(n));
        setSug(filtered.slice(0, 8));
        setActiveIdx(-1);
      } catch {
        if (alive) { setSug([]); setActiveIdx(-1); }
      } finally { if (alive) setLoadingSug(false); }
    };
    t = setTimeout(run, 200);
    return () => { alive = false; clearTimeout(t); };
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (deskRef.current?.contains(target) || mobRef.current?.contains(target)) return;
      setOpenSug(false);
      setActiveIdx(-1);
    };
    document.addEventListener("mousedown", onDoc, { passive: true });
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const onSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (query) saveSearchTerm(query);
    setOpenSug(false);
    navigate(`/products${query ? `?search=${encodeURIComponent(query)}` : ""}`);
  }, [q, navigate, saveSearchTerm]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!openSug) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => (i + 1 >= sug.length ? 0 : i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => (i - 1 < 0 ? sug.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (activeIdx >= 0 && sug[activeIdx]) {
        e.preventDefault();
        setOpenSug(false);
        const p = sug[activeIdx];
        if (p.type === "category") navigate(`/category/${p._id}`);
        else if (p.type === "brand") navigate(`/brand/${p._id}`);
        else navigate(`/product/${p._id}`);
      } else {
        setOpenSug(false);
        const query = (e.currentTarget as HTMLInputElement).value.trim() || q.trim();
        if (query) saveSearchTerm(query);
        navigate(`/products${query ? `?search=${encodeURIComponent(query)}` : ""}`);
      }
    } else if (e.key === "Escape") {
      setOpenSug(false);
      setActiveIdx(-1);
    }
  }, [openSug, sug, activeIdx, navigate, q, saveSearchTerm]);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let ticking = false;
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (Math.abs(currentScrollY - lastScrollY) < 5) return;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(currentScrollY > 20);
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [user, setUser] = useState<any | null>(null);
  useEffect(() => {
    const parseUser = () => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } };
    setUser(parseUser());
  }, []);

  return (
    <header className={`modern-header ${scrolled ? "modern-header--scrolled" : ""}`}>
      <a href="https://www.instagram.com/bafna_toys/" target="_blank" rel="noopener noreferrer" className="modern-top-banner">
        <div className="modern-top-banner__inner">
          <svg className="modern-top-banner__icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
          <span className="modern-top-banner__text">See our adorable toys in action! 🎥 Watch reels on Instagram! ✨</span>
          <span className="modern-top-banner__btn">Watch Now</span>
        </div>
      </a>

      <div className="modern-header__main">
        <div className="modern-header__container bk-header-container">
          <Link to="/" className="modern-logo" aria-label="Home">
            <img src={LOGO_IMG} alt="BAFNA TOYS" className="modern-logo__img" width={188} height={45} loading="eager" />
          </Link>

          <div className="modern-search__desktop-wrapper">
            <SearchForm
              ref={deskRef} q={q} setQ={setQ} onSubmit={onSubmit} onKeyDown={onKeyDown}
              openSug={openSug} setOpenSug={setOpenSug} loadingSug={loadingSug} sug={sug}
              activeIdx={activeIdx} setActiveIdx={setActiveIdx} navigate={navigate}
              recentSearches={recentSearches} popularSearches={popularSearches} handleQuickSearch={handleQuickSearch}
              placeholderText={placeholderText}
            />
          </div>

          <nav className="modern-actions">
            <button className="modern-action-btn modern-theme-btn" onClick={toggleTheme}>{theme === "light" ? "🌙" : "☀️"}</button>
            {user ? (
              <button className="modern-action-btn" onClick={() => navigate("/my-account")}>
                <span className="modern-ico">👤</span> <span className="modern-btn-text">Account</span>
              </button>
            ) : (
              <Link className="modern-action-btn" to="/login"><span className="modern-ico">🔑</span> <span className="modern-btn-text">Login</span></Link>
            )}
            {user && <Link className="modern-action-btn mobile-hide" to="/orders"><span className="modern-ico">📦</span> <span className="modern-btn-text">Orders</span></Link>}
            <Link className="modern-cart-btn" to="/cart">
              <span className="modern-cart-ico">🛒</span> <span className="modern-cart-text">Cart</span>
              {cartCount > 0 && <span className="modern-cart-badge">{cartCount}</span>}
            </Link>
          </nav>
        </div>
      </div>

      <div className="modern-search--mobile">
        <SearchForm
          ref={mobRef} mobile q={q} setQ={setQ} onSubmit={onSubmit} onKeyDown={onKeyDown}
          openSug={openSug} setOpenSug={setOpenSug} loadingSug={loadingSug} sug={sug}
          activeIdx={activeIdx} setActiveIdx={setActiveIdx} navigate={navigate}
          recentSearches={recentSearches} popularSearches={popularSearches} handleQuickSearch={handleQuickSearch}
          placeholderText={placeholderText}
        />
      </div>
    </header>
  );
};

export default Header;