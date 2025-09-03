// src/components/Header.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api, { API_ROOT, MEDIA_URL } from "../utils/api";
import { useShop } from "../context/ShopContext";
import "../styles/Header.css";

const LOGO_IMG = "/logo.png";

type Suggestion = {
  _id: string;
  name: string;
  sku?: string;
  images?: string[];
  price?: number;
};

// IMAGE base detection (Vite env or fallback)
const IMAGE_BASE =
  (import.meta as any).env?.VITE_IMAGE_BASE_URL ||
  (import.meta as any).env?.VITE_MEDIA_URL ||
  MEDIA_URL ||
  "";

// build thumbnail URL
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
      onSubmit={(e) => {
        onSubmit(e);
      }}
      role="search"
      aria-label={mobile ? "Site search mobile" : "Site search"}
      ref={ref}
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => sug.length > 0 && setOpenSug(true)}
        onKeyDown={onKeyDown}
        className="bt-search__input"
        placeholder="Search products, SKUs…"
        aria-label="Search products"
      />
      <button className="bt-search__btn" type="submit" aria-label="Search">
        <svg viewBox="0 0 24 24" className="bt-ico">
          <path d="M15.5 14h-.79l-.28-.27a6.471 6.471 0 0 0 1.57-4.23C16 6.01 13.31 3.32 10 3.32S4 6.01 4 9.5 6.69 15.68 10 15.68c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5Z" />
        </svg>
        <span>Search</span>
      </button>

      {openSug && (
        <div className="bt-suggest" role="listbox">
          {loadingSug && <div className="bt-suggest__loading">Searching…</div>}
          {!loadingSug && sug.length === 0 && <div className="bt-suggest__empty">No matches</div>}
          {!loadingSug && sug.length > 0 && (
            <ul className="bt-suggest__list">
              {sug.map((p, idx) => (
                <li
                  key={p._id}
                  role="option"
                  aria-selected={idx === activeIdx}
                  className={`bt-suggest__item ${idx === activeIdx ? "is-active" : ""}`}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setOpenSug(false);
                    navigate(`/product/${p._id}`);
                  }}
                >
                  {getThumb(p) ? (
                    <img src={getThumb(p)!} alt="" className="bt-suggest__thumb" />
                  ) : (
                    <div className="bt-suggest__thumb bt-suggest__thumb--ph" />
                  )}
                  <div className="bt-suggest__meta">
                    <div className="bt-suggest__name">{p.name}</div>
                    {p.sku && <div className="bt-suggest__sku">SKU: {p.sku}</div>}
                  </div>
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
              navigate(`/products${query ? `?search=${encodeURIComponent(query)}` : ""}`);
            }}
          >
            See all results
          </button>
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

  // search state
  const [q, setQ] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qs = params.get("search") || params.get("q") || "";
    setQ(qs);
  }, [location.search]);

  // suggestions
  const [sug, setSug] = useState<Suggestion[]>([]);
  const [loadingSug, setLoadingSug] = useState(false);
  const [openSug, setOpenSug] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const deskRef = useRef<HTMLFormElement | null>(null);
  const mobRef = useRef<HTMLFormElement | null>(null);

  // ---------- USER / AUTH UI ----------
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

  // update user on storage events (and on custom dispatchEvent("storage") from LoginOTP)
  useEffect(() => {
    const onStorage = () => setUser(parseUser());
    window.addEventListener("storage", onStorage);
    window.addEventListener("user-changed", onStorage as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("user-changed", onStorage as EventListener);
    };
  }, []);

  // ---------- SUGGESTIONS FETCH ----------
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
        // use shared api instance (works in prod because baseURL is set there)
        const res = await api.get("/products", { params: { search: needle, limit: 50 } });
        if (!alive) return;

        const arr: Suggestion[] = Array.isArray(res.data)
          ? res.data
          : Array.isArray((res.data as any)?.products)
          ? (res.data as any).products
          : [];

        const n = needle.toLowerCase();
        const filtered = arr.filter(
          (p) => (p.name || "").toLowerCase().includes(n) || (p.sku || "").toLowerCase().includes(n)
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

  // outside click closes suggestions
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

  return (
    <header className="bt-header">
      <div className="bt-header__bar">
        <Link to="/" className="bt-logo" aria-label="Go to homepage">
          <img src={LOGO_IMG} alt="BAFNA TOYS" className="bt-logo__img" />
          <span className="bt-logo__text">Bafna Toys</span>
        </Link>

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

        <nav className="bt-actions" aria-label="Primary">
          {/* if logged in show My Account; otherwise show Login */}
          {user ? (
            <div className="bt-account">
              <button
                className="bt-account__button"
                onClick={() => navigate("/my-account")}
                title="Go to My Account"
                aria-label="My Account"
              >
                My Account
              </button>
            </div>
          ) : (
            <Link className="bt-link" to="/login">
              Login
            </Link>
          )}

          <Link className="bt-cart" to="/cart" aria-label={`Cart with ${cartCount} items`}>
            <svg viewBox="0 0 24 24" className="bt-ico">
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 
                0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.17 
                14h9.66c.75 0 1.41-.41 1.75-1.03L22 6H6.21l-.94-2H2v2h2l3.6 
                7.59-1.35 2.45C5.52 16.37 6.48 18 8 18h12v-2H8l1.1-2z" />
            </svg>
            {cartCount > 0 && <span className="bt-cart__badge">{cartCount}</span>}
            <span className="bt-cart__text">Cart</span>
          </Link>
        </nav>
      </div>

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
