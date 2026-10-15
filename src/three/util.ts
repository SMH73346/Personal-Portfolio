import * as THREE from 'three';
import type { RootState } from '@react-three/fiber';
import { MOBILE_BP, store } from '../lib/store';

export const DEG = Math.PI / 180;
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = THREE.MathUtils.lerp;
export const smooth = (t: number) => t * t * (3 - 2 * t);

/** Tent weights for acts 0..3 from the continuous store.act. */
export function actWeights(act = store.act): [number, number, number, number] {
  return [0, 1, 2, 3].map((i) => Math.max(0, 1 - Math.abs(act - i))) as [number, number, number, number];
}

/** Blend N keyframe objects by weights. */
export function blend<T extends Record<string, number>>(keys: T[], w: number[]): T {
  const out = {} as Record<string, number>;
  for (const k of Object.keys(keys[0])) {
    let v = 0;
    for (let i = 0; i < keys.length; i++) v += (keys[i][k] ?? 0) * (w[i] ?? 0);
    out[k] = v;
  }
  return out as T;
}

/** Frame-rate independent damping of every numeric field of `cur` toward `target`. */
export function dampTo<T extends Record<string, number>>(cur: T, target: T, lambda: number, dt: number, snap: boolean) {
  for (const k of Object.keys(target) as (keyof T)[]) {
    (cur[k] as number) = snap ? target[k] : THREE.MathUtils.damp(cur[k] as number, target[k] as number, lambda, Math.min(dt, 0.1));
  }
}

/** Layout helpers shared by scenes that pin objects to the HTML layout. */
export function layout(state: RootState) {
  const W = state.size.width;
  const H = state.size.height;
  const vp = state.viewport.getCurrentViewport(state.camera, [0, 0, 0]);
  const k = vp.height / H; // world units per CSS px at z = 0
  const mobile = W < MOBILE_BP;
  const s = clamp(W / 1440, 0.56, 1.4); // matches --s in CSS
  const m = W / 375; // mobile mock scale (horizontal)
  /** CSS px (viewport) → world xy at z = 0 */
  const wx = (x: number) => (x - W / 2) * k;
  const wy = (y: number) => (H / 2 - y) * k;
  return { W, H, k, s, m, mobile, wx, wy };
}

/** Live rect of a DOM element in viewport px, or null when absent. */
export function anchor(selector: string) {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return r;
}

/** Glowing light beam: a quad whose shader draws a hot core and soft falloff. */
export function beamMaterial(color: string) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: 1 }, uFade: { value: new THREE.Vector2(0.04, 0.96) } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity; uniform vec2 uFade;
      varying vec2 vUv;
      void main() {
        float d = abs(vUv.y - 0.5) * 2.0;
        float core = exp(-d * d * 120.0);
        float glow = exp(-d * 5.0) * 0.32;
        float ends = smoothstep(0.0, uFade.x, vUv.x) * (1.0 - smoothstep(uFade.y, 1.0, vUv.x));
        vec3 col = uColor * (core * 1.1 + glow) + vec3(core * 0.35);
        gl_FragColor = vec4(col, (core + glow) * ends * uOpacity);
      }
    `,
  });
}

/** Place a unit beam quad from (x,y) px at `angle` deg (CSS sense: clockwise) for `len` px. */
export function placeBeam(mesh: THREE.Mesh, L: ReturnType<typeof layout>, x: number, y: number, angle: number, len: number, thickPx = 22) {
  const a = angle * DEG;
  const ex = x + Math.cos(a) * len;
  const ey = y + Math.sin(a) * len;
  mesh.position.set(L.wx((x + ex) / 2), L.wy((y + ey) / 2), 0);
  mesh.rotation.set(0, 0, -a);
  mesh.scale.set(Math.max(0.0001, len * L.k), thickPx * L.k, 1);
}

export function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  draw(ctx);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { tex, ctx, canvas: c, redraw: () => (draw(ctx), (tex.needsUpdate = true)) };
}

/**
 * Create an InstancedMesh's colour buffer up front so its material compiles
 * with instancing colours enabled (otherwise the first program lacks them).
 */
export function initInstanceColors(mesh: THREE.InstancedMesh, color: THREE.ColorRepresentation = '#ffffff') {
  const c = new THREE.Color(color);
  for (let i = 0; i < mesh.count; i++) mesh.setColorAt(i, c);
  mesh.instanceColor!.needsUpdate = true;
  (mesh.material as THREE.Material).needsUpdate = true;
}
