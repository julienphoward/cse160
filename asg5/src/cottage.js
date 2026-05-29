import * as THREE from 'three';
import { scene } from './setup.js';
import { loadTex, matHouseWood, matBrick, matGlass } from './materials.js';
import { MAP_OFFSET, addBox, HMX1, HMX2, HMZ1, HMZ2, HDOOR1, HDOOR2, HWH } from './world.js';

// ── Interior lantern ──────────────────────────────────────────────────────────
const cottageX = (HMX1 + HMX2) / 2 + 0.5 + MAP_OFFSET;
const cottageZ = (HMZ1 + HMZ2) / 2 + 0.5 + MAP_OFFSET;
const lantern = new THREE.PointLight(0xffaa44, 8, 10, 2);
lantern.position.set(cottageX, 2.0, cottageZ);
lantern.castShadow = true;
lantern.shadow.mapSize.set(512, 512);
scene.add(lantern);

// ── Shepherd's Cottage ────────────────────────────────────────────────────────
{
  const WIN_Y   = 1;
  const WIN_ROW = 26;
  const WIN_COL = 25;

  for (let c = HMX1; c <= HMX2; c++) {
    for (let y = 0; y < HWH; y++) {
      if (y < 2 && (c === HDOOR1 || c === HDOOR2)) continue;
      addBox(c + MAP_OFFSET, y, HMZ1 + MAP_OFFSET, 1, 1, 1, matHouseWood);
    }
  }

  for (let c = HMX1; c <= HMX2; c++) {
    for (let y = 0; y < HWH; y++) {
      const isWin = (c === WIN_COL && y === WIN_Y);
      addBox(c + MAP_OFFSET, y, HMZ2 + MAP_OFFSET, 1, 1, 1, isWin ? matGlass : matHouseWood);
    }
  }

  for (let r = HMZ1 + 1; r <= HMZ2 - 1; r++) {
    for (let y = 0; y < HWH; y++) {
      const isWin = (r === WIN_ROW && y === WIN_Y);
      addBox(HMX1 + MAP_OFFSET, y, r + MAP_OFFSET, 1, 1, 1, isWin ? matGlass : matHouseWood);
    }
  }

  for (let r = HMZ1 + 1; r <= HMZ2 - 1; r++) {
    for (let y = 0; y < HWH; y++) {
      const isWin = (r === WIN_ROW && y === WIN_Y);
      addBox(HMX2 + MAP_OFFSET, y, r + MAP_OFFSET, 1, 1, 1, isWin ? matGlass : matHouseWood);
    }
  }

  const floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(HMX2 - HMX1 - 1, HMZ2 - HMZ1 - 1),
    matHouseWood
  );
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(
    (HMX1 + HMX2 + 1) / 2 + MAP_OFFSET,
    0.002,
    (HMZ1 + HMZ2 + 1) / 2 + MAP_OFFSET
  );
  scene.add(floorMesh);

  for (let layer = 0; layer <= 4; layer++) {
    const startC = HMX1 - 1 + layer;
    const startR = HMZ1 - 1 + layer;
    const size   = 9 - 2 * layer;
    for (let dc = 0; dc < size; dc++) {
      for (let dr = 0; dr < size; dr++) {
        addBox(startC + dc + MAP_OFFSET, HWH + layer, startR + dr + MAP_OFFSET, 1, 1, 1, matBrick);
      }
    }
  }

  const _threshFloor = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), matHouseWood);
  _threshFloor.rotation.x = -Math.PI / 2;
  _threshFloor.position.set(HDOOR1 + MAP_OFFSET + 1, 0.002, HMZ1 + MAP_OFFSET + 0.5);
  scene.add(_threshFloor);
}

// ── Oak Doors ─────────────────────────────────────────────────────────────────
const matOakDoor = new THREE.MeshLambertMaterial({
  map: loadTex('textures/wooden_door_texture.png', 1, 1),
  side: THREE.DoubleSide,
});

const _leftDoorPivot  = new THREE.Group();
const _rightDoorPivot = new THREE.Group();
_leftDoorPivot .position.set(HDOOR1 + MAP_OFFSET,      0, HMZ1 + MAP_OFFSET + 0.04);
_rightDoorPivot.position.set(HDOOR2 + MAP_OFFSET + 1,  0, HMZ1 + MAP_OFFSET + 0.04);
scene.add(_leftDoorPivot);
scene.add(_rightDoorPivot);

export const _doorData = [
  { pivot: _leftDoorPivot,  openAngle: -Math.PI / 2, isOpen: false },
  { pivot: _rightDoorPivot, openAngle:  Math.PI / 2, isOpen: false },
];

const _doorGeo = new THREE.BoxGeometry(1, 2, 0.08);
const _leftDoorMesh  = new THREE.Mesh(_doorGeo, matOakDoor);
const _rightDoorMesh = new THREE.Mesh(_doorGeo, matOakDoor);
_leftDoorMesh .position.set( 0.5, 1, 0);
_rightDoorMesh.position.set(-0.5, 1, 0);
_leftDoorMesh .castShadow = _rightDoorMesh.castShadow = true;
_leftDoorPivot .add(_leftDoorMesh);
_rightDoorPivot.add(_rightDoorMesh);
_leftDoorMesh .userData.door = _doorData[0];
_rightDoorMesh.userData.door = _doorData[1];
export const _doorMeshes = [_leftDoorMesh, _rightDoorMesh];

// ── Bed ───────────────────────────────────────────────────────────────────────
{
  const bedTex = (f) => loadTex(`textures/${f}`, 1, 1);
  const mHTop  = new THREE.MeshLambertMaterial({ map: bedTex('bed_head_top.png'),  side: THREE.FrontSide });
  const mFTop  = new THREE.MeshLambertMaterial({ map: bedTex('bed_foot_top.png'),  side: THREE.FrontSide });
  const mSide  = new THREE.MeshLambertMaterial({ map: bedTex('bed_side_long.png') });
  const mEnd   = new THREE.MeshLambertMaterial({ map: bedTex('bed_side_end.png')  });
  const mLeg   = new THREE.MeshLambertMaterial({ map: bedTex('bed_leg.png')       });

  const H = 0.5625;
  const BX = 11, BZ = 11;

  const frameGeo  = new THREE.BoxGeometry(1, H, 2);
  const frameMats = [ mSide, mSide, mSide, matHouseWood, mEnd, mEnd ];
  const frame     = new THREE.Mesh(frameGeo, frameMats);
  frame.position.set(BX + 0.5, H * 0.5, BZ + 1);
  frame.castShadow = frame.receiveShadow = true;
  scene.add(frame);

  const topY = H + 0.002;
  const mkTop = (mat, cx, cz, flipY = false) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    m.rotation.x = -Math.PI / 2;
    if (flipY) m.rotation.z = Math.PI;
    m.position.set(cx, topY, cz);
    m.receiveShadow = true;
    scene.add(m);
  };
  mkTop(mHTop, BX + 0.5, BZ + 1.5, true);
  mkTop(mFTop, BX + 0.5, BZ + 0.5);

  addBox(BX, 0, BZ + 2 - 0.08, 1, 0.8, 0.08, matHouseWood);
  addBox(BX, 0, BZ,             1, 0.4, 0.08, matHouseWood);

  const legGeo = new THREE.BoxGeometry(0.1, 0.15, 0.1);
  [[BX+0.05, BZ+0.05], [BX+0.85, BZ+0.05], [BX+0.05, BZ+1.85], [BX+0.85, BZ+1.85]]
    .forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, mLeg);
      leg.position.set(lx + 0.05, 0.075, lz + 0.05);
      leg.castShadow = true;
      scene.add(leg);
    });
}
