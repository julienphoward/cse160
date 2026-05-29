import * as THREE from 'three';

export const texLoader = new THREE.TextureLoader();

export function loadTex(path, rx = 1, ry = 1) {
  const t = texLoader.load(path);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.magFilter = THREE.NearestFilter;
  t.minFilter  = THREE.NearestMipmapLinearFilter;
  return t;
}

export const matGround   = new THREE.MeshLambertMaterial({ map: loadTex('textures/moss_block.jpg', 2000, 2000) });
export const matSand     = new THREE.MeshLambertMaterial({ map: loadTex('textures/Sand.png', 1, 1) });
export const matStone    = new THREE.MeshLambertMaterial({ map: loadTex('textures/cracked_stone_bricks.jpg') });
export const matSpruce   = new THREE.MeshLambertMaterial({ map: loadTex('textures/spruce_planks.jpg') });
export const matLog      = new THREE.MeshLambertMaterial({ map: loadTex('textures/oak_log.jpg') });
export const matLeaf     = new THREE.MeshLambertMaterial({ map: loadTex('textures/azalea_leaves.jpg') });
export const matWhite    = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
export const matWhite2   = new THREE.MeshLambertMaterial({ color: 0xe0e0e0 });
export const matDark     = new THREE.MeshLambertMaterial({ color: 0x222222 });
export const matGray     = new THREE.MeshLambertMaterial({ color: 0x787878 });
export const matMidGray  = new THREE.MeshLambertMaterial({ color: 0x6e6e6e });
export const matNose     = new THREE.MeshLambertMaterial({ color: 0x1f1410 });
export const matBelly    = new THREE.MeshLambertMaterial({ color: 0xe5e5e5 });
export const matBrick    = new THREE.MeshLambertMaterial({ map: loadTex('textures/bricks.png') });

const glassTex = texLoader.load('textures/glass.png');
glassTex.magFilter = glassTex.minFilter = THREE.NearestFilter;
export const matGlass = new THREE.MeshLambertMaterial({ map: glassTex, transparent: true, opacity: 0.65, side: THREE.DoubleSide });

export const matHouseWood = new THREE.MeshLambertMaterial({ map: loadTex('textures/spruce_planks.png', 1, 1) });
const _matFPostSide = new THREE.MeshLambertMaterial({ map: loadTex('textures/spruce_planks.png', 0.3, 1.0) });
const _matFPostCap  = new THREE.MeshLambertMaterial({ map: loadTex('textures/spruce_planks.png', 0.3, 0.3) });
export const matFencePost = [_matFPostSide, _matFPostSide, _matFPostCap, _matFPostCap, _matFPostSide, _matFPostSide];
