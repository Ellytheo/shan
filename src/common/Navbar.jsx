import { useEffect, useRef, useState } from "react";
import { IoCloseOutline, IoMenuOutline } from "react-icons/io5";
import logoImage from "../images/logo.png";

// ─── styles (plain JS object, injected as <style> tag) ───────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap');

  /* ── NAV WRAPPER (provides the side margins so nav floats) ── */
  .sv-nav-wrap {
    position: fixed;
    top: 4px;
    left: 0;
    right: 0;
    z-index: 1000;
    padding: 0 20px;
    pointer-events: none;  /* let clicks pass through the wrapper gap */
    font-family: 'Inter', sans-serif;
  }

  /* ── NAV ROOT (the visible pill) ── */
  .sv-nav {
    pointer-events: all;
    background: rgba(185, 245, 235, 0.12);
    backdrop-filter: blur(28px) saturate(180%);
    -webkit-backdrop-filter: blur(28px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.31);
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.44);
    overflow: visible;
    position: relative;
  }

  /* glass sheen overlay */
  .sv-nav::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 20px;
    background: linear-gradient(
      135deg,
      rgba(255,255,255,0.35) 0%,
      rgba(255,255,255,0.08) 40%,
      rgba(255,255,255,0.02) 100%
    );
    pointer-events: none;
  }

  /* ── INNER WRAPPER ── */
  .sv-nav__inner {
    padding: 0 20px;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
  }

  /* ── LOGO ── */
  .sv-nav__logo {
    display: flex;
    align-items: center;
    gap: 20px;
    text-decoration: none;
    flex-shrink: 0;
  }

  .sv-nav__logo-img {
    height: 66px;
    width: auto;
    object-fit: contain;
    border-radius: 10px;
    transition: transform 0.3s ease, filter 0.3s ease;
    filter: drop-shadow(0 0 8px rgba(173,216,230,0.6)) drop-shadow(0 0 16px rgba(135,206,250,0.4));
  }

  .sv-nav__logo:hover .sv-nav__logo-img {
    transform: scale(1.05);
    filter: drop-shadow(0 0 12px rgba(135,206,250,0.7)) drop-shadow(0 0 20px rgba(173,216,230,0.5));
  }

  .sv-nav__logo-text {
    font-family: 'Playfair Display', serif;
    font-size: 50px;
    font-weight: 700;
    color: #0F8F46;
    letter-spacing: 0.75px;
    line-height: 1;
  }

  .sv-nav__logo-sub {
    font-family: 'Inter', sans-serif;
    font-size: 9px;
    font-weight: 500;
    color: #F58220;
    letter-spacing: 2px;
    text-transform: uppercase;
    display: block;
    margin-top: 3px;
  }

  /* ── DESKTOP LINKS ── */
  .sv-nav__links {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  @media (max-width: 768px) {
    .sv-nav__links { display: none; }
  }

  .sv-nav__link {
    position: relative;
    font-family: 'My Soul', cursive, 'Inter', sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #F58220;
    text-decoration: none;
    padding: 8px 14px;
    border-radius: 8px;
    transition: color 0.25s ease, background 0.25s ease, transform 0.2s ease;
  }

  .sv-nav__link::after {
    content: '';
    position: absolute;
    bottom: 3px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 3px;
    background: linear-gradient(90deg, #0F8F46, #F58220, #0F8F46);
    border-radius: 2px;
    transition: width 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .sv-nav__link:hover {
    color: #0F8F46;
    transform: translateY(-2px);
  }

  .sv-nav__link:hover::after {
    width: 60%;
  }

  .sv-nav__link--active {
    color: #0F8F46 !important;
  }

  .sv-nav__link--active::after {
    width: 60% !important;
    box-shadow: 0 0 8px rgba(15,143,70,0.3);
  }

  /* ── HAMBURGER ── */
  .sv-nav__hamburger {
    display: none;
    background: transparent;
    border: none;
    color: #0F8F46;
    font-size: 32px;
    cursor: pointer;
    padding: 4px 8px;
    transition: color 0.3s ease, transform 0.2s ease;
    line-height: 1;
  }

  .sv-nav__hamburger:hover {
    color: #F58220;
    transform: scale(1.1);
  }

  @media (max-width: 768px) {
    .sv-nav__hamburger { display: flex; align-items: center; }
  }

  /* ── MOBILE DRAWER ── */
  .sv-nav__drawer {
    display: none;
  }

  @media (max-width: 768px) {
    .sv-nav__drawer {
      display: flex;
      flex-direction: column;
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      left: 0;
      background: rgba(185,245,235,0.75);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 16px;
      box-shadow: 0 12px 32px rgba(31,38,135,0.18);
      padding: 0 16px;
      gap: 0;

      max-height: 0;
      overflow: hidden;
      opacity: 0;
      transition: max-height 0.4s cubic-bezier(0.25,0.8,0.25,1),
                  opacity 0.3s ease,
                  padding 0.35s ease;
    }

    .sv-nav__drawer--open {
      max-height: 420px;
      opacity: 1;
      padding: 12px 16px 18px;
    }
  }

  .sv-nav__drawer-link {
    font-family: 'My Soul', cursive, 'Inter', sans-serif;
    font-size: 20px;
    font-weight: 600;
    color: #F58220;
    text-decoration: none;
    padding: 11px 8px;
    border-bottom: 1px solid rgba(15,143,70,0.12);
    display: flex;
    align-items: center;
    gap: 10px;
    transition: color 0.2s ease, padding-left 0.2s ease;
    background: transparent;
    text-shadow: 0 1px 2px rgba(255,255,255,0.8);
  }

  .sv-nav__drawer-link:last-child { border-bottom: none; }

  .sv-nav__drawer-link:hover,
  .sv-nav__drawer-link--active {
    color: #0F8F46;
    padding-left: 14px;
    background: rgba(15,143,70,0.05);
  }

  .sv-nav__drawer-link--active {
    font-weight: 700;
  }

  .sv-nav__drawer-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #0F8F46;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .sv-nav__drawer-link--active .sv-nav__drawer-dot,
  .sv-nav__drawer-link:hover .sv-nav__drawer-dot {
    opacity: 1;
  }
`;

// ─── nav items ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "home",      label: "Home" },
  { id: "about",     label: "About" },
  { id: "rooms",     label: "Rooms" },
  { id: "amenities", label: "Amenities" },
  { id: "contact",   label: "Contact" },
  { id: "gallery",   label: "Gallery" },
];

// ─── component ───────────────────────────────────────────────────────────────
const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");
  const styleRef = useRef(null);

  // inject styles once
  useEffect(() => {
    if (!styleRef.current) {
      const tag = document.createElement("style");
      tag.id = "sv-nav-styles";
      tag.textContent = css;
      document.head.appendChild(tag);
      styleRef.current = tag;
    }
    return () => {
      // leave style tag in place to avoid flash on HMR
    };
  }, []);

  // scroll spy
  useEffect(() => {
    const ids = NAV_ITEMS.map((i) => i.id);
    const handleScroll = () => {
      const offset = window.scrollY + 90;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= offset) current = id;
      }
      setActive(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // close drawer on outside click
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!e.target.closest(".sv-nav")) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const handleLinkClick = () => setOpen(false);

  return (
    <div className="sv-nav-wrap">
      <nav className="sv-nav" aria-label="Main navigation">
        <div className="sv-nav__inner">

          {/* ── LOGO ── */}
          <a className="sv-nav__logo" href="#home" aria-label="Shanvilla – go to home">
            <img
              className="sv-nav__logo-img"
              src={logoImage}
              alt="Shanvilla logo"
            />
          </a>

          {/* ── DESKTOP LINKS ── */}
          <nav className="sv-nav__links" aria-label="Site sections">
            {NAV_ITEMS.map(({ id, label }) => (
              <a
                key={id}
                className={`sv-nav__link${active === id ? " sv-nav__link--active" : ""}`}
                href={`#${id}`}
                aria-current={active === id ? "page" : undefined}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* ── HAMBURGER ── */}
          <button
            className="sv-nav__hamburger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="sv-mobile-drawer"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <IoCloseOutline /> : <IoMenuOutline />}
          </button>
        </div>

        {/* ── MOBILE DRAWER ── */}
        <div
          id="sv-mobile-drawer"
          className={`sv-nav__drawer${open ? " sv-nav__drawer--open" : ""}`}
          role="menu"
          aria-hidden={!open}
        >
          {NAV_ITEMS.map(({ id, label }) => (
            <a
              key={id}
              className={`sv-nav__drawer-link${active === id ? " sv-nav__drawer-link--active" : ""}`}
              href={`#${id}`}
              role="menuitem"
              aria-current={active === id ? "page" : undefined}
              onClick={handleLinkClick}
            >
              <span className="sv-nav__drawer-dot" aria-hidden="true" />
              {label}
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;