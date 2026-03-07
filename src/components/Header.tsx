// src/components/Header.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api, { API_ROOT, MEDIA_URL } from "../utils/api";
import { useShop } from "../context/ShopContext";
import { useTheme } from "../context/ThemeContext";
import "../styles/Header.css";

const LOGO_IMG = "/logo.webp"; // Ensure this logo is colorful!

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

// ✅ PERFORMANCE: Wrapped in React.memo to prevent unnecessary re-renders
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
      className={`modern-search ${mobile ? "is-mobile" : ""}`}
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
          onFocus={() => sug.length > 0 && setOpenSug(true)}
          onKeyDown={onKeyDown}
          className="modern-search__input"
          placeholder={mobile ? "Search toys..." : "Search for toys, games..."}
          aria-label="Search"
        />
        <button className="modern-search__btn" type="submit" aria-label="Search">
          {mobile ? "Go" : "Search"}
        </button>
      </div>

      {openSug && (
        <div className="modern-suggest">
          {loadingSug && (
            <div className="modern-suggest__loading">
              <div className="modern-spinner"></div>
              Looking for toys...
            </div>
          )}

          {!loadingSug && sug.length === 0 && (
            <div className="modern-suggest__empty">
              😕 No toys found. Try "car" or "doll"?
            </div>
          )}

          {!loadingSug && sug.length > 0 && (
            <ul className="modern-suggest__list" role="listbox" aria-label="Search suggestions">
              {sug.map((p, idx) => (
                <li
                  key={p._id}
                  className={`modern-suggest__item ${idx === activeIdx ? "is-active" : ""}`}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setOpenSug(false);
                    navigate(`/product/${p._id}`);
                  }}
                  role="option"
                  aria-selected={idx === activeIdx}
                >
                  {getThumb(p) ? (
                    <img
                      src={getThumb(p)!}
                      alt=""
                      className="modern-suggest__thumb"
                      loading="lazy"
                      width={48}
                      height={48}
                    />
                  ) : (
                    <div className="modern-suggest__thumb modern-suggest__thumb--ph" />
                  )}

                  <div className="modern-suggest__meta">
                    <div className="modern-suggest__name">{p.name}</div>
                    {p.sku && <div className="modern-suggest__sku">#{p.sku}</div>}
                  </div>

                  <div className="modern-suggest__price">{p.price ? `₹${p.price}` : ""}</div>
                </li>
              ))}
            </ul>
          )}

          {sug.length > 0 && (
            <button
              className="modern-suggest__more"
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const query = q.trim();
                setOpenSug(false);
                navigate(`/products${query ? `?search=${encodeURIComponent(query)}` : ""}`);
              }}
            >
              See all results
            </button>
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
          params: { search: needle, limit: 10 },
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
    // ✅ PERFORMANCE: Added passive: true for faster touch/click handling
    document.addEventListener("mousedown", onDoc, { passive: true });
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // ✅ PERFORMANCE: Wrapped in useCallback to prevent child re-renders
  const onSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    setOpenSug(false);
    navigate(`/products${query ? `?search=${encodeURIComponent(query)}` : ""}`);
  }, [q, navigate]);

  // ✅ PERFORMANCE: Wrapped in useCallback
  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
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
        const query = (e.currentTarget as HTMLInputElement).value.trim() || q.trim();
        navigate(`/products${query ? `?search=${encodeURIComponent(query)}` : ""}`);
      }
    } else if (e.key === "Escape") {
      setOpenSug(false);
      setActiveIdx(-1);
    }
  }, [openSug, sug, loadingSug, activeIdx, navigate, q]);

  const [scrolled, setScrolled] = useState(false);
  
  // ✅ FIXED: Debounced scroll listener to prevent shaking
  useEffect(() => {
    let ticking = false;
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Only update if scroll position changed significantly (prevents micro-adjustments)
      if (Math.abs(currentScrollY - lastScrollY) < 5) {
        return;
      }
      
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

  return (
    <header className={`modern-header ${scrolled ? "modern-header--scrolled" : ""}`}>
      
      {/* 🌟 NEW INSTAGRAM BANNER 🌟 */}
      <a 
        href="https://www.instagram.com/bafna_toys/" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="modern-top-banner"
        aria-label="Follow us on Instagram"
      >
        <div className="modern-top-banner__inner">
          <svg className="modern-top-banner__icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
          <span className="modern-top-banner__text">
           See our adorable toys in action! 🎥 Watch reels on Instagram & come back to shop! ✨
          </span>
          <span className="modern-top-banner__btn">Watch Now</span>
        </div>
      </a>

      <div className="modern-header__main">
        <div className="modern-header__container bk-header-container">
          {/* Logo */}
          <Link to="/" className="modern-logo" aria-label="Home">
            <img
              src={LOGO_IMG}
              alt="BAFNA TOYS"
              className="modern-logo__img"
              width={188}
              height={45}
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </Link>

          {/* Desktop Search */}
          <div className="modern-search__desktop-wrapper">
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

          {/* Action Buttons (Icons + Text) */}
          <nav className="modern-actions" aria-label="Header actions">
            {/* Theme Toggle */}
            <button
              className="modern-action-btn modern-theme-btn"
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              type="button"
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>

            {/* Account / Login */}
            {user ? (
              <button
                className="modern-action-btn"
                onClick={() => navigate("/my-account")}
                type="button"
              >
                <span className="modern-ico" aria-hidden>👤</span>
                <span className="modern-btn-text">Account</span>
              </button>
            ) : (
              <Link className="modern-action-btn" to="/login">
                <span className="modern-ico" aria-hidden>🔑</span>
                <span className="modern-btn-text">Login</span>
              </Link>
            )}

            {/* My Orders */}
            {user && (
              <Link className="modern-action-btn mobile-hide" to="/orders">
                <span className="modern-ico" aria-hidden>📦</span>
                <span className="modern-btn-text">Orders</span>
              </Link>
            )}

            {/* Cart Button */}
            <Link className="modern-cart-btn" to="/cart" aria-label="Cart">
              <span className="modern-cart-ico" aria-hidden>🛒</span>
              <span className="modern-cart-text">Cart</span>
              {cartCount > 0 && <span className="modern-cart-badge">{cartCount}</span>}
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="modern-search--mobile">
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