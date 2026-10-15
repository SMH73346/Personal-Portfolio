/**
 * All site copy lives here. Anything not confirmed in the brief carries a
 * [VERIFY] marker, rendered as a visible chip so it can't ship unnoticed.
 * No invented metrics, clients or testimonials.
 */

export type Category = 'WordPress' | 'Shopify' | 'Front-End' | 'Demo';

export const CATEGORIES: Category[] = ['WordPress', 'Shopify', 'Front-End', 'Demo'];

export const person = {
  name: 'Syed Muhammad Hussain',
  short: 'S.M. Hussain',
  role: 'Web Developer',
  since: 2021,
  yearsNote: '[VERIFY: 4+ years]',
  email: 'muhammad.hussain@ghost-digital.com',
  linkedin: 'https://www.linkedin.com/in/smh12/',
  github: 'https://github.com/SMH73346',
  availability: 'Remote · Freelance · Available [VERIFY]',
};

export const headline = {
  // Draft headline from the brief. Alternates offered by the design:
  //  H1 "Websites built properly — on WordPress, Shopify and beyond."
  //  H2 "From brief to launch, built to last."
  //  H3 "Front-end craft for brands that sell and inform."
  lines: ['Turning ideas', 'into high-quality', 'web experiences.'],
  text: 'Turning ideas into high-quality web experiences.',
};

export const about = {
  lede: 'I build fast, accessible websites on WordPress, Shopify and modern front-end stacks — from first brief to launch and the care that follows.',
  body: [
    'I have been building for the web since 2021 [VERIFY: 4+ years], starting as a freelancer on WordPress and design work, then moving through front-end and WordPress roles into Shopify and agency development.',
    'Today I work as a Web Developer at Ghost Digital and Data. I am open to remote roles and selected freelance projects.',
  ],
};

export type Service = { id: 'fe' | 'wp' | 'shop'; title: Category; lines: string[] };

export const services: Service[] = [
  {
    id: 'fe',
    title: 'Front-End',
    lines: ['Responsive, accessible interfaces', 'React components and single-page apps', 'Performance and clean, maintainable code'],
  },
  {
    id: 'wp',
    title: 'WordPress',
    lines: ['Custom themes and site builds', 'Redesigns of existing sites', 'Editor-friendly content setup'],
  },
  {
    id: 'shop',
    title: 'Shopify',
    lines: ['Store builds from design to launch', 'Theme customisation (Liquid)', 'Product, collection and checkout flow setup'],
  },
];

export const skills: { group: string; items: string[] }[] = [
  { group: 'Front-End', items: ['HTML', 'CSS', 'JavaScript', 'React', 'Responsive design', 'Accessibility'] },
  { group: 'WordPress', items: ['Custom themes', 'PHP [VERIFY]', 'Headless WordPress'] },
  { group: 'Shopify', items: ['Liquid', 'Theme customisation', 'Store setup'] },
  { group: 'Tools', items: ['Git', 'Figma [VERIFY]', 'Browser DevTools'] },
];

export type Role = {
  from: number;
  to: number | 'present';
  label: string; // dates are placeholders per the brief
  title: string;
  org: string;
  note: string;
  current?: boolean;
};

export const experience: Role[] = [
  { from: 2021, to: 2022, label: '2021–2022', title: 'Freelance', org: 'Independent', note: 'WordPress sites and design work.' },
  { from: 2023, to: 2025, label: '2023–2025', title: 'Junior Front-End → WordPress Developer', org: '[VERIFY: company]', note: 'Front-end builds, then WordPress development.' },
  { from: 2025, to: 2025, label: '2025', title: 'Shopify Developer (contract)', org: 'Aerosoft Studio', note: 'Shopify store build.' },
  { from: 2025, to: 'present', label: '2025–present', title: 'Web Developer', org: 'Ghost Digital and Data', note: 'WordPress, Shopify and front-end development.', current: true },
];

export const process = [
  { id: 'understand', title: 'Understand', text: 'Goals, audience, content and constraints — before any code.' },
  { id: 'plan', title: 'Plan', text: 'Sitemap, components and platform choice agreed up front.' },
  { id: 'build', title: 'Build', text: 'Semantic, responsive, accessible code in small reviewable steps.' },
  { id: 'test', title: 'Test', text: 'Real devices, browsers, keyboard and screen-reader checks.' },
  { id: 'deliver', title: 'Deliver', text: 'Launch, handover and documentation; support after go-live.' },
];

export type Project = {
  slug: string;
  name: string;
  category: Category;
  kind: string; // short descriptor e.g. "Store build"
  role: string; // one-line role
  year: string;
  url: string | null;
  demo?: boolean;
  featured?: boolean;
};

export const featured: Project[] = [
  { slug: 'aerosoft-studio', name: 'Aerosoft Studio', category: 'Shopify', kind: 'Store build', role: 'Shopify developer (contract) — built the store end to end [VERIFY]', year: '2025', url: null, featured: true },
  { slug: 'sterlington-law', name: 'Sterlington Law', category: 'WordPress', kind: 'Redesign', role: 'WordPress developer — redesign [VERIFY: scope]', year: '[VERIFY]', url: null, featured: true },
  { slug: 'ee-glazing', name: 'EE Glazing', category: 'WordPress', kind: 'Design & build', role: 'Designed and built the WordPress site [VERIFY]', year: '[VERIFY]', url: null, featured: true },
];

export const selectedWork: Project[] = [
  { slug: 'ghost-digital', name: 'Ghost Digital', category: 'WordPress', kind: 'Agency site', role: 'WordPress development [VERIFY: role]', year: '[VERIFY]', url: null },
  { slug: 'gddltd', name: 'GDDLTD', category: 'WordPress', kind: 'Company site', role: 'WordPress development [VERIFY: role]', year: '[VERIFY]', url: null },
  { slug: 'incloud-data', name: 'InCloud Data', category: 'WordPress', kind: 'Company site', role: 'WordPress development [VERIFY: role]', year: '[VERIFY]', url: null },
  { slug: 'hifi-consultants', name: 'HiFi Consultants', category: 'Shopify', kind: 'Store', role: 'Shopify development [VERIFY: role]', year: '[VERIFY]', url: null },
  { slug: 'senate-of-pakistan', name: 'Senate of Pakistan', category: 'Front-End', kind: 'React', role: 'React front-end [VERIFY: role]', year: '[VERIFY]', url: null },
  { slug: 'sco', name: 'SCO', category: 'Front-End', kind: 'React', role: 'React front-end [VERIFY: role]', year: '[VERIFY]', url: null },
  { slug: 'headless-wp-react', name: 'Headless WordPress + React', category: 'Demo', kind: 'Technical Demo — Local Development', role: 'Personal build: WordPress REST API feeding a React front end', year: '[VERIFY]', url: null, demo: true },
];

export const allProjects = [...featured, ...selectedWork];

export type CaseStudy = {
  slug: string;
  overview: string;
  challenge: string;
  role: string; // shown as a pull-caption
  solution: string[];
  stack: string[];
  visuals: { caption: string }[];
  results: string[];
  links: { label: string; href: string | null }[];
};

export const caseStudies: Record<string, CaseStudy> = {
  'aerosoft-studio': {
    slug: 'aerosoft-studio',
    overview:
      'Aerosoft Studio engaged me on a 2025 contract to build their Shopify store. [VERIFY: one sentence on what Aerosoft Studio sells and who it serves.]',
    challenge:
      '[VERIFY: the core problem — e.g. no existing store, an outdated theme, or a catalogue that was hard to browse. State it in one or two plain sentences.]',
    role: 'I was the Shopify developer on the project: theme build, store setup and launch. [VERIFY: name anything designed or owned by others.]',
    solution: [
      '[VERIFY: how the theme was approached — custom-built or adapted from an existing theme, and why.]',
      '[VERIFY: key templates built — home, collection, product, cart — and any custom sections.]',
      '[VERIFY: content and product setup, apps configured, and launch steps.]',
    ],
    stack: ['Shopify', 'Liquid', 'HTML', 'CSS', 'JavaScript', '[VERIFY: apps]'],
    visuals: [
      { caption: 'Home page — desktop [VERIFY: screenshot]' },
      { caption: 'Product page — mobile [VERIFY: screenshot]' },
      { caption: 'Collection grid [VERIFY: screenshot]' },
    ],
    results: ['[VERIFY: a real outcome — launch date, client feedback, or a measured change. Leave out if none can be stated.]'],
    links: [
      { label: 'Live store [VERIFY: URL]', href: null },
    ],
  },
  'sterlington-law': {
    slug: 'sterlington-law',
    overview: 'A WordPress redesign for Sterlington Law. [VERIFY: one-sentence overview.]',
    challenge: '[VERIFY: what was wrong with the previous site.]',
    role: '[VERIFY: my role on the redesign.]',
    solution: ['[VERIFY: approach and key pages.]'],
    stack: ['WordPress', 'PHP [VERIFY]', 'CSS', 'JavaScript'],
    visuals: [{ caption: 'Home page [VERIFY: screenshot]' }],
    results: ['[VERIFY]'],
    links: [{ label: 'Live site [VERIFY: URL]', href: null }],
  },
  'ee-glazing': {
    slug: 'ee-glazing',
    overview: 'Design and build of the EE Glazing WordPress site. [VERIFY: one-sentence overview.]',
    challenge: '[VERIFY: the brief.]',
    role: '[VERIFY: design and development scope.]',
    solution: ['[VERIFY: approach and key pages.]'],
    stack: ['WordPress', 'CSS', 'JavaScript'],
    visuals: [{ caption: 'Home page [VERIFY: screenshot]' }],
    results: ['[VERIFY]'],
    links: [{ label: 'Live site [VERIFY: URL]', href: null }],
  },
};
