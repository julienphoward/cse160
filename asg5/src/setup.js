import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.toneMapping       = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.6;
document.body.appendChild(renderer.domElement);

export const scene  = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 1.7, 0);
scene.add(camera);

scene.fog = new THREE.FogExp2(new THREE.Color(0x88b0d8), 0.004);

const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);
export const skyU = sky.material.uniforms;
skyU['turbidity'].value       = 10;
skyU['rayleigh'].value        = 2;
skyU['mieCoefficient'].value  = 0.005;
skyU['mieDirectionalG'].value = 0.8;

let _sunAngle = Math.PI * 0.2;
export const sunDir = new THREE.Vector3();

export const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

export const dirLight = new THREE.DirectionalLight(0xfff5e0, 2.5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
dirLight.shadow.camera.left   = dirLight.shadow.camera.bottom = -30;
dirLight.shadow.camera.right  = dirLight.shadow.camera.top    =  30;
dirLight.shadow.camera.near   = 0.5;
dirLight.shadow.camera.far    = 300;
dirLight.shadow.camera.updateProjectionMatrix();
scene.add(dirLight);
scene.add(dirLight.target);

export const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x4a7c1e, 0.5);
scene.add(hemiLight);

export function syncSky() {
  const phi = Math.PI / 2 - _sunAngle;
  sunDir.setFromSphericalCoords(1, phi, 0);
  skyU['sunPosition'].value.copy(sunDir);
  dirLight.position.set(sunDir.x * 150, sunDir.y * 150, sunDir.z * 150);
  const elev = Math.max(0, sunDir.y);
  scene.fog.color.setRGB(0.35 + 0.18 * elev, 0.50 + 0.31 * elev, 0.65 + 0.27 * elev);
  renderer.toneMappingExposure = 0.25 + 0.45 * elev;
}

export function getSunAngle() { return _sunAngle; }
export function setSunAngle(v) { _sunAngle = v; syncSky(); }
export function advanceSun(dt) {
  _sunAngle += 0.02 * dt;
  if (_sunAngle > Math.PI) _sunAngle = 0;
  syncSky();
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
