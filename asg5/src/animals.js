import * as THREE from 'three';
import { OBJLoader  } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader  } from 'three/addons/loaders/MTLLoader.js';
import { scene, camera } from './setup.js';
import {
  loadTex,
  matWhite, matDark, matGray, matMidGray, matNose, matBelly, matFencePost,
} from './materials.js';
import {
  MAP_OFFSET, DEG, addBox, g_map,
  PEN_MX1, PEN_MX2, PEN_MZ1, PEN_MZ2, PX1, PX2, PZ1, PZ2,
  HMX1, HMX2, HMZ1, HMZ2,
} from './world.js';

// ── Pen ───────────────────────────────────────────────────────────────────────
const _penW = PX2 - PX1, _penD = PZ2 - PZ1;
const penFloor = new THREE.Mesh(
  new THREE.PlaneGeometry(_penW, _penD),
  new THREE.MeshLambertMaterial({ map: loadTex('textures/moss_block.jpg', _penW, _penD) })
);
penFloor.rotation.x = -Math.PI / 2;
penFloor.position.set((PX1 + PX2) / 2, 0.001, (PZ1 + PZ2) / 2);
penFloor.receiveShadow = true;
scene.add(penFloor);

for (let px = PX1; px <= PX2; px += 2) {
  addBox(px, 0, PZ1,       0.3, 1.0, 0.3, matFencePost);
  addBox(px, 0, PZ2 - 0.3, 0.3, 1.0, 0.3, matFencePost);
}
for (let pz = PZ1 + 2; pz < PZ2; pz += 2) {
  addBox(PX1, 0, pz, 0.3, 1.0, 0.3, matFencePost);
  addBox(PX2, 0, pz, 0.3, 1.0, 0.3, matFencePost);
}

const _entry = 2;
const _rH  = 0.12;
const _rFW = _penW - _entry - 0.3;
const _rBW = _penW - 0.3;
const _rSD = _penD - 0.6;
const _mkRL = len => new THREE.MeshLambertMaterial({ map: loadTex('textures/spruce_planks.png', len, _rH) });
const _matRF = _mkRL(_rFW), _matRB = _mkRL(_rBW), _matRS = _mkRL(_rSD);

addBox(PX1 + 0.3, 0.6, PZ1,       _rFW, _rH, _rH, _matRF);
addBox(PX1 + 0.3, 0.3, PZ1,       _rFW, _rH, _rH, _matRF);
addBox(PX1 + 0.3, 0.6, PZ2 - _rH, _rBW, _rH, _rH, _matRB);
addBox(PX1 + 0.3, 0.3, PZ2 - _rH, _rBW, _rH, _rH, _matRB);
addBox(PX1, 0.6, PZ1 + 0.3, _rH, _rH, _rSD, _matRS);
addBox(PX1, 0.3, PZ1 + 0.3, _rH, _rH, _rSD, _matRS);
addBox(PX2, 0.6, PZ1 + 0.3, _rH, _rH, _rSD, _matRS);
addBox(PX2, 0.3, PZ1 + 0.3, _rH, _rH, _rSD, _matRS);

// ── Animated Spheres ──────────────────────────────────────────────────────────
export const sphereMeshes = [];
[
  { color: 0xff6633, mx:  3, mz:  3 },
  { color: 0x3388ff, mx: 29, mz:  3 },
  { color: 0xffdd00, mx:  3, mz: 29 },
].forEach(({ color, mx, mz }) => {
  const x = mx + MAP_OFFSET + 0.5, z = mz + MAP_OFFSET + 0.5;
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshPhongMaterial({ color, shininess: 100, specular: 0x444444 })
  );
  mesh.position.set(x, 1.5, z);
  mesh.castShadow = true;
  scene.add(mesh);
  sphereMeshes.push({ mesh, baseY: 1.5 });
});

export function updateSpheres(now, dt) {
  sphereMeshes.forEach(({ mesh, baseY }, i) => {
    mesh.position.y = baseY + Math.sin(now * 0.001 + i * 1.5) * 0.4;
    mesh.rotation.y += dt * 0.8;
  });
}

// ── Koala ─────────────────────────────────────────────────────────────────────
let koalaX   = 15.2 + MAP_OFFSET;
let koalaZ   = 11.0 + MAP_OFFSET;
let koalaFacing      = 0;
let koalaWanderAngle = 0;
let koalaWanderTimer = 120;

export const koalaGroup = new THREE.Group();
koalaGroup.position.set(koalaX, 1.02, koalaZ);
scene.add(koalaGroup);

function kBox(w, h, d, cx, cy, cz, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(cx, cy, cz);
  m.castShadow = true;
  koalaGroup.add(m);
  return m;
}

kBox(0.7,  0.5,  1.4,   0,     0,     0,     matGray);
kBox(0.64, 0.62, 0.58,  0,     0.31,  0.69,  matMidGray);
kBox(0.34, 0.22, 0.07,  0,     0.21,  0.985, matNose);
kBox(0.08, 0.08, 0.04, -0.24,  0.32,  0.98,  matDark);
kBox(0.08, 0.08, 0.04,  0.24,  0.32,  0.98,  matDark);
kBox(0.18, 0.14, 0.1,   0.04,  0.25, -0.67,  matGray);
kBox(0.56, 0.4,  0.72,  0,    -0.02,  0.36,  matBelly);

function addEar(cx, cy, cz) {
  const ear = new THREE.Mesh(
    new THREE.CylinderGeometry(0.21, 0.21, 0.3, 8),
    new THREE.MeshLambertMaterial({ color: 0x949494 })
  );
  ear.rotation.x = Math.PI / 2;
  ear.position.set(cx, cy, cz);
  koalaGroup.add(ear);
  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 0.05, 8),
    new THREE.MeshLambertMaterial({ color: 0xc0b8b8 })
  );
  inner.rotation.x = Math.PI / 2;
  inner.position.set(cx, cy, cz + 0.14);
  koalaGroup.add(inner);
}
addEar(-0.325, 0.71, 0.65);
addEar( 0.325, 0.71, 0.65);

export const koalaLegs = {};

function makeLeg(name, hx, hy, hz, hipSign, kneeMax, ankleSign) {
  const hipPivot = new THREE.Group();
  hipPivot.position.set(hx, hy, hz);
  koalaGroup.add(hipPivot);

  const upper = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.55, 0.28), matGray);
  upper.position.set(0.14, -0.275, 0.14);
  upper.castShadow = true;
  hipPivot.add(upper);

  const kneePivot = new THREE.Group();
  kneePivot.position.set(0, -0.55, 0);
  hipPivot.add(kneePivot);

  const lower = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.40, 0.28), matMidGray);
  lower.position.set(0.14, -0.20, 0.14);
  lower.castShadow = true;
  kneePivot.add(lower);

  const anklePivot = new THREE.Group();
  anklePivot.position.set(-0.03, -0.40, -0.03);
  kneePivot.add(anklePivot);

  const paw = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.15, 0.34), matDark);
  paw.position.set(0.17, -0.075, 0.17);
  paw.castShadow = true;
  anklePivot.add(paw);

  koalaLegs[name] = { hipPivot, kneePivot, anklePivot, hipSign, kneeMax, ankleSign };
}

makeLeg('fl', -0.52, 0.25,  0.45,  1, false,  1);
makeLeg('fr',  0.30, 0.25,  0.45, -1, true,  -1);
makeLeg('bl', -0.52, 0.25, -0.55, -1, false, -1);
makeLeg('br',  0.30, 0.25, -0.55,  1, false,  1);

export function updateKoala(now, dt) {
  const t = now * 0.003;
  for (const leg of Object.values(koalaLegs)) {
    leg.hipPivot.rotation.x   = leg.hipSign   * 25 * Math.sin(t) * DEG;
    leg.kneePivot.rotation.x  = 20 * Math.max(0, leg.hipSign * Math.sin(t)) * DEG;
    leg.anklePivot.rotation.x = leg.ankleSign *  8 * Math.sin(t) * DEG;
  }

  koalaWanderTimer--;
  if (koalaWanderTimer <= 0) {
    koalaWanderAngle = Math.random() * Math.PI * 2;
    koalaWanderTimer = Math.floor(Math.random() * 200) + 80;
  }
  const kwx = Math.cos(koalaWanderAngle) * 0.008 * dt * 60;
  const kwz = Math.sin(koalaWanderAngle) * 0.008 * dt * 60;
  const kMx = koalaX - MAP_OFFSET + kwx;
  const kMz = koalaZ - MAP_OFFSET + kwz;
  const kimx = Math.floor(kMx), kimz = Math.floor(kMz);
  if (kimx >= 1 && kimx < 31 && kimz >= 1 && kimz < 31 && g_map[kimz][kimx] === 0) {
    koalaX = kMx + MAP_OFFSET;
    koalaZ = kMz + MAP_OFFSET;
    koalaFacing = Math.atan2(kwx, kwz);
  } else {
    koalaWanderAngle = Math.random() * Math.PI * 2;
    koalaWanderTimer = 30;
  }
  koalaGroup.position.set(koalaX, 1.02, koalaZ);
  koalaGroup.rotation.y = koalaFacing;
}

// ── Sheep ─────────────────────────────────────────────────────────────────────
function createSheep() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.8), matWhite);
  body.position.set(0, 0.475, 0);
  body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.35), matWhite);
  head.position.set(0, 0.65, 0.525);
  group.add(head);

  [-1, 1].forEach(side => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.04), matDark);
    eye.position.set(side * 0.1, 0.68, 0.69);
    group.add(eye);
  });

  const legPivots = [];
  [[-0.2, 0.2], [0.2, 0.2], [-0.2, -0.2], [0.2, -0.2]].forEach(([lx, lz]) => {
    const pivot = new THREE.Group();
    pivot.position.set(lx, 0.3, lz);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.3, 0.15), matDark);
    leg.position.set(0, -0.15, 0);
    pivot.add(leg);
    group.add(pivot);
    legPivots.push(pivot);
  });
  return { group, legPivots };
}

let g_gameWon   = false;
let g_sheepTime = 0;
export const g_sheep = [];

export function initSheep() {
  const candidates = [];
  for (let mz = 2; mz < 30; mz++) {
    for (let mx = 2; mx < 30; mx++) {
      if (g_map[mz][mx] !== 0) continue;
      if (mx >= PEN_MX1 - 2 && mx <= PEN_MX2 + 2 &&
          mz >= PEN_MZ1 - 2 && mz <= PEN_MZ2 + 2) continue;
      if (mx >= 14 && mx <= 18 && mz >= 12 && mz <= 16) continue;
      if (mx >= HMX1 && mx <= HMX2 && mz >= HMZ1 && mz <= HMZ2) continue;
      candidates.push({ mx, mz });
    }
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  for (let i = 0; i < 25; i++) {
    const { mx, mz } = candidates[i];
    const { group, legPivots } = createSheep();
    const sx = mx + 0.5, sz = mz + 0.5;
    group.position.set(sx + MAP_OFFSET, 0, sz + MAP_OFFSET);
    scene.add(group);
    g_sheep.push({
      group, legPivots,
      mx: sx, mz: sz,
      following: false, herded: false,
      prevPX: 0, prevPZ: 0,
      wanderAngle: Math.random() * Math.PI * 2,
      wanderTimer: Math.floor(Math.random() * 120) + 60,
      facingAngle: 0, isMoving: false,
    });
  }
}

export function updateSheep(delta) {
  if (g_gameWon) return;
  g_sheepTime += 0.1;

  const px = camera.position.x - MAP_OFFSET;
  const pz = camera.position.z - MAP_OFFSET;
  let herdedCount = 0;

  for (const s of g_sheep) {
    if (s.herded) { herdedCount++; continue; }

    if (s.mx >= PEN_MX1 + 1 && s.mx <= PEN_MX2 - 1 &&
        s.mz >= PEN_MZ1 + 1 && s.mz <= PEN_MZ2 - 1) {
      s.herded = true;
      s.following = false;
      s.isMoving = false;
      herdedCount++;
      continue;
    }

    if (s.following) {
      const tx = s.prevPX - s.mx, tz = s.prevPZ - s.mz;
      const tlen = Math.sqrt(tx * tx + tz * tz);
      if (tlen > 0.1) {
        s.mx += (tx / tlen) * 0.03;
        s.mz += (tz / tlen) * 0.03;
        s.facingAngle = Math.atan2(tx, tz);
        s.isMoving = true;
      }
    } else {
      s.wanderTimer--;
      s.isMoving = false;
      if (s.wanderTimer <= 0) {
        s.wanderAngle = Math.random() * Math.PI * 2;
        s.wanderTimer = Math.floor(Math.random() * 180) + 60;
      }
      const wx = Math.cos(s.wanderAngle) * 0.012 * delta * 60;
      const wz = Math.sin(s.wanderAngle) * 0.012 * delta * 60;
      const nx = s.mx + wx, nz = s.mz + wz;
      const imx = Math.floor(nx), imz = Math.floor(nz);
      if (imx >= 1 && imx < 31 && imz >= 1 && imz < 31 && g_map[imz][imx] === 0) {
        s.mx = nx; s.mz = nz;
        s.facingAngle = Math.atan2(wx, wz);
        s.isMoving = true;
      } else {
        s.wanderAngle = Math.random() * Math.PI * 2;
        s.wanderTimer = 30;
      }
    }

    s.prevPX = px;
    s.prevPZ = pz;

    s.group.position.set(s.mx + MAP_OFFSET, 0, s.mz + MAP_OFFSET);
    s.group.rotation.y = s.facingAngle;

    const swing = s.isMoving ? Math.sin(g_sheepTime * 1.5) * 0.35 : 0;
    s.legPivots.forEach((p, i) => { p.rotation.x = (i % 2 === 0) ? swing : -swing; });
  }

  const el = document.getElementById('sheepCounter');
  if (el) el.textContent = herdedCount + '/25';

  if (herdedCount === 25 && !g_gameWon) {
    g_gameWon = true;
    const win = document.getElementById('winMessage');
    if (win) { win.style.display = 'block'; setTimeout(() => { win.style.display = 'none'; }, 30000); }
  }
}

initSheep();

// ── Dragon ────────────────────────────────────────────────────────────────────
const mtlLoader = new MTLLoader();
mtlLoader.load('dragon.mtl', (materials) => {
  materials.preload();
  const objLoader = new OBJLoader();
  objLoader.setMaterials(materials);
  objLoader.load('dragon.obj', (obj) => {
    obj.traverse(child => {
      if (child.isMesh) { child.castShadow = child.receiveShadow = true; }
    });
    obj.scale.setScalar(0.5);
    obj.position.set(-4.5, 4 + 2.37 * 0.5, 7.5);
    obj.rotation.y = Math.PI;
    scene.add(obj);
  });
});
