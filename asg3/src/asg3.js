// ============================================================
// SHADERS
// ============================================================
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  varying vec2 v_UV;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }
`;

var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;  // wall texture
  uniform sampler2D u_Sampler1;  // ground texture
  uniform sampler2D u_Sampler2;  // sky texture
  uniform sampler2D u_Sampler3;  // fence texture
  uniform sampler2D u_Sampler4;  // oak log
  uniform sampler2D u_Sampler5;  // leaves
  uniform int u_texColorWeight;  // -1=color, 0=wall, 1=ground, 2=sky, 3=fence
  void main() {
    if (u_texColorWeight == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_texColorWeight == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_texColorWeight == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else if (u_texColorWeight == 3) {
      gl_FragColor = texture2D(u_Sampler3, v_UV);
    } else if (u_texColorWeight == 4) {
      gl_FragColor = texture2D(u_Sampler4, v_UV);
    } else if (u_texColorWeight == 5) {
      gl_FragColor = texture2D(u_Sampler5, v_UV);
    } else {
      gl_FragColor = u_FragColor;
    }
  }
`;

// ============================================================
// GLOBALS
// ============================================================
var canvas, gl;
var a_Position, a_UV;
var u_ModelMatrix, u_ViewMatrix, u_ProjectionMatrix;
var u_FragColor, u_texColorWeight;
var u_Sampler0, u_Sampler1, u_Sampler2, u_Sampler3, u_Sampler4, u_Sampler5;
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
  [4,0,0,3,3,0,0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,3,0,0,0,0,4],
  [4,0,0,3,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,3,0,0,0,0,4],
  [4,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,3,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,3,0,3,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,1,0,0,0,0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,1,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,4,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,4,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
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
  gl.clearColor(0.5, 0.7, 1.0, 1.0);

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Shader init failed'); return;
  }

  a_Position         = gl.getAttribLocation(gl.program, 'a_Position');
  a_UV               = gl.getAttribLocation(gl.program, 'a_UV');
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

  g_vertexBuffer = gl.createBuffer();

  gl.uniform1i(u_Sampler0, 0);
  gl.uniform1i(u_Sampler1, 1);
  gl.uniform1i(u_Sampler2, 2);
  gl.uniform1i(u_Sampler3, 3);
  gl.uniform1i(u_Sampler4, 4);
  gl.uniform1i(u_Sampler5, 5);

  initTexture('textures/cracked_stone_bricks.jpg', gl.TEXTURE0, 0);
  initTexture('textures/moss_block.jpg',           gl.TEXTURE1, 1);
  initTexture('textures/sky.jpg',                  gl.TEXTURE2, 2);
  initTexture('textures/spruce_planks.jpg',        gl.TEXTURE3, 3);
  initTexture('textures/oak_log.jpg',      gl.TEXTURE4, 4);
  initTexture('textures/azalea_leaves.jpg', gl.TEXTURE5, 5);

  g_camera = new Camera();
  initSheep();

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
function initTexture(src, texUnit, idx) {
  var tex = gl.createTexture();
  var img = new Image();
  img.onload = function() {
    gl.activeTexture(texUnit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
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
  // Collect movement direction
  var mx = 0, mz = 0;
  if (g_keys['w']) { let [fx,,fz] = g_camera._forward(); mx+=fx; mz+=fz; }
  if (g_keys['s']) { let [fx,,fz] = g_camera._forward(); mx-=fx; mz-=fz; }
  if (g_keys['a']) { let [rx,,rz] = g_camera._right();   mx-=rx; mz-=rz; }
  if (g_keys['d']) { let [rx,,rz] = g_camera._right();   mx+=rx; mz+=rz; }

  // Normalize so diagonal isn't faster
  if (mx !== 0 || mz !== 0) {
    var len = Math.sqrt(mx*mx + mz*mz);
    mx /= len; mz /= len;
    g_camera.moveDir(mx, mz);
  }

  if (g_keys['q']) g_camera.panLeft();
  if (g_keys['e']) g_camera.panRight();
  
  var now = performance.now();
  var delta = now - g_lastFrameTime;
  g_lastFrameTime = now;
  var fps = delta > 0 ? Math.round(1000 / delta) : g_fpsSmooth;
  g_fpsSmooth = Math.round(g_fpsSmooth * 0.9 + fps * 0.1);
  var el = document.getElementById('fpsCounter');
  if (el) el.textContent = g_fpsSmooth;
  g_camera.applyGravity();

  updateSheep();
  renderScene();
  requestAnimationFrame(tick);
}

function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.uniformMatrix4fv(u_ViewMatrix,       false, g_camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_camera.projectionMatrix.elements);

  var identity = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identity.elements);

  drawSkybox();
  drawGround();
  drawPen();
  drawWorld();
  drawKoala();
  drawAllSheep();
  drawAllTrees();
}

// ============================================================
// SKYBOX
// ============================================================
function drawSkybox() {
  var sky = new Cube();
  sky.textureNum = 2;
  sky.matrix.translate(-250, -250, -250);
  sky.matrix.scale(500, 500, 500);
  gl.depthMask(false);
  sky.render();
  gl.depthMask(true);
}

// ============================================================
// GROUND
// ============================================================
function drawGround() {
  var g = new Cube();
  g.textureNum = 1;
  g.matrix.setTranslate(-1, -0.01, -1);
  g.matrix.scale(34, 0.02, 34);

  var verts = new Float32Array([
    0,1,0, 0,0,   0,1,1, 0,32,  1,1,1, 32,32,
    0,1,0, 0,0,   1,1,1, 32,32, 1,1,0, 32,0,
  ]);

  gl.uniform1i(u_texColorWeight, 1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, g.matrix.elements);

  const FSIZE = verts.BYTES_PER_ELEMENT;
  gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 5*FSIZE, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 5*FSIZE, 3*FSIZE);
  gl.enableVertexAttribArray(a_UV);
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

window.onload = main;