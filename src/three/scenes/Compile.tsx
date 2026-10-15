import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { store } from '../../lib/store';
import { actWeights, blend, clamp, DEG, dampTo, initInstanceColors, layout } from '../util';

/**
 * COMPILE — an abstract rounded slab made of points. Near the cursor, points
 * snap into solid lime-lit faces; scrolling compiles the slab left → right
 * (K1 15% → K2 build stages → K3 previews resolve → K4 fully compiled, exit 0).
 */

const SW = 5; // slab width (world units in slab space)
const SH = 4.4;
const SD = 0.55;
const R = 0.9;
const STEP = 0.13;

type Pt = { p: THREE.Vector3; n: THREE.Vector3; order: number; shade: number };

function insideRoundRect(x: number, y: number) {
  const ax = Math.abs(x) - (SW / 2 - R);
  const ay = Math.abs(y) - (SH / 2 - R);
  if (ax <= 0 || ay <= 0) return Math.abs(x) <= SW / 2 && Math.abs(y) <= SH / 2;
  return ax * ax + ay * ay <= R * R;
}

function buildSlab(): Pt[] {
  const pts: Pt[] = [];
  const light = new THREE.Vector3(-0.4, 0.6, 0.7).normalize();
  const add = (p: THREE.Vector3, n: THREE.Vector3) => {
    const order = clamp((p.x + SW / 2) / SW + (Math.sin(p.y * 3.1) * 0.04 + (Math.random() - 0.5) * 0.06));
    pts.push({ p, n, order, shade: 0.72 + 0.28 * Math.max(0, n.dot(light)) });
  };
  for (const face of [1, -1]) {
    for (let x = -SW / 2 + STEP / 2; x < SW / 2; x += STEP)
      for (let y = -SH / 2 + STEP / 2; y < SH / 2; y += STEP) if (insideRoundRect(x, y)) add(new THREE.Vector3(x, y, (face * SD) / 2), new THREE.Vector3(0, 0, face));
  }
  // rim: walk the rounded-rect perimeter
  const per: { x: number; y: number; nx: number; ny: number }[] = [];
  const hx = SW / 2 - R;
  const hy = SH / 2 - R;
  const pushSeg = (x0: number, y0: number, x1: number, y1: number, nx: number, ny: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    for (let s = 0; s < len; s += STEP) per.push({ x: x0 + ((x1 - x0) * s) / len, y: y0 + ((y1 - y0) * s) / len, nx, ny });
  };
  pushSeg(-hx, SH / 2, hx, SH / 2, 0, 1);
  pushSeg(SW / 2, hy, SW / 2, -hy, 1, 0);
  pushSeg(hx, -SH / 2, -hx, -SH / 2, 0, -1);
  pushSeg(-SW / 2, -hy, -SW / 2, hy, -1, 0);
  const corners = [
    [hx, hy, 0],
    [hx, -hy, -90],
    [-hx, -hy, 180],
    [-hx, hy, 90],
  ];
  for (const [cx, cy, a0] of corners) {
    for (let a = 0; a < 90; a += (STEP / R) / DEG) {
      const ang = (a0 + 90 - a) * DEG;
      per.push({ x: cx + Math.cos(ang) * R, y: cy + Math.sin(ang) * R, nx: Math.cos(ang), ny: Math.sin(ang) });
    }
  }
  for (const e of per) for (let z = -SD / 2 + STEP / 2; z < SD / 2; z += STEP) add(new THREE.Vector3(e.x, e.y, z), new THREE.Vector3(e.nx, e.ny, 0));
  return pts;
}

const DOT = new THREE.Color('#EDEDE6').lerp(new THREE.Color('#101014'), 0.45);
const L1 = new THREE.Color('#D4FF9C');
const L2 = new THREE.Color('#B8FF60');
const L3 = new THREE.Color('#86C83E');
const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const Z = new THREE.Vector3(0, 0, 1);
const sc = new THREE.Vector3();
const col = new THREE.Color();
const inv = new THREE.Matrix4();
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const local = new THREE.Ray();
const front = new THREE.Plane(new THREE.Vector3(0, 0, 1), -SD / 2);
const hitP = new THREE.Vector3();

type Pose = { x: number; y: number; size: number; rx: number; ry: number; rz: number; g: number };

export function CompileScene({ motion }: { motion: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const pts = useMemo(buildSlab, []);
  const comp = useMemo(() => new Float32Array(pts.length), [pts]);
  const pose = useRef<Pose | null>(null);
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  useLayoutEffect(() => initInstanceColors(mesh.current, DOT), []);

  useFrame((state, dt) => {
    const L = layout(state);
    const { s, m, W, H, mobile } = L;
    const w = actWeights();
    const t = state.clock.elapsedTime;

    const keys: Pose[] = mobile
      ? [
          { x: 220 * m, y: 190, size: 220 * m, rx: -10, ry: -22, rz: 8, g: 0.15 },
          { x: W + 6, y: H * 0.32, size: 130, rx: -10, ry: -30, rz: 6, g: 0.3 + store.local[1] * 0.4 },
          { x: W + 6, y: H * 0.32, size: 130, rx: -10, ry: -30, rz: 6, g: 0.82 },
          { x: W + 6, y: H * 0.32, size: 140, rx: -6, ry: -20, rz: 0, g: 1 },
        ]
      : [
          { x: 1070 * s, y: 390 * s, size: 500 * s, rx: -14, ry: -28, rz: 0, g: 0.15 },
          { x: W - 250 * s, y: H * 0.48, size: 340 * s, rx: -18, ry: -36, rz: 4, g: 0.3 + store.local[1] * 0.45 },
          { x: W - 210 * s, y: H * 0.62, size: 300 * s, rx: -24, ry: -42, rz: 2, g: 0.82 },
          { x: W - 260 * s, y: H * 0.42, size: 380 * s, rx: -10, ry: -24, rz: 0, g: 1 },
        ];
    const target = blend(keys, w);
    if (!pose.current) pose.current = { ...target };
    dampTo(pose.current, target, 3.5, dt, !motion);
    const p = pose.current;

    const g = group.current;
    const sway = motion ? store.pointer.x * 8 * w[0] : 0;
    g.position.set(L.wx(p.x), L.wy(p.y), 0);
    g.rotation.set((p.rx + (motion ? store.pointer.y * -5 * w[0] : 0)) * DEG, (p.ry + sway + (motion ? Math.sin(t * 0.3) * 2 : 0)) * DEG, p.rz * DEG, 'YXZ');
    const scale = (p.size * L.k) / SW;
    g.scale.setScalar(scale);
    g.updateMatrixWorld();

    // cursor → slab-local point on the front face
    let cx = 99;
    let cy = 99;
    if (store.pointer.active && motion) {
      ndc.set(store.pointer.x, store.pointer.y);
      ray.setFromCamera(ndc, state.camera);
      inv.copy(g.matrixWorld).invert();
      local.copy(ray.ray).applyMatrix4(inv);
      if (local.intersectPlane(front, hitP)) {
        cx = hitP.x;
        cy = hitP.y;
      }
    }
    const radius = 1.2;

    let total = 0;
    const im = mesh.current;
    for (let i = 0; i < pts.length; i++) {
      const pt = pts[i];
      const near = clamp(1 - Math.hypot(pt.p.x - cx, pt.p.y - cy) / radius);
      const byScroll = pt.order < p.g ? 1 : 0;
      const tgt = Math.max(byScroll, near > 0 ? 1 : 0);
      comp[i] = motion ? THREE.MathUtils.damp(comp[i], tgt, tgt > comp[i] ? 14 : 3, dt) : tgt;
      const c = comp[i];
      total += c;
      const size = THREE.MathUtils.lerp(0.032, STEP * 1.02, c * c * (3 - 2 * c));
      q.setFromUnitVectors(Z, pt.n);
      sc.set(size, size, 1);
      m4.compose(pt.p, q, sc);
      im.setMatrixAt(i, m4);
      const k = (pt.p.x / SW + 0.5) * 0.6 + (0.5 - pt.p.y / SH) * 0.4;
      col.copy(L1).lerp(L2, clamp(k * 2)).lerp(L3, clamp(k * 2 - 1)).multiplyScalar(pt.shade);
      im.setColorAt(i, col.lerp(DOT, 1 - c));
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    store.compiled = total / pts.length;
  });

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[geo, undefined, pts.length]} frustumCulled={false}>
        <meshBasicMaterial side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  );
}
