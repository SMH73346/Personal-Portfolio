import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CONCEPTS, CONCEPT_META, type Concept } from '../lib/concepts';

/**
 * Review tool: switch between the five design directions on the same route.
 * Remove (or hide behind an env flag) once a concept is chosen.
 */
export function ConceptSwitcher({ concept }: { concept: Concept }) {
  const { pathname, hash } = useLocation();
  const [open, setOpen] = useState(false);
  const rest = pathname.replace(/^\/[^/]+/, '');

  if (import.meta.env.VITE_HIDE_SWITCHER === '1') return null;

  return (
    <div className="switcher" data-open={open || undefined}>
      <button type="button" className="switcher__toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="switcher__code">{CONCEPT_META[concept].code}</span> {CONCEPT_META[concept].label}
        <span aria-hidden="true"> {open ? '▾' : '▴'}</span>
        <span className="sr-only"> — switch design concept</span>
      </button>
      {open && (
        <ul className="switcher__list" aria-label="Design concepts">
          {CONCEPTS.map((c) => (
            <li key={c}>
              <Link to={`/${c}${rest}${hash}`} aria-current={c === concept ? 'page' : undefined} onClick={() => setOpen(false)}>
                <span className="switcher__code">{CONCEPT_META[c].code}</span>
                <span>
                  {CONCEPT_META[c].label} <small>— {CONCEPT_META[c].style}</small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
