import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { store } from '../../lib/store';
import { allProjects } from '../../lib/content';
import { actWeights, anchor, blend, canvasTexture, clamp, DEG, dampTo, layout } from '../util';

/**
 * FOLIO — a sheet of paper floats beside the headline, its corner curling
 * toward the cursor (K1); it fans into four spreads (K2); settles into a stack
 * whose top sheet lifts with the hovered project printed on it (K3); and folds
 * into an envelope for the contact act (K4). Mobile: one sheet, scroll bends it.
 */

const N = 4;
const ASPECT = 4 / 3;
const SEG_X = 22;
const SEG_Y = 30;

type Pose = { x: number; y: number; w: number; h: number; rx: number; ry: number; rz: number; z: number; o: number };

const PAPER = ['#FBFAF5', '#F4F2EA', '#E2DFD4'];
const LABELS = ['p. 01', 'p. 02 — About', 'p. 03 — Services', 'p. 04 — Experience'];

function drawSheet(ctx: CanvasRenderingContext2D, label: string, cover?: { name: string; cat: string }) {
  const { width: W, height: H } = ctx.canvas;
  const g = ctx.createLinearGradient(0, 0, W, H * 0.9);
  g.addColorStop(0, PAPER[0]);
  g.addColorStop(0.55, PAPER[1]);
  g.addColorStop(1, PAPER[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#5E5B54';
  ctx.font = `500 ${W * 0.042}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.fillText(cover ? `${cover.cat.toUpperCase()} — PRINT PROOF` : label, W * 0.078, H * 0.085);
  ctx.fillStyle = 'rgba(20,20,20,0.5)';
  ctx.fillRect(W * 0.078, H * 0.11, W * 0.844, 2);
  if (cover) {
    // halftone "screenshot" block + lime spot + name
    ctx.save();
    ctx.fillStyle = 'rgba(20,20,20,0.16)';
    for (let y = H * 0.16; y < H * 0.62; y += 9) for (let x = W * 0.078; x < W * 0.922; x += 9) ctx.fillRect(x, y, 2.6, 2.6);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = '#B8FF60';
    ctx.fillRect(W * 0.078, H * 0.16, W * 0.42, H * 0.16);
    ctx.restore();
    ctx.fillStyle = '#141414';
    ctx.font = `italic 400 ${W * 0.12}px "Instrument Serif", Georgia, serif`;
    const words = cover.name.split(' ');
    let line = '';
    let y = H * 0.74;
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (ctx.measureText(t).width > W * 0.84 && line) {
        ctx.fillText(line, W * 0.078, y);
        y += W * 0.12;
        line = w;
      } else line = t;
    }
    ctx.fillText(line, W * 0.078, y);
  } else {
    // ghosted text columns
    ctx.fillStyle = 'rgba(20,20,20,0.07)';
    for (let i = 0; i < 16; i++) {
      const y = H * 0.2 + i * H * 0.042;
      const len = i % 5 === 4 ? 0.5 : 0.84;
      ctx.fillRect(W * 0.078, y, W * len, H * 0.012);
    }
  }
}

function shadowTexture() {
  return canvasTexture(256, 320, (ctx) => {
    ctx.clearRect(0, 0, 256, 320);
    ctx.filter = 'blur(18px)';
    ctx.fillStyle = 'rgba(20,20,20,0.55)';
    ctx.fillRect(40, 40, 176, 240);
  }).tex;
}

function Sheet({ index, motion }: { index: number; motion: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const mesh = useRef<THREE.Mesh>(null!);
  const flap = useRef<THREE.Mesh>(null!);
  const shadow = useRef<THREE.Mesh>(null!);
  const pose = useRef<Pose>({ x: 0, y: 0, w: 1, h: 1, rx: 0, ry: 0, rz: 0, z: 0, o: 1 });
  const fx = useRef({ curl: 0.35, bend: 0, lift: 0, fold: 0 });
  const lastCover = useRef<string | null>(null);

  const geo = useMemo(() => new THREE.PlaneGeometry(1, ASPECT, SEG_X, SEG_Y), []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  const tex = useMemo(() => canvasTexture(512, 683, (ctx) => drawSheet(ctx, LABELS[index])), [index]);
  const shadowTex = useMemo(shadowTexture, []);
  const flapGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    // triangle hinged on its top edge (y = 0), pointing down
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0, -0.55, 0], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 0.5, 0.45], 2));
    g.computeVertexNormals();
    return g;
  }, []);

  useEffect(() => {
    document.fonts?.ready.then(() => tex.redraw());
    return () => {
      geo.dispose();
      tex.tex.dispose();
    };
  }, [geo, tex]);

  useFrame((state, dt) => {
    const L = layout(state);
    const { s, m, W, H, mobile } = L;
    const w = actWeights();
    const t = state.clock.elapsedTime;
    const hovered = store.hoveredIndex >= 0 ? allProjects[store.hoveredIndex] : null;
    const isTop = index === 0;

    // ---- keyframes (viewport px) ----
    let keys: Pose[];
    if (mobile) {
      const solo = index === 0 ? 1 : 0;
      keys = [
        { x: 235 * m, y: 210, w: 170 * m, h: 220 * m, rx: -6, ry: -14, rz: 8, z: 0, o: solo },
        // later acts: the sheet peeks in from the right edge, clear of the text column
        { x: W + 14, y: H * 0.3, w: 110, h: 142, rx: -4, ry: -18, rz: -10, z: 0, o: solo },
        { x: W + 14, y: H * 0.3, w: 110, h: 142, rx: -4, ry: -18, rz: 6, z: 0, o: solo },
        { x: W + 10, y: H * 0.3, w: 130, h: 86, rx: -8, ry: -10, rz: -4, z: 0, o: solo },
      ];
    } else {
      const sw = 360 * s;
      const fanW = 250 * s;
      const pileW = 230 * s;
      const env = anchor('.cform');
      const ex = env ? Math.min(W - 160 * s, env.right - 40 * s) : 1180 * s;
      const ey = env ? clamp(env.top + 80 * s, 120, H - 120) : H * 0.55;
      keys = [
        { x: 1180 * s + index * 4, y: 440 * s + index * 5, w: sw, h: sw * ASPECT, rx: -8, ry: -24, rz: 6, z: -index * 0.05, o: 1 },
        { x: W - 330 * s + index * 66 * s, y: H * 0.5 - 70 * s + index * 46 * s, w: fanW, h: fanW * ASPECT, rx: -4, ry: -14, rz: 15 - index * 9, z: -index * 0.05, o: 1 },
        {
          x: W - 210 * s + index * 6,
          y: H - 150 * s - index * 10,
          w: pileW,
          h: pileW * ASPECT,
          rx: -38,
          ry: -14,
          rz: [6, -3, 9, -8][index],
          z: -index * 0.05,
          o: 1,
        },
        { x: ex, y: ey, w: 420 * s, h: 270 * s, rx: -6, ry: -16, rz: -5, z: -index * 0.05, o: index === 0 ? 1 : 0 },
      ];
    }
    const target = blend(keys, w);
    dampTo(pose.current, target, 4.5, dt, !motion);
    const p = pose.current;

    // ---- effects ----
    const scrX = (p.x / W) * 2 - 1;
    const scrY = -(p.y / H) * 2 + 1;
    const near = store.pointer.active ? 1 - clamp(Math.hypot(store.pointer.x - scrX, (store.pointer.y - scrY) * 0.7) / 1.1) : 0;
    const liftTarget = isTop && hovered ? 1 : 0;
    const tfx = {
      curl: motion ? 0.28 + near * 0.62 * (w[0] + w[1]) + w[2] * 0.15 : 0.32,
      bend: mobile ? Math.sin(store.scrollY / 260) * 0.9 : w[1] * (index % 2 ? 0.25 : -0.25),
      lift: liftTarget * w[2],
      fold: w[3],
    };
    dampTo(fx.current, tfx, 6, dt, !motion);
    const f = fx.current;

    // project cover printed on the top sheet while a project is hovered
    const coverKey = isTop && hovered && w[2] > 0.3 ? hovered.slug : null;
    if (coverKey !== lastCover.current) {
      lastCover.current = coverKey;
      tex.ctx.clearRect(0, 0, tex.canvas.width, tex.canvas.height);
      drawSheet(tex.ctx, LABELS[index], coverKey && hovered ? { name: hovered.name, cat: hovered.category } : undefined);
      tex.tex.needsUpdate = true;
    }

    // ---- transform ----
    const g = group.current;
    const liftPx = f.lift * 70 * s;
    g.position.set(L.wx(p.x - liftPx * 0.4), L.wy(p.y - liftPx), p.z + f.lift * 0.8);
    g.rotation.set((p.rx + f.lift * 26) * DEG, (p.ry + f.lift * 6) * DEG, (p.rz - f.lift * 6) * DEG, 'YXZ');
    g.scale.set(p.w * L.k, (p.h * L.k) / ASPECT, p.w * L.k);
    g.visible = p.o > 0.02;
    (mesh.current.material as THREE.MeshStandardMaterial).opacity = p.o;
    (shadow.current.material as THREE.MeshBasicMaterial).opacity = p.o * (0.32 + f.lift * 0.12) * (1 - f.fold * 0.4);
    shadow.current.position.set(0.07 + f.lift * 0.08, -0.09 - f.lift * 0.12, -0.06 - f.lift * 0.2);

    // envelope flap folds shut through the contact act
    flap.current.visible = isTop && f.fold > 0.05;
    flap.current.rotation.x = (1 - clamp(store.local[3] * 2.2)) * -150 * DEG * (motion ? 1 : 0);
    (flap.current.material as THREE.MeshStandardMaterial).opacity = f.fold;

    // ---- deform: corner curl toward the cursor + scroll bend ----
    const pos = geo.attributes.position.array as Float32Array;
    const R = 0.42;
    for (let i = 0; i < pos.length; i += 3) {
      const x0 = base[i];
      const y0 = base[i + 1];
      const u = x0 + 0.5;
      const v = (y0 + ASPECT / 2) / ASPECT;
      const d = (u + (1 - v)) / 2;
      const c = clamp((d - (1 - R)) / R);
      const lift = f.curl * (1 - f.fold) * c * c;
      const wave = motion ? Math.sin(v * 3 + t * 0.9 + index) * 0.008 : 0;
      pos[i] = x0 - lift * 0.1;
      pos[i + 1] = y0 + lift * 0.1;
      pos[i + 2] = lift * 0.5 + f.bend * Math.sin(u * Math.PI) * 0.12 + wave;
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
  });

  return (
    <group ref={group}>
      <mesh ref={shadow} renderOrder={-1}>
        <planeGeometry args={[1.08, ASPECT * 1.08]} />
        <meshBasicMaterial map={shadowTex} transparent depthWrite={false} opacity={0.3} />
      </mesh>
      <mesh ref={mesh} geometry={geo}>
        <meshStandardMaterial map={tex.tex} roughness={0.92} metalness={0} side={THREE.DoubleSide} transparent />
      </mesh>
      <mesh ref={flap} geometry={flapGeo} position={[0, ASPECT / 2, 0.01]}>
        <meshStandardMaterial color="#ECE9DF" roughness={0.9} side={THREE.DoubleSide} transparent />
      </mesh>
    </group>
  );
}

export function FolioScene({ motion }: { motion: boolean }) {
  return (
    <>
      <ambientLight intensity={1.6} />
      <directionalLight position={[-4, 6, 8]} intensity={1.5} />
      {Array.from({ length: N }, (_, i) => (
        <Sheet key={i} index={N - 1 - i} motion={motion} />
      ))}
    </>
  );
}
