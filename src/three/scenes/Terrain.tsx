import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { store } from '../../lib/store';
import { experience } from '../../lib/content';
import { actWeights, anchor, clamp, DEG, initInstanceColors, layout } from '../util';

/**
 * TERRAIN — a low-angle heightfield of instanced square columns, aligned to
 * the 12-col grid. K1: cursor sends a lime-crested ripple (taps add rings).
 * K2: columns rise into an honest career bar chart. K3: a plinth rises under
 * the hovered project. K4: field at rest, one lit lime column under the email.
 */

const LIME = new THREE.Color('#B8FF60');
const BAR = new THREE.Color('#6B6B75');
const tmpM = new THREE.Matrix4();
const tmpC = new THREE.Color();
const ray = new THREE.Raycaster();
const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hit = new THREE.Vector3();
const ndc = new THREE.Vector2();
const v3 = new THREE.Vector3();
const v3b = new THREE.Vector3();

const CAM_Y = 4.5;
const HALF_FOV = 15 * DEG;

/** Distance along the ground at which a point appears at screen fraction `yf` (0 top → 1 bottom). */
const groundDist = (yf: number, tilt: number) => CAM_Y / Math.tan(tilt + Math.atan((yf - 0.5) * 2 * Math.tan(HALF_FOV)));

/** Career bars by year (dates are placeholders — mirrors content.experience). */
function careerHeights(): { year: number; h: number; current: boolean }[] {
  const start = 2021;
  const end = new Date().getFullYear();
  const out = [];
  for (let y = start; y <= end; y++) {
    const roles = experience.filter((r) => y >= r.from && y <= (r.to === 'present' ? end : r.to));
    const level = roles.length ? Math.max(...roles.map((r) => experience.indexOf(r) + 1)) : 0;
    out.push({ year: y, h: level * 0.9, current: roles.some((r) => r.current) });
  }
  return out;
}

export function TerrainScene({ motion }: { motion: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const mobile = size.width < 820;
  const cols = mobile ? 22 : 48;
  const rows = mobile ? 18 : 34;
  const count = cols * rows;
  // field fills the bottom of the frame like the mock: from 64% (desktop) / 74% (mobile) down
  const tilt = (mobile ? 9 : 12) * DEG;
  const Z_FAR = -groundDist(mobile ? 0.74 : 0.64, tilt);
  const Z_NEAR = -groundDist(1.04, tilt);

  const cells = useMemo(() => {
    const out: { x: number; z: number; w: number; r: number; c: number }[] = [];
    const depth = Z_NEAR - Z_FAR;
    for (let r = 0; r < rows; r++) {
      // rows bunch up toward the horizon, as in the mock's r² spacing
      const f = r / (rows - 1);
      const z = Z_FAR + (f * 0.55 + f * f * 0.45) * depth;
      // width of view at this depth, so columns cover the frame edge to edge
      const span = 2 * Math.abs(z) * Math.tan(HALF_FOV) * (size.width / size.height) * 1.04 + 0.4;
      const pitch = span / cols;
      for (let c = 0; c < cols; c++) out.push({ x: -span / 2 + (c + 0.5) * pitch, z, w: pitch * 0.82, r, c });
    }
    return out;
  }, [cols, rows, size.width, size.height, Z_FAR, Z_NEAR]);

  const heights = useMemo(() => new Float32Array(count), [count]);
  const bars = useMemo(careerHeights, []);

  // create the per-instance colour buffer before the first render so the
  // material compiles with instancing colours enabled
  useLayoutEffect(() => initInstanceColors(mesh.current, BAR), [count]);

  useEffect(() => {
    camera.position.set(0, CAM_Y, 0);
    camera.rotation.set(-tilt, 0, 0);
    camera.updateProjectionMatrix();
    return () => {
      camera.position.set(0, 0, 12);
      camera.rotation.set(0, 0, 0);
    };
  }, [camera, tilt]);

  useFrame((state, dt) => {
    const L = layout(state);
    const w = actWeights();
    const t = motion ? state.clock.elapsedTime : 0;
    const now = performance.now();

    const depth = Z_NEAR - Z_FAR;
    const zMid = Z_FAR + depth * 0.45;

    // cursor → ground point
    let px = 0;
    let pz = zMid;
    if (store.pointer.active && motion) {
      ndc.set(store.pointer.x, store.pointer.y);
      ray.setFromCamera(ndc, camera);
      // depth from the ground hit (clamped to the field); x from screen x so
      // the ripple stays under the cursor even when it is above the horizon
      pz = ray.ray.intersectPlane(ground, hit) ? clamp(hit.z, Z_FAR, Z_NEAR) : Z_FAR;
      px = store.pointer.x * Math.abs(pz) * Math.tan(HALF_FOV) * (L.W / L.H);
    } else if (motion) {
      px = Math.sin(t * 0.25) * 4;
      pz = zMid + Math.cos(t * 0.2) * depth * 0.3;
    }
    // taps (and scroll on mobile) spawn travelling rings
    const rings = store.taps
      .map((tp) => {
        ndc.set((tp.px / L.W) * 2 - 1, -(tp.py / L.H) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        const ok = ray.ray.intersectPlane(ground, hit);
        return ok ? { x: hit.x, z: hit.z, age: (now - tp.t) / 1000 } : null;
      })
      .filter((r): r is { x: number; z: number; age: number } => !!r && r.age < 4);
    if (L.mobile && motion && Math.abs(store.scrollVel) > 6 && rings.length < 3) {
      store.taps.push({ px: L.W / 2, py: L.H * 0.85, t: now });
    }

    // K4: lit column under the email address
    const email = anchor('.contact__email');
    const zLit = Z_FAR + depth * 0.7;
    const halfLit = Math.abs(zLit) * Math.tan(HALF_FOV) * (L.W / L.H);
    const litX = email ? ((email.left + 7) / L.W) * 2 * halfLit - halfLit : -halfLit * 0.6;
    // grow the lit column up to just below the email (never behind text)
    let litH = depth * 0.32;
    if (email) {
      const base = v3.set(litX, 0, zLit).project(camera);
      const top = v3b.set(litX, 1, zLit).project(camera);
      const baseY = (1 - base.y) * 0.5 * L.H;
      const pxPerUnit = Math.max(1, baseY - (1 - top.y) * 0.5 * L.H);
      litH = clamp((baseY - (email.bottom + 14)) / pxPerUnit, 0, depth * 0.5);
    }
    // K3: plinth under the hovered project (right of the list = preview column)
    const hov = store.hoveredIndex >= 0;
    const zPl = Z_FAR + depth * 0.5;
    const plinthX = L.mobile ? 0 : Math.abs(zPl) * Math.tan(HALF_FOV) * (L.W / L.H) * 0.62;

    const m = mesh.current;
    for (let i = 0; i < count; i++) {
      const cell = cells[i];
      const { x, z, w: cw } = cell;
      const near = (z - Z_FAR) / (Z_NEAR - Z_FAR); // 0 far → 1 near
      const unit = cw; // heights scale with column width, like the mock

      // K1 ripple
      const d = Math.hypot(x - px, (z - pz) * 1.6);
      const wl = depth * 0.16;
      let rip = Math.max(0, Math.sin(d / wl - t * 2.6)) * Math.exp(-d / (depth * 0.9));
      for (const r of rings) {
        const rd = Math.hypot(x - r.x, (z - r.z) * 1.6);
        rip += Math.exp(-(((rd - r.age * depth * 0.6) / wl) ** 2) * 1.5) * Math.exp(-r.age * 0.9) * 1.3;
      }
      const h0 = unit * (0.5 + rip * 1.8 + (motion ? Math.sin(x * 1.3 + t * 0.4) * Math.cos(z * 1.1 + t * 0.3) * 0.12 : 0));

      // K2 career chart: middle band of rows, columns binned by year
      let h1 = unit * 0.3;
      let barLit = false;
      const band = near > 0.25 && near < 0.6;
      if (band) {
        const halfW = Math.abs(z) * Math.tan(HALF_FOV) * (L.W / L.H) * (L.mobile ? 0.9 : 0.36);
        const xs = L.mobile ? x : x - halfW * 1.25;
        const yi = Math.floor(((xs + halfW) / (2 * halfW)) * bars.length);
        if (yi >= 0 && yi < bars.length && xs > -halfW) {
          h1 = unit + bars[yi].h * depth * (L.mobile ? 0.035 : 0.045);
          barLit = bars[yi].current;
        }
      }

      // K3 plinth
      const inPlinth = Math.abs(x - plinthX) < depth * 0.16 && Math.abs(z - zPl) < depth * 0.18;
      const h2 = inPlinth ? depth * (hov ? 0.22 : 0.08) : unit * (0.3 + Math.max(0, Math.sin(x * 2 + z + t * 0.6)) * 0.3);

      // K4 rest + lit column
      const isLit = Math.abs(x - litX) < cw * 0.6 && Math.abs(z - zLit) < (depth / rows) * 0.8;
      const h3 = isLit ? Math.max(unit * 0.3, litH) : unit * 0.3;

      const target = h0 * w[0] + h1 * w[1] + h2 * w[2] + h3 * w[3];
      heights[i] = motion ? THREE.MathUtils.damp(heights[i], target, 5, dt) : target;
      const h = Math.max(0.02, heights[i]);

      tmpM.makeScale(cw, h, cw).setPosition(x, 0, z);
      m.setMatrixAt(i, tmpM);

      const shade = (30 + near * 36) / 255;
      tmpC.setRGB(shade, shade, shade + 6 / 255, THREE.SRGBColorSpace);
      const crest = w[0] * clamp((rip - 0.6) * 4) + w[1] * (barLit && band ? 1 : 0) + w[2] * (inPlinth && hov ? 1 : 0) + w[3] * (isLit ? 1 : 0);
      const barTone = w[1] * (band && h1 > 0.1 ? 0.6 : 0);
      tmpC.lerp(BAR, barTone).lerp(LIME, clamp(crest));
      m.setColorAt(i, tmpC);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  const geo = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.translate(0, 0.5, 0);
    return g;
  }, []);

  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[2, 10, 6]} intensity={1.9} />
      <directionalLight position={[-6, 3, 2]} intensity={0.35} />
      <instancedMesh key={count} ref={mesh} args={[geo, undefined, count]} frustumCulled={false}>
        <meshLambertMaterial />
      </instancedMesh>
    </>
  );
}
