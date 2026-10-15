export const CONCEPTS = ['folio', 'prism', 'terrain', 'compile', 'maquette'] as const;
export type Concept = (typeof CONCEPTS)[number];

export const isConcept = (v: string | undefined): v is Concept => !!v && (CONCEPTS as readonly string[]).includes(v);

type Meta = {
  code: string;
  label: string;
  style: string;
  /** Nav labels per concept, matching each hero mock. */
  nav: { work: string; story: string; contact: string };
  /** Page background, used for <meta name="theme-color"> and the canvas. */
  bg: string;
  dark: boolean;
};

export const CONCEPT_META: Record<Concept, Meta> = {
  folio: { code: '1a', label: 'FOLIO', style: 'Riso Editorial', nav: { work: 'Work', story: 'Story', contact: 'Contact' }, bg: '#F2EFE6', dark: false },
  prism: { code: '1b', label: 'PRISM', style: 'Optical Minimalism', nav: { work: 'Work', story: 'About', contact: 'Contact' }, bg: '#0A0A0D', dark: true },
  terrain: { code: '1c', label: 'TERRAIN', style: 'Kinetic Neo-Swiss', nav: { work: 'Work', story: 'About', contact: 'Contact' }, bg: '#101014', dark: true },
  compile: { code: '1d', label: 'COMPILE', style: 'Blueprint Brutalism', nav: { work: './work', story: './about', contact: './contact' }, bg: '#101014', dark: true },
  maquette: { code: '1e', label: 'MAQUETTE', style: 'Architectural Model', nav: { work: 'Work', story: 'About', contact: 'Contact' }, bg: '#FAFAF7', dark: false },
};

/** Light colours for the three disciplines (PRISM); reused for category accents elsewhere. */
export const DISCIPLINE_COLOR = { 'Front-End': '#B8FF60', WordPress: '#7FE7FF', Shopify: '#FFB86B', Demo: '#F4F4F0' } as const;
