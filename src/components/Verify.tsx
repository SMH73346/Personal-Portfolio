import { Fragment } from 'react';

/**
 * Renders a string, turning every `[VERIFY…]` marker into a visible chip so
 * placeholders are impossible to miss before launch.
 */
export function V({ children }: { children: string }) {
  const parts = children.split(/(\[VERIFY[^\]]*\])/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('[VERIFY') ? (
          <span key={i} className="verify">
            {p}
          </span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}
