// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_GlobalRotation;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjectionMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotation * u_ModelMatrix * a_Position;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

var canvas;
var gl;
var a_Position;
var u_FragColor;
var u_ModelMatrix;
var u_GlobalRotation;
var u_ProjectionMatrix;
var u_ViewMatrix;

// joint angles
var g_globalAngle = 180;
var g_frontLeftUpperLegAngle = 0;
var g_frontLeftLowerLegAngle = 0;
var g_frontRightUpperLegAngle = 0;
var g_frontRightLowerLegAngle = 0;
var g_backLeftUpperLegAngle = 0;
var g_backLeftLowerLegAngle = 0;
var g_backRightUpperLegAngle = 0;
var g_backRightLowerLegAngle = 0;
var g_frontLeftPawAngle = 0;
var g_frontRightPawAngle = 0;
var g_backLeftPawAngle = 0;
var g_backRightPawAngle = 0;

var g_animationOn = false;
var g_startTime = performance.now() / 1000.0;
var g_seconds = 0;

var g_mouseDown = false;
var g_lastMouseX = 0;
var g_lastMouseY = 0;
var g_mouseXAngle = 0;

var g_pokeAnimating = false;
var g_pokeStartTime = 0;

var g_winkTime = 0;
var g_winking = false;

var g_vertexBuffer = null;

var g_lastFrameTime = performance.now();
var g_fps = 0;
var g_fpsSmooth = 0;

function main() {
  setupWebGL();
  connectVariablesToGLSL();

  document.getElementById('resetBtn').addEventListener('click', function() {
    g_frontLeftUpperLegAngle = 0;
    g_frontLeftLowerLegAngle = 0;
    g_frontRightUpperLegAngle = 0;
    g_frontRightLowerLegAngle = 0;
    g_backLeftUpperLegAngle = 0;
    g_backLeftLowerLegAngle = 0;
    g_backRightUpperLegAngle = 0;
    g_backRightLowerLegAngle = 0;
    g_frontLeftPawAngle = 0;
    g_frontRightPawAngle = 0;
    g_backLeftPawAngle = 0;
    g_backRightPawAngle = 0;
    g_globalAngle = 180;
    g_mouseXAngle = 0;
    document.getElementById('frontLeftUpperLegSlider').value = 0;
    document.getElementById('frontLeftLowerLegSlider').value = 0;
    document.getElementById('frontRightUpperLegSlider').value = 0;
    document.getElementById('frontRightLowerLegSlider').value = 0;
    document.getElementById('backLeftUpperLegSlider').value = 0;
    document.getElementById('backLeftLowerLegSlider').value = 0;
    document.getElementById('backRightUpperLegSlider').value = 0;
    document.getElementById('backRightLowerLegSlider').value = 0;
    document.getElementById('frontLeftPawSlider').value = 0;
    document.getElementById('frontRightPawSlider').value = 0;
    document.getElementById('backLeftPawSlider').value = 0;
    document.getElementById('backRightPawSlider').value = 0;
    document.getElementById('globalRotSlider').value = 180;
    renderScene();
  });

  document.getElementById('globalRotSlider').addEventListener('input', function() {
    g_globalAngle = this.value; renderScene();
  });
  document.getElementById('frontLeftUpperLegSlider').addEventListener('input', function() {
    g_frontLeftUpperLegAngle = this.value; renderScene();
  });
  document.getElementById('frontLeftLowerLegSlider').addEventListener('input', function() {
    g_frontLeftLowerLegAngle = this.value; renderScene();
  });
  document.getElementById('frontRightUpperLegSlider').addEventListener('input', function() {
    g_frontRightUpperLegAngle = this.value; renderScene();
  });
  document.getElementById('frontRightLowerLegSlider').addEventListener('input', function() {
    g_frontRightLowerLegAngle = this.value; renderScene();
  });
  document.getElementById('backLeftUpperLegSlider').addEventListener('input', function() {
    g_backLeftUpperLegAngle = this.value; renderScene();
  });
  document.getElementById('backLeftLowerLegSlider').addEventListener('input', function() {
    g_backLeftLowerLegAngle = this.value; renderScene();
  });
  document.getElementById('backRightUpperLegSlider').addEventListener('input', function() {
    g_backRightUpperLegAngle = this.value; renderScene();
  });
  document.getElementById('backRightLowerLegSlider').addEventListener('input', function() {
    g_backRightLowerLegAngle = this.value; renderScene();
  });
  document.getElementById('frontLeftPawSlider').addEventListener('input', function() {
    g_frontLeftPawAngle = this.value; renderScene();
  });
  document.getElementById('frontRightPawSlider').addEventListener('input', function() {
    g_frontRightPawAngle = this.value; renderScene();
  });
  document.getElementById('backLeftPawSlider').addEventListener('input', function() {
    g_backLeftPawAngle = this.value; renderScene();
  });
  document.getElementById('backRightPawSlider').addEventListener('input', function() {
    g_backRightPawAngle = this.value; renderScene();
  });

  document.getElementById('animBtn').addEventListener('click', function() {
    g_animationOn = !g_animationOn;
    this.textContent = g_animationOn ? 'Stop Animation' : 'Start Animation';
  });

  canvas.onmousedown = function(ev) {
    if (ev.shiftKey) { startPokeAnimation(); return; }
    g_mouseDown = true;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
  };
  document.onmouseup = function(ev) { g_mouseDown = false; };  canvas.onmousemove = function(ev) {
    if (!g_mouseDown) return;
    var dx = ev.clientX - g_lastMouseX;
    var dy = ev.clientY - g_lastMouseY;
    g_globalAngle += dx * 0.5;
    g_mouseXAngle += dy * 0.5;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
    renderScene();
  };

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  tick();
}

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) { console.log('Failed to get WebGL context'); return; }
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.'); return;
  }

  g_vertexBuffer = gl.createBuffer();
  if (!g_vertexBuffer) { console.log('Failed to create buffer'); return; }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotation = gl.getUniformLocation(gl.program, 'u_GlobalRotation');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
}

function tick() {
  var now = performance.now();
  var delta = now - g_lastFrameTime;
  g_lastFrameTime = now;
  g_fps = delta > 0 ? Math.round(1000 / delta) : g_fpsSmooth;
  g_fpsSmooth = Math.round(g_fpsSmooth * 0.9 + g_fps * 0.1); // smooth it
  document.getElementById('fpsCounter').textContent = g_fpsSmooth;
  
  g_seconds = performance.now() / 1000.0 - g_startTime;
  updateAnimationAngles();
  renderScene();
  requestAnimationFrame(tick);
}

function startPokeAnimation() {
  g_pokeAnimating = true;
  g_pokeStartTime = g_seconds;
}

function updateAnimationAngles() {
  if (g_pokeAnimating) {
    var pokeTime = g_seconds - g_pokeStartTime;
    if (pokeTime < 0.15) {
      g_winking = true;
    } else if (pokeTime < 0.6) {
      g_winking = true;
    } else if (pokeTime < 0.75) {
      g_winking = false;
    } else {
      g_winking = false;
      g_pokeAnimating = false;
    }
    return;
  }

  if (g_animationOn) {
    g_frontLeftUpperLegAngle  =  25 * Math.sin(g_seconds * 3);
    g_frontRightUpperLegAngle = -25 * Math.sin(g_seconds * 3);
    g_backLeftUpperLegAngle   = -25 * Math.sin(g_seconds * 3);
    g_backRightUpperLegAngle  =  25 * Math.sin(g_seconds * 3);
    g_frontLeftLowerLegAngle  =  15 * Math.abs(Math.sin(g_seconds * 3));
    g_frontRightLowerLegAngle =  15 * Math.abs(Math.sin(g_seconds * 3));
    g_backLeftLowerLegAngle   =  15 * Math.abs(Math.sin(g_seconds * 3));
    g_backRightLowerLegAngle  =  15 * Math.abs(Math.sin(g_seconds * 3));
  }
}

function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var projMat = new Matrix4();
  projMat.setPerspective(50, canvas.width / canvas.height, 0.1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  var viewMat = new Matrix4();
  viewMat.setLookAt(0, 0.3, -3, 0, 0, 0, 0, 1, 0);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  var globalRotMat = new Matrix4()
    .rotate(g_globalAngle, 0, 1, 0)
    .rotate(g_mouseXAngle, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotation, false, globalRotMat.elements);

  // --- BODY ---
  // Long front-to-back (Z axis), low and wide
  gl.uniform4f(u_FragColor, 0.47, 0.47, 0.47, 1.0);
  var body = new Matrix4();
  body.translate(-0.35, -0.25, -0.7);
  body.scale(0.7, 0.5, 1.4);
  drawCube(body);

  // --- HEAD ---
  // Sticks out front of body, slightly lower than ears
  gl.uniform4f(u_FragColor, 0.55, 0.55, 0.55, 1.0);
  var head = new Matrix4();
  head.translate(-0.32, 0.0, 0.4);
  head.scale(0.64, 0.62, 0.58);
  drawCube(head);

  // --- NOSE ---
  gl.uniform4f(u_FragColor, 0.12, 0.08, 0.06, 1.0);
  var nose = new Matrix4();
  nose.translate(-0.17, 0.1, 0.95);
  nose.scale(0.34, 0.22, 0.07);
  drawCube(nose);

  // LEFT EYE
  gl.uniform4f(u_FragColor, 0.08, 0.08, 0.08, 1.0); // near black
  var leftEye = new Matrix4();
  leftEye.translate(-0.28, 0.28, 0.96);
  leftEye.scale(0.08, 0.08, 0.04);
  drawCube(leftEye);

  // RIGHT EYE
  gl.uniform4f(u_FragColor, 0.08, 0.08, 0.08, 1.0);
  var rightEye = new Matrix4();
  rightEye.translate(0.2, 0.28, 0.96);
  if (g_winking) {
    rightEye.scale(0.08, 0.01, 0.04);
  } else {
    rightEye.scale(0.08, 0.08, 0.04);
  }
  drawCube(rightEye);

  // LEFT EAR
  gl.uniform4f(u_FragColor, 0.58, 0.58, 0.58, 1.0);
  var leftEar = new Matrix4();
  leftEar.translate(-0.55, 0.5, 0.5);
  leftEar.scale(0.45, 0.42, 0.3);
  drawCylinder(leftEar, 8);

  gl.uniform4f(u_FragColor, 0.75, 0.72, 0.72, 1.0);
  var leftEarInner = new Matrix4();
  leftEarInner.translate(-0.465, 0.58, 0.78);
  leftEarInner.scale(0.28, 0.24, 0.04);
  drawCylinder(leftEarInner, 8);

  // RIGHT EAR
  gl.uniform4f(u_FragColor, 0.58, 0.58, 0.58, 1.0);
  var rightEar = new Matrix4();
  rightEar.translate(0.1, 0.5, 0.5);
  rightEar.scale(0.45, 0.42, 0.3);
  drawCylinder(rightEar, 8);

  gl.uniform4f(u_FragColor, 0.75, 0.72, 0.72, 1.0);
  var rightEarInner = new Matrix4();
  rightEarInner.translate(0.185, 0.58, 0.78);
  rightEarInner.scale(0.28, 0.24, 0.04);
  drawCylinder(rightEarInner, 8);

  // --- TAIL ---
  gl.uniform4f(u_FragColor, 0.5, 0.5, 0.5, 1.0);
  var tail = new Matrix4();
  tail.translate(-0.05, 0.18, -0.72);
  tail.scale(0.18, 0.14, 0.1);
  drawCube(tail);

  // === LEGS ===

  // --- FRONT LEFT UPPER LEG ---
  gl.uniform4f(u_FragColor, 0.5, 0.5, 0.5, 1.0);
  var flUpper = new Matrix4();
  flUpper.translate(-0.52, -0.25, 0.45);
  flUpper.rotate(g_frontLeftUpperLegAngle, 1, 0, 0);
  var flUpperBase = new Matrix4(flUpper);
  flUpper.scale(0.22, 0.35, 0.22);
  drawCube(flUpper);

  // --- FRONT LEFT LOWER LEG ---
  gl.uniform4f(u_FragColor, 0.48, 0.48, 0.48, 1.0);
  var flLower = new Matrix4(flUpperBase);
  flLower.translate(0, -0.38, 0);
  flLower.rotate(g_frontLeftLowerLegAngle, 1, 0, 0);
  var flLowerBase = new Matrix4(flLower);
  flLower.scale(0.22, 0.38, 0.22);
  drawCube(flLower);

  // FRONT LEFT PAW
  gl.uniform4f(u_FragColor, 0.3, 0.3, 0.3, 1.0);
  var flPaw = new Matrix4(flLowerBase);
  flPaw.translate(-0.04, -0.18, -0.06);
  flPaw.rotate(g_frontLeftPawAngle, 1, 0, 0);
  flPaw.scale(0.3, 0.15, 0.34);
  drawCube(flPaw);

  // --- FRONT RIGHT UPPER LEG ---
  gl.uniform4f(u_FragColor, 0.5, 0.5, 0.5, 1.0);
  var frUpper = new Matrix4();
  frUpper.translate(0.3, -0.25, 0.45);
  frUpper.rotate(g_frontRightUpperLegAngle, 1, 0, 0);
  var frUpperBase = new Matrix4(frUpper);
  frUpper.scale(0.22, 0.35, 0.22);
  drawCube(frUpper);

  // --- FRONT RIGHT LOWER LEG ---
  gl.uniform4f(u_FragColor, 0.48, 0.48, 0.48, 1.0);
  var frLower = new Matrix4(frUpperBase);
  frLower.translate(0, -0.38, 0);
  frLower.rotate(g_frontRightLowerLegAngle, 1, 0, 0);
  var frLowerBase = new Matrix4(frLower);
  frLower.scale(0.22, 0.38, 0.22);
  drawCube(frLower);

  // FRONT RIGHT PAW
  gl.uniform4f(u_FragColor, 0.3, 0.3, 0.3, 1.0);
  var frPaw = new Matrix4(frLowerBase);
  frPaw.translate(-0.04, -0.18, -0.06);
  frPaw.rotate(g_frontRightPawAngle, 1, 0, 0);
  frPaw.scale(0.3, 0.15, 0.34);
  drawCube(frPaw);

  // --- BACK LEFT UPPER LEG ---
  gl.uniform4f(u_FragColor, 0.5, 0.5, 0.5, 1.0);
  var blUpper = new Matrix4();
  blUpper.translate(-0.52, -0.25, -0.55);
  blUpper.rotate(g_backLeftUpperLegAngle, 1, 0, 0);
  var blUpperBase = new Matrix4(blUpper);
  blUpper.scale(0.22, 0.35, 0.22);
  drawCube(blUpper);

  // --- BACK LEFT LOWER LEG ---
  gl.uniform4f(u_FragColor, 0.48, 0.48, 0.48, 1.0);
  var blLower = new Matrix4(blUpperBase);
  blLower.translate(0, -0.38, 0);
  blLower.rotate(g_backLeftLowerLegAngle, 1, 0, 0);
  var blLowerBase = new Matrix4(blLower);
  blLower.scale(0.22, 0.38, 0.22);
  drawCube(blLower);

  // BACK LEFT PAW
  gl.uniform4f(u_FragColor, 0.3, 0.3, 0.3, 1.0);
  var blPaw = new Matrix4(blLowerBase);
  blPaw.translate(-0.04, -0.18, -0.06);
  blPaw.rotate(g_backLeftPawAngle, 1, 0, 0);
  blPaw.scale(0.3, 0.15, 0.34);
  drawCube(blPaw);

  // --- BACK RIGHT UPPER LEG ---
  gl.uniform4f(u_FragColor, 0.5, 0.5, 0.5, 1.0);
  var brUpper = new Matrix4();
  brUpper.translate(0.3, -0.25, -0.55);
  brUpper.rotate(g_backRightUpperLegAngle, 1, 0, 0);
  var brUpperBase = new Matrix4(brUpper);
  brUpper.scale(0.22, 0.35, 0.22);
  drawCube(brUpper);

  // --- BACK RIGHT LOWER LEG ---
  gl.uniform4f(u_FragColor, 0.48, 0.48, 0.48, 1.0);
  var brLower = new Matrix4(brUpperBase);
  brLower.translate(0, -0.38, 0);
  brLower.rotate(g_backRightLowerLegAngle, 1, 0, 0);
  var brLowerBase = new Matrix4(brLower);
  brLower.scale(0.22, 0.38, 0.22);
  drawCube(brLower);

  // BACK RIGHT PAW
  gl.uniform4f(u_FragColor, 0.3, 0.3, 0.3, 1.0);
  var brPaw = new Matrix4(brLowerBase);
  brPaw.translate(-0.04, -0.18, -0.06);
  brPaw.rotate(g_backRightPawAngle, 1, 0, 0);
  brPaw.scale(0.3, 0.15, 0.34);
  drawCube(brPaw);
  
  // BELLY
  gl.uniform4f(u_FragColor, 0.9, 0.9, 0.9, 1.0); // near white
  var belly = new Matrix4();
  belly.translate(-0.28, -0.22, 0.0);
  belly.scale(0.56, 0.4, 0.72);
  drawCube(belly);
}

function drawTriangle3D(vertices) {
  gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function drawCylinder(M, sides) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);
  var angleStep = (2 * Math.PI) / sides;
  
  for (var i = 0; i < sides; i++) {
    var a1 = i * angleStep;
    var a2 = (i + 1) * angleStep;
    var x1 = 0.5 + 0.5 * Math.cos(a1);
    var y1 = 0.5 + 0.5 * Math.sin(a1);
    var x2 = 0.5 + 0.5 * Math.cos(a2);
    var y2 = 0.5 + 0.5 * Math.sin(a2);

    // front face
    drawTriangle3D([0.5, 0.5, 0,  x1, y1, 0,  x2, y2, 0]);
    // back face
    drawTriangle3D([0.5, 0.5, 1,  x2, y2, 1,  x1, y1, 1]);
    // side quad (2 triangles)
    drawTriangle3D([x1, y1, 0,  x1, y1, 1,  x2, y2, 1]);
    drawTriangle3D([x1, y1, 0,  x2, y2, 1,  x2, y2, 0]);
  }
}

function drawCube(M) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);

  // front
  drawTriangle3D([0,0,0, 1,0,0, 1,1,0]);
  drawTriangle3D([0,0,0, 1,1,0, 0,1,0]);
  // back
  drawTriangle3D([0,0,1, 1,1,1, 1,0,1]);
  drawTriangle3D([0,0,1, 0,1,1, 1,1,1]);
  // top
  drawTriangle3D([0,1,0, 0,1,1, 1,1,1]);
  drawTriangle3D([0,1,0, 1,1,1, 1,1,0]);
  // bottom
  drawTriangle3D([0,0,0, 1,0,1, 0,0,1]);
  drawTriangle3D([0,0,0, 1,0,0, 1,0,1]);
  // left
  drawTriangle3D([0,0,0, 0,0,1, 0,1,1]);
  drawTriangle3D([0,0,0, 0,1,1, 0,1,0]);
  // right
  drawTriangle3D([1,0,0, 1,1,0, 1,1,1]);
  drawTriangle3D([1,0,0, 1,1,1, 1,0,1]);
}