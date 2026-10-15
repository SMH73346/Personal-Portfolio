import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import type { Concept } from '../lib/concepts';
import { caseStudies, featured } from '../lib/content';
import { V } from '../components/Verify';
import { Shot } from '../sections/Projects';

const SECTION_LABEL: Record<Concept, (n: number, t: string) => string> = {
  folio: (n, t) => `§${n} ${t}`,
  prism: (_n, t) => t,
  terrain: (n, t) => `${String(n).padStart(2, '0')} — ${t}`,
  compile: (n, t) => `// ${String(n).padStart(2, '0')} ${t.toLowerCase()}`,
  maquette: (n, t) => `${String.fromCharCode(64 + n)} — ${t}`,
};

export function CaseStudyPage() {
  const { concept, slug } = useParams() as { concept: Concept; slug: string };
  const idx = featured.findIndex((p) => p.slug === slug);
  const project = featured[idx];
  const cs = caseStudies[slug];

  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (project) document.title = `${project.name} — Case study — Syed Muhammad Hussain`;
  }, [project]);

  if (!project || !cs) return <Navigate to={`/${concept}#work`} replace />;

  const prev = featured[(idx - 1 + featured.length) % featured.length];
  const next = featured[(idx + 1) % featured.length];
  const L = SECTION_LABEL[concept];

  const meta = [
    { k: 'Role', v: project.role },
    { k: 'Stack', v: cs.stack.join(' · ') },
    { k: 'Year', v: project.year },
    { k: 'Category', v: `${project.category} — ${project.kind}` },
  ];

  return (
    <main id="main" className="case" tabIndex={-1}>
      <div className="case__inner">
        <Link to={`/${concept}#work`} className="case__back">
          ← All work
        </Link>

        <header className="case__head">
          <p className="case__kicker">
            Case study {String(idx + 1).padStart(2, '0')} / {String(featured.length).padStart(2, '0')} · {project.category}
          </p>
          <h1 className="case__title">{project.name}</h1>
          <p className="case__stand">
            <V>{cs.overview}</V>
          </p>
          <dl className="case__meta">
            {meta.map((m) => (
              <div key={m.k}>
                <dt>{m.k}</dt>
                <dd>
                  <V>{m.v}</V>
                </dd>
              </div>
            ))}
            <div>
              <dt>Link</dt>
              <dd>
                {cs.links[0]?.href ? (
                  <a href={cs.links[0].href} target="_blank" rel="noreferrer">
                    {cs.links[0].label} ↗
                  </a>
                ) : (
                  <V>{cs.links[0]?.label ?? '[VERIFY]'}</V>
                )}
              </dd>
            </div>
          </dl>
        </header>

        <figure className="case__hero">
          <Shot project={project} />
          <figcaption>
            <V>{`${project.name} — home page [VERIFY: screenshot]`}</V>
          </figcaption>
        </figure>

        <div className="case__grid">
          <article className="case__body">
            <section aria-labelledby="cs-overview">
              <h2 id="cs-overview">{L(1, 'Overview')}</h2>
              <p>
                <V>{cs.overview}</V>
              </p>
            </section>
            <section aria-labelledby="cs-challenge">
              <h2 id="cs-challenge">{L(2, 'Challenge')}</h2>
              <p>
                <V>{cs.challenge}</V>
              </p>
            </section>
            <section aria-labelledby="cs-role">
              <h2 id="cs-role">{L(3, 'My role')}</h2>
              <blockquote className="pull">
                <p>
                  <V>{cs.role}</V>
                </p>
              </blockquote>
            </section>
            <section aria-labelledby="cs-solution">
              <h2 id="cs-solution">{L(4, 'Solution')}</h2>
              {cs.solution.map((s) => (
                <p key={s}>
                  <V>{s}</V>
                </p>
              ))}
            </section>
            <section aria-labelledby="cs-visuals">
              <h2 id="cs-visuals">{L(5, 'Visuals')}</h2>
              <div className="case__visuals">
                {cs.visuals.map((v, i) => (
                  <figure key={v.caption} className={i === 0 ? 'wide' : ''}>
                    <Shot project={project} size={i === 0 ? 'lg' : 'sm'} />
                    <figcaption>
                      <span className="fig-n">Fig. {i + 1}</span> <V>{v.caption}</V>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
            <section aria-labelledby="cs-results">
              <h2 id="cs-results">{L(6, 'Results')}</h2>
              <ul className="case__list">
                {cs.results.map((r) => (
                  <li key={r}>
                    <V>{r}</V>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-labelledby="cs-links">
              <h2 id="cs-links">{L(7, 'Links')}</h2>
              <ul className="case__list">
                {cs.links.map((l) => (
                  <li key={l.label}>
                    {l.href ? (
                      <a href={l.href} target="_blank" rel="noreferrer">
                        {l.label} ↗
                      </a>
                    ) : (
                      <V>{l.label}</V>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </article>

          <aside className="case__aside" aria-label="Project details">
            <div className="case__aside-inner">
              <h2 className="case__aside-title">Stack</h2>
              <ul className="stack">
                {cs.stack.map((s) => (
                  <li key={s}>
                    <V>{s}</V>
                  </li>
                ))}
              </ul>
              <h2 className="case__aside-title">Role</h2>
              <p>
                <V>{project.role}</V>
              </p>
              <h2 className="case__aside-title">Year</h2>
              <p>
                <V>{project.year}</V>
              </p>
            </div>
          </aside>
        </div>

        <nav className="case__pager" aria-label="More case studies">
          <Link to={`/${concept}/work/${prev.slug}`} className="case__pager-link" rel="prev">
            <span className="case__pager-dir">← Previous</span>
            <span className="case__pager-name">{prev.name}</span>
          </Link>
          <Link to={`/${concept}/work/${next.slug}`} className="case__pager-link case__pager-link--next" rel="next">
            <span className="case__pager-dir">Next →</span>
            <span className="case__pager-name">{next.name}</span>
          </Link>
        </nav>
      </div>
    </main>
  );
}
