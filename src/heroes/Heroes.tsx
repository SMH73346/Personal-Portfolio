import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Concept } from '../lib/concepts';
import { person } from '../lib/content';
import { store } from '../lib/store';
import { V } from '../components/Verify';

/**
 * The five hero layouts, transcribed from "Portfolio Concepts.dc.html".
 * Desktop sizes are expressed in `--s` units (1 unit = 1px at 1440 wide) so the
 * composition matches the 1440×900 mock and scales with the viewport. Mobile
 * follows the 375 mock in plain px. The 3D object is drawn by the persistent
 * WebGL scene into the space each hero leaves empty (`.hero__stage`).
 */

function Line({ children }: { children: React.ReactNode }) {
  return (
    <span className="hl">
      <span className="hl__in">{children}</span>
    </span>
  );
}

function Ctas({ primary = 'Explore Projects', secondary = "Let's Work Together", className = '' }) {
  return (
    <div className={`hero__ctas ${className}`}>
      <a href="#work" className="btn btn--primary">
        {primary}
      </a>
      <a href="#contact" className="btn btn--secondary">
        {secondary}
      </a>
    </div>
  );
}

function FolioHero() {
  return (
    <section id="hero" className="hero hero--folio" aria-labelledby="hero-title">
      <div className="hero__grid d-only" aria-hidden="true" />
      <span className="crop crop--tl" aria-hidden="true" />
      <span className="crop crop--tr" aria-hidden="true" />
      <span className="crop crop--bl" aria-hidden="true" />
      <span className="crop crop--br" aria-hidden="true" />
      <div className="hero__top">
        <p className="hero__kicker">
          <span className="d-only">01 — HERO · FRONT-END / WORDPRESS / SHOPIFY</span>
          <span className="m-only">
            01 — HERO
            <br />
            FRONT-END
            <br />
            WORDPRESS
            <br />
            SHOPIFY
          </span>
        </p>
        <div className="hero__stage m-only" aria-hidden="true" />
      </div>
      <h1 id="hero-title" className="hero__title">
        <Line>
          Turning <em>ideas</em>
        </Line>{' '}
        <Line>into high-quality</Line> <Line>web experiences.</Line>
      </h1>
      <div className="hero__body">
        <p className="hero__lede">
          <span className="d-only">
            Web developer specialising in Front-End, WordPress and Shopify. Building for the web since 2021 <V>[VERIFY: 4+ years]</V>. Open to
            remote roles and freelance projects.
          </span>
          <span className="m-only">
            Front-End, WordPress &amp; Shopify developer since 2021 <V>[VERIFY]</V>.
          </span>
        </p>
        <Ctas />
      </div>
      <div className="hero__foot">
        <span>01 / 04</span>
        <span className="d-only">
          <V>{person.availability}</V>
        </span>
        <span className="d-only">scroll ↓</span>
        <span className="m-only">scroll bends the sheet ↓</span>
      </div>
    </section>
  );
}

function PrismHero() {
  return (
    <section id="hero" className="hero hero--prism" aria-labelledby="hero-title">
      <div className="hero__stage" aria-hidden="true" />
      <ul className="prism-labels d-only" aria-label="Disciplines">
        <li className="c-fe">FRONT-END</li>
        <li className="c-wp">WORDPRESS</li>
        <li className="c-shop">SHOPIFY</li>
      </ul>
      <div className="hero__fade m-only" aria-hidden="true" />
      <h1 id="hero-title" className="hero__title">
        <Line>Turning ideas into</Line> <Line>high-quality</Line> <Line>web experiences</Line>
      </h1>
      <p className="hero__lede d-only">
        Web developer — Front-End, WordPress, Shopify. Building for the web since 2021 <V>[VERIFY: 4+ years]</V>. Remote roles &amp; freelance.
      </p>
      <p className="hero__lede m-only">
        <span className="c-fe">Front-End</span> · <span className="c-wp">WordPress</span> · <span className="c-shop">Shopify</span>
        <br />
        Building for the web since 2021 <V>[VERIFY]</V>.
      </p>
      <Ctas secondary="Let's Work Together →" />
      <div className="hero__foot d-only">
        <span>01 / 04</span>
        <span>SCROLL TO SPLIT THE BEAM</span>
      </div>
    </section>
  );
}

function TerrainHero() {
  return (
    <section id="hero" className="hero hero--terrain" aria-labelledby="hero-title">
      <div className="hero__fade" aria-hidden="true" />
      <div className="hero__grid d-only" aria-hidden="true" />
      <p className="hero__kicker">01 — Hero</p>
      <h1 id="hero-title" className="hero__title">
        <Line>Turning ideas</Line> <Line>into high-quality</Line> <Line>web experi&shy;ences.</Line>
      </h1>
      <div className="hero__meta">
        <div className="hero__meta-cell">
          <div className="muted">Role</div>Web Developer
        </div>
        <div className="hero__meta-cell">
          <div className="muted">Stack</div>
          <span className="d-only">WordPress · Shopify · React</span>
          <span className="m-only">WP · Shopify · React</span>
        </div>
        <div className="hero__meta-cell d-only">
          <div className="muted">Since</div>2021 <V>[VERIFY]</V>
        </div>
        <Ctas className="hero__meta-ctas" />
      </div>
      <div className="hero__stage" aria-hidden="true" />
    </section>
  );
}

function CompileReadout() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    let last = -1;
    const tick = () => {
      const v = Math.round(store.compiled * 100);
      if (v !== last && ref.current) {
        ref.current.textContent = `${v}%`;
        last = v;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <span className="compile-readout" aria-hidden="true">
      ┌ compiled: <span ref={ref}>0%</span>
    </span>
  );
}

function CompileHero() {
  return (
    <section id="hero" className="hero hero--compile" aria-labelledby="hero-title">
      <div className="hero__stage" aria-hidden="true" />
      <div className="compile-annot d-only" aria-hidden="true">
        <CompileReadout />
        <span className="compile-dim" />
        <span className="compile-dim__label">// slab · hover to compile faces</span>
      </div>
      <p className="hero__kicker">
        &lt;h1&gt; · 01/04<span className="d-only"> · x:080 y:150</span>
      </p>
      <h1 id="hero-title" className="hero__title">
        <span className="hero__title-bg">
          Turning <span className="mono-word">ideas</span> into high-quality web experiences.
        </span>
      </h1>
      <div className="hero__body">
        <p className="hero__lede">
          <span className="d-only">
            Web developer — Front-End, WordPress, Shopify. Shipping sites since 2021 <V>[VERIFY: 4+ years]</V>. Available for remote roles and
            freelance builds.
          </span>
          <span className="m-only">
            Front-End · WordPress · Shopify. Since 2021 <V>[VERIFY]</V>.
          </span>
        </p>
        <Ctas secondary="$ lets-work-together" />
      </div>
      <div className="hero__foot d-only">
        <span>BUILD 01 — HERO</span>
        <span>scroll ↓ to compile</span>
      </div>
    </section>
  );
}

const FLOORS = [
  { tag: 'L4', text: 'Turning ideas' },
  { tag: 'L3', text: 'into high-' },
  { tag: 'L2', text: 'quality web' },
  { tag: 'L1', text: 'experiences.' },
];

function MaquetteHero() {
  return (
    <section id="hero" className="hero hero--maquette" aria-labelledby="hero-title">
      {createPortal(<div className="ground-underlay" aria-hidden="true" />, document.body)}
      <div className="hero__top m-only">
        <p className="hero__kicker">
          ELEVATION A<br />
          1:400
          <br />4 LEVELS
        </p>
        <div className="hero__stage" aria-hidden="true" />
      </div>
      <h1 id="hero-title" className="hero__title">
        <span className="d-only floors">
          {FLOORS.map((f) => (
            <span className="floor" key={f.tag}>
              <span className="floor__tag" aria-hidden="true">
                {f.tag}
              </span>
              <span className="floor__text">{f.text}</span>
            </span>
          ))}
        </span>
        <span className="m-only">Turning ideas into high-quality web experiences.</span>
      </h1>
      <div className="hero__body">
        <p className="hero__lede">
          <span className="d-only">
            Web developer — Front-End, WordPress and Shopify. Building for the web since 2021 <V>[VERIFY: 4+ years]</V>.
          </span>
          <span className="m-only">
            Front-End, WordPress &amp; Shopify developer since 2021 <V>[VERIFY]</V>.
          </span>
        </p>
        <Ctas />
      </div>
      <p className="maquette-caption d-only" aria-hidden="true">
        <span>MODEL 1:200</span>
        <span>hover → windows lit</span>
      </p>
      <div className="hero__foot d-only">
        <span>LEVEL 04 / ROOF</span>
        <span>N ↑</span>
        <span>scroll to descend ↓</span>
      </div>
    </section>
  );
}

export function Hero({ concept }: { concept: Concept }) {
  switch (concept) {
    case 'folio':
      return <FolioHero />;
    case 'prism':
      return <PrismHero />;
    case 'terrain':
      return <TerrainHero />;
    case 'compile':
      return <CompileHero />;
    case 'maquette':
      return <MaquetteHero />;
  }
}
