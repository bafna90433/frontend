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

const IMAGE_BASE = (import.meta as any).env?.VITE_IMAGE_BASE_URL || (import.meta as any).env?.VITE_MEDIA_URL || MEDIA_URL || "";

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

const getHighlightedText = (text: string, highlight: string) => {
  if (!highlight.trim()) return text;
  const parts = text.split(new RegExp(`(${highlight})`, "gi"));
  return (
    <span>
      {parts.map((part, i) => (
        <span key={i} className={part.toLowerCase() === highlight.toLowerCase() ? "search-highlight-match" : ""}>
          {part}
        </span>
      ))}
    </span>
  );
};

const SuggestionSkeleton = () => (
  <div className="bafna-suggest__skeleton">
    {[1, 2, 3].map((i) => (
      <div key={i} className="skeleton-item">
        <div className="skeleton-thumb" />
        <div className="skeleton-meta">
          <div className="skeleton-line skeleton-line--title" />
          <div className="skeleton-line skeleton-line--subtitle" />
        </div>
      </div>
    ))}
  </div>
);

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
    clearRecentSearches: () => void;
  },
  ref: React.Ref<HTMLFormElement>
) {
  const {
    mobile, q, setQ, onSubmit, onKeyDown, openSug, setOpenSug,
    loadingSug, sug, activeIdx, setActiveIdx, navigate,
    recentSearches, popularSearches, handleQuickSearch, placeholderText, clearRecentSearches
  } = props;

  const isQueryEmpty = q.trim().length < 2;

  return (
    <form
      className={`bafna-search ${mobile ? "is-mobile" : ""} ${openSug ? "is-suggestions-open" : ""}`}
      onSubmit={onSubmit}
      role="search"
      ref={ref}
    >
      <div className="bafna-search__wrapper">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpenSug(true)}
          onKeyDown={onKeyDown}
          className="bafna-search__input"
          placeholder={placeholderText}
          aria-label="Search toys"
        />
        {mobile && openSug && (
          <button type="button" className="bafna-search__close-mob" onClick={() => setOpenSug(false)} aria-label="Close">✕</button>
        )}
        {q.length > 0 && !mobile && (
          <button type="button" onClick={() => { setQ(""); setOpenSug(true); }} className="bafna-search__clear-btn" aria-label="Clear">✕</button>
        )}
        <button className="bafna-search__submit" type="submit" aria-label="Search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5 1.49-1.49-5-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
        </button>
      </div>

      {openSug && (
        <div className="bafna-suggest">
          {isQueryEmpty ? (
            <div className="bafna-suggest__empty-state">
              {recentSearches.length > 0 && (
                <div className="bafna-suggest__section">
                  <div className="bafna-suggest__section-header">
                    <span className="bafna-suggest__section-title">Recent Searches</span>
                    <button type="button" className="bafna-suggest__clear-all" onClick={clearRecentSearches}>Clear All</button>
                  </div>
                  <ul className="bafna-suggest__recent-list">
                    {recentSearches.map((term, i) => (
                      <li key={i} className="bafna-suggest__recent-item" onClick={() => handleQuickSearch(term)}>
                        <svg className="bafna-suggest__history-icon" viewBox="0 0 24 24"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.25 2.52.75-1.23-3.5-2.07V8h-1.5z" /></svg>
                        {term}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {popularSearches.length > 0 && (
                <div className="bafna-suggest__section">
                  <div className="bafna-suggest__section-title">Trending Now</div>
                  <div className="bafna-suggest__popular-tags">
                    {popularSearches.map((cat) => (
                      <button type="button" key={cat._id} className="bafna-suggest__popular-pill" onClick={() => { setOpenSug(false); setQ(""); navigate(`/?category=${cat._id}`); }}>{cat.name}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>{loadingSug ? <SuggestionSkeleton /> : (
              <>{!loadingSug && sug.length === 0 && <div className="bafna-suggest__empty">😕 No toys found!</div>}
                {!loadingSug && sug.length > 0 && (
                  <ul className="bafna-suggest__list" role="listbox">
                    {sug.map((p, idx) => {
                      const isFirstOfType = idx === 0 || sug[idx - 1].type !== p.type;
                      return (
                        <React.Fragment key={`${p.type}-${p._id}`}>
                          {isFirstOfType && (
                            <div className="bafna-suggest__group-title">
                              {p.type === "category" ? "📁 Category" : p.type === "brand" ? "🏷️ Brand" : "🧸 Toy"}
                            </div>
                          )}
                          <li className={`bafna-suggest__item ${idx === activeIdx ? "is-active" : ""}`} onMouseEnter={() => setActiveIdx(idx)}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setOpenSug(false);
                              if (p.type === "category") navigate(`/category/${p._id}`);
                              else if (p.type === "brand") navigate(`/brand/${p._id}`);
                              else navigate(`/product/${p._id}`);
                            }}>
                            {p.type === "product" && getThumb(p) ? (
                              <img src={getThumb(p)!} alt="" className="bafna-suggest__thumb" loading="lazy" width={48} height={48} />
                            ) : (
                              <div className="bafna-suggest__thumb bafna-suggest__thumb--ph">
                                {p.type === "category" ? "📁" : p.type === "brand" ? "🏷️" : "🧸"}
                              </div>
                            )}
                            <div className="bafna-suggest__meta">
                              <div className="bafna-suggest__name">{getHighlightedText(p.name, q)}</div>
                              {p.sku && p.type === "product" && <div className="bafna-suggest__sku">SKU: {p.sku}</div>}
                            </div>
                            {p.price && p.type === "product" ? <div className="bafna-suggest__price">₹{p.price}</div> : null}
                          </li>
                        </React.Fragment>
                      );
                    })}
                  </ul>
                )}
                {sug.length > 0 && <button className="bafna-suggest__more" type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => handleQuickSearch(q)}>View all results →</button>}
              </>
            )}</>
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

  const [placeholderText, setPlaceholderText] = useState("");
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    const words = popularSearches.length > 0 ? popularSearches.map(cat => `Search for "${cat.name}"...`) : ["Search for wind-up toys...", "Search for soft toys...", "Search for pull-back cars..."];
    const currentFullWord = words[currentWordIdx % words.length];
    const typingSpeed = isDeleting ? 40 : 80;
    const timeout = setTimeout(() => {
      if (!isDeleting && charIdx < currentFullWord.length) {
        setPlaceholderText(currentFullWord.substring(0, charIdx + 1));
        setCharIdx(prev => prev + 1);
      } else if (isDeleting && charIdx > 0) {
        setPlaceholderText(currentFullWord.substring(0, charIdx - 1));
        setCharIdx(prev => prev - 1);
      } else if (!isDeleting && charIdx === currentFullWord.length) {
        setTimeout(() => setIsDeleting(true), 2000);
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

  const clearRecentSearches = useCallback(() => {
    localStorage.removeItem("bafna_recent_searches");
    setRecentSearches([]);
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
    navigate(`/?search=${encodeURIComponent(term)}`);
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
    navigate(`/${query ? `?search=${encodeURIComponent(query)}` : ""}`);
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
        navigate(`/${query ? `?search=${encodeURIComponent(query)}` : ""}`);
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
    const parseUser = () => {
      try { return JSON.parse(localStorage.getItem("user") || "null"); }
      catch { return null; }
    };
    setUser(parseUser());
    const handleStorageChange = () => { setUser(parseUser()); };
    window.addEventListener("storage", handleStorageChange);
    return () => { window.removeEventListener("storage", handleStorageChange); };
  }, []);

  return (
    <header className={`bafna-site-header ${scrolled ? "is-scrolled" : ""}`}>

      {/* ══ MAIN HEADER ══ */}
      <div className="bafna-header-main">
        <div className="bafna-header-container">

          {/* Logo + B2B Tagline + MASCOT */}
          <Link to="/" className="bafna-brand" aria-label="Bafna Toys Home">
            {/* Mascot Image is now FIRST */}
            <img 
              src="https://res.cloudinary.com/dpdecxqb9/image/upload/v1774086370/Super_Car___05_vrkphh.webp" 
              alt="Mascot" 
              className="bafna-brand__mascot"
            />
            {/* Logo and Tagline are SECOND */}
            <div className="bafna-brand__wrap">
              <img src={LOGO_IMG} alt="BAFNA TOYS" className="bafna-brand__img" width={188} height={45} loading="eager" />
              <span className="bafna-brand__tagline">B2B Toys Manufacturer</span>
            </div>
          </Link>

          {/* ═══ CENTER: Search + Trust Badges ═══ */}
          <div className="bafna-center-block">
            <div className="bafna-search-wrap-desktop">
              <SearchForm
                ref={deskRef} q={q} setQ={setQ} onSubmit={onSubmit} onKeyDown={onKeyDown}
                openSug={openSug} setOpenSug={setOpenSug} loadingSug={loadingSug} sug={sug}
                activeIdx={activeIdx} setActiveIdx={setActiveIdx} navigate={navigate}
                recentSearches={recentSearches} popularSearches={popularSearches} handleQuickSearch={handleQuickSearch}
                placeholderText={placeholderText} clearRecentSearches={clearRecentSearches}
              />
            </div>

            {/* Inline Trust Badges — next to search */}
            <div className="bafna-inline-badges">
              <div className="bafna-inline-badge bafna-inline-badge--bis">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
                <span>BIS Certified</span>
              </div>
              <div className="bafna-inline-badge bafna-inline-badge--factory">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 20h20"/>
                  <path d="M5 20V8l7-5 7 5v12"/>
                  <rect x="9" y="12" width="6" height="8"/>
                  <path d="M9 12h6"/>
                </svg>
                <span>Factory Direct</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <nav className="bafna-user-actions">
            <button className="bafna-action-icon bafna-theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
              {theme === "light" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              )}
            </button>

            <div className="bafna-action-group">
              {user ? (
                <Link to="/my-account" className="bafna-action-link">
                  <span className="bafna-action-link__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                  <div className="text-stack">
                    <span className="label" style={{ maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}
                      title={`Hello, ${user.shopName || user.name?.split(' ')[0] || 'User'}`}>
                      Hello, {user.shopName || user.name?.split(' ')[0] || 'User'}
                    </span>
                    <span className="val hidden-mobile">Account</span>
                  </div>
                </Link>
              ) : (
                <Link to="/login" className="bafna-action-link">
                  <span className="bafna-action-link__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                  </span>
                  <div className="text-stack">
                    <span className="label hidden-mobile">Welcome</span>
                    <span className="val hidden-mobile">Sign In</span>
                  </div>
                </Link>
              )}
            </div>

            <Link to="/cart" className="bafna-cart-link">
              <div className="bafna-cart-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </div>
              <span className="cart-total-text hidden-mobile">Cart</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobile Search - BADGES REMOVED HERE */}
      <div className="bafna-search-wrap-mobile">
        <SearchForm
          ref={mobRef} mobile q={q} setQ={setQ} onSubmit={onSubmit} onKeyDown={onKeyDown}
          openSug={openSug} setOpenSug={setOpenSug} loadingSug={loadingSug} sug={sug}
          activeIdx={activeIdx} setActiveIdx={setActiveIdx} navigate={navigate}
          recentSearches={recentSearches} popularSearches={popularSearches} handleQuickSearch={handleQuickSearch}
          placeholderText={placeholderText} clearRecentSearches={clearRecentSearches}
        />
      </div>
    </header>
  );
};

export default Header;