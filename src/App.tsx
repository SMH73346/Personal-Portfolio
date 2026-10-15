import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { MotionProvider } from './lib/motion';
import { CONCEPT_META, isConcept, type Concept } from './lib/concepts';
import { Nav } from './components/Nav';
import { ConceptSwitcher } from './components/ConceptSwitcher';
import { Home } from './pages/Home';
import { CaseStudyPage } from './pages/CaseStudy';
import { store } from './lib/store';

const Scene = lazy(() => import('./three/Scene'));

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
const HAS_WEBGL = typeof window !== 'undefined' && webglAvailable();

function ConceptLayout() {
  const { concept } = useParams();
  const { pathname } = useLocation();
  const home = !pathname.includes('/work/');

  useEffect(() => {
    if (!isConcept(concept)) return;
    const root = document.documentElement;
    root.dataset.concept = concept;
    if (!HAS_WEBGL) root.dataset.nowebgl = '';
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = CONCEPT_META[concept].bg;
  }, [concept]);

  useEffect(() => {
    store.home = home;
    document.documentElement.dataset.page = home ? 'home' : 'case';
  }, [home]);

  if (!isConcept(concept)) return <Navigate to="/folio" replace />;
  const c: Concept = concept;

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {HAS_WEBGL && (
        <Suspense fallback={null}>
          <Scene concept={c} />
        </Suspense>
      )}
      <Nav concept={c} />
      <Outlet />
      <ConceptSwitcher concept={c} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MotionProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/folio" replace />} />
          <Route path="/:concept" element={<ConceptLayout />}>
            <Route index element={<Home />} />
            <Route path="work/:slug" element={<CaseStudyPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/folio" replace />} />
        </Routes>
      </MotionProvider>
    </BrowserRouter>
  );
}
