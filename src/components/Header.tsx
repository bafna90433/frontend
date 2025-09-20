// src/components/Header.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api, { API_ROOT, MEDIA_URL } from "../utils/api";
import { useShop } from "../context/ShopContext";
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
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => sug.length > 0 && setOpenSug(true)}
        onKeyDown={onKeyDown}
        className="bt-search__input"
        placeholder="Search products, SKUs…"
      />
      <button className="bt-search__btn" type="submit">
        <svg viewBox="0 0 24 24" className="bt-ico">
          <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5 1.49-1.49-5-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <span>Search</span>
      </button>
      {openSug && (
        <div className="bt-suggest">
          {loadingSug && <div className="bt-suggest__loading">Searching…</div>}
          {!loadingSug && sug.length === 0 && (
            <div className="bt-suggest__empty">No matches</div>
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
                      width="40"
                      height="40"
                      loading="lazy"
                    />
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
              navigate(
                `/products${query ? `?search=${encodeURIComponent(query)}` : ""}`
              );
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

  const [categories, setCategories] = useState<Category[]>([]);
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

  const params = new URLSearchParams(location.search);
  const activeCategory = params.get("category");

  // refs for each category button
  const catRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // smooth scroll when active category changes
  useEffect(() => {
    if (activeCategory && catRefs.current[activeCategory]) {
      catRefs.current[activeCategory]?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
    if (!activeCategory && catRefs.current["all"]) {
      catRefs.current["all"]?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeCategory]);

  const formatName = (str: string) => {
    if (!str) return "";
    const lower = str.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  return (
    <header className="bt-header">
      <div className="bt-header__bar">
        <Link to="/" className="bt-logo">
          <img
            src={LOGO_IMG}
            alt="BAFNA TOYS"
            className="bt-logo__img"
            width="150"
            height="40"
            fetchpriority="high"
          />
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
        <nav className="bt-actions">
          {user ? (
            <div className="bt-account">
              <button
                className="bt-account__button"
                onClick={() => navigate("/my-account")}
              >
                <svg viewBox="0 0 24 24" className="bt-ico">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <span>My Account</span>
              </button>
            </div>
          ) : (
            <Link className="bt-link" to="/login">
              Login
            </Link>
          )}
          <Link className="bt-cart" to="/cart">
            <svg viewBox="0 0 24 24" className="bt-ico">
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
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
      {categories.length > 0 && (
        <div className="bt-cat-scroll">
          <button
            ref={(el) => (catRefs.current["all"] = el)}
            className={`bt-cat-item ${!activeCategory ? "is-active" : ""}`}
            onClick={() => navigate("/products")}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              ref={(el) => (catRefs.current[cat._id] = el)}
              className={`bt-cat-item ${
                activeCategory === cat._id ? "is-active" : ""
              }`}
              onClick={() =>
                navigate(`/products?category=${encodeURIComponent(cat._id)}`)
              }
            >
              {formatName(cat.name)}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};

export default Header;
