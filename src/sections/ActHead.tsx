import type { ReactNode } from 'react';
import type { Concept } from '../lib/concepts';

type Props = { concept: Concept; n: number; id: string; title: Record<Concept, ReactNode>; kicker: Record<Concept, ReactNode> };

/** Section opener. Same markup everywhere; each concept styles it differently. */
export function ActHead({ concept, n, id, title, kicker }: Props) {
  return (
    <header className="act-head" data-reveal>
      <span className="act-head__n" aria-hidden="true">
        0{n}
      </span>
      <p className="act-head__kicker">{kicker[concept]}</p>
      <h2 className="act-head__title" id={id}>
        {title[concept]}
      </h2>
      <span className="act-head__folio" aria-hidden="true">
        0{n} / 04
      </span>
    </header>
  );
}
