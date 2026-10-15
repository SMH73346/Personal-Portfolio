import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { store } from '../../lib/store';
import { allProjects } from '../../lib/content';
import { actWeights, blend, DEG, dampTo, initInstanceColors, layout } from '../util';

/**
 * MAQUETTE — a matte white model tower on a plinth with tiny scale figures.
 * K1: turns toward the cursor, windows glow lime on hover. K2: camera
 * descends floor by floor; the current chapter's floor is lit. K3: tilts to a
 * floor plan whose rooms are the projects; hovering lights a room. K4: dusk.
 */

const FLOORS = 6;
const FW = 2.5; // floor width
const FD = 1.5; // floor depth
const FH = 0.84;
const WIN_FRONT = 6;
const WIN_SIDE = 3;
const ROOMS_X = 5;
const ROOMS_Z = 2;

const WHITE = new THREE.Color('#FFFFFF');
const WIN_OFF = new THREE.Color('#E9E8E3');
const WIN_DUSK = new THREE.Color('#2A2A31');
const LIME = new THREE.Color('#B8FF60');
const DEFAULT_LIT = new Set(['1-1', '1-4', '2-2', '4-0', '4-3', '4-5']); // from the mock
const tmp = new THREE.Object3D();
const c = new THREE.Color();
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const box = new THREE.Box3();

type Pose = { x: number; y: number; scale: number; rx: number; ry: number; dusk: number; plan: number };

export function MaquetteScene({ motion }: { motion: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const tower = useRef<THREE.Group>(null!);
  const windows = useRef<THREE.InstancedMesh>(null!);
  const rooms = useRef<THREE.InstancedMesh>(null!);
  const hemi = useRef<THREE.HemisphereLight>(null!);
  const key = useRef<THREE.DirectionalLight>(null!);
  const fill = useRef<THREE.PointLight>(null!);
  const pose = useRef<Pose | null>(null);
  const glow = useRef(0);
  const turn = useRef(0);

  const wins = useMemo(() => {
    const out: { floor: number; i: number; pos: THREE.Vector3; ry: number; w: number; rnd: number; id: string }[] = [];
    for (let f = 0; f < FLOORS; f++) {
      const y = f * FH + FH * 0.52;
      for (let i = 0; i < WIN_FRONT; i++) {
        const pitch = (FW - 0.3) / WIN_FRONT;
        out.push({ floor: f, i, pos: new THREE.Vector3(-FW / 2 + 0.15 + pitch * (i + 0.5), y, FD / 2 + 0.006), ry: 0, w: pitch * 0.72, rnd: Math.random(), id: `${FLOORS - 1 - f}-${i}` });
      }
      for (let i = 0; i < WIN_SIDE; i++) {
        const pitch = (FD - 0.3) / WIN_SIDE;
        out.push({ floor: f, i, pos: new THREE.Vector3(FW / 2 + 0.006, y, FD / 2 - 0.15 - pitch * (i + 0.5)), ry: 90 * DEG, w: pitch * 0.72, rnd: Math.random(), id: `s${f}-${i}` });
      }
    }
    return out;
  }, []);

  useLayoutEffect(() => {
    initInstanceColors(windows.current, WIN_OFF);
    initInstanceColors(rooms.current, WHITE);
  }, []);

  useEffect(() => {
    // static matrices for windows and rooms
    wins.forEach((wd, i) => {
      tmp.position.copy(wd.pos);
      tmp.rotation.set(0, wd.ry, 0);
      tmp.scale.set(wd.w, FH * 0.42, 1);
      tmp.updateMatrix();
      windows.current.setMatrixAt(i, tmp.matrix);
    });
    windows.current.instanceMatrix.needsUpdate = true;
    const rw = (FW - 0.2) / ROOMS_X;
    const rd = (FD - 0.2) / ROOMS_Z;
    for (let z = 0; z < ROOMS_Z; z++)
      for (let x = 0; x < ROOMS_X; x++) {
        tmp.position.set(-FW / 2 + 0.1 + rw * (x + 0.5), FLOORS * FH + 0.13, -FD / 2 + 0.1 + rd * (z + 0.5));
        tmp.rotation.set(-90 * DEG, 0, 0);
        tmp.scale.set(rw * 0.88, rd * 0.84, 1);
        tmp.updateMatrix();
        rooms.current.setMatrixAt(z * ROOMS_X + x, tmp.matrix);
      }
    rooms.current.instanceMatrix.needsUpdate = true;
  }, [wins]);

  useFrame((state, dt) => {
    const L = layout(state);
    const { s, m, W, H, mobile } = L;
    const w = actWeights();
    const t = state.clock.elapsedTime;
    const towerH = FLOORS * FH + 0.3;
    const u = L.k * 100; // world units per 100 css px; the model is 100 px per unit at s = 1
    const descend = store.local[1];

    const keys: Pose[] = mobile
      ? [
          { x: 282 * m, y: 286, scale: (200 / towerH) * L.k, rx: 5, ry: -28, dusk: 0, plan: 0 },
          { x: W - 8, y: H * 0.42, scale: (150 / towerH) * L.k, rx: 8, ry: -34, dusk: 0, plan: 0 },
          { x: W - 8, y: H * 0.34, scale: (110 / FW) * L.k, rx: 62, ry: -18, dusk: 0, plan: 1 },
          { x: W - 8, y: H + 120, scale: (300 / towerH) * L.k, rx: 4, ry: -30, dusk: 1, plan: 0 },
        ]
      : [
          { x: 1150 * s, y: 706 * s, scale: u * s, rx: 5, ry: -28, dusk: 0, plan: 0 },
          // big tower; group y is set so the current chapter's floor sits mid-screen
          { x: W - 250 * s, y: H * 0.5 + (FLOORS - 0.5 - descend * FLOORS) * FH * 100 * s * 1.9, scale: u * s * 1.9, rx: 6, ry: -34, dusk: 0, plan: 0 },
          { x: W - 240 * s, y: H * 0.62, scale: u * s * 1.35, rx: 64, ry: -16, dusk: 0, plan: 1 },
          // rooftop at dusk: upper floors rise into the empty space under the contact details
          { x: 300 * s, y: H + 440 * s, scale: u * s * 1.1, rx: 4, ry: -30, dusk: 1, plan: 0 },
        ];
    const target = blend(keys, w);
    if (!pose.current) pose.current = { ...target };
    dampTo(pose.current, target, 3, dt, !motion);
    const p = pose.current;

    // hover over the tower lights the windows
    const g = group.current;
    g.position.set(L.wx(p.x), L.wy(p.y), 0);
    g.scale.setScalar(p.scale);
    const turnTarget = motion ? store.pointer.x * 10 * (w[0] + w[3]) : 0;
    turn.current = motion ? THREE.MathUtils.damp(turn.current, turnTarget, 3, Math.min(dt, 0.1)) : turnTarget;
    g.rotation.set(p.rx * DEG, (p.ry + turn.current) * DEG, 0, 'XYZ');
    g.updateMatrixWorld();
    let over = false;
    if (store.pointer.active) {
      box.setFromObject(tower.current);
      ndc.set(store.pointer.x, store.pointer.y);
      ray.setFromCamera(ndc, state.camera);
      over = ray.ray.intersectsBox(box);
    }
    glow.current = motion ? THREE.MathUtils.damp(glow.current, over ? 1 : 0, over ? 2.2 : 1.2, dt) : over ? 1 : 0;

    const chapterFloor = FLOORS - 1 - Math.min(FLOORS - 1, Math.floor(descend * FLOORS));
    const dusk = p.dusk;
    wins.forEach((wd, i) => {
      let lit = DEFAULT_LIT.has(wd.id) ? 1 : 0;
      if (wd.rnd < glow.current * 0.75) lit = 1;
      if (w[1] > 0.3 && wd.floor === chapterFloor) lit = Math.max(lit, w[1]);
      if (dusk > 0.1 && wd.rnd < 0.62 + (motion ? Math.sin(t * 0.7 + wd.rnd * 20) * 0.05 : 0)) lit = Math.max(lit, dusk);
      c.copy(WIN_OFF).lerp(WIN_DUSK, dusk).lerp(LIME, lit);
      windows.current.setColorAt(i, c);
    });
    if (windows.current.instanceColor) windows.current.instanceColor.needsUpdate = true;

    for (let r = 0; r < ROOMS_X * ROOMS_Z; r++) {
      const on = store.hoveredIndex === r;
      c.copy(WHITE).lerp(LIME, on ? 1 : 0);
      rooms.current.setColorAt(r, c);
    }
    if (rooms.current.instanceColor) rooms.current.instanceColor.needsUpdate = true;
    (rooms.current.material as THREE.MeshBasicMaterial).opacity = p.plan;
    rooms.current.visible = p.plan > 0.02;

    // light: day → dusk
    hemi.current.intensity = THREE.MathUtils.lerp(1.5, 0.35, dusk);
    key.current.intensity = THREE.MathUtils.lerp(2.1, 0.5, dusk);
    fill.current.intensity = THREE.MathUtils.lerp(0, 18, dusk);
  });

  // one room per project (10 = 3 featured + 7 indexed)
  const roomCount = Math.min(ROOMS_X * ROOMS_Z, allProjects.length);

  return (
    <>
      <hemisphereLight ref={hemi} args={['#ffffff', '#EAE8E3', 1.5]} />
      <directionalLight
        ref={key}
        position={[-5, 9, 7]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={8}
        shadow-camera-bottom={-4}
        shadow-radius={6}
        shadow-bias={-0.0005}
      />
      <pointLight ref={fill} position={[3, 2, 5]} color="#5b6db0" intensity={0} distance={30} />
      <group ref={group}>
        {/* plinth */}
        <mesh position={[0.2, -0.22, 0.1]} receiveShadow>
          <boxGeometry args={[4.2, 0.44, 2.7]} />
          <meshStandardMaterial color="#F3F1EC" roughness={1} />
        </mesh>
        <group ref={tower}>
          {Array.from({ length: FLOORS }, (_, f) => (
            <group key={f} position={[0, f * FH, 0]}>
              <mesh position={[0, FH / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[FW, FH - 0.02, FD]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.95} />
              </mesh>
              <mesh position={[0, 0.005, 0]}>
                <boxGeometry args={[FW + 0.04, 0.03, FD + 0.04]} />
                <meshStandardMaterial color="#DEDBD4" roughness={1} />
              </mesh>
            </group>
          ))}
          {/* roof slab */}
          <mesh position={[0, FLOORS * FH + 0.06, 0]} castShadow receiveShadow>
            <boxGeometry args={[FW + 0.12, 0.12, FD + 0.12]} />
            <meshStandardMaterial color="#F6F5F1" roughness={1} />
          </mesh>
          <instancedMesh ref={windows} args={[undefined, undefined, wins.length]} frustumCulled={false}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial />
          </instancedMesh>
          <instancedMesh ref={rooms} args={[undefined, undefined, roomCount]} frustumCulled={false}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial transparent />
          </instancedMesh>
        </group>
        {/* tiny scale figures */}
        {[
          [1.45, 0.9],
          [1.7, 0.6],
          [-1.55, 1.05],
        ].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 0.07, 0]} castShadow>
              <cylinderGeometry args={[0.025, 0.03, 0.14, 8]} />
              <meshStandardMaterial color="#5C5A55" roughness={1} />
            </mesh>
            <mesh position={[0, 0.165, 0]} castShadow>
              <sphereGeometry args={[0.024, 10, 8]} />
              <meshStandardMaterial color="#5C5A55" roughness={1} />
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
}
