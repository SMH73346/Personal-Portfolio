import { useEffect, useLayoutEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Concept } from '../lib/concepts';
import { useMotion } from '../lib/motion';
import { measureActs, store } from '../lib/store';
import { Hero } from '../heroes/Heroes';
import { Story } from '../sections/Story';
import { Projects } from '../sections/Projects';
import { Contact } from '../sections/Contact';

gsap.registerPlugin(ScrollTrigger);

/** Feeds scroll + pointer into the shared store the WebGL scene reads. */
function useSceneInputs(concept: Concept) {
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        measureActs();
        // MAQUETTE: the closing act shifts the whole page to dusk.
        document.documentElement.toggleAttribute('data-dusk', concept === 'maquette' && store.act > 2.15);
      });
    };
    const onPointer = (e: PointerEvent) => {
      store.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      store.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      store.pointer.px = e.clientX;
      store.pointer.py = e.clientY;
      store.pointer.active = true;
    };
    const onDown = (e: PointerEvent) => {
      store.taps.push({ px: e.clientX, py: e.clientY, t: performance.now() });
      if (store.taps.length > 6) store.taps.shift();
    };
    const onLeave = () => (store.pointer.active = false);
    onScroll();
    const ro = new ResizeObserver(onScroll);
    ro.observe(document.body);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerdown', onDown);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.documentElement.removeAttribute('data-dusk');
    };
  }, [concept]);
}

/** Entrance + scroll reveals. Entirely skipped when motion is off. */
function useReveals(concept: Concept, motion: boolean) {
  useLayoutEffect(() => {
    if (!motion) return;
    const ctx = gsap.context(() => {
      gsap.from('.hero .hl__in, .hero .floor, .hero__title-bg', {
        yPercent: 40,
        opacity: 0,
        duration: 1.1,
        stagger: 0.09,
        ease: 'expo.out',
        delay: 0.1,
      });
      gsap.from('.hero__body, .hero__meta, .hero__ctas, .hero__lede', { opacity: 0, y: 16, duration: 0.9, delay: 0.45, ease: 'power3.out' });

      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 88%',
        once: true,
        onEnter: (els) => gsap.from(els, { opacity: 0, y: 40, duration: 0.9, stagger: 0.08, ease: 'power3.out', clearProps: 'transform,opacity' }),
      });

      // Animated contact headline: words rise in; PRISM's beam underline converges.
      const title = document.querySelector('#contact-title');
      if (title) {
        gsap.from('#contact .act-head__title', {
          clipPath: 'inset(0 100% 0 0)',
          duration: 1.4,
          ease: 'expo.inOut',
          scrollTrigger: { trigger: '#contact', start: 'top 70%' },
        });
      }
      gsap.from('.contact__beam', {
        scaleX: 0,
        duration: 1.6,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.contact__email', start: 'top 85%' },
      });
    });
    // Trigger positions go stale when web fonts load or reveals change layout.
    let t = 0;
    const refresh = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    };
    document.fonts?.ready.then(refresh);
    const ro = new ResizeObserver(refresh);
    ro.observe(document.body);
    return () => {
      window.clearTimeout(t);
      ro.disconnect();
      ctx.revert();
    };
  }, [concept, motion]);
}

export function Home() {
  const { concept } = useParams() as { concept: Concept };
  const { motion } = useMotion();
  const { hash } = useLocation();

  useSceneInputs(concept);
  useReveals(concept, motion);

  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: motion ? 'smooth' : 'auto' }));
  }, [hash, motion]);

  useEffect(() => {
    document.title = 'Syed Muhammad Hussain — Web Developer (Front-End, WordPress, Shopify)';
  }, []);

  return (
    <main id="main" tabIndex={-1}>
      <Hero concept={concept} />
      <Story concept={concept} />
      <Projects concept={concept} />
      <Contact concept={concept} />
    </main>
  );
}
