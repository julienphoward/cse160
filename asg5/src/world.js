import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { scene } from './setup.js';
import {
  loadTex, texLoader,
  matGround, matSand, matStone, matLog, matLeaf,
} from './materials.js';

export const MAP_OFFSET = -16;
export const DEG = Math.PI / 180;

// ── House bounds (shared with cottage, animals, player) ───────────────────────
export const HMX1 = 22, HMX2 = 28;
export const HMZ1 = 23, HMZ2 = 29;
export const HWH  = 3;
export const HDOOR1 = 24, HDOOR2 = 25;

// ── Pen bounds (world-space corners exported for animals.js) ──────────────────
export const PEN_MX1 = 11, PEN_MX2 = 19, PEN_MZ1 = 3, PEN_MZ2 = 11;
export const PX1 = PEN_MX1 + MAP_OFFSET;
export const PX2 = PEN_MX2 + MAP_OFFSET;
export const PZ1 = PEN_MZ1 + MAP_OFFSET;
export const PZ2 = PEN_MZ2 + MAP_OFFSET;

// ── Ground ────────────────────────────────────────────────────────────────────
const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), matGround);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ── Box helper: corner at (x,y,z), dimensions (w,h,d) ────────────────────────
export function addBox(x, y, z, w, h, d, mat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x + w * 0.5, y + h * 0.5, z + d * 0.5);
  mesh.castShadow = mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

// ── 32×32 World Map ───────────────────────────────────────────────────────────
export const g_map = [
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,3,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,3,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,3,4,4,3,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,4],
  [4,0,0,0,0,2,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,3,4,4,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
];

for (let i = 0; i < 32; i++) {
  g_map[0][i] = 0; g_map[31][i] = 0;
  g_map[i][0] = 0; g_map[i][31] = 0;
}
g_map[20][24] = 0; g_map[20][25] = 0; g_map[21][24] = 0; g_map[22][24] = 0;

for (let c = HMX1; c <= HMX2; c++) { g_map[HMZ1][c] = 3; g_map[HMZ2][c] = 3; }
for (let r = HMZ1; r <= HMZ2; r++) { g_map[r][HMX1] = 3; g_map[r][HMX2] = 3; }
g_map[HMZ1][HDOOR1] = 0; g_map[HMZ1][HDOOR2] = 0;

const houseWallSet = new Set();
for (let c = HMX1; c <= HMX2; c++) { houseWallSet.add(`${HMZ1},${c}`); houseWallSet.add(`${HMZ2},${c}`); }
for (let r = HMZ1 + 1; r <= HMZ2 - 1; r++) { houseWallSet.add(`${r},${HMX1}`); houseWallSet.add(`${r},${HMX2}`); }

for (let mz = 1; mz < 31; mz++) {
  for (let mx = 1; mx < 31; mx++) {
    const h = g_map[mz][mx];
    if (h === 0) continue;
    if (houseWallSet.has(`${mz},${mx}`)) continue;
    for (let y = 0; y < h; y++) {
      addBox(mx + MAP_OFFSET, y, mz + MAP_OFFSET, 1, 1, 1, matStone);
    }
  }
}

// ── Moat constants ────────────────────────────────────────────────────────────
export const MOAT_INNER = 33, MOAT_OUTER = 48, MOAT_CORNER_R = 10;
export const _moatInnerEdge = MOAT_INNER - MOAT_CORNER_R;

function _inRoundedInner(wx, wz) {
  const dx = Math.max(0, Math.abs(wx) - _moatInnerEdge);
  const dz = Math.max(0, Math.abs(wz) - _moatInnerEdge);
  return dx * dx + dz * dz < MOAT_CORNER_R * MOAT_CORNER_R;
}
export const inMoat = (wx, wz) =>
  Math.abs(wx) < MOAT_OUTER && Math.abs(wz) < MOAT_OUTER && !_inRoundedInner(wx, wz);

// ── Trees ─────────────────────────────────────────────────────────────────────
export const treeTrunks = [];

function _cloneTiled(baseTex, rx, ry) {
  const t = baseTex.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestMipmapLinearFilter;
  t.needsUpdate = true;
  return t;
}

const logMats = {}, branchMats = {}, branchZMats = {}, leafMats = {};
const leafSideMats = {}, leafTopMats = {};
for (let h = 3; h <= 20; h++)
  logMats[h] = new THREE.MeshLambertMaterial({ map: _cloneTiled(matLog.map, 1, h) });
for (let len = 1; len <= 5; len++) {
  branchMats[len]  = new THREE.MeshLambertMaterial({ map: _cloneTiled(matLog.map, len, 1) });
  branchZMats[len] = new THREE.MeshLambertMaterial({ map: _cloneTiled(matLog.map, 1, len) });
}
for (let cw = 1; cw <= 7; cw++) {
  for (let ch = 1; ch <= 4; ch++)
    leafMats[`${cw},${ch}`] = new THREE.MeshLambertMaterial({ map: _cloneTiled(matLeaf.map, cw, ch) });
  leafSideMats[cw] = new THREE.MeshLambertMaterial({ map: _cloneTiled(matLeaf.map, cw, 1) });
  leafTopMats[cw]  = new THREE.MeshLambertMaterial({ map: _cloneTiled(matLeaf.map, cw, cw) });
}

function _addLeaf(gx, gy, gz, w, h, d) {
  let mat;
  if (h === 1 && w > 1) {
    const sw = Math.min(7, w), sd = Math.min(7, d), st = Math.min(7, Math.max(w, d));
    mat = [
      leafSideMats[sd], leafSideMats[sd],
      leafTopMats[st],  leafTopMats[st],
      leafSideMats[sw], leafSideMats[sw],
    ];
  } else {
    const cw = Math.min(7, w), ch = Math.min(4, h);
    mat = leafMats[`${cw},${ch}`];
  }
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(gx, gy, gz);
  m.castShadow    = false;
  m.receiveShadow = true;
  scene.add(m);
}

function placeTree(wx, wz) {
  treeTrunks.push([wx, wz]);
  const h = 3 + Math.floor(Math.random() * 18);
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(1, h, 1), logMats[h]);
  trunk.position.set(wx, h * 0.5, wz);
  trunk.castShadow = true;
  scene.add(trunk);

  const numBranches = 1 + Math.floor(Math.random() * 3);
  for (let b = 0; b < numBranches; b++) {
    const bh   = Math.floor(h * (0.4 + Math.random() * 0.4));
    const blen = 1 + Math.floor(Math.random() * Math.min(3, Math.floor(h / 3)));
    const bm   = branchMats[Math.min(blen, 5)];
    const dir  = Math.floor(Math.random() * 4);
    if (dir < 2) {
      const sx = dir === 0 ? 1 : -1;
      const br = new THREE.Mesh(new THREE.BoxGeometry(blen, 1, 1), bm);
      br.position.set(wx + sx * blen * 0.5, bh, wz);
      br.castShadow = false; br.receiveShadow = true; scene.add(br);
      const cs = 2 + Math.floor(Math.random() * 2);
      _addLeaf(wx + sx * (blen + cs * 0.5 - 0.5), bh + cs * 0.4, wz, cs, cs, cs);
    } else {
      const sz = dir === 2 ? 1 : -1;
      const br = new THREE.Mesh(new THREE.BoxGeometry(1, 1, blen), branchZMats[Math.min(blen, 5)]);
      br.position.set(wx, bh, wz + sz * blen * 0.5);
      br.castShadow = false; br.receiveShadow = true; scene.add(br);
      const cs = 2 + Math.floor(Math.random() * 2);
      _addLeaf(wx, bh + cs * 0.4, wz + sz * (blen + cs * 0.5 - 0.5), cs, cs, cs);
    }
  }

  const baseW   = 3 + Math.min(4, Math.floor(h / 5));
  const numLays = 3 + Math.floor(Math.random() * 3);
  for (let lay = 0; lay < numLays; lay++) {
    const t  = lay / numLays;
    const lw = Math.min(7, Math.max(2, Math.round(baseW * (1.0 - t * 0.55) + (Math.random() - 0.5) * 2)));
    const ox = (Math.random() - 0.5) * 2.5;
    const oz = (Math.random() - 0.5) * 2.5;
    const oy = h - 1 + lay;
    _addLeaf(wx + ox, oy, wz + oz, lw, 1, lw);
  }
  const numSide = 1 + Math.floor(Math.random() * 3);
  for (let s = 0; s < numSide; s++) {
    const ang = Math.random() * Math.PI * 2;
    const rad = baseW * (0.4 + Math.random() * 0.4);
    const cs  = 2 + Math.floor(Math.random() * 2);
    _addLeaf(wx + Math.cos(ang) * rad, h - 1 + Math.random() * 2, wz + Math.sin(ang) * rad, cs, cs, cs);
  }
}

const TREE_EXCL = [
  [0,    0,    25],
  [-1,   -9,   25],
  [-4.5, 7.5,  36],
  [9.5,  10.5, 256],
  [-12.5,-12.5, 6.25],
  [13.5, -12.5, 6.25],
  [-12.5, 13.5, 6.25],
];
const inExcl = (wx, wz) => TREE_EXCL.some(([cx, cz, r2]) => (wx-cx)**2 + (wz-cz)**2 < r2);

{
  const CELL = 3.0, MIN2 = 4.0;
  const placed = [];
  for (let gx = -32; gx < 32; gx += CELL) {
    for (let gz = -32; gz < 32; gz += CELL) {
      if (Math.random() > 0.39) continue;
      const wx = gx + Math.random() * CELL, wz = gz + Math.random() * CELL;
      if (inExcl(wx, wz)) continue;
      if (inMoat(wx, wz)) continue;
      const tmx = Math.floor(wx + 16), tmz = Math.floor(wz + 16);
      if (tmx >= 0 && tmx < 32 && tmz >= 0 && tmz < 32 && g_map[tmz][tmx] !== 0) continue;
      if (placed.some(([tx, tz]) => (wx-tx)**2 + (wz-tz)**2 < MIN2)) continue;
      placed.push([wx, wz]);
      placeTree(wx, wz);
    }
  }
}

{
  const CELL = 35.0;
  for (let gx = -400; gx < 400; gx += CELL) {
    for (let gz = -400; gz < 400; gz += CELL) {
      if (Math.random() > 0.19) continue;
      const wx = gx + Math.random() * CELL, wz = gz + Math.random() * CELL;
      const d2 = wx * wx + wz * wz;
      if (d2 < 35 * 35 || d2 > 395 * 395) continue;
      if (inExcl(wx, wz)) continue;
      if (inMoat(wx, wz)) continue;
      if (treeTrunks.some(([tx, tz]) => (wx-tx)**2 + (wz-tz)**2 < 4)) continue;
      placeTree(wx, wz);
    }
  }
}

// ── Sand bank ─────────────────────────────────────────────────────────────────
export const sandSet = new Set();
{
  const MI = MOAT_INNER, MO = MOAT_OUTER;
  const MAX_SAND = 7;

  function genSandBank(bankAxis, perpStart, perpDir, rangeFrom, rangeTo) {
    for (let p = rangeFrom; p < rangeTo; p++) {
      const d = 1 + Math.floor(Math.random() * MAX_SAND);
      for (let k = 0; k < d; k++) {
        const perp = perpStart + perpDir * k;
        const wx = (bankAxis === 'z' ? p : perp) + 0.5;
        const wz = (bankAxis === 'z' ? perp : p) + 0.5;
        if (inMoat(wx, wz)) break;
        sandSet.add(bankAxis === 'z' ? `${p},${perp}` : `${perp},${p}`);
      }
    }
  }

  genSandBank('z', -MI,     +1, -MO,  MO);
  genSandBank('z',  MI - 1, -1, -MO,  MO);
  genSandBank('x', -MI,     +1, -MI,  MI);
  genSandBank('x',  MI - 1, -1, -MI,  MI);
  genSandBank('z', -MO - 1, -1, -MO,  MO);
  genSandBank('z',  MO,     +1, -MO,  MO);
  genSandBank('x', -MO - 1, -1, -MO,  MO);
  genSandBank('x',  MO,     +1, -MO,  MO);

  const scan = MOAT_CORNER_R + MAX_SAND + 2;
  for (const [sx, sz] of [[-1,-1],[1,-1],[1,1],[-1,1]]) {
    const cx = sx * _moatInnerEdge, cz_c = sz * _moatInnerEdge;
    for (let dix = -scan; dix <= scan; dix++) {
      for (let diz = -scan; diz <= scan; diz++) {
        const ix = Math.round(cx) + dix, iz = Math.round(cz_c) + diz;
        const wx = ix + 0.5, wz = iz + 0.5;
        if (inMoat(wx, wz)) continue;
        if (Math.sign(wx) !== sx || Math.sign(wz) !== sz) continue;
        const ddx = Math.max(0, Math.abs(wx) - _moatInnerEdge);
        const ddz = Math.max(0, Math.abs(wz) - _moatInnerEdge);
        const distIn = MOAT_CORNER_R - Math.sqrt(ddx * ddx + ddz * ddz);
        if (distIn < 0 || distIn > MAX_SAND) continue;
        sandSet.add(`${ix},${iz}`);
      }
    }
  }

  const sandGeo = new THREE.PlaneGeometry(1, 1);
  for (const key of sandSet) {
    const comma = key.indexOf(',');
    const ix = parseInt(key.slice(0, comma), 10);
    const iz = parseInt(key.slice(comma + 1), 10);
    const tile = new THREE.Mesh(sandGeo, matSand);
    tile.rotation.x   = -Math.PI / 2;
    tile.position.set(ix + 0.5, 0.002, iz + 0.5);
    tile.receiveShadow = true;
    scene.add(tile);
  }
}

// ── Tall Grass & Flowers ──────────────────────────────────────────────────────
const grassTex = texLoader.load('textures/Tall_Grass_JE4.png');
grassTex.magFilter = grassTex.minFilter = THREE.NearestFilter;
const matGrass = new THREE.MeshBasicMaterial({
  map: grassTex, transparent: true, alphaTest: 0.4,
  side: THREE.DoubleSide, depthWrite: false,
});
const grassGeo = new THREE.PlaneGeometry(0.9, 1.0);
const _grassPos = [];
function addGrass(x, z) { _grassPos.push(x, z); }

const FLOWER_COLORS = [0xff3333, 0xffee00, 0xff88dd, 0xffffff, 0xff8800, 0x8855ff];
const flowerMats = FLOWER_COLORS.map(c => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
const flowerGeo  = new THREE.PlaneGeometry(0.35, 0.4);
const _flowerPos = FLOWER_COLORS.map(() => []); // per-color: [x, z, ry0, ry1, ...]
function addFlower(x, z) {
  const ci = Math.floor(Math.random() * FLOWER_COLORS.length);
  _flowerPos[ci].push(x, z,
    (Math.random() - 0.5) * 0.5,
    Math.PI / 2 + (Math.random() - 0.5) * 0.5
  );
}

for (let wx = -32; wx < 32; wx++) {
  for (let wz = -32; wz < 32; wz++) {
    if (inMoat(wx + 0.5, wz + 0.5)) continue;
    if (sandSet.has(`${wx},${wz}`)) continue;
    const mx = Math.floor(wx + 16), mz = Math.floor(wz + 16);
    const inMap = mx >= 0 && mx < 32 && mz >= 0 && mz < 32;
    if (inMap && g_map[mz][mx] !== 0) continue;
    if (inMap && mx >= PEN_MX1 && mx <= PEN_MX2 && mz >= PEN_MZ1 && mz <= PEN_MZ2) continue;
    if (inMap && mx >= HMX1 && mx <= HMX2 && mz >= HMZ1 && mz <= HMZ2) continue;
    if (inMap && mx >= HDOOR1 && mx <= HDOOR2 && mz === HMZ1 - 1) continue;
    const jx = wx + Math.random() * 0.9 + 0.05;
    const jz = wz + Math.random() * 0.9 + 0.05;
    const r = Math.random();
    if (r < 0.28) addGrass(jx, jz);
    else if (r < 0.33) addFlower(jx, jz);
  }
}

for (let gx = -400; gx < 400; gx += 5) {
  for (let gz = -400; gz < 400; gz += 5) {
    const d2 = gx * gx + gz * gz;
    if (d2 < 35 * 35 || d2 > 400 * 400) continue;
    if (inMoat(gx, gz)) continue;
    if (sandSet.has(`${Math.floor(gx)},${Math.floor(gz)}`)) continue;
    const jx = gx + Math.random() * 5, jz = gz + Math.random() * 5;
    if (inMoat(jx, jz)) continue;
    const r = Math.random();
    if (r < 0.05) addGrass(jx, jz);
    else if (r < 0.06) addFlower(jx, jz);
  }
}

// ── Build grass + flower InstancedMesh ───────────────────────────────────────
{
  const _d = new THREE.Object3D();

  const iGrass = new THREE.InstancedMesh(grassGeo, matGrass, _grassPos.length);
  iGrass.castShadow = false;
  for (let i = 0, n = _grassPos.length / 2; i < n; i++) {
    const x = _grassPos[i * 2], z = _grassPos[i * 2 + 1];
    for (let a = 0; a < 2; a++) {
      _d.position.set(x, 0.5, z);
      _d.rotation.set(0, a * Math.PI / 2, 0);
      _d.updateMatrix();
      iGrass.setMatrixAt(i * 2 + a, _d.matrix);
    }
  }
  iGrass.instanceMatrix.needsUpdate = true;
  scene.add(iGrass);

  _flowerPos.forEach((pos, ci) => {
    if (pos.length === 0) return;
    const count = pos.length / 4; // each entry: x, z, ry0, ry1
    const iF = new THREE.InstancedMesh(flowerGeo, flowerMats[ci], count * 2);
    iF.castShadow = false;
    for (let i = 0; i < count; i++) {
      const x = pos[i * 4], z = pos[i * 4 + 1];
      const ry = [pos[i * 4 + 2], pos[i * 4 + 3]];
      for (let a = 0; a < 2; a++) {
        _d.position.set(x, 0.2, z);
        _d.rotation.set(0, ry[a], 0);
        _d.updateMatrix();
        iF.setMatrixAt(i * 2 + a, _d.matrix);
      }
    }
    iF.instanceMatrix.needsUpdate = true;
    scene.add(iF);
  });
}

// ── Water Moat ────────────────────────────────────────────────────────────────
export const waterUniforms = {
  time:       { value: 0 },
  uSunDir:    { value: new THREE.Vector3(0.5, 0.8, 0.3) },
  uCameraPos: { value: new THREE.Vector3() },
  uSkyColor:  { value: new THREE.Color(0.53, 0.81, 0.98) },
};

const waterMat = new THREE.ShaderMaterial({
  uniforms: waterUniforms,
  vertexShader: `
    varying vec3 vWorldPos;
    void main() {
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec3  uSunDir;
    uniform vec3  uCameraPos;
    uniform vec3  uSkyColor;
    varying vec3  vWorldPos;

    void main() {
      vec2 uv1 = vWorldPos.xz * 0.20 + vec2(time * 0.035, time * 0.028);
      vec2 uv2 = vWorldPos.xz * 0.52 + vec2(-time * 0.06, time * 0.048);

      float r1 = sin(uv1.x * 3.14 + time * 0.75) * sin(uv1.y * 2.51 + time * 0.55);
      float r2 = sin((uv1.x + uv1.y) * 2.73 - time * 0.65);
      float r3 = sin(uv2.x * 4.20 - time * 1.05) * sin(uv2.y * 3.80 + time * 0.48);
      float r4 = sin((uv2.x - uv2.y) * 3.60 + time * 0.88);

      float ripple = clamp((r1*0.38 + r2*0.26 + r3*0.24 + r4*0.12) * 0.5 + 0.5, 0.0, 1.0);
      vec3 normal = normalize(vec3((r1 - r2) * 0.12, 1.0, (r2 - r3) * 0.12));

      vec3  viewDir  = normalize(uCameraPos - vWorldPos);
      vec3  halfVec  = normalize(uSunDir + viewDir);
      float sunElev  = max(0.0, uSunDir.y);
      float spec     = pow(max(0.0, dot(normal, halfVec)), 90.0) * sunElev;

      vec3 deep    = vec3(0.01, 0.04, 0.13);
      vec3 shallow = mix(vec3(0.08, 0.38, 0.68), uSkyColor * 0.70, 0.45);
      vec3 base    = mix(deep, shallow, ripple * ripple);
      base += vec3(1.00, 0.97, 0.88) * spec * 1.4;

      float alpha = mix(0.90, 0.72, ripple);
      gl_FragColor = vec4(base, alpha);
    }
  `,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const matRiverBed = new THREE.MeshLambertMaterial({ color: 0x050302 });

{
  const MI = MOAT_INNER, MO = MOAT_OUTER, r = MOAT_CORNER_R, s = _moatInnerEdge;

  const moatShape = new THREE.Shape();
  moatShape.moveTo(-MO, -MO);
  moatShape.lineTo( MO, -MO);
  moatShape.lineTo( MO,  MO);
  moatShape.lineTo(-MO,  MO);
  moatShape.closePath();

  const hole = new THREE.Path();
  hole.moveTo(-s,  MI);
  hole.lineTo( s,  MI);
  hole.quadraticCurveTo( MI,  MI,  MI,  s);
  hole.lineTo( MI, -s);
  hole.quadraticCurveTo( MI, -MI,  s, -MI);
  hole.lineTo(-s, -MI);
  hole.quadraticCurveTo(-MI, -MI, -MI, -s);
  hole.lineTo(-MI,  s);
  hole.quadraticCurveTo(-MI,  MI, -s,  MI);
  hole.closePath();
  moatShape.holes.push(hole);

  const moatGeo = new THREE.ShapeGeometry(moatShape, 32);

  const bed = new THREE.Mesh(moatGeo, matRiverBed);
  bed.rotation.x = -Math.PI / 2;
  bed.position.set(0, 0.001, 0);
  bed.receiveShadow = true;
  scene.add(bed);

  const surf = new THREE.Mesh(moatGeo, waterMat);
  surf.rotation.x = -Math.PI / 2;
  surf.position.set(0, 0.003, 0);
  scene.add(surf);
}

// ── River-bank rocks ──────────────────────────────────────────────────────────
{
  const gltfLoader = new GLTFLoader();
  gltfLoader.load('textures/Rocks.glb', gltf => {
    gltf.scene.updateWorldMatrix(true, true);
    const rockTemplates = [];
    gltf.scene.traverse(n => {
      if (!n.isMesh) return;
      const geo = n.geometry.clone();
      geo.applyMatrix4(n.matrixWorld);
      geo.computeBoundingBox();
      const bb = geo.boundingBox;
      geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
      const mesh = new THREE.Mesh(geo, n.material);
      mesh.castShadow = mesh.receiveShadow = true;
      rockTemplates.push(mesh);
    });
    if (rockTemplates.length === 0) return;

    const MI = MOAT_INNER;
    const pool = [...sandSet].filter(key => {
      const comma = key.indexOf(',');
      const wx = parseInt(key.slice(0, comma), 10) + 0.5;
      const wz = parseInt(key.slice(comma + 1), 10) + 0.5;
      return Math.abs(wx) <= MI + 8 && Math.abs(wz) <= MI + 8;
    });
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    pool.slice(0, 10).forEach(key => {
      const comma = key.indexOf(',');
      const ix = parseInt(key.slice(0, comma), 10);
      const iz = parseInt(key.slice(comma + 1), 10);
      const wx = ix + 0.2 + Math.random() * 0.6;
      const wz = iz + 0.2 + Math.random() * 0.6;
      const tpl = rockTemplates[Math.floor(Math.random() * rockTemplates.length)];
      const rock = tpl.clone();
      rock.position.set(wx, 0, wz);
      rock.rotation.y = Math.random() * Math.PI * 2;
      rock.scale.setScalar(0.15 + Math.random() * 0.25);
      scene.add(rock);
    });
  });
}

// ── Distant Horizon Terrain ───────────────────────────────────────────────────
const horizonMats = [
  new THREE.MeshLambertMaterial({ color: 0x5a6e52 }),
  new THREE.MeshLambertMaterial({ color: 0x6b7c61 }),
  new THREE.MeshLambertMaterial({ color: 0x4a5e44 }),
];
function rnd(a, b) { return a + Math.random() * (b - a); }

for (let i = 0; i < 300; i++) {
  const angle = Math.random() * Math.PI * 2;
  const dist  = rnd(150, 500);
  const w = rnd(1, 6), h = rnd(1, 18), d = rnd(1, 6);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), horizonMats[Math.floor(Math.random() * 3)]);
  mesh.position.set(Math.cos(angle) * dist, h / 2, Math.sin(angle) * dist);
  scene.add(mesh);
}
for (let i = 0; i < 40; i++) {
  const angle = Math.random() * Math.PI * 2;
  const dist  = rnd(500, 900);
  const w = rnd(20, 70), h = rnd(25, 90), d = rnd(20, 70);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: 0x3a4e36 }));
  mesh.position.set(Math.cos(angle) * dist, h / 2, Math.sin(angle) * dist);
  scene.add(mesh);
}
