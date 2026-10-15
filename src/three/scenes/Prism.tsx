import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { store } from '../../lib/store';
import { allProjects } from '../../lib/content';
import { actWeights, anchor, beamMaterial, blend, clamp, DEG, dampTo, layout, placeBeam } from '../util';

/**
 * PRISM — a glass prism splits a lime beam into Front-End (lime), WordPress
 * (cyan) and Shopify (amber). K1: prism turns toward the cursor, beams sweep.
 * K2: beams fan wide across the story. K3: near-parallel beams light the work.
 * K4: the three recombine into one point — the contact headline's underline.
 */

const COLORS = ['#B8FF60', '#7FE7FF', '#FFB86B'];

const glassMaterial = () =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uOpacity: { value: 1 }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        vP = position;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity; uniform float uTime;
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main() {
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
        vec3 base = mix(vec3(0.10, 0.10, 0.13), vec3(0.05, 0.05, 0.07), vP.y * 0.5 + 0.5);
        // faint dispersion across the body
        float h = vP.x * 1.4 + vP.y * 0.6 + uTime * 0.05;
        vec3 disp = 0.5 + 0.5 * cos(6.2831 * (h + vec3(0.0, 0.33, 0.67)));
        vec3 col = base + disp * 0.05 + vec3(0.96) * f * 0.75;
        gl_FragColor = vec4(col, (0.62 + f * 0.38) * uOpacity);
      }
    `,
  });

type K = {
  px: number; py: number; pw: number; ph: number; po: number; prot: number;
  ix: number; iy: number; ia: number; il: number; io: number;
  ox0: number; oy0: number; a0: number; ox1: number; oy1: number; a1: number; ox2: number; oy2: number; a2: number; l0: number; l1: number; l2: number; oo: number;
};

export function PrismScene({ motion }: { motion: boolean }) {
  const prism = useRef<THREE.Group>(null!);
  const beamIn = useRef<THREE.Mesh>(null!);
  const beams = [useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!)];
  const merged = useRef<THREE.Mesh>(null!);
  const cur = useRef<K | null>(null);
  const turn = useRef({ y: 0, x: 0 });

  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(1, 1, 1.4, 3, 1);
    g.rotateX(-Math.PI / 2); // apex up, axis toward the viewer
    g.translate(0, -0.25, 0); // centre the bounding box (centroid sits 1/4 below it)
    return g;
  }, []);
  const edges = useMemo(() => new THREE.EdgesGeometry(geo), [geo]);
  const glass = useMemo(glassMaterial, []);
  const edgeMat = useMemo(() => new THREE.LineBasicMaterial({ color: '#F4F4F0', transparent: true, opacity: 0.55 }), []);
  const mats = useMemo(() => [...COLORS.map((c) => beamMaterial(c)), beamMaterial(COLORS[0]), beamMaterial(COLORS[0])], []);

  useFrame((state, dt) => {
    const L = layout(state);
    const { s, m, W, H, mobile } = L;
    const w = actWeights();
    const t = state.clock.elapsedTime;
    const px = motion ? store.pointer.x : 0;
    const py = motion ? store.pointer.y : 0;
    const hoverCat = store.hoveredIndex >= 0 ? allProjects[store.hoveredIndex].category : null;
    const line = anchor('.contact__beam');
    const lx = line ? line.left : W * 0.1;
    const ly = line ? line.top + 1 : H * 0.5;

    let keys: K[];
    if (mobile) {
      const cx = 187 * m;
      keys = [
        { px: cx, py: 187, pw: 120 * m, ph: 110 * m, po: 1, prot: 0, ix: cx, iy: 60, ia: 90, il: 90, io: 1,
          ox0: cx - 26 * m, oy0: 238, a0: 104, ox1: cx, oy1: 238, a1: 90, ox2: cx + 26 * m, oy2: 238, a2: 76, l0: 640, l1: 640, l2: 640, oo: 0.75 },
        { px: cx, py: -120, pw: 80, ph: 74, po: 0, prot: 0, ix: cx, iy: -200, ia: 90, il: 10, io: 0,
          ox0: 10, oy0: -40, a0: 90, ox1: 18, oy1: -40, a1: 90, ox2: 26, oy2: -40, a2: 90, l0: H + 80, l1: H + 80, l2: H + 80, oo: 0.55 },
        { px: cx, py: -120, pw: 80, ph: 74, po: 0, prot: 0, ix: cx, iy: -200, ia: 90, il: 10, io: 0,
          ox0: W - 26, oy0: -40, a0: 90, ox1: W - 18, oy1: -40, a1: 90, ox2: W - 10, oy2: -40, a2: 90, l0: H + 80, l1: H + 80, l2: H + 80, oo: 0.55 },
        { px: cx, py: -120, pw: 80, ph: 74, po: 0, prot: 0, ix: cx, iy: -200, ia: 90, il: 10, io: 0,
          ox0: 4, oy0: ly - 220, a0: Math.atan2(220, lx - 4) / DEG, ox1: 4, oy1: ly - 140, a1: Math.atan2(140, lx - 4) / DEG, ox2: 4, oy2: ly - 60, a2: Math.atan2(60, lx - 4) / DEG, l0: Math.hypot(lx - 4, 220), l1: Math.hypot(lx - 4, 140), l2: Math.hypot(lx - 4, 60), oo: 0.8 },
      ];
    } else {
      const toLine = (y0: number) => ({ a: Math.atan2(ly - y0, lx + 40) / DEG, l: Math.hypot(lx + 40, ly - y0) - 4 });
      const c0 = toLine(H * 0.12);
      const c1 = toLine(H * 0.32);
      const c2 = toLine(H * 0.52);
      keys = [
        { px: 960 * s, py: 250 * s, pw: 260 * s, ph: 240 * s, po: 1, prot: -4,
          ix: -29 * s, iy: 444 * s, ia: -9, il: 900 * s, io: 1,
          ox0: 1012 * s, oy0: 250 * s, a0: -6, ox1: 1012 * s, oy1: 262 * s, a1: 9, ox2: 1012 * s, oy2: 274 * s, a2: 24, l0: 640 * s, l1: 640 * s, l2: 640 * s, oo: 1 },
        { px: 110 * s, py: H * 0.36, pw: 150 * s, ph: 138 * s, po: 0.6, prot: 6,
          ix: -200, iy: H * 0.36 - 60, ia: 14, il: 260 * s, io: 0.6,
          ox0: 150 * s, oy0: H * 0.36, a0: -16, ox1: 150 * s, oy1: H * 0.36 + 6, a1: 6, ox2: 150 * s, oy2: H * 0.36 + 12, a2: 26, l0: W * 1.25, l1: W * 1.25, l2: W * 1.25, oo: 0.85 },
        { px: -260, py: H * 0.5, pw: 150 * s, ph: 138 * s, po: 0, prot: 12,
          ix: -400, iy: H * 0.5, ia: 0, il: 10, io: 0,
          ox0: -20, oy0: H * 0.5 - 60, a0: -3, ox1: -20, oy1: H * 0.5, a1: 0, ox2: -20, oy2: H * 0.5 + 60, a2: 3, l0: W * 1.2, l1: W * 1.2, l2: W * 1.2, oo: 0.55 },
        { px: -260, py: H * 0.5, pw: 150 * s, ph: 138 * s, po: 0, prot: 12,
          ix: -400, iy: H * 0.5, ia: 0, il: 10, io: 0,
          ox0: -40, oy0: H * 0.12, a0: c0.a, ox1: -40, oy1: H * 0.32, a1: c1.a, ox2: -40, oy2: H * 0.52, a2: c2.a, l0: c0.l, l1: c1.l, l2: c2.l, oo: 0.9 },
      ];
    }
    const target = blend(keys, w);
    if (!cur.current) cur.current = { ...target };
    dampTo(cur.current, target, 3.5, dt, !motion);
    const k = cur.current;

    // prism turns toward the cursor; the refracted fan follows
    dampTo(turn.current, { y: px * 0.5, x: -py * 0.25 }, 3, dt, !motion);
    const sweep = turn.current.y * 6 * (w[0] + w[1]);
    const idle = motion ? Math.sin(t * 0.6) * 1.2 : 0;

    const g = prism.current;
    g.visible = k.po > 0.02;
    g.position.set(L.wx(k.px), L.wy(k.py), 0);
    g.rotation.set(turn.current.x, turn.current.y + (motion ? Math.sin(t * 0.4) * 0.08 : 0), k.prot * DEG);
    g.scale.set((k.pw * L.k) / 1.732, (k.ph * L.k) / 1.5, (k.pw * L.k) / 1.732 * 0.55);
    glass.uniforms.uOpacity.value = k.po;
    glass.uniforms.uTime.value = t;
    edgeMat.opacity = 0.55 * k.po;

    placeBeam(beamIn.current, L, k.ix, k.iy, k.ia, k.il);
    mats[3].uniforms.uOpacity.value = k.io;

    // beams end exactly on the underline in the contact act (per-beam lengths)
    const outs: [number, number, number, number][] = [
      [k.ox0, k.oy0, k.a0, k.l0],
      [k.ox1, k.oy1, k.a1, k.l1],
      [k.ox2, k.oy2, k.a2, k.l2],
    ];
    const cats = ['Front-End', 'WordPress', 'Shopify'];
    outs.forEach(([x, y, a, len], i) => {
      const spread = sweep * (0.6 + i * 0.25) * (1 - w[3]);
      placeBeam(beams[i].current, L, x, y, a + spread + idle * (i - 1) * (1 - w[3]), len, mobile ? 18 : 22);
      const lit = hoverCat ? (hoverCat === cats[i] ? 1.25 : 0.35) : 1;
      mats[i].uniforms.uOpacity.value = THREE.MathUtils.damp(mats[i].uniforms.uOpacity.value, k.oo * (w[2] > 0.5 ? lit : 1), 6, dt);
    });

    // the point where the three recombine: a flare at the start of the
    // contact headline's underline (the underline itself is HTML)
    const mw = w[3];
    merged.current.visible = mw > 0.02;
    const flare = 70 * clamp(mw * 1.4) * (motion ? 1 + Math.sin(t * 2.4) * 0.12 : 1);
    placeBeam(merged.current, L, lx - flare / 2, ly, 0, flare, flare * 0.9);
    mats[4].uniforms.uOpacity.value = mw;
  });

  return (
    <>
      <mesh ref={beamIn} material={mats[3]} renderOrder={1}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      {beams.map((b, i) => (
        <mesh key={i} ref={b} material={mats[i]} renderOrder={1}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
      <mesh ref={merged} material={mats[4]} renderOrder={1}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <group ref={prism}>
        <mesh geometry={geo} material={glass} renderOrder={2} />
        <lineSegments geometry={edges} material={edgeMat} renderOrder={3} />
      </group>
    </>
  );
}
