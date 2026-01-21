// src/components/Header.tsx - Professional Icons Version
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api, { API_ROOT, MEDIA_URL } from "../utils/api";
import { useShop } from "../context/ShopContext";
import { useTheme } from "../context/ThemeContext"; // ✅ Added Import
import "../styles/Header.css";

const LOGO_IMG = "/logo.webp";

type Suggestion = {
  _id: string;
  name: string;
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
      className={`bt-search ${mobile ? "is-mobile" : ""}`}
      onSubmit={(e) => onSubmit(e)}
      role="search"
      ref={ref}
    >
      <div className="bt-search__wrapper">
        <svg className="bt-search__icon" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5 1.49-1.49-5-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => sug.length > 0 && setOpenSug(true)}
          onKeyDown={onKeyDown}
          className="bt-search__input"
          placeholder="Search toys, games, SKUs…"
        />
      </div>
      <button className="bt-search__btn" type="submit">
        Search
      </button>
      
      {openSug && (
        <div className="bt-suggest">
          {loadingSug && (
            <div className="bt-suggest__loading">
              <div className="bt-spinner"></div>
              Searching…
            </div>
          )}
          {!loadingSug && sug.length === 0 && (
            <div className="bt-suggest__empty">
              <svg viewBox="0 0 24 24" className="bt-suggest__empty-icon">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              No products found
            </div>
          )}
          {!loadingSug && sug.length > 0 && (
            <ul className="bt-suggest__list">
              {sug.map((p, idx) => (
                <li
                  key={p._id}
                  className={`bt-suggest__item ${
                    idx === activeIdx ? "is-active" : ""
                  }`}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setOpenSug(false);
                    navigate(`/product/${p._id}`);
                  }}
                >
                  {getThumb(p) ? (
                    <img
                      src={getThumb(p)!}
                      alt=""
                      className="bt-suggest__thumb"
                      width="48"
                      height="48"
                      loading="lazy"
                    />
                  ) : (
                    <div className="bt-suggest__thumb bt-suggest__thumb--ph" />
                  )}
                  <div className="bt-suggest__meta">
                    <div className="bt-suggest__name">{p.name}</div>
                    {p.sku && <div className="bt-suggest__sku">SKU: {p.sku}</div>}
                    {p.price && (
                      <div className="bt-suggest__price">₹{p.price.toFixed(2)}</div>
                    )}
                  </div>
                  <svg className="bt-suggest__arrow" viewBox="0 0 24 24">
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                  </svg>
                </li>
              ))}
            </ul>
          )}
          <button
            className="bt-suggest__more"
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
            View all results
            <svg viewBox="0 0 24 24">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
        </div>
      )}
    </form>
  );
});

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems } = useShop();
  const { theme, toggleTheme } = useTheme(); // ✅ Hook usage

  const cartCount = useMemo(() => {
    if (!Array.isArray(cartItems)) return 0;
    return cartItems.reduce((sum: number, it: any) => {
      const q = it?.quantity ?? it?.qty ?? 1;
      return sum + (Number.isFinite(q) ? q : 0);
    }, 0);
  }, [cartItems]);

  const [q, setQ] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qs = params.get("search") || params.get("q") || "";
    setQ(qs);
  }, [location.search]);

  const [sug, setSug] = useState<Suggestion[]>([]);
  const [loadingSug, setLoadingSug] = useState(false);
  const [openSug, setOpenSug] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const deskRef = useRef<HTMLFormElement | null>(null);
  const mobRef = useRef<HTMLFormElement | null>(null);

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
  useEffect(() => {
    const onStorage = () => setUser(parseUser());
    window.addEventListener("storage", onStorage);
    window.addEventListener("user-changed", onStorage as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("user-changed", onStorage as EventListener);
    };
  }, []);

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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    setOpenSug(false);
    navigate(`/products${query ? `?search=${encodeURIComponent(query)}` : ""}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!openSug || (!sug.length && !loadingSug)) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1 >= sug.length ? 0 : i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 < 0 ? sug.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (activeIdx >= 0 && sug[activeIdx]) {
        setOpenSug(false);
        navigate(`/product/${sug[activeIdx]._id}`);
      } else {
        setOpenSug(false);
        const query =
          (e.currentTarget as HTMLInputElement).value.trim() || q.trim();
        navigate(
          `/products${query ? `?search=${encodeURIComponent(query)}` : ""}`
        );
      }
    } else if (e.key === "Escape") {
      setOpenSug(false);
      setActiveIdx(-1);
    }
  };

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`bt-header ${scrolled ? 'bt-header--scrolled' : ''}`}>
      {/* Main Header */}
      <div className="bt-header__main">
        <div className="bt-header__container">
          {/* Logo */}
          <Link to="/" className="bt-logo">
            <div className="bt-logo__wrapper">
              <img
                src={LOGO_IMG}
                alt="BAFNA TOYS"
                className="bt-logo__img"
                width="160"
                height="45"
                fetchpriority="high"
              />
            </div>
          </Link>

          {/* Desktop Search - Full Width */}
          <div className="bt-search__desktop-wrapper">
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

          {/* Actions */}
          <nav className="bt-actions">
            
            {/* ✅ Theme Toggle (Replaced Bottom Floating Button) */}
            <button
              className="bt-account__button" // Using same class for consistent sizing/style
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              type="button"
            >
              {theme === 'light' ? (
                // Moon Icon
                <svg viewBox="0 0 24 24" className="bt-ico" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              ) : (
                // Sun Icon
                <svg viewBox="0 0 24 24" className="bt-ico" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <circle cx="12" cy="12" r="5"></circle>
                   <line x1="12" y1="1" x2="12" y2="3"></line>
                   <line x1="12" y1="21" x2="12" y2="23"></line>
                   <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                   <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                   <line x1="1" y1="12" x2="3" y2="12"></line>
                   <line x1="21" y1="12" x2="23" y2="12"></line>
                   <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                   <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              )}
              <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>

            {user ? (
              <div className="bt-account">
                <button
                  className="bt-account__button"
                  onClick={() => navigate("/my-account")}
                >
                  <svg viewBox="0 0 24 24" className="bt-ico" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.43-.82-6.14-2.88C7.55 15.8 9.68 15 12 15s4.45.8 6.14 2.12C16.43 19.18 14.03 20 12 20z" />
                  </svg>
                  <span>Account</span>
                </button>
              </div>
            ) : (
              <Link className="bt-link bt-link--login" to="/login">
                <svg viewBox="0 0 24 24" className="bt-ico" fill="currentColor">
                  <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"/>
                </svg>
                <span>Login</span>
              </Link>
            )}
            
            {user && (
              <Link className="bt-link bt-link--orders bt-actions__orders-mobile-hide" to="/orders">
                <svg viewBox="0 0 24 24" className="bt-ico" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-1.23c0-.62.28-1.2.76-1.58C7.47 15.06 9.64 14 12 14s4.53 1.06 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
                </svg>
                <span>My Orders</span>
              </Link>
            )}

            <Link className="bt-cart" to="/cart">
              <div className="bt-cart__icon">
                <svg viewBox="0 0 24 24" className="bt-cart__svg" fill="currentColor">
                  <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm0 10c-2.76 0-5-2.24-5-5h2c0 1.66 1.34 3 3 3s3-1.34 3-3h2c0 2.76-2.24 5-5 5z"/>
                </svg>
                {cartCount > 0 && <span className="bt-cart__badge">{cartCount}</span>}
              </div>
              <span className="bt-cart__text">Cart</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="bt-search--mobile">
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
    </header>
  );
};

export default Header;