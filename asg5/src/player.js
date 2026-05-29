import * as THREE from 'three';
import { renderer, camera, setSunAngle } from './setup.js';
import { g_map, MAP_OFFSET, treeTrunks } from './world.js';
import { _doorData, _doorMeshes } from './cottage.js';
import { g_sheep } from './animals.js';

// ── Mouse look ────────────────────────────────────────────────────────────────
export let yaw = 0;
let pitch = 0;
const SENSITIVITY = 0.004;

export function isLocked() { return document.pointerLockElement === renderer.domElement; }

let _gameStarted = false;
document.getElementById('overlay').addEventListener('click', () => {
  _gameStarted = true;
  renderer.domElement.requestPointerLock();
});

renderer.domElement.addEventListener('click', () => {
  if (_gameStarted && !isLocked()) renderer.domElement.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
  document.getElementById('overlay').style.display =
    (!_gameStarted && !isLocked()) ? 'flex' : 'none';
});

document.addEventListener('mousemove', (e) => {
  if (!isLocked()) return;
  yaw   -= e.movementX * SENSITIVITY;
  pitch -= e.movementY * SENSITIVITY;
  pitch  = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch));
  const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
  camera.quaternion.copy(qY).multiply(qX);
});

// ── Sun slider ────────────────────────────────────────────────────────────────
const _sunSlider = document.getElementById('sunSlider');
if (_sunSlider) {
  _sunSlider.addEventListener('input', () => {
    setSunAngle((parseFloat(_sunSlider.value) / 100) * Math.PI);
  });
}
export { _sunSlider };

// ── Door interaction ──────────────────────────────────────────────────────────
const _doorRaycaster = new THREE.Raycaster();
renderer.domElement.addEventListener('click', () => {
  if (!isLocked()) return;
  _doorRaycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = _doorRaycaster.intersectObjects(_doorMeshes);
  if (hits.length > 0 && hits[0].distance < 5) {
    const d = hits[0].object.userData.door;
    d.isOpen = !d.isOpen;
    d.pivot.rotation.y = d.isOpen ? d.openAngle : 0;
  }
});

// ── WASD + collision + jump ───────────────────────────────────────────────────
const keys = {};
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'KeyR') trySelectSheep();
  if (e.code === 'Space') e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.code] = false; });

const BOUNDARY = 400;
const SPEED    = 12;
const _fwd   = new THREE.Vector3();
const _right  = new THREE.Vector3();
const _up     = new THREE.Vector3(0, 1, 0);
let velocityY = 0;

function playerCollides(px, pz, feetY) {
  const r = 0.3;
  for (const [ox, oz] of [[-r, -r], [r, -r], [-r, r], [r, r]]) {
    const mx = Math.floor(px + ox - MAP_OFFSET);
    const mz = Math.floor(pz + oz - MAP_OFFSET);
    if (mx < 0 || mx >= 32 || mz < 0 || mz >= 32) continue;
    if (g_map[mz][mx] > feetY) return true;
  }
  for (const [tx, tz] of treeTrunks) {
    if (Math.abs(px - tx) < 0.65 && Math.abs(pz - tz) < 0.65) return true;
  }
  if (feetY < 2) {
    const _doorLocal = [[[0,-0.04],[1,-0.04],[0,0.04],[1,0.04]],[[-1,-0.04],[0,-0.04],[-1,0.04],[0,0.04]]];
    for (let di = 0; di < _doorData.length; di++) {
      const { pivot } = _doorData[di];
      const ry = pivot.rotation.y;
      const pvx = pivot.position.x, pvz = pivot.position.z;
      const cos = Math.cos(ry), sin = Math.sin(ry);
      let xMin = Infinity, xMax = -Infinity, zMin = Infinity, zMax = -Infinity;
      for (const [lx, lz] of _doorLocal[di]) {
        const wx = pvx + lx * cos + lz * sin;
        const wz = pvz - lx * sin + lz * cos;
        if (wx < xMin) xMin = wx; if (wx > xMax) xMax = wx;
        if (wz < zMin) zMin = wz; if (wz > zMax) zMax = wz;
      }
      if (px > xMin - 0.3 && px < xMax + 0.3 && pz > zMin - 0.3 && pz < zMax + 0.3) return true;
    }
  }
  return false;
}

function getGroundHeight(px, pz) {
  const mx = Math.floor(px - MAP_OFFSET);
  const mz = Math.floor(pz - MAP_OFFSET);
  if (mx < 0 || mx >= 32 || mz < 0 || mz >= 32) return 0;
  return g_map[mz][mx];
}

export function movePlayer(dt) {
  if (!isLocked()) return;
  _fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw));
  _right.crossVectors(_fwd, _up);

  const p = camera.position;
  const feetY = p.y - 1.7;
  let mdx = 0, mdz = 0;
  if (keys['KeyW']) { mdx += _fwd.x;   mdz += _fwd.z; }
  if (keys['KeyS']) { mdx -= _fwd.x;   mdz -= _fwd.z; }
  if (keys['KeyD']) { mdx += _right.x; mdz += _right.z; }
  if (keys['KeyA']) { mdx -= _right.x; mdz -= _right.z; }
  const mlen = Math.sqrt(mdx * mdx + mdz * mdz);
  const dx = mlen > 0 ? (mdx / mlen) * SPEED * dt : 0;
  const dz = mlen > 0 ? (mdz / mlen) * SPEED * dt : 0;

  if (!playerCollides(p.x + dx, p.z, feetY)) p.x += dx;
  if (!playerCollides(p.x, p.z + dz, feetY)) p.z += dz;

  const dist = Math.sqrt(p.x * p.x + p.z * p.z);
  if (dist > BOUNDARY) { p.x = (p.x / dist) * BOUNDARY; p.z = (p.z / dist) * BOUNDARY; }

  const floorY = getGroundHeight(p.x, p.z) + 1.7;
  if (keys['Space'] && p.y <= floorY + 0.05) velocityY = 8;
  velocityY += -20 * dt;
  p.y += velocityY * dt;
  if (p.y < floorY) { p.y = floorY; velocityY = 0; }
}

export function trySelectSheep() {
  const px = camera.position.x, pz = camera.position.z;
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  let bestDist = 3.5, bestIdx = -1;
  g_sheep.forEach((s, i) => {
    if (s.herded) return;
    const dx = (s.mx + MAP_OFFSET) - px;
    const dz = (s.mz + MAP_OFFSET) - pz;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < bestDist) {
      const dot = (dx / dist) * fx + (dz / dist) * fz;
      if (dot > 0.3) { bestDist = dist; bestIdx = i; }
    }
  });
  if (bestIdx >= 0) {
    g_sheep[bestIdx].following = !g_sheep[bestIdx].following;
  }
}
