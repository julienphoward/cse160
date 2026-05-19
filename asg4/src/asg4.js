// ============================================================
// SHADERS
// ============================================================
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec3 v_WorldPos;
  void main() {
    vec4 wp = u_ModelMatrix * a_Position;
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * wp;
    v_UV = a_UV;
    v_WorldPos = wp.xyz;
    v_Normal = normalize(mat3(u_ModelMatrix) * a_Normal);
  }
`;

var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec3 v_WorldPos;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform sampler2D u_Sampler4;
  uniform sampler2D u_Sampler5;
  uniform sampler2D u_Sampler6;
  uniform int  u_texColorWeight;
  uniform bool u_showNormals;
  uniform bool u_lightOn;
  uniform bool u_pointLightOn;
  uniform vec3 u_LightPos;
  uniform vec3 u_LightColor;
  uniform bool u_spotOn;
  uniform vec3 u_SpotPos;
  uniform vec3 u_SpotDir;
  uniform float u_SpotCutoff;
  uniform vec3 u_SpotColor;
  uniform vec3 u_CameraPos;
  void main() {
    if (u_showNormals) {
      gl_FragColor = vec4(v_Normal * 0.5 + 0.5, 1.0);
      return;
    }
    vec4 base;
    if      (u_texColorWeight == 0) base = texture2D(u_Sampler0, v_UV);
    else if (u_texColorWeight == 1) base = texture2D(u_Sampler1, v_UV);
    else if (u_texColorWeight == 2) base = texture2D(u_Sampler2, v_UV);
    else if (u_texColorWeight == 3) base = texture2D(u_Sampler3, v_UV);
    else if (u_texColorWeight == 4) base = texture2D(u_Sampler4, v_UV);
    else if (u_texColorWeight == 5) base = texture2D(u_Sampler5, v_UV);
    else if (u_texColorWeight == 6) base = texture2D(u_Sampler6, v_UV);
    else                             base = u_FragColor;
    if (base.a < 0.1) discard;
    if (!u_lightOn) { gl_FragColor = base; return; }

    vec3 N = normalize(v_Normal);
    vec3 V = normalize(u_CameraPos - v_WorldPos);
    vec3 result = 0.2 * base.rgb; // global ambient

    // --- Point light ---
    if (u_pointLightOn) {
      vec3 L = normalize(u_LightPos - v_WorldPos);
      vec3 R = reflect(-L, N);
      float diff = max(dot(N, L), 0.0);
      float spec = pow(max(dot(R, V), 0.0), 32.0);
      result += diff * u_LightColor * base.rgb + 0.5 * spec * u_LightColor;
    }

    // --- Spotlight ---
    if (u_spotOn) {
      vec3 spotL = normalize(u_SpotPos - v_WorldPos);
      float cosA = dot(-spotL, normalize(u_SpotDir));
      if (cosA > u_SpotCutoff) {
        float sf = pow(cosA, 6.0); // smooth cone edge falloff
        float sDiff = max(dot(N, spotL), 0.0);
        vec3 sR = reflect(-spotL, N);
        float sSpec = pow(max(dot(sR, V), 0.0), 32.0);
        result += sf * (sDiff * u_SpotColor * base.rgb + 0.6 * sSpec * u_SpotColor);
      }
    }

    gl_FragColor = vec4(result, base.a);
  }
`;

// ============================================================
// GLOBALS
// ============================================================
var canvas, gl;
var a_Position, a_UV, a_Normal;
var u_ModelMatrix, u_ViewMatrix, u_ProjectionMatrix;
var u_FragColor, u_texColorWeight;
var u_Sampler0, u_Sampler1, u_Sampler2, u_Sampler3, u_Sampler4, u_Sampler5, u_Sampler6;
var u_showNormals;
var u_lightOn, u_pointLightOn, u_LightPos, u_LightColor, u_CameraPos;
var u_spotOn, u_SpotPos, u_SpotDir, u_SpotCutoff, u_SpotColor;
var g_showNormals = false;
var g_lightOn      = true;
var g_pointLightOn = true;
var g_spotOn       = true;
var g_lightPos   = [16, 7, 16];
var g_lightColor = [1.0, 1.0, 1.0]; // user slider hue
var g_sunColor   = [1.0, 0.95, 0.8]; // day/night cycle tint
var g_lightAnimAngle = 0;
var g_spotPos    = [12, 14, 24];
var g_spotDir    = [0, -1, 0];
var g_spotColor  = [0.6, 0.7, 1.0];  // cool blue-white
var g_spotAnimAngle = 180;
var g_vertexBuffer;
var g_camera;

// Keyboard state
var g_keys = {};

// Mouse look
var g_mouseDown = false;
var g_lastMouseX = 0;
var g_lastMouseY = 0;

// FPS
var g_lastFrameTime = performance.now();
var g_fpsSmooth = 0;

// Textures
var g_texturesLoaded = 0;
var TEXTURES_NEEDED = 4;

// ============================================================
// 32x32 WORLD MAP
// ============================================================
var g_map = [
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

// ============================================================
// MAIN
// ============================================================
function main() {
  canvas = document.getElementById('webgl');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  gl = canvas.getContext('webgl');
  if (!gl) { console.log('No WebGL'); return; }
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.4, 0.65, 0.9, 1.0);
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Shader init failed'); return;
  }

  a_Position         = gl.getAttribLocation(gl.program, 'a_Position');
  a_UV               = gl.getAttribLocation(gl.program, 'a_UV');
  a_Normal           = gl.getAttribLocation(gl.program, 'a_Normal');
  u_ModelMatrix      = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ViewMatrix       = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_FragColor        = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_texColorWeight   = gl.getUniformLocation(gl.program, 'u_texColorWeight');
  u_Sampler0         = gl.getUniformLocation(gl.program, 'u_Sampler0');
  u_Sampler1         = gl.getUniformLocation(gl.program, 'u_Sampler1');
  u_Sampler2         = gl.getUniformLocation(gl.program, 'u_Sampler2');
  u_Sampler3         = gl.getUniformLocation(gl.program, 'u_Sampler3');
  u_Sampler4         = gl.getUniformLocation(gl.program, 'u_Sampler4');
  u_Sampler5         = gl.getUniformLocation(gl.program, 'u_Sampler5');
  u_Sampler6         = gl.getUniformLocation(gl.program, 'u_Sampler6');
  u_showNormals      = gl.getUniformLocation(gl.program, 'u_showNormals');
  u_lightOn          = gl.getUniformLocation(gl.program, 'u_lightOn');
  u_pointLightOn     = gl.getUniformLocation(gl.program, 'u_pointLightOn');
  u_LightPos         = gl.getUniformLocation(gl.program, 'u_LightPos');
  u_LightColor       = gl.getUniformLocation(gl.program, 'u_LightColor');
  u_CameraPos        = gl.getUniformLocation(gl.program, 'u_CameraPos');
  u_spotOn           = gl.getUniformLocation(gl.program, 'u_spotOn');
  u_SpotPos          = gl.getUniformLocation(gl.program, 'u_SpotPos');
  u_SpotDir          = gl.getUniformLocation(gl.program, 'u_SpotDir');
  u_SpotCutoff       = gl.getUniformLocation(gl.program, 'u_SpotCutoff');
  u_SpotColor        = gl.getUniformLocation(gl.program, 'u_SpotColor');

  g_vertexBuffer = gl.createBuffer();

  gl.uniform1i(u_Sampler0, 0);
  gl.uniform1i(u_Sampler1, 1);
  gl.uniform1i(u_Sampler2, 2);
  gl.uniform1i(u_Sampler3, 3);
  gl.uniform1i(u_Sampler4, 4);
  gl.uniform1i(u_Sampler5, 5);
  gl.uniform1i(u_Sampler6, 6);

  initTexture('textures/cracked_stone_bricks.jpg', gl.TEXTURE0, 0);
  initTexture('textures/moss_block.jpg',           gl.TEXTURE1, 1);
  initTexture('textures/sky.jpg',                  gl.TEXTURE2, 2);
  initTexture('textures/spruce_planks.jpg',        gl.TEXTURE3, 3);
  initTexture('textures/oak_log.jpg',      gl.TEXTURE4, 4);
  initTexture('textures/azalea_leaves.jpg',    gl.TEXTURE5, 5);
  initTexture('textures/Tall_Grass_JE4.png',   gl.TEXTURE6, 6, true, true);

  g_camera = new Camera();
  initSheep();
  initGrass();

  loadOBJ('dragon.obj', function(model) {
    model.color = [0.15, 0.55, 0.20, 1.0];
    model.matrix.setTranslate(12, 4, 24);
    model.matrix.scale(0.5, 0.5, 0.5);
    model.matrix.translate(0, 2.37, 0);
    g_dragon = model;
  });

  document.addEventListener('keydown', e => { g_keys[e.key.toLowerCase()] = true;  handleKeyDown(e); });
  document.addEventListener('keyup',   e => { g_keys[e.key.toLowerCase()] = false; });
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mouseup',   () => { g_mouseDown = false; });
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('click', () => canvas.requestPointerLock());
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) {
      document.addEventListener('mousemove', onPointerLockMove);
    } else {
      document.removeEventListener('mousemove', onPointerLockMove);
    }
  });

  window.addEventListener('resize', () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    g_camera._updateProj();
  });

  tick();
}

// ============================================================
// TEXTURE LOADING
// ============================================================
function initTexture(src, texUnit, idx, rgba, linear) {
  var fmt = rgba ? gl.RGBA : gl.RGB;
  var minF = linear ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST_MIPMAP_LINEAR;
  var magF = linear ? gl.LINEAR : gl.NEAREST;
  var tex = gl.createTexture();
  var img = new Image();
  img.onload = function() {
    gl.activeTexture(texUnit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, fmt, fmt, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minF);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magF);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    g_texturesLoaded++;
    console.log('Texture loaded: ' + src);
  };
  img.onerror = function() {
    gl.activeTexture(texUnit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    var pixel = idx === 0 ? new Uint8Array([180,140,100]) :
                idx === 1 ? new Uint8Array([80,140,60])   :
                idx === 2 ? new Uint8Array([100,160,220]) :
                            new Uint8Array([139,90,43]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, pixel);
    g_texturesLoaded++;
    console.log('Texture fallback for: ' + src);
  };
  img.src = src;
}

// ============================================================
// INPUT
// ============================================================
function handleKeyDown(e) {
  switch(e.key.toLowerCase()) {
    case 'f': addBlockInFront();        break;
    case 'g': deleteBlockInFront();     break;
    case 'r': trySelectSheep();     break;
    case ' ': g_camera.jump(); break;
  }
}

function onMouseDown(ev) {
  g_mouseDown = true;
  g_lastMouseX = ev.clientX;
  g_lastMouseY = ev.clientY;
}

function onMouseMove(ev) {
  if (!g_mouseDown) return;
  var dx = ev.clientX - g_lastMouseX;
  var dy = ev.clientY - g_lastMouseY;
  g_lastMouseX = ev.clientX;
  g_lastMouseY = ev.clientY;
  g_camera.mouseLook(dx, dy);
}

function onPointerLockMove(ev) {
  g_camera.mouseLook(ev.movementX, ev.movementY);
}

// ============================================================
// ADD / DELETE BLOCKS
// ============================================================
function getBlockInFront() {
  let f = new Vector3(g_camera.at.elements);
  f.sub(g_camera.eye);
  f.normalize();
  let px = Math.floor(g_camera.eye.elements[0] + f.elements[0] * 2);
  let pz = Math.floor(g_camera.eye.elements[2] + f.elements[2] * 2);
  if (px < 0 || px >= 32 || pz < 0 || pz >= 32) return null;
  return { x: px, z: pz };
}

function addBlockInFront() {
  let b = getBlockInFront();
  if (!b) return;
  if (g_map[b.z][b.x] < 4) g_map[b.z][b.x]++;
}

function deleteBlockInFront() {
  let b = getBlockInFront();
  if (!b) return;
  if (g_map[b.z][b.x] > 0) g_map[b.z][b.x]--;
}

// ============================================================
// RENDER LOOP
// ============================================================
function tick() {
  var now = performance.now();
  var delta = (now - g_lastFrameTime) / 1000;

  var mx = 0, mz = 0;
  if (g_keys['w']) { let [fx,,fz] = g_camera._forward(); mx+=fx; mz+=fz; }
  if (g_keys['s']) { let [fx,,fz] = g_camera._forward(); mx-=fx; mz-=fz; }
  if (g_keys['a']) { let [rx,,rz] = g_camera._right();   mx-=rx; mz-=rz; }
  if (g_keys['d']) { let [rx,,rz] = g_camera._right();   mx+=rx; mz+=rz; }

  if (mx !== 0 || mz !== 0) {
    var len = Math.sqrt(mx*mx + mz*mz);
    mx /= len; mz /= len;
    var normalizedDelta = delta * 60;
    g_camera.moveDir(mx, mz, normalizedDelta);
  }

  if (g_keys['q']) g_camera.panLeft();
  if (g_keys['e']) g_camera.panRight();

  g_lastFrameTime = now;
  var fps = delta > 0 ? Math.round(1 / delta) : g_fpsSmooth;
  g_fpsSmooth = Math.round(g_fpsSmooth * 0.9 + fps * 0.1);
  var el = document.getElementById('fpsCounter');
  if (el) el.textContent = g_fpsSmooth;

  g_camera.applyGravity();
  updateSheep(delta);
  updateKoala(delta);

  // Day/night cycle — sun arcs in a vertical plane (X-Y) at fixed Z=16
  g_lightAnimAngle += delta * 3;  // ~2 minute full day
  var rad = g_lightAnimAngle * Math.PI / 180;
  var sunR = 28;
  g_lightPos[0] = 16 + sunR * Math.cos(rad);
  g_lightPos[1] = sunR * Math.sin(rad);   // rises and sets like a real sun
  g_lightPos[2] = 16;

  // Shift sun color: orange at horizon, warm white at noon, dim blue at night
  var elev = Math.sin(rad); // -1 (midnight) → 0 (horizon) → 1 (noon)
  if (elev > 0) {
    g_sunColor[0] = 1.0;
    g_sunColor[1] = 0.5 + 0.45 * elev;
    g_sunColor[2] = 0.2 + 0.6  * elev;
  } else {
    g_sunColor[0] = 0.15;
    g_sunColor[1] = 0.15;
    g_sunColor[2] = 0.35;
  }

  renderScene();
  requestAnimationFrame(tick);
}

function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.uniformMatrix4fv(u_ViewMatrix,       false, g_camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_camera.projectionMatrix.elements);
  gl.uniform1i(u_showNormals, g_showNormals ? 1 : 0);
  gl.uniform1i(u_lightOn,      g_lightOn      ? 1 : 0);
  gl.uniform1i(u_pointLightOn, g_pointLightOn ? 1 : 0);
  gl.uniform3fv(u_LightPos,    new Float32Array(g_lightPos));
  gl.uniform3fv(u_LightColor,  new Float32Array([
    g_lightColor[0] * g_sunColor[0],
    g_lightColor[1] * g_sunColor[1],
    g_lightColor[2] * g_sunColor[2],
  ]));
  gl.uniform3fv(u_CameraPos,   g_camera.eye.elements);
  gl.uniform1i(u_spotOn,       g_spotOn       ? 1 : 0);
  gl.uniform3fv(u_SpotPos,     new Float32Array(g_spotPos));
  gl.uniform3fv(u_SpotDir,     new Float32Array(g_spotDir));
  gl.uniform1f(u_SpotCutoff,   Math.cos(20 * Math.PI / 180));
  gl.uniform3fv(u_SpotColor,   new Float32Array(g_spotColor));

  var identity = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identity.elements);

  drawSkybox();
  drawGround();
  drawPen();
  drawWorld();
  drawKoala();
  drawAllSheep();
  drawAllTrees();
  drawSpheres();
  drawLightMarker();
  if (g_dragon) g_dragon.render();
  drawGrass();
  if (g_gameWon) drawFlowers();
}

// ============================================================
// SKYBOX
// ============================================================
function drawSkybox() {
  gl.uniform1i(u_lightOn, 0);
  var sky = new Cube();
  sky.textureNum = -1;
  sky.color = [0.4, 0.65, 0.9, 1.0];
  sky.matrix.translate(-250, -250, -250);
  sky.matrix.scale(500, 500, 500);
  gl.depthMask(false);
  sky.render();
  gl.depthMask(true);
  gl.uniform1i(u_lightOn, g_lightOn ? 1 : 0);
}

// ============================================================
// GROUND
// ============================================================
function drawGround() {
  var g = new Cube();
  g.textureNum = 1;
  g.matrix.setTranslate(-1, -0.01, -1);
  g.matrix.scale(34, 0.02, 34);

  // x,y,z, u,v, nx,ny,nz — normal is (0,1,0) for ground top face
  var verts = new Float32Array([
    0,1,0, 0,0,  0,1,0,   0,1,1, 0,32, 0,1,0,  1,1,1, 32,32, 0,1,0,
    0,1,0, 0,0,  0,1,0,   1,1,1, 32,32,0,1,0,  1,1,0, 32,0,  0,1,0,
  ]);

  gl.uniform1i(u_texColorWeight, 1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, g.matrix.elements);

  const FSIZE = verts.BYTES_PER_ELEMENT;
  gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 8*FSIZE, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 8*FSIZE, 3*FSIZE);
  gl.enableVertexAttribArray(a_UV);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 8*FSIZE, 5*FSIZE);
  gl.enableVertexAttribArray(a_Normal);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// ============================================================
// WORLD WALLS
// ============================================================
function drawWorld() {
  for (var z = 0; z < 32; z++) {
    for (var x = 0; x < 32; x++) {
      var h = g_map[z][x];
      if (h === 0) continue;
      for (var y = 0; y < h; y++) {
        var c = new Cube();
        c.textureNum = 0;
        c.matrix.setTranslate(x, y, z);
        c.render();
      }
    }
  }
}

// drawFlowers

var g_flowerPositions = [
  [3,3],[7,4],[10,2],[18,3],[25,4],[28,3],
  [2,10],[6,12],[9,18],[20,15],[27,12],[29,18],
  [3,22],[8,25],[12,28],[19,26],[24,22],[28,26],
  [5,8],[15,20],[22,10],[11,15],[17,8],[6,17],
  [23,18],[4,14],[26,6],[9,28],[21,28],[28,22],
];

function drawFlowers() {
  for (var i = 0; i < g_flowerPositions.length; i++) {
    var fx = g_flowerPositions[i][0];
    var fz = g_flowerPositions[i][1];

    // Stem
    setColor(0.2, 0.7, 0.2);
    var stem = new Matrix4();
    stem.setTranslate(fx + 0.4, 0, fz + 0.4);
    stem.scale(0.08, 0.35, 0.08);
    drawKoalaCube(stem);

    // Flower head — alternate red/yellow
    var color = i % 4;
    if (color === 0) setColor(1.0, 0.9, 0.0);
    else if (color === 1) setColor(1.0, 0.2, 0.2);
    else if (color === 2) setColor(0.4, 0.4, 1.0);
    else setColor(0.7, 0.2, 0.9);
    var head = new Matrix4();
    head.setTranslate(fx + 0.25, 0.32, fz + 0.25);
    head.scale(0.35, 0.15, 0.35);
    drawKoalaCube(head);
  }
}

// ============================================================
// LIGHT MARKER
// ============================================================
function drawLightMarker() {
  gl.uniform1i(u_lightOn, 0);

  // Sun cube = point light
  var sunSize = 2.5;
  var m = new Cube();
  m.textureNum = -1;
  m.color = [1.0, 0.95, 0.3, 1.0];
  m.matrix.setTranslate(g_lightPos[0] - sunSize/2, g_lightPos[1] - sunSize/2, g_lightPos[2] - sunSize/2);
  m.matrix.scale(sunSize, sunSize, sunSize);
  m.render();

  // Cyan cube = spotlight
  var s = new Cube();
  s.textureNum = -1;
  s.color = [0.0, 1.0, 1.0, 1.0];
  s.matrix.setTranslate(g_spotPos[0] - 0.25, g_spotPos[1] - 0.25, g_spotPos[2] - 0.25);
  s.matrix.scale(0.5, 0.5, 0.5);
  s.render();

  gl.uniform1i(u_lightOn, g_lightOn ? 1 : 0);
}

// ============================================================
// SPHERES
// ============================================================
function drawSpheres() {
  // Orange sphere
  var s1 = new Sphere();
  s1.color = [1.0, 0.5, 0.1, 1.0];
  s1.matrix.setTranslate(15, 1.5, 11);
  s1.render();

  // Teal sphere
  var s2 = new Sphere();
  s2.color = [0.1, 0.7, 0.8, 1.0];
  s2.matrix.setTranslate(22, 1.5, 8);
  s2.render();
}

function toggleLighting() {
  g_lightOn = !g_lightOn;
  var btn = document.getElementById('btnLighting');
  btn.textContent = 'Lighting: ' + (g_lightOn ? 'ON' : 'OFF');
  btn.classList.toggle('active', g_lightOn);
}

function togglePointLight() {
  g_pointLightOn = !g_pointLightOn;
  var btn = document.getElementById('btnPointLight');
  btn.textContent = 'Point Light: ' + (g_pointLightOn ? 'ON' : 'OFF');
  btn.classList.toggle('active', g_pointLightOn);
}

function toggleSpotLight() {
  g_spotOn = !g_spotOn;
  var btn = document.getElementById('btnSpotLight');
  btn.textContent = 'Spot Light: ' + (g_spotOn ? 'ON' : 'OFF');
  btn.classList.toggle('active', g_spotOn);
}

function setLightAngle(deg) {
  g_lightAnimAngle = deg;
}

function setLightHue(h) {
  if (h < 1) { g_lightColor = [1.0, 1.0, 1.0]; return; }
  var i = Math.floor(h / 60) % 6;
  var f = h / 60 - Math.floor(h / 60);
  var q = 1 - f, t = f;
  g_lightColor = [[1,t,0],[q,1,0],[0,1,t],[0,q,1],[t,0,1],[1,0,q]][i];
}

function toggleNormals() {
  g_showNormals = !g_showNormals;
  var btn = document.getElementById('btnNormals');
  btn.textContent = 'Normal Vis: ' + (g_showNormals ? 'ON' : 'OFF');
  btn.classList.toggle('active', g_showNormals);
}

window.onload = main;