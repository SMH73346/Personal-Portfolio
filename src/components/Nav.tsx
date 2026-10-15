import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CONCEPT_META, type Concept } from '../lib/concepts';
import { useMotion } from '../lib/motion';

function Brand({ concept }: { concept: Concept }) {
  switch (concept) {
    case 'folio':
      return (
        <>
          Folio<i>/</i>SMH
        </>
      );
    case 'prism':
      return (
        <>
          <span className="d-only">S · M · HUSSAIN</span>
          <span className="m-only">S·M·HUSSAIN</span>
        </>
      );
    case 'terrain':
      return <>S.M. HUSSAIN</>;
    case 'compile':
      return (
        <>
          <span className="lime">~/</span>
          <span className="d-only">smhussain</span>
          <span className="m-only">smh</span>
        </>
      );
    case 'maquette':
      return (
        <>
          <span className="d-only">SYED M. HUSSAIN</span>
          <span className="m-only">S.M. HUSSAIN</span>
        </>
      );
  }
}

const SUB: Partial<Record<Concept, ReactNode>> = {
  folio: 'ISSUE 01 · WEB DEVELOPER',
  terrain: 'Web Developer — FE / WP / Shopify',
};

const MENU_GLYPH: Record<Concept, string> = { folio: 'MENU', prism: '≡', terrain: '☰', compile: '≡', maquette: 'MENU' };

export function Nav({ concept }: { concept: Concept }) {
  const { motion, toggle } = useMotion();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const menuBtn = useRef<HTMLButtonElement>(null);
  const meta = CONCEPT_META[concept];
  const base = `/${concept}`;

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        menuBtn.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const links = [
    { hash: '#work', label: meta.nav.work },
    { hash: '#story', label: meta.nav.story },
    { hash: '#contact', label: meta.nav.contact },
  ];

  const motionLong = motion ? 'Motion: On' : 'Motion: Off';
  const motionShort = motion ? 'MOTION ON' : 'MOTION OFF';

  return (
    <header className="site-nav" data-scrolled={scrolled || undefined} data-open={open || undefined}>
      <nav aria-label="Primary" className="site-nav__inner">
        <div className="site-nav__brandwrap">
          <Link to={base} className="site-nav__brand" aria-label={`Syed Muhammad Hussain — home`} onClick={() => window.scrollTo({ top: 0 })}>
            <Brand concept={concept} />
          </Link>
          {SUB[concept] && <span className="site-nav__sub">{SUB[concept]}</span>}
        </div>
        <ul className="site-nav__links">
          {links.map((l) => (
            <li key={l.hash}>
              <Link to={{ pathname: base, hash: l.hash }}>{l.label}</Link>
            </li>
          ))}
        </ul>
        <div className="site-nav__actions">
          <button type="button" className="motion-btn" aria-pressed={motion} onClick={toggle} aria-label="Toggle motion">
            <span className="d-only" aria-hidden="true">
              {motionLong}
            </span>
            <span className="m-only" aria-hidden="true">
              {motionShort}
            </span>
          </button>
          <button
            ref={menuBtn}
            type="button"
            className="menu-btn"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span aria-hidden="true">{open ? '✕' : MENU_GLYPH[concept]}</span>
          </button>
        </div>
      </nav>
      <div id={menuId} className="site-nav__drawer" hidden={!open}>
        <ul>
          {links.map((l, i) => (
            <li key={l.hash}>
              <Link to={{ pathname: base, hash: l.hash }} onClick={() => setOpen(false)}>
                <span className="site-nav__drawer-n">0{i + 2}</span>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
