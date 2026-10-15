import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Concept } from '../lib/concepts';
import { allProjects, CATEGORIES, featured, selectedWork, type Category, type Project } from '../lib/content';
import { store } from '../lib/store';
import { V } from '../components/Verify';
import { ActHead } from './ActHead';

const catClass = (c: Category) => ({ 'Front-End': 'fe', WordPress: 'wp', Shopify: 'shop', Demo: 'demo' })[c];

/**
 * Screenshot slot. No screenshots were supplied, so this renders a labelled
 * placeholder in the concept's style. Swap for <img> when real shots exist.
 */
export function Shot({ project, size = 'lg' }: { project: Project; size?: 'lg' | 'sm' }) {
  return (
    <div className={`shot shot--${size} cat-${catClass(project.category)}`} role="img" aria-label={`${project.name} — screenshot placeholder`}>
      <div className="shot__wire" aria-hidden="true">
        <span className="shot__bar" />
        <span className="shot__hero" />
        <span className="shot__row">
          <i />
          <i />
          <i />
        </span>
      </div>
      <div className="shot__face" aria-hidden="true">
        <span className="shot__name">{project.name}</span>
        <span className="shot__note">Screenshot [VERIFY]</span>
      </div>
    </div>
  );
}

function setHover(slug: string | null) {
  store.hovered = slug;
  store.hoveredIndex = slug ? allProjects.findIndex((p) => p.slug === slug) : -1;
}

function FeaturedCard({ concept, project, i }: { concept: Concept; project: Project; i: number }) {
  const ref = useRef<HTMLElement>(null);

  // COMPILE (mobile): previews resolve when scrolled into view.
  useEffect(() => {
    if (concept !== 'compile' || !ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(([e]) => el.toggleAttribute('data-inview', e.isIntersecting), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [concept]);

  return (
    <article
      ref={ref}
      className={`feature panel cat-${catClass(project.category)}`}
      data-reveal
      onPointerEnter={() => setHover(project.slug)}
      onPointerLeave={() => setHover(null)}
      onFocus={() => setHover(project.slug)}
      onBlur={() => setHover(null)}
    >
      <Link to={`work/${project.slug}`} className="feature__link" aria-labelledby={`feat-${project.slug}`}>
        <Shot project={project} />
      </Link>
      <div className="feature__meta">
        <span className="feature__n">{concept === 'folio' ? `Fig. ${i + 1}` : String(i + 1).padStart(2, '0')}</span>
        <span className="feature__cat">
          {project.category} — {project.kind}
        </span>
      </div>
      <h3 className="feature__title" id={`feat-${project.slug}`}>
        <Link to={`work/${project.slug}`}>{project.name}</Link>
      </h3>
      <p className="feature__role">
        <V>{project.role}</V>
      </p>
      <Link to={`work/${project.slug}`} className="feature__cta" aria-hidden="true" tabIndex={-1}>
        Read case study →
      </Link>
    </article>
  );
}

function IndexRow({ project, n, active }: { project: Project; n: number; active: boolean }) {
  return (
    <li
      className={`irow cat-${catClass(project.category)}`}
      data-active={active || undefined}
      data-demo={project.demo || undefined}
      onPointerEnter={() => setHover(project.slug)}
      onPointerLeave={() => setHover(null)}
    >
      <span className="irow__n" aria-hidden="true">
        {String(n).padStart(2, '0')}
      </span>
      <span className="irow__name">{project.name}</span>
      <span className="irow__cat">
        <span className="cat-dot" aria-hidden="true" />
        {project.category}
      </span>
      <span className="irow__role">
        {project.demo ? <strong className="demo-tag">Technical Demo — Local Development</strong> : null}
        <V>{project.role}</V>
      </span>
      <span className="irow__link">
        {project.url ? (
          <a href={project.url} target="_blank" rel="noreferrer" onFocus={() => setHover(project.slug)} onBlur={() => setHover(null)}>
            Visit <span className="sr-only">{project.name}</span> ↗
          </a>
        ) : project.demo ? (
          <span className="muted">Local only</span>
        ) : (
          <V>[VERIFY: URL]</V>
        )}
      </span>
    </li>
  );
}

const TITLE: Record<Concept, ReactNode> = {
  folio: (
    <>
      Selected <em>work</em>
    </>
  ),
  prism: 'Work, by light',
  terrain: 'Work',
  compile: (
    <>
      ./<span className="mono-word">work</span>
    </>
  ),
  maquette: 'Floor plan: work',
};
const KICKER: Record<Concept, ReactNode> = {
  folio: '03 — PROJECTS · FEATURE STORIES & INDEX',
  prism: '03 / 04 — PROJECTS',
  terrain: '03 — Projects',
  compile: '<section> · 03/04 · ls ./work',
  maquette: 'PLAN — LEVEL 02',
};

export function Projects({ concept }: { concept: Concept }) {
  const [filter, setFilter] = useState<Category | 'All'>('All');
  const [hover, setHoverState] = useState<string | null>(null);
  const rows = useMemo(() => (filter === 'All' ? selectedWork : selectedWork.filter((p) => p.category === filter)), [filter]);
  const preview = selectedWork.find((p) => p.slug === hover) ?? null;

  // Mirror the shared store into React state for the HTML preview card.
  useEffect(() => {
    let raf = 0;
    let last: string | null = null;
    const tick = () => {
      const h = store.hovered && selectedWork.some((p) => p.slug === store.hovered) ? store.hovered : null;
      if (h !== last) {
        last = h;
        setHoverState(h);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section id="work" className="act act--work" aria-labelledby="work-title">
      <div className="act__inner">
        <ActHead concept={concept} n={3} id="work-title" title={TITLE} kicker={KICKER} />

        <h3 className="sublabel" data-reveal>
          Featured case studies
        </h3>
        <div className="features">
          {featured.map((p, i) => (
            <FeaturedCard key={p.slug} concept={concept} project={p} i={i} />
          ))}
        </div>

        <div className="index panel" data-reveal>
          <div className="index__head">
            <h3 className="sublabel" id="index-title">
              Selected work index
            </h3>
            <div className="filters" role="group" aria-label="Filter by category">
              {(['All', ...CATEGORIES] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`chip ${c === 'All' ? '' : `cat-${catClass(c)}`}`}
                  aria-pressed={filter === c}
                  onClick={() => setFilter(c)}
                >
                  {c !== 'All' && <span className="cat-dot" aria-hidden="true" />}
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="index__body">
            <ul className="irows" aria-labelledby="index-title" aria-live="polite">
              <li className="irow irow--head" aria-hidden="true">
                <span className="irow__n">No.</span>
                <span className="irow__name">Project</span>
                <span className="irow__cat">Category</span>
                <span className="irow__role">Role</span>
                <span className="irow__link">Link</span>
              </li>
              {rows.map((p) => (
                <IndexRow key={p.slug} project={p} n={selectedWork.indexOf(p) + 4} active={hover === p.slug} />
              ))}
              {rows.length === 0 && <li className="irow irow--empty">No projects in this category yet.</li>}
            </ul>
            <div className="index__preview d-only" aria-hidden="true" data-show={preview ? '' : undefined}>
              {preview && <Shot project={preview} size="sm" />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
