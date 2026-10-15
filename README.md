# Syed Muhammad Hussain — Portfolio

A 3D, scroll-driven portfolio built from the Claude Design handoff in `project/Portfolio Concepts.dc.html` (design chat in `chats/`). It uses one persistent WebGL scene (React Three Fiber) behind real HTML content. All headings, text, links and project information are HTML.

All five design directions are implemented and can be switched live:

| Code | Route | Concept | 3D scene |
| --- | --- | --- | --- |
| 1a | `/folio` | FOLIO — Riso Editorial | Paper sheet curls toward the cursor → fans into spreads → stack lifts the hovered project's cover → folds into an envelope |
| 1b | `/prism` | PRISM — Optical Minimalism | Glass prism splits a lime beam into Front-End / WordPress / Shopify → beams fan across Story → light the work → recombine into the contact underline |
| 1c | `/terrain` | TERRAIN — Kinetic Neo-Swiss | Instanced column field with a lime-crested cursor/tap ripple → career bar chart → plinth under the hovered project → one lit column under the email |
| 1d | `/compile` | COMPILE — Blueprint Brutalism | Point-cloud slab; faces snap solid lime near the cursor and compile left→right with scroll (live "compiled: N%" read-out) |
| 1e | `/maquette` | MAQUETTE — Architectural Model | White model tower on a plinth; windows light on hover → descends floor by floor → floor-plan rooms per project → rooftop at dusk |

The floating **concept switcher** (bottom right) is a review tool. Hide it with `VITE_HIDE_SWITCHER=1`, or delete it once a direction is chosen.

## Run

```bash
npm install
npm run dev        # http://localhost:5173 → redirects to /folio
npm run build      # type-check + production build into dist/
npm run preview
```

This is a single-page app with client-side routes (`/:concept`, `/:concept/work/:slug`). The static host must rewrite unknown paths to `index.html`.

## Structure

```
src/
  lib/content.ts        all copy: projects, timeline, services, skills, case studies
  lib/concepts.ts       concept metadata (nav labels, colours)
  lib/store.ts          scroll/pointer/hover state shared with the WebGL scene
  lib/motion.tsx        motion toggle (defaults from prefers-reduced-motion, persisted)
  heroes/Heroes.tsx     the five hero layouts, transcribed from the 1440 + 375 mocks
  sections/             Story, Projects (featured + index), Contact (accessible form)
  pages/                Home (4 acts + GSAP reveals), CaseStudy (long-read layout)
  three/Scene.tsx       persistent <Canvas>; one scene per concept in three/scenes/
  styles/               tokens per concept (base.css), heroes, sections, case study
```

How the scene stays in sync: `measureActs()` turns scroll position into a continuous `store.act` (0 = hero … 3 = contact). It plateaus while you read each section and transitions near the section boundaries. Each scene blends its four storyboard keyframes (K1–K4) by that value. Desktop hero objects are placed in 1440-mock pixel coordinates scaled by `--s`, matching the CSS. Some later-act objects are pinned to live DOM rects, such as the contact underline and the form.

## Content to confirm

The brief forbids invented metrics, clients and testimonials. Anything unconfirmed is written as `[VERIFY: …]` in `src/lib/content.ts` and renders as a visible chip. There are about 70 of them, covering:

- years of experience, the 2023–2025 employer, location/timezone
- each project's role, year and live URL
- the Aerosoft Studio case study text (overview, challenge, solution, results) and its screenshots
- the Sterlington Law and EE Glazing case-study bodies

**Screenshots:** none were supplied. `Shot` in `src/sections/Projects.tsx` renders a styled placeholder; replace it with `<img>` once real images exist.

## Contact form

The form validates in the browser and shows errors inline with `aria-invalid` / `aria-describedby`. When `VITE_CONTACT_ENDPOINT` is set (for example a Formspree URL), it POSTs JSON there. Otherwise it opens the visitor's mail client with the message pre-filled.

## Accessibility notes

- Text never sits directly over bright 3D: content sits on opaque panels, and headings on the dark concepts have solid backing.
- Captions use the darker greys from the mocks (≥ 5.9:1 on their surfaces). Lime is used as text only on dark surfaces, and only as a fill with dark text on light ones.
- Every nav has a motion toggle. With motion off, GSAP is skipped and the canvas renders on demand, with no idle animation.
- Visible focus states everywhere, a skip link, an Escape-closable mobile menu that returns focus, and real `<form>` controls with 44 px+ targets.
- Case-study pages fade the WebGL layer out and stop rendering it.

## Design source

- `project/Portfolio Concepts.dc.html`: the exported Claude Design canvas (hero mocks and storyboards)
- `chats/chat1.md`: the brief and the design conversation
