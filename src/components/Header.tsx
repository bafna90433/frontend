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

const highlightText = (text: string, query: string) => {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return (
    <span>
      {parts.map((part, i) => (
        <span
          key={i}
          className={
            part.toLowerCase() === query.toLowerCase() ? "hdr-highlight" : ""
          }
        >
          {part}
        </span>
      ))}
    </span>
  );
};

const SuggestionSkeleton = () => (
  <div className="hdr-sug-skeleton">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="hdr-skel-row">
        <div className="hdr-skel-thumb" />
        <div className="hdr-skel-lines">
          <div className="hdr-skel-line w70" />
          <div className="hdr-skel-line w40" />
        </div>
      </div>
    ))}
  </div>
);

const SearchBox = React.memo(
  React.forwardRef(function SearchBox(
    props: {
      mobile?: boolean;
      q: string;
      setQ: React.Dispatch<React.SetStateAction<string>>;
      onSubmit: (e: React.FormEvent) => void;
      onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
      open: boolean;
      setOpen: React.Dispatch<React.SetStateAction<boolean>>;
      loading: boolean;
      results: Suggestion[];
      activeIdx: number;
      setActiveIdx: React.Dispatch<React.SetStateAction<number>>;
      navigate: ReturnType<typeof useNavigate>;
      recent: string[];
      popular: { _id: string; name: string }[];
      quickSearch: (term: string) => void;
      placeholder: string;
      clearRecent: () => void;
      onMobileClose?: () => void;
    },
    ref: React.Ref<HTMLFormElement>
  ) {
    const {
      mobile, q, setQ, onSubmit, onKeyDown, open, setOpen,
      loading, results, activeIdx, setActiveIdx, navigate,
      recent, popular, quickSearch, placeholder, clearRecent, onMobileClose,
    } = props;

    const isEmpty = q.trim().length < 2;

    return (
      <form
        className={`hdr-search ${mobile ? "hdr-search--mob" : ""} ${open ? "hdr-search--open" : ""}`}
        onSubmit={onSubmit}
        role="search"
        ref={ref}
      >
        <div className="hdr-search-bar">
          <svg className="hdr-search-icon" viewBox="0 0 24 24" aria-hidden>
            <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5 1.49-1.49-5-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            className="hdr-search-input"
            placeholder={placeholder}
            aria-label="Search toys"
            autoComplete="off"
          />

          {q.length > 0 && (
            <button
              type="button"
              onClick={() => { setQ(""); setOpen(true); }}
              className="hdr-search-clear"
              aria-label="Clear"
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor" />
              </svg>
            </button>
          )}

          <button className="hdr-search-submit" type="submit" aria-label="Search">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5 1.49-1.49-5-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
          </button>
        </div>

        {open && (
          <div className="hdr-dropdown">
            {mobile && (
              <div className="hdr-drop-mob-head">
                <span>Search Results</span>
                <button type="button" onClick={() => { setOpen(false); onMobileClose?.(); }}>✕</button>
              </div>
            )}

            {isEmpty ? (
              <div className="hdr-drop-empty">
                {recent.length > 0 && (
                  <div className="hdr-drop-section">
                    <div className="hdr-drop-section-head">
                      <span>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.25 2.52.75-1.23-3.5-2.07V8h-1.5z" />
                        </svg>
                        Recent
                      </span>
                      <button type="button" onClick={clearRecent}>Clear</button>
                    </div>
                    <div className="hdr-recent-list">
                      {recent.map((term, i) => (
                        <button type="button" key={i} className="hdr-recent-item" onClick={() => quickSearch(term)}>
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" opacity={0.4}>
                            <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.25 2.52.75-1.23-3.5-2.07V8h-1.5z" />
                          </svg>
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {popular.length > 0 && (
                  <div className="hdr-drop-section">
                    <div className="hdr-drop-section-head">
                      <span>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
                        </svg>
                        Trending
                      </span>
                    </div>
                    <div className="hdr-popular-tags">
                      {popular.map((cat) => (
                        <button type="button" key={cat._id} className="hdr-popular-pill"
                          onClick={() => { setOpen(false); setQ(""); navigate(`/products?category=${cat._id}`); }}>
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {recent.length === 0 && popular.length === 0 && (
                  <div className="hdr-drop-hint">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <p>Search for toys, categories, SKUs...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="hdr-drop-results">
                {loading ? (
                  <SuggestionSkeleton />
                ) : results.length === 0 ? (
                  <div className="hdr-drop-noresult">
                    <span>😕</span>
                    <p>No results for "{q}"</p>
                    <small>Try different keywords</small>
                  </div>
                ) : (
                  <>
                    <ul className="hdr-result-list" role="listbox">
                      {results.map((item, idx) => {
                        const isFirst = idx === 0 || results[idx - 1].type !== item.type;
                        return (
                          <React.Fragment key={`${item.type}-${item._id}`}>
                            {isFirst && (
                              <li className="hdr-result-group">
                                {item.type === "category" ? "Categories" : item.type === "brand" ? "Brands" : "Products"}
                              </li>
                            )}
                            <li
                              className={`hdr-result-item ${idx === activeIdx ? "is-active" : ""}`}
                              onMouseEnter={() => setActiveIdx(idx)}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setOpen(false);
                                if (item.type === "category") navigate(`/category/${item._id}`);
                                else if (item.type === "brand") navigate(`/brand/${item._id}`);
                                else navigate(`/product/${item._id}`);
                              }}
                              role="option"
                              aria-selected={idx === activeIdx}
                            >
                              {item.type === "product" && getThumb(item) ? (
                                <img src={getThumb(item)!} alt="" className="hdr-result-thumb" loading="lazy" />
                              ) : (
                                <div className="hdr-result-thumb hdr-result-thumb--ph">
                                  {item.type === "category" ? "📁" : item.type === "brand" ? "🏷️" : "🧸"}
                                </div>
                              )}
                              <div className="hdr-result-meta">
                                <div className="hdr-result-name">{highlightText(item.name, q)}</div>
                                {item.sku && item.type === "product" && <div className="hdr-result-sku">SKU: {item.sku}</div>}
                              </div>
                              {item.price && item.type === "product" && <div className="hdr-result-price">₹{item.price}</div>}
                              <svg className="hdr-result-arrow" viewBox="0 0 24 24" width="16" height="16">
                                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" fill="currentColor" />
                              </svg>
                            </li>
                          </React.Fragment>
                        );
                      })}
                    </ul>
                    <button className="hdr-viewall-btn" type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => quickSearch(q)}>
                      View all results for "{q}"
                      <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" fill="currentColor" /></svg>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </form>
    );
  })
);

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems } = useShop();
  const { theme, toggleTheme } = useTheme();

  const cartCount = useMemo(() => {
    if (!Array.isArray(cartItems)) return 0;
    return cartItems.reduce(
      (sum: number, it: any) => sum + (Number.isFinite(it?.qty || it?.quantity) ? (it?.qty || it?.quantity) : 1), 0
    );
  }, [cartItems]);

  const [q, setQ] = useState("");
  const [sug, setSug] = useState<Suggestion[]>([]);
  const [loadingSug, setLoadingSug] = useState(false);
  const [openSug, setOpenSug] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const [popular, setPopular] = useState<{ _id: string; name: string }[]>([]);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const deskRef = useRef<HTMLFormElement>(null);
  const mobRef = useRef<HTMLFormElement>(null);

  const [placeholder, setPlaceholder] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const words = popular.length > 0
      ? popular.map((c) => `Search "${c.name}"...`)
      : ['Search "wind-up toys"...', 'Search "soft toys"...', 'Search "pull-back cars"...'];
    const current = words[wordIdx % words.length];
    const speed = deleting ? 35 : 70;

    const timer = setTimeout(() => {
      if (!deleting && charIdx < current.length) {
        setPlaceholder(current.substring(0, charIdx + 1));
        setCharIdx((p) => p + 1);
      } else if (deleting && charIdx > 0) {
        setPlaceholder(current.substring(0, charIdx - 1));
        setCharIdx((p) => p - 1);
      } else if (!deleting && charIdx === current.length) {
        setTimeout(() => setDeleting(true), 2200);
      } else if (deleting && charIdx === 0) {
        setDeleting(false);
        setWordIdx((p) => p + 1);
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [charIdx, deleting, wordIdx, popular]);

  useEffect(() => {
    try {
      const s = localStorage.getItem("bafna_recent_searches");
      if (s) setRecent(JSON.parse(s));
    } catch {}
  }, []);

  const clearRecent = useCallback(() => {
    localStorage.removeItem("bafna_recent_searches");
    setRecent([]);
  }, []);

  useEffect(() => {
    api.get("/categories")
      .then((r) => {
        if (Array.isArray(r.data))
          setPopular(r.data.slice(0, 8).map((c: any) => ({ _id: c._id, name: c.name })));
      })
      .catch(console.error);
  }, []);

  const saveSearch = useCallback((term: string) => {
    const t = term.trim();
    if (!t) return;
    setRecent((prev) => {
      const updated = [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 5);
      localStorage.setItem("bafna_recent_searches", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const quickSearch = useCallback((term: string) => {
    setQ(term);
    saveSearch(term);
    setOpenSug(false);
    setMobileSearchOpen(false);
    navigate(`/products?search=${encodeURIComponent(term)}`);
  }, [navigate, saveSearch]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQ(params.get("search") || params.get("q") || "");
  }, [location.search]);

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      const needle = q.trim();
      if (needle.length < 2) { if (alive) { setSug([]); setActiveIdx(-1); } return; }
      setLoadingSug(true);
      try {
        const res = await api.get("/products", { params: { search: needle, limit: 10 } });
        if (!alive) return;
        const data = res.data || {};
        const combined: Suggestion[] = [];
        if (Array.isArray(data.categories)) data.categories.forEach((c: any) => combined.push({ ...c, type: "category" }));
        if (Array.isArray(data.brands)) data.brands.forEach((b: any) => combined.push({ ...b, type: "brand" }));
        const products = Array.isArray(data) ? data : Array.isArray(data.products) ? data.products : [];
        products.forEach((p: any) => combined.push({ ...p, type: "product" }));
        const n = needle.toLowerCase();
        setSug(combined.filter((p) => (p.name || "").toLowerCase().includes(n) || (p.sku || "").toLowerCase().includes(n)).slice(0, 8));
        setActiveIdx(-1);
      } catch { if (alive) { setSug([]); setActiveIdx(-1); } }
      finally { if (alive) setLoadingSug(false); }
    }, 200);
    return () => { alive = false; clearTimeout(timer); };
  }, [q]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (deskRef.current?.contains(t) || mobRef.current?.contains(t)) return;
      setOpenSug(false);
      setActiveIdx(-1);
    };
    document.addEventListener("mousedown", handler, { passive: true });
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const onSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (query) saveSearch(query);
    setOpenSug(false);
    setMobileSearchOpen(false);
    navigate(`/products${query ? `?search=${encodeURIComponent(query)}` : ""}`);
  }, [q, navigate, saveSearch]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!openSug) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => (i + 1 >= sug.length ? 0 : i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => (i - 1 < 0 ? sug.length - 1 : i - 1)); }
    else if (e.key === "Enter") {
      if (activeIdx >= 0 && sug[activeIdx]) {
        e.preventDefault(); setOpenSug(false); setMobileSearchOpen(false);
        const p = sug[activeIdx];
        if (p.type === "category") navigate(`/category/${p._id}`);
        else if (p.type === "brand") navigate(`/brand/${p._id}`);
        else navigate(`/product/${p._id}`);
      }
    } else if (e.key === "Escape") { setOpenSug(false); setActiveIdx(-1); }
  }, [openSug, sug, activeIdx, navigate]);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let ticking = false;
    const handler = () => {
      if (!ticking) {
        requestAnimationFrame(() => { setScrolled(window.scrollY > 20); ticking = false; });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem("user") || "null")); } catch { setUser(null); }
  }, []);

  const searchFormProps = {
    q, setQ, onSubmit, onKeyDown, open: openSug, setOpen: setOpenSug,
    loading: loadingSug, results: sug, activeIdx, setActiveIdx, navigate,
    recent, popular, quickSearch, placeholder, clearRecent,
  };

  return (
    <>
      <header className={`hdr ${scrolled ? "hdr--scrolled" : ""}`}>
        {/* ── Main Row (NO announcement bar) ── */}
        <div className="hdr-main">
          <div className="hdr-main-inner">
            <Link to="/" className="hdr-logo" aria-label="Home">
              <img src={LOGO_IMG} alt="Bafna Toys" width={170} height={42} loading="eager" />
            </Link>

            <div className="hdr-search-desktop">
              <SearchBox ref={deskRef} {...searchFormProps} />
            </div>

            <nav className="hdr-actions">
              <button className="hdr-act-btn hdr-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === "light" ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                )}
              </button>

              <button className="hdr-act-btn hdr-mob-search-btn" onClick={() => setMobileSearchOpen(!mobileSearchOpen)} aria-label="Search">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5 1.49-1.49-5-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor" />
                </svg>
              </button>

              <Link to={user ? "/my-account" : "/login"} className="hdr-act-btn hdr-account-btn" aria-label="Account">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                <div className="hdr-act-text">
                  <span className="hdr-act-label">{user ? `Hi, ${user.name?.split(" ")[0] || "User"}` : "Sign In"}</span>
                  <span className="hdr-act-val">Account</span>
                </div>
              </Link>

              <Link to="/cart" className="hdr-cart-btn" aria-label="Cart">
                <div className="hdr-cart-icon">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  {cartCount > 0 && <span className="hdr-cart-badge">{cartCount}</span>}
                </div>
                <span className="hdr-cart-text">Cart</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* ── Mobile Search ── */}
        <div className={`hdr-mob-search-area ${mobileSearchOpen ? "is-open" : ""}`}>
          <SearchBox ref={mobRef} mobile {...searchFormProps} onMobileClose={() => setMobileSearchOpen(false)} />
        </div>
      </header>

      {mobileSearchOpen && openSug && (
        <div className="hdr-mob-overlay" onClick={() => { setOpenSug(false); setMobileSearchOpen(false); }} />
      )}
    </>
  );
};

export default Header;