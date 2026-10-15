import type { ReactNode } from 'react';
import type { Concept } from '../lib/concepts';
import { about, experience, person, process, services, skills, type Role } from '../lib/content';
import { V } from '../components/Verify';
import { ActHead } from './ActHead';

const SPREADS = ['About', 'Services', 'Skills', 'Experience', 'How I work'] as const;

function spreadLabel(concept: Concept, i: number) {
  switch (concept) {
    case 'folio':
      return `p. ${String(i + 2).padStart(2, '0')} — ${SPREADS[i]}`;
    case 'prism':
      return SPREADS[i];
    case 'terrain':
      return `02.${i + 1} — ${SPREADS[i]}`;
    case 'compile':
      return `// sheet ${String(i + 1).padStart(2, '0')} · ${SPREADS[i].toLowerCase().replace(/ /g, '-')}`;
    case 'maquette':
      return `${['L4', 'L3', 'L2', 'L1', 'G'][i]} — ${SPREADS[i]}`;
  }
}

function Spread({ concept, i, title, children, className = '' }: { concept: Concept; i: number; title: ReactNode; children: ReactNode; className?: string }) {
  const id = `spread-${i}`;
  return (
    <article className={`spread panel ${className}`} aria-labelledby={id} data-reveal>
      <p className="spread__label">{spreadLabel(concept, i)}</p>
      <h3 className="spread__title" id={id}>
        {title}
      </h3>
      <div className="spread__body">{children}</div>
      {concept === 'folio' && (
        <span className="spread__folio" aria-hidden="true">
          {String(i + 2).padStart(2, '0')}
        </span>
      )}
    </article>
  );
}

/* ---------- Experience: three renderings of the same data ---------- */

function TimelineList({ concept }: { concept: Concept }) {
  return (
    <ol className={`timeline timeline--${concept === 'prism' ? 'beam' : 'list'}`}>
      {experience.map((r) => (
        <li key={r.label} className="timeline__item" data-current={r.current || undefined}>
          <span className="timeline__date">{r.label}</span>
          <div className="timeline__main">
            <span className="timeline__title">{r.title}</span>
            <span className="timeline__org">
              <V>{r.org}</V>
            </span>
            <span className="timeline__note">{r.note}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** TERRAIN: honest bar chart — one bar per role, width = span in years. Dates are placeholders. */
function TimelineChart() {
  const start = 2021;
  const end = new Date().getFullYear() + 1;
  const years = Array.from({ length: end - start }, (_, i) => start + i);
  const span = (r: Role) => {
    const to = r.to === 'present' ? end : r.to + 1;
    return { col: r.from - start + 1, len: to - r.from };
  };
  return (
    <figure className="chart">
      <figcaption className="chart__cap">
        Career timeline, {start}–present. Dates are placeholders <V>[VERIFY]</V>.
      </figcaption>
      <div className="chart__plot" style={{ ['--cols' as string]: years.length }} role="list">
        {experience.map((r, i) => {
          const s = span(r);
          return (
            <div
              key={r.label}
              role="listitem"
              className="chart__bar"
              data-current={r.current || undefined}
              style={{ gridColumn: `${s.col} / span ${s.len}`, gridRow: i + 1 }}
            >
              <span className="chart__bar-label">
                <strong>{r.title}</strong> · <V>{r.org}</V> <span className="muted">{r.label}</span>
              </span>
            </div>
          );
        })}
        <div className="chart__axis" aria-hidden="true">
          {years.map((y) => (
            <span key={y}>{y}</span>
          ))}
        </div>
      </div>
    </figure>
  );
}

function Process({ concept }: { concept: Concept }) {
  if (concept === 'compile') {
    return (
      <ol className="buildlog">
        {process.map((p, i) => (
          <li key={p.id} className="buildlog__step">
            <span className="buildlog__prompt" aria-hidden="true">
              [{i + 1}/5]
            </span>
            <span className="buildlog__cmd">{p.title.toLowerCase()}</span>
            <span className="buildlog__text">{p.text}</span>
            <span className="buildlog__ok" aria-hidden="true">
              ✓ ok
            </span>
          </li>
        ))}
        <li className="buildlog__done" aria-hidden="true">
          → build complete · exit 0
        </li>
      </ol>
    );
  }
  return (
    <ol className="process">
      {process.map((p, i) => (
        <li key={p.id} className="process__step">
          <span className="process__n">{String(i + 1).padStart(2, '0')}</span>
          <span className="process__title">{p.title}</span>
          <span className="process__text">{p.text}</span>
        </li>
      ))}
    </ol>
  );
}

const TITLE: Record<Concept, ReactNode> = {
  folio: (
    <>
      The <em>story</em> so far
    </>
  ),
  prism: 'One beam, three disciplines',
  terrain: 'Story',
  compile: (
    <>
      Build <span className="mono-word">log</span>
    </>
  ),
  maquette: 'Four floors, one practice',
};

const KICKER: Record<Concept, ReactNode> = {
  folio: '02 — STORY · ABOUT / SERVICES / SKILLS / EXPERIENCE',
  prism: '02 / 04 — ABOUT',
  terrain: '02 — Story',
  compile: '<section> · 02/04 · about.md',
  maquette: 'SECTION B–B · DESCENDING',
};

export function Story({ concept }: { concept: Concept }) {
  return (
    <section id="story" className="act act--story" aria-labelledby="story-title">
      <div className="act__inner">
        <ActHead concept={concept} n={2} id="story-title" title={TITLE} kicker={KICKER} />

        <div className="spreads">
          <Spread concept={concept} i={0} title={concept === 'folio' ? <>About <em>me</em></> : 'About'} className="spread--about">
            <p className="spread__lede">{about.lede}</p>
            <div className="spread__cols">
              {about.body.map((p) => (
                <p key={p}>
                  <V>{p}</V>
                </p>
              ))}
            </div>
            <dl className="facts">
              <div>
                <dt>Role</dt>
                <dd>{person.role}</dd>
              </div>
              <div>
                <dt>Since</dt>
                <dd>
                  2021 <V>[VERIFY]</V>
                </dd>
              </div>
              <div>
                <dt>Open to</dt>
                <dd>Remote roles · Freelance</dd>
              </div>
              <div>
                <dt>Based</dt>
                <dd>
                  <V>[VERIFY: city, timezone]</V>
                </dd>
              </div>
            </dl>
          </Spread>

          <Spread concept={concept} i={1} title="Services" className="spread--services">
            <ul className="services">
              {services.map((s) => (
                <li key={s.id} className={`service service--${s.id}`}>
                  <h4 className="service__title">{s.title}</h4>
                  <ul className="service__lines">
                    {s.lines.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </Spread>

          <Spread concept={concept} i={2} title="Skills" className="spread--skills">
            <div className="skills">
              {skills.map((g) => (
                <div key={g.group} className="skills__group">
                  <h4 className="skills__head">{g.group}</h4>
                  <ul className="skills__list">
                    {g.items.map((s) => (
                      <li key={s}>
                        <V>{s}</V>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Spread>

          <Spread concept={concept} i={3} title="Experience" className="spread--exp">
            {concept === 'terrain' ? <TimelineChart /> : <TimelineList concept={concept} />}
          </Spread>

          <Spread concept={concept} i={4} title={concept === 'folio' ? <>How I <em>work</em></> : 'How I work'} className="spread--process">
            <Process concept={concept} />
          </Spread>
        </div>
      </div>
    </section>
  );
}
