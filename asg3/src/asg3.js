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
  uniform int u_texColorWeight;  // -1=color, 0=wall, 1=ground, 2=sky
  void main() {
    if (u_texColorWeight == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_texColorWeight == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_texColorWeight == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else if (u_texColorWeight == 3) {
      gl_FragColor = texture2D(u_Sampler3, v_UV);
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
var u_Sampler0, u_Sampler1, u_Sampler2, u_Sampler3;
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

// Textures loaded counter
var g_texturesLoaded = 0;
var TEXTURES_NEEDED = 3;


// ============================================================
// 32x32 WORLD MAP
// Each cell = wall height (0-4). 0 = empty.
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

  // Get attribute/uniform locations
  a_Position      = gl.getAttribLocation(gl.program, 'a_Position');
  a_UV            = gl.getAttribLocation(gl.program, 'a_UV');
  u_ModelMatrix   = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ViewMatrix    = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_FragColor     = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_texColorWeight = gl.getUniformLocation(gl.program, 'u_texColorWeight');
  u_Sampler0      = gl.getUniformLocation(gl.program, 'u_Sampler0');
  u_Sampler1      = gl.getUniformLocation(gl.program, 'u_Sampler1');
  u_Sampler2      = gl.getUniformLocation(gl.program, 'u_Sampler2');
  u_Sampler3      = gl.getUniformLocation(gl.program, 'u_Sampler3');

  // Single interleaved vertex buffer
  g_vertexBuffer = gl.createBuffer();

  // Bind texture units once
  gl.uniform1i(u_Sampler0, 0);
  gl.uniform1i(u_Sampler1, 1);
  gl.uniform1i(u_Sampler2, 2);
  gl.uniform1i(u_Sampler3, 3);

  // Load textures
  initTexture('textures/cracked_stone_bricks.jpg', gl.TEXTURE0, 0);
  initTexture('textures/moss_block.jpg', gl.TEXTURE1, 1);
  initTexture('textures/sky.jpg', gl.TEXTURE2, 2);
  initTexture('textures/spruce_planks.jpg', gl.TEXTURE3, 3);

  // Camera
  g_camera = new Camera();

  initSheep();

  // Input
  document.addEventListener('keydown',  e => { g_keys[e.key.toLowerCase()] = true;  handleKeyDown(e); });
  document.addEventListener('keyup',    e => { g_keys[e.key.toLowerCase()] = false; });
  canvas.addEventListener('mousedown',  onMouseDown);
  canvas.addEventListener('mouseup',    ()  => { g_mouseDown = false; });
  canvas.addEventListener('mousemove',  onMouseMove);
  // Pointer lock for smooth mouse look
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
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    g_texturesLoaded++;
    console.log('Texture loaded: ' + src);
  };
  img.onerror = function() {
    // Fallback: create a 1x1 colored texture so rendering doesn't break
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
    case 'w': g_camera.moveForward();   break;
    case 's': g_camera.moveBackwards(); break;
    case 'a': g_camera.moveLeft();      break;
    case 'd': g_camera.moveRight();     break;
    case 'q': g_camera.panLeft();       break;
    case 'e': g_camera.panRight();      break;
    case 'f': addBlockInFront();        break;  // Add block
    case 'g': deleteBlockInFront();     break;  // Delete block
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
  // Get map cell 2 units in front of camera
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
  // Continuous key movement
  if (g_keys['w']) g_camera.moveForward();
  if (g_keys['s']) g_camera.moveBackwards();
  if (g_keys['a']) g_camera.moveLeft();
  if (g_keys['d']) g_camera.moveRight();
  if (g_keys['q']) g_camera.panLeft();
  if (g_keys['e']) g_camera.panRight();

  // FPS
  var now = performance.now();
  var delta = now - g_lastFrameTime;
  g_lastFrameTime = now;
  var fps = delta > 0 ? Math.round(1000 / delta) : g_fpsSmooth;
  g_fpsSmooth = Math.round(g_fpsSmooth * 0.9 + fps * 0.1);
  var el = document.getElementById('fpsCounter');
  if (el) el.textContent = g_fpsSmooth;

  updateSheep();
  renderScene();
  requestAnimationFrame(tick);
}

function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.viewport(0, 0, canvas.width, canvas.height);

  // Upload camera matrices
  gl.uniformMatrix4fv(u_ViewMatrix,       false, g_camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_camera.projectionMatrix.elements);

  // Identity model matrix for static objects (overridden per cube)
  var identity = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identity.elements);

  drawSkybox();
  drawGround();
  drawPen();
  drawWorld();
  drawKoala();
  drawAllSheep();
}

// ============================================================
// SKYBOX
// ============================================================
function drawSkybox() {
  var sky = new Cube();
  sky.textureNum = 2;
  sky.matrix.translate(-250, -250, -250);
  sky.matrix.scale(500, 500, 500);
  // Disable depth write so skybox is always behind everything
  gl.depthMask(false);
  sky.render();
  gl.depthMask(true);
}

// ============================================================
// GROUND
// ============================================================
/*function drawGround() {
  var g = new Cube();
  g.textureNum = 1;
  g.matrix.setTranslate(-1, -0.01, -1);
  g.matrix.scale(34, 0.02, 34);
  g.render();
}
*/

function drawGround() {
  var g = new Cube();
  g.textureNum = 1;
  g.matrix.setTranslate(-1, -0.01, -1);
  g.matrix.scale(34, 0.02, 34);

  // Custom verts with tiled UVs (32x32 repeats)
  var verts = new Float32Array([
    // Top face only (y=1) with UVs 0-32
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
        c.textureNum = 0; // wall texture
        c.matrix.setTranslate(x, y, z);
        c.render();
      }
    }
  }
}

// ============================================================
// KOALA — placed at world pos (16, 0, 16)
// ============================================================
function setColor(r, g_, b) {
  gl.uniform4f(u_FragColor, r, g_, b, 1.0);
}

function drawKoalaCube(M) {
  // Disable texture, use solid color
  gl.uniform1i(u_texColorWeight, -1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);

  var verts = new Float32Array([
    // Front
    0,0,0, 0,0,  1,0,0, 1,0,  1,1,0, 1,1,
    0,0,0, 0,0,  1,1,0, 1,1,  0,1,0, 0,1,
    // Back
    1,0,1, 0,0,  0,0,1, 1,0,  0,1,1, 1,1,
    1,0,1, 0,0,  0,1,1, 1,1,  1,1,1, 0,1,
    // Top
    0,1,0, 0,0,  0,1,1, 0,1,  1,1,1, 1,1,
    0,1,0, 0,0,  1,1,1, 1,1,  1,1,0, 1,0,
    // Bottom
    0,0,1, 0,0,  0,0,0, 0,1,  1,0,0, 1,1,
    0,0,1, 0,0,  1,0,0, 1,1,  1,0,1, 1,0,
    // Left
    0,0,1, 0,0,  0,0,0, 1,0,  0,1,0, 1,1,
    0,0,1, 0,0,  0,1,0, 1,1,  0,1,1, 0,1,
    // Right
    1,0,0, 0,0,  1,0,1, 1,0,  1,1,1, 1,1,
    1,0,0, 0,0,  1,1,1, 1,1,  1,1,0, 0,1,
  ]);
  const FSIZE = verts.BYTES_PER_ELEMENT;
  gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 5*FSIZE, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 5*FSIZE, 3*FSIZE);
  gl.enableVertexAttribArray(a_UV);
  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function drawKoalaCylinder(M, sides) {
  gl.uniform1i(u_texColorWeight, -1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);
  var angleStep = (2 * Math.PI) / sides;
  var verts = [];
  for (var i = 0; i < sides; i++) {
    var a1 = i * angleStep, a2 = (i+1) * angleStep;
    var x1 = 0.5 + 0.5*Math.cos(a1), y1 = 0.5 + 0.5*Math.sin(a1);
    var x2 = 0.5 + 0.5*Math.cos(a2), y2 = 0.5 + 0.5*Math.sin(a2);
    // front
    verts.push(0.5,0.5,0, 0,0, x1,y1,0, 1,0, x2,y2,0, 1,1);
    // back
    verts.push(0.5,0.5,1, 0,0, x2,y2,1, 1,0, x1,y1,1, 1,1);
    // sides
    verts.push(x1,y1,0, 0,0, x1,y1,1, 1,0, x2,y2,1, 1,1);
    verts.push(x1,y1,0, 0,0, x2,y2,1, 1,0, x2,y2,0, 1,1);
  }
  var arr = new Float32Array(verts);
  const FSIZE = arr.BYTES_PER_ELEMENT;
  gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, arr, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 5*FSIZE, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 5*FSIZE, 3*FSIZE);
  gl.enableVertexAttribArray(a_UV);
  gl.drawArrays(gl.TRIANGLES, 0, sides * 4 * 3);
}

function drawKoala() {
  // Koala lives at world pos (16, 0, 16), scaled up 1.5x
  var base = new Matrix4();
  base.setTranslate(15.2, 1, 13.0);
  base.scale(1, 1, 1);

  // BODY
  setColor(0.47, 0.47, 0.47);
  var body = new Matrix4(base);
  body.translate(-0.35, -0.25, -0.7);
  body.scale(0.7, 0.5, 1.4);
  drawKoalaCube(body);

  // HEAD
  setColor(0.55, 0.55, 0.55);
  var head = new Matrix4(base);
  head.translate(-0.32, 0.0, 0.4);
  head.scale(0.64, 0.62, 0.58);
  drawKoalaCube(head);

  // NOSE
  setColor(0.12, 0.08, 0.06);
  var nose = new Matrix4(base);
  nose.translate(-0.17, 0.1, 0.95);
  nose.scale(0.34, 0.22, 0.07);
  drawKoalaCube(nose);

  // LEFT EYE
  setColor(0.08, 0.08, 0.08);
  var leftEye = new Matrix4(base);
  leftEye.translate(-0.28, 0.28, 0.96);
  leftEye.scale(0.08, 0.08, 0.04);
  drawKoalaCube(leftEye);

  // RIGHT EYE
  setColor(0.08, 0.08, 0.08);
  var rightEye = new Matrix4(base);
  rightEye.translate(0.2, 0.28, 0.96);
  rightEye.scale(0.08, 0.08, 0.04);
  drawKoalaCube(rightEye);

  // LEFT EAR
  setColor(0.58, 0.58, 0.58);
  var leftEar = new Matrix4(base);
  leftEar.translate(-0.55, 0.5, 0.5);
  leftEar.scale(0.45, 0.42, 0.3);
  drawKoalaCylinder(leftEar, 8);

  setColor(0.75, 0.72, 0.72);
  var leftEarInner = new Matrix4(base);
  leftEarInner.translate(-0.465, 0.58, 0.78);
  leftEarInner.scale(0.28, 0.24, 0.04);
  drawKoalaCylinder(leftEarInner, 8);

  // RIGHT EAR
  setColor(0.58, 0.58, 0.58);
  var rightEar = new Matrix4(base);
  rightEar.translate(0.1, 0.5, 0.5);
  rightEar.scale(0.45, 0.42, 0.3);
  drawKoalaCylinder(rightEar, 8);

  setColor(0.75, 0.72, 0.72);
  var rightEarInner = new Matrix4(base);
  rightEarInner.translate(0.185, 0.58, 0.78);
  rightEarInner.scale(0.28, 0.24, 0.04);
  drawKoalaCylinder(rightEarInner, 8);

  // TAIL
  setColor(0.5, 0.5, 0.5);
  var tail = new Matrix4(base);
  tail.translate(-0.05, 0.18, -0.72);
  tail.scale(0.18, 0.14, 0.1);
  drawKoalaCube(tail);

  // FRONT LEFT UPPER LEG
  setColor(0.5, 0.5, 0.5);
  var flUpper = new Matrix4(base);
  flUpper.translate(-0.52, -0.25, 0.45);
  var flUpperBase = new Matrix4(flUpper);
  flUpper.scale(0.22, 0.35, 0.22);
  drawKoalaCube(flUpper);

  setColor(0.48, 0.48, 0.48);
  var flLower = new Matrix4(flUpperBase);
  flLower.translate(0, -0.38, 0);
  var flLowerBase = new Matrix4(flLower);
  flLower.scale(0.22, 0.38, 0.22);
  drawKoalaCube(flLower);

  setColor(0.3, 0.3, 0.3);
  var flPaw = new Matrix4(flLowerBase);
  flPaw.translate(-0.04, -0.18, -0.06);
  flPaw.scale(0.3, 0.15, 0.34);
  drawKoalaCube(flPaw);

  // FRONT RIGHT UPPER LEG
  setColor(0.5, 0.5, 0.5);
  var frUpper = new Matrix4(base);
  frUpper.translate(0.3, -0.25, 0.45);
  var frUpperBase = new Matrix4(frUpper);
  frUpper.scale(0.22, 0.35, 0.22);
  drawKoalaCube(frUpper);

  setColor(0.48, 0.48, 0.48);
  var frLower = new Matrix4(frUpperBase);
  frLower.translate(0, -0.38, 0);
  var frLowerBase = new Matrix4(frLower);
  frLower.scale(0.22, 0.38, 0.22);
  drawKoalaCube(frLower);

  setColor(0.3, 0.3, 0.3);
  var frPaw = new Matrix4(frLowerBase);
  frPaw.translate(-0.04, -0.18, -0.06);
  frPaw.scale(0.3, 0.15, 0.34);
  drawKoalaCube(frPaw);

  // BACK LEFT UPPER LEG
  setColor(0.5, 0.5, 0.5);
  var blUpper = new Matrix4(base);
  blUpper.translate(-0.52, -0.25, -0.55);
  var blUpperBase = new Matrix4(blUpper);
  blUpper.scale(0.22, 0.35, 0.22);
  drawKoalaCube(blUpper);

  setColor(0.48, 0.48, 0.48);
  var blLower = new Matrix4(blUpperBase);
  blLower.translate(0, -0.38, 0);
  var blLowerBase = new Matrix4(blLower);
  blLower.scale(0.22, 0.38, 0.22);
  drawKoalaCube(blLower);

  setColor(0.3, 0.3, 0.3);
  var blPaw = new Matrix4(blLowerBase);
  blPaw.translate(-0.04, -0.18, -0.06);
  blPaw.scale(0.3, 0.15, 0.34);
  drawKoalaCube(blPaw);

  // BACK RIGHT UPPER LEG
  setColor(0.5, 0.5, 0.5);
  var brUpper = new Matrix4(base);
  brUpper.translate(0.3, -0.25, -0.55);
  var brUpperBase = new Matrix4(brUpper);
  brUpper.scale(0.22, 0.35, 0.22);
  drawKoalaCube(brUpper);

  setColor(0.48, 0.48, 0.48);
  var brLower = new Matrix4(brUpperBase);
  brLower.translate(0, -0.38, 0);
  var brLowerBase = new Matrix4(brLower);
  brLower.scale(0.22, 0.38, 0.22);
  drawKoalaCube(brLower);

  setColor(0.3, 0.3, 0.3);
  var brPaw = new Matrix4(brLowerBase);
  brPaw.translate(-0.04, -0.18, -0.06);
  brPaw.scale(0.3, 0.15, 0.34);
  drawKoalaCube(brPaw);

  // BELLY
  setColor(0.9, 0.9, 0.9);
  var belly = new Matrix4(base);
  belly.translate(-0.28, -0.22, 0.0);
  belly.scale(0.56, 0.4, 0.72);
  drawKoalaCube(belly);
}

// ============================================================
// SHEEP SYSTEM
// ============================================================
var g_sheep = [];
var g_gameWon = false;
 
// Pen bounds (open area near koala)
var PEN_X1 = 13, PEN_X2 = 17;
var PEN_Z1 = 5,  PEN_Z2 = 9;
 
function initSheep() {
  var candidates = [];
  for (var z = 2; z < 30; z++) {
    for (var x = 2; x < 30; x++) {
      if (g_map[z][x] === 0) {
        if (x >= PEN_X1-2 && x <= PEN_X2+2 && z >= PEN_Z1-2 && z <= PEN_Z2+2) continue;
        if (x >= 14 && x <= 18 && z >= 12 && z <= 16) continue;
        candidates.push({x, z});
      }
    }
  }
  for (var i = candidates.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = candidates[i]; candidates[i] = candidates[j]; candidates[j] = tmp;
  }
  for (var i = 0; i < 5; i++) {
    g_sheep.push({
      x: candidates[i].x + 0.5,
      z: candidates[i].z + 0.5,
      following: false,
      herded: false,
      prevPlayerX: 0,
      prevPlayerZ: 0,
    });
  }
}
 
function updateSheep() {
  if (g_gameWon) return;
  var px = g_camera.eye.elements[0];
  var pz = g_camera.eye.elements[2];
  var herded = 0;
 
  for (var i = 0; i < g_sheep.length; i++) {
    var s = g_sheep[i];
    if (s.herded) { herded++; continue; }
 
    if (s.x >= PEN_X1 && s.x <= PEN_X2 && s.z >= PEN_Z1 && s.z <= PEN_Z2) {
      s.herded = true;
      s.following = false;
      herded++;
      continue;
    }
 
    var dx = px - s.x;
    var dz = pz - s.z;
    var dist = Math.sqrt(dx*dx + dz*dz);
    if (dist < 2.5) s.following = true;
 
    if (s.following) {
      var tx = s.prevPlayerX - s.x;
      var tz = s.prevPlayerZ - s.z;
      var tlen = Math.sqrt(tx*tx + tz*tz);
      if (tlen > 0.1) {
        s.x += (tx/tlen) * 0.03;
        s.z += (tz/tlen) * 0.03;
      }
    }
 
    s.prevPlayerX = px;
    s.prevPlayerZ = pz;
  }
 
  var el = document.getElementById('sheepCounter');
  if (el) el.textContent = herded + '/5';
 
  if (herded === 5) {
    g_gameWon = true;
    document.getElementById('winMessage').style.display = 'block';
  }
}

function drawPen() {
  // Green ground patch inside pen
  for (var x = PEN_X1; x < PEN_X2; x++) {
    for (var z = PEN_Z1; z < PEN_Z2; z++) {
      var p = new Cube();
      p.textureNum = -1;
      p.color = [0.3, 0.7, 0.3, 1.0];
      p.matrix.setTranslate(x, -0.005, z);
      p.matrix.scale(1, 0.01, 1);
      p.render();
    }
  }

  // Helper to draw a fence piece with spruce texture
function fenceCube(tx, ty, tz, sx, sy, sz) {
  var M = new Matrix4();
  M.setTranslate(tx, ty, tz);
  M.scale(sx, sy, sz);
  gl.uniform1i(u_texColorWeight, 3);
  gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);

  // UVs tile based on dimensions so texture doesn't stretch
  var ux = sx, uy = sy, uz = sz;
  var verts = new Float32Array([
    // Front (z=0)
    0,0,0, 0,0,   1,0,0, ux,0,  1,1,0, ux,uy,
    0,0,0, 0,0,   1,1,0, ux,uy, 0,1,0, 0,uy,
    // Back (z=1)
    1,0,1, 0,0,   0,0,1, ux,0,  0,1,1, ux,uy,
    1,0,1, 0,0,   0,1,1, ux,uy, 1,1,1, 0,uy,
    // Top (y=1)
    0,1,0, 0,0,   0,1,1, 0,uz,  1,1,1, ux,uz,
    0,1,0, 0,0,   1,1,1, ux,uz, 1,1,0, ux,0,
    // Bottom (y=0)
    0,0,1, 0,0,   0,0,0, 0,uz,  1,0,0, ux,uz,
    0,0,1, 0,0,   1,0,0, ux,uz, 1,0,1, ux,0,
    // Left (x=0)
    0,0,1, 0,0,   0,0,0, uz,0,  0,1,0, uz,uy,
    0,0,1, 0,0,   0,1,0, uz,uy, 0,1,1, 0,uy,
    // Right (x=1)
    1,0,0, 0,0,   1,0,1, uz,0,  1,1,1, uz,uy,
    1,0,0, 0,0,   1,1,1, uz,uy, 1,1,0, 0,uy,
  ]);

  const FSIZE = verts.BYTES_PER_ELEMENT;
  gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 5*FSIZE, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 5*FSIZE, 3*FSIZE);
  gl.enableVertexAttribArray(a_UV);
  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

  // POSTS — corners and every 2 units along each side
  var postX = [13, 15, 17];
  var postZ = [5, 7, 9];

  // Posts along z=5 and z=9 (front and back)
  for (var i = 0; i < postX.length; i++) {
    fenceCube(postX[i], 0, 5,    0.2, 1.0, 0.2); // front
    fenceCube(postX[i], 0, 8.8,  0.2, 1.0, 0.2); // back
  }
  // Posts along x=13 and x=17 (sides), skip corners already drawn
  fenceCube(13, 0, 7, 0.2, 1.0, 0.2);
  fenceCube(17, 0, 7, 0.2, 1.0, 0.2);

  // RAILS along z=5 side (front) — leave gap at x=15-16 as entrance
  fenceCube(13.2, 0.6, 5.0, 1.8, 0.12, 0.12); // left half
  fenceCube(13.2, 0.3, 5.0, 1.8, 0.12, 0.12); // left half

  // right half skipped = entrance gap

  // RAILS along z=9 side (back, full)
  fenceCube(13.2, 0.6, 8.88, 3.8, 0.12, 0.12);
  fenceCube(13.2, 0.3, 8.88, 3.8, 0.12, 0.12);

  // RAILS along x=13 side (left)
  fenceCube(13.0, 0.6, 5.2, 0.12, 0.12, 3.6);
  fenceCube(13.0, 0.3, 5.2, 0.12, 0.12, 3.6);

  // RAILS along x=17 side (right)
  fenceCube(17, 0.6, 5.2, 0.12, 0.12, 3.6);
  fenceCube(17, 0.3, 5.2, 0.12, 0.12, 3.6);
}

function drawSheep(x, z, following, herded) {
  var base = new Matrix4();
  
  // Rotate to face player if following
  var angle = 0;
  if (following && !herded) {
    var px = g_camera.eye.elements[0];
    var pz = g_camera.eye.elements[2];
    var dx = px - x;
    var dz = pz - z;
    angle = Math.atan2(dx, dz) * 180 / Math.PI;
  }
  
  base.setTranslate(x, 0, z);
  base.rotate(angle, 0, 1, 0);
  base.translate(-0.3, 0, -0.4);

  setColor(0.92, 0.92, 0.92);
  var body = new Matrix4(base);
  body.translate(0, 0.3, 0);
  body.scale(0.6, 0.35, 0.8);
  drawKoalaCube(body);

  setColor(0.85, 0.85, 0.85);
  var head = new Matrix4(base);
  head.translate(0.1, 0.5, 0.55);
  head.scale(0.4, 0.35, 0.35);
  drawKoalaCube(head);

  setColor(0.05, 0.05, 0.05);
  var eyeL = new Matrix4(base);
  eyeL.translate(0.08, 0.62, 0.89);
  eyeL.scale(0.08, 0.08, 0.04);
  drawKoalaCube(eyeL);
  var eyeR = new Matrix4(base);
  eyeR.translate(0.44, 0.62, 0.89);
  eyeR.scale(0.08, 0.08, 0.04);
  drawKoalaCube(eyeR);

  setColor(0.3, 0.3, 0.3);
  var legPositions = [[0.05,0.05], [0.45,0.05], [0.05,0.55], [0.45,0.55]];
  for (var i = 0; i < 4; i++) {
    var leg = new Matrix4(base);
    leg.translate(legPositions[i][0], 0.0, legPositions[i][1]);
    leg.scale(0.15, 0.3, 0.15);
    drawKoalaCube(leg);
  }
}

function drawAllSheep() {
  for (var i = 0; i < g_sheep.length; i++) {
    var s = g_sheep[i];
    drawSheep(s.x, s.z, s.following, s.herded);
  }
}

window.onload = main;