/**
 * Shared mutable state read by the WebGL scene every frame. Deliberately not
 * React state: the DOM writes, the scene reads, nothing re-renders.
 */
export const store = {
  /** Pointer in normalised device coords (-1..1), y up. */
  pointer: { x: 0, y: 0, px: 0, py: 0, active: false },
  /** Taps / clicks, consumed by scenes that react to them (TERRAIN ripples). */
  taps: [] as { px: number; py: number; t: number }[],
  /** Continuous act index: 0 hero, 1 story, 2 projects, 3 contact. Plateaus while reading. */
  act: 0,
  /** 0..1 progress through each act's section. */
  local: [0, 0, 0, 0],
  scrollY: 0,
  scrollVel: 0,
  /** Slug of the project row currently hovered/focused in the index. */
  hovered: null as string | null,
  /** Index of hovered project within allProjects (or -1). */
  hoveredIndex: -1,
  /** COMPILE read-out, written by the scene. */
  compiled: 0,
  /** Whether the scene should render the home acts (false on case-study pages). */
  home: true,
  /** Hero layout breakpoint, mirrors CSS. */
  mobile: false,
};

export const MOBILE_BP = 820;

const ACT_IDS = ['hero', 'story', 'work', 'contact'];

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Recompute store.act / store.local from the DOM. Cheap; call on scroll + resize. */
export function measureActs() {
  const y = window.scrollY;
  const H = window.innerHeight;
  store.scrollVel = y - store.scrollY;
  store.scrollY = y;
  store.mobile = window.innerWidth < MOBILE_BP;
  const els = ACT_IDS.map((id) => document.getElementById(id));
  if (els.some((e) => !e)) return;
  const tops = els.map((e) => e!.getBoundingClientRect().top + y);
  const heights = els.map((e) => e!.offsetHeight);
  let act = 0;
  for (let i = 1; i < tops.length; i++) act += smooth(tops[i] - 0.85 * H, tops[i] - 0.15 * H, y);
  store.act = act;
  store.local = tops.map((t, i) => Math.min(1, Math.max(0, (y + H * 0.5 - t) / Math.max(1, heights[i]))));
}
