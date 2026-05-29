import { renderer, scene, camera, dirLight, sunDir, syncSky, advanceSun, getSunAngle } from './setup.js';
import { waterUniforms } from './world.js';
import { updateSpheres, updateKoala, updateSheep } from './animals.js';
import { movePlayer, _sunSlider } from './player.js';

syncSky();

let lastTime = performance.now();
let fpsCnt = 0, fpsAccum = 0;

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt  = Math.min((now - lastTime) / 1000, 0.1);
  lastTime  = now;

  fpsCnt++;
  fpsAccum += dt;
  if (fpsAccum >= 1.0) {
    const el = document.getElementById('fps');
    if (el) el.textContent = fpsCnt;
    fpsCnt = 0; fpsAccum -= 1.0;
  }

  waterUniforms.time.value      += dt;
  waterUniforms.uSunDir.value.copy(sunDir);
  waterUniforms.uCameraPos.value.copy(camera.position);
  waterUniforms.uSkyColor.value.copy(scene.fog.color);

  advanceSun(dt);
  if (_sunSlider) _sunSlider.value = String(Math.round((getSunAngle() / Math.PI) * 100));

  {
    const cx = camera.position.x, cz = camera.position.z;
    dirLight.position.x += cx;
    dirLight.position.z += cz;
    dirLight.target.position.set(cx, 0, cz);
  }

  updateSpheres(now, dt);
  updateKoala(now, dt);
  updateSheep(dt);
  movePlayer(dt);
  renderer.render(scene, camera);
}

animate();
