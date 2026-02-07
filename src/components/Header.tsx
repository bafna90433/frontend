import React, { useEffect, useMemo, useRef, useState } from "react";
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
      className={`kid-search ${mobile ? "is-mobile" : ""}`}
      onSubmit={(e) => onSubmit(e)}
      role="search"
      ref={ref}
    >
      <div className="kid-search__wrapper">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => sug.length > 0 && setOpenSug(true)}
          onKeyDown={onKeyDown}
          className="kid-search__input"
          placeholder="Search for toys, games..."
        />
        <button className="kid-search__btn" type="submit">
          <svg className="kid-search__icon" viewBox="0 0 24 24">
             <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5 1.49-1.49-5-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
        </button>
      </div>
      
      {/* Suggestions Dropdown (Playful Style) */}
      {openSug && (
        <div className="kid-suggest">
          {loadingSug && (
            <div className="kid-suggest__loading">
              <div className="kid-spinner"></div>
              Looking for toys...
            </div>
          )}
          {!loadingSug && sug.length === 0 && (
            <div className="kid-suggest__empty">
              😕 No toys found. Try "car" or "doll"?
            </div>
          )}
          {!loadingSug && sug.length > 0 && (
            <ul className="kid-suggest__list">
              {sug.map((p, idx) => (
                <li
                  key={p._id}
                  className={`kid-suggest__item ${
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
                      className="kid-suggest__thumb"
                      loading="lazy"
                    />
                  ) : (
                    <div className="kid-suggest__thumb kid-suggest__thumb--ph" />
                  )}
                  <div className="kid-suggest__meta">
                    <div className="kid-suggest__name">{p.name}</div>
                    {p.sku && <div className="kid-suggest__sku">#{p.sku}</div>}
                  </div>
                  <div className="kid-suggest__price">
                     {p.price ? `₹${p.price}` : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {sug.length > 0 && (
              <button
                className="kid-suggest__more"
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
                See all results
              </button>
          )}
        </div>
      )}
    </form>
  );
});

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

  // Search Logic (Same as before)
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
        const query = (e.currentTarget as HTMLInputElement).value.trim() || q.trim();
        navigate(`/products${query ? `?search=${encodeURIComponent(query)}` : ""}`);
      }
    } else if (e.key === "Escape") {
      setOpenSug(false);
      setActiveIdx(-1);
    }
  };

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`kid-header ${scrolled ? 'kid-header--scrolled' : ''}`}>
      <div className="kid-header__main">
        <div className="kid-header__container">
           
          {/* Logo */}
          <Link to="/" className="kid-logo">
            <img src={LOGO_IMG} alt="BAFNA TOYS" className="kid-logo__img" height="45" />
          </Link>

          {/* Desktop Search */}
          <div className="kid-search__desktop-wrapper">
            <SearchForm
              ref={deskRef}
              q={q} setQ={setQ}
              onSubmit={onSubmit} onKeyDown={onKeyDown}
              openSug={openSug} setOpenSug={setOpenSug} loadingSug={loadingSug}
              sug={sug} activeIdx={activeIdx} setActiveIdx={setActiveIdx}
              navigate={navigate}
            />
          </div>

          {/* Action Buttons (Icons + Text) */}
          <nav className="kid-actions">
            
            {/* Theme Toggle */}
            <button className="kid-action-btn kid-theme-btn" onClick={toggleTheme} aria-label="Toggle Theme">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {/* Account / Login */}
            {user ? (
               <button className="kid-action-btn" onClick={() => navigate("/my-account")}>
                 <span className="kid-ico">👤</span>
                 <span className="kid-btn-text">Account</span>
               </button>
            ) : (
               <Link className="kid-action-btn" to="/login">
                 <span className="kid-ico">🔑</span>
                 <span className="kid-btn-text">Login</span>
               </Link>
            )}

            {/* My Orders */}
            {user && (
              <Link className="kid-action-btn mobile-hide" to="/orders">
                <span className="kid-ico">📦</span>
                <span className="kid-btn-text">Orders</span>
              </Link>
            )}

            {/* Cart Button (Bouncy & Colorful) */}
            <Link className="kid-cart-btn" to="/cart">
              <div className="kid-cart-icon-wrap">
                  🛒
                  {cartCount > 0 && <span className="kid-cart-badge">{cartCount}</span>}
              </div>
              <span className="kid-btn-text">Cart</span>
            </Link>

          </nav>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="kid-search--mobile">
        <SearchForm
          ref={mobRef}
          mobile
          q={q} setQ={setQ}
          onSubmit={onSubmit} onKeyDown={onKeyDown}
          openSug={openSug} setOpenSug={setOpenSug} loadingSug={loadingSug}
          sug={sug} activeIdx={activeIdx} setActiveIdx={setActiveIdx}
          navigate={navigate}
        />
      </div>
    </header>
  );
};

export default Header;