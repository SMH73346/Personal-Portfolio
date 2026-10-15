import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Concept } from '../lib/concepts';
import { useMotion } from '../lib/motion';
import { FolioScene } from './scenes/Folio';
import { PrismScene } from './scenes/Prism';
import { TerrainScene } from './scenes/Terrain';
import { CompileScene } from './scenes/Compile';
import { MaquetteScene } from './scenes/Maquette';

/** With motion off the canvas renders on demand: only scroll/resize/hover cause a frame. */
function DemandInvalidator({ active }: { active: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!active) return;
    const on = () => invalidate();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    window.addEventListener('pointerover', on, { passive: true });
    window.addEventListener('focusin', on);
    const id = window.setInterval(on, 500); // catch async layout (fonts, images)
    on();
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      window.removeEventListener('pointerover', on);
      window.removeEventListener('focusin', on);
      window.clearInterval(id);
    };
  }, [active, invalidate]);
  return null;
}

export default function Scene({ concept }: { concept: Concept }) {
  const { motion } = useMotion();
  // Case studies are for reading: the scene fades out and stops rendering.
  const home = !useLocation().pathname.includes('/work/');
  return (
    <div className="scene" aria-hidden="true">
      <Canvas
        key={concept}
        flat
        shadows={concept === 'maquette'}
        dpr={[1, 2]}
        frameloop={!home ? 'never' : motion ? 'always' : 'demand'}
        camera={{ fov: 30, position: [0, 0, 12], near: 0.1, far: 100 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(0x000000), 0);
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
        style={{ pointerEvents: 'none' }}
      >
        <DemandInvalidator active={home && !motion} />
        {concept === 'folio' && <FolioScene motion={motion} />}
        {concept === 'prism' && <PrismScene motion={motion} />}
        {concept === 'terrain' && <TerrainScene motion={motion} />}
        {concept === 'compile' && <CompileScene motion={motion} />}
        {concept === 'maquette' && <MaquetteScene motion={motion} />}
      </Canvas>
    </div>
  );
}
