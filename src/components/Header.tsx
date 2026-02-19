// src/components/Header.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api, { API_ROOT, MEDIA_URL } from "../utils/api";
import { useShop } from "../context/ShopContext";
import { useTheme } from "../context/ThemeContext";
import "../styles/Header.css";

const LOGO_IMG = "/logo.webp"; 

type Suggestion = {
  _id: string;
  name: string;
  sku?: string;
  images?: string[];
  price?: number;
};

// ... [Keep your IMAGE_BASE and getThumb helper functions exactly as they are] ...
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

/* --- Professional Icons (Inline SVGs) --- */
const Icons = {
  Search: () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  ),
  Mic: () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
  ),
  User: () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
  ),
  Login: () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
  ),
  Box: () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
  ),
  Cart: () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
  ),
  Moon: () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
  ),
  Sun: () => (
    <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
  )
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

  // Voice Search Logic (Unchanged)
  const SpeechRecognitionCtor =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const voiceSupported = !!SpeechRecognitionCtor;
  const recognitionRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!voiceSupported) return;
    const rec = new SpeechRecognitionCtor();
    recognitionRef.current = rec;
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-IN"; 
    rec.onstart = () => setListening(true);
    rec.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const clean = transcript.trim();
      if (clean) setQ(clean);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    return () => {
        // cleanup
    };
  }, [voiceSupported, setQ]);

  const toggleVoice = () => {
    if (!voiceSupported) return;
    setOpenSug(false);
    setActiveIdx(-1);
    inputRef.current?.focus();
    try {
      const rec = recognitionRef.current;
      if (!rec) return;
      if (listening) rec.stop();
      else rec.start();
    } catch {
      setListening(false);
    }
  };

  return (
    <form
      className={`kid-search ${mobile ? "is-mobile" : ""}`}
      onSubmit={(e) => onSubmit(e)}
      role="search"
      ref={ref}
    >
      <div className="kid-search__wrapper">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => sug.length > 0 && setOpenSug(true)}
          onKeyDown={onKeyDown}
          className="kid-search__input"
          placeholder="Search for toys, brands..."
          aria-label="Search"
        />

        <button
          className={`kid-voice-btn ${listening ? "is-listening" : ""}`}
          type="button"
          onClick={toggleVoice}
          disabled={!voiceSupported}
          aria-label={voiceSupported ? (listening ? "Stop voice search" : "Start voice search") : "Not supported"}
        >
          <Icons.Mic />
        </button>

        <button className="kid-search__btn" type="submit" aria-label="Search">
           <Icons.Search />
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {openSug && (
        <div className="kid-suggest">
          {loadingSug && (
            <div className="kid-suggest__loading">
              <div className="kid-spinner"></div>
              Loading...
            </div>
          )}

          {!loadingSug && sug.length === 0 && (
            <div className="kid-suggest__empty">
              No results found.
            </div>
          )}

          {!loadingSug && sug.length > 0 && (
            <ul className="kid-suggest__list" role="listbox">
              {sug.map((p, idx) => (
                <li
                  key={p._id}
                  className={`kid-suggest__item ${idx === activeIdx ? "is-active" : ""}`}
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
                    <img src={getThumb(p)!} alt="" className="kid-suggest__thumb" loading="lazy" />
                  ) : (
                    <div className="kid-suggest__thumb kid-suggest__thumb--ph" />
                  )}

                  <div className="kid-suggest__meta">
                    <div className="kid-suggest__name">{p.name}</div>
                    {p.sku && <div className="kid-suggest__sku">SKU: {p.sku}</div>}
                  </div>
                  <div className="kid-suggest__price">{p.price ? `₹${p.price.toLocaleString()}` : ""}</div>
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
                navigate(`/products${query ? `?search=${encodeURIComponent(query)}` : ""}`);
              }}
            >
              View all results
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

  // ... [Keep your cartCount, search logic, user parsing, etc. intact] ...
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

  // ... [Rest of your useEffects for Search Logic and Listeners] ...
  // (Assuming you keep the exact logic for search fetching from your original code)
  
  // Re-implementing logic blocks for brevity in display, ensure you copy your existing logic here.
  // ... [Search Logic Code Block] ...
  // ... [Outside Click Logic Block] ...
  // ... [Scroll Logic Block] ...
  
  const [user, setUser] = useState<any | null>(null); // Simplified for display
  // Add your user parsing logic back here.

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10); // Trigger earlier
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handlers
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    setOpenSug(false);
    navigate(`/products${query ? `?search=${encodeURIComponent(query)}` : ""}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // ... [Keep your existing logic] ...
  };

  return (
    <header className={`kid-header ${scrolled ? "kid-header--scrolled" : ""}`}>
      <div className="kid-header__main">
        <div className="kid-header__container">
          {/* Logo */}
          <Link to="/" className="kid-logo" aria-label="Home">
            <img
              src={LOGO_IMG}
              alt="BAFNA TOYS"
              className="kid-logo__img"
              width={160} // Slightly smaller for professional look
              height={40}
            />
          </Link>

          {/* Desktop Search */}
          <div className="kid-search__desktop-wrapper">
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

          {/* Action Buttons */}
          <nav className="kid-actions" aria-label="Header actions">
            {/* Theme Toggle */}
            <button
              className="kid-action-btn kid-theme-btn"
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              type="button"
            >
              {theme === "light" ? <Icons.Moon /> : <Icons.Sun />}
            </button>

            {/* Account / Login */}
            {user ? (
              <button
                className="kid-action-btn"
                onClick={() => navigate("/my-account")}
                type="button"
              >
                <Icons.User />
                <span className="kid-btn-text">Account</span>
              </button>
            ) : (
              <Link className="kid-action-btn" to="/login">
                <Icons.Login />
                <span className="kid-btn-text">Login</span>
              </Link>
            )}

            {/* My Orders */}
            {user && (
              <Link className="kid-action-btn mobile-hide" to="/orders">
                <Icons.Box />
                <span className="kid-btn-text">Orders</span>
              </Link>
            )}

            {/* Cart Button */}
            <Link className="kid-cart-btn" to="/cart" aria-label="Cart">
              <div className="kid-cart-icon-wrap">
                <Icons.Cart />
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