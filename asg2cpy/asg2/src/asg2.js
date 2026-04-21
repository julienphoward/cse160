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
var g_leftUpperArmAngle = 0;
var g_leftLowerArmAngle = 0;
var g_rightUpperArmAngle = 0;
var g_rightLowerArmAngle = 0;
var g_leftUpperLegAngle = 0;
var g_leftLowerLegAngle = 0;
var g_rightUpperLegAngle = 0;
var g_rightLowerLegAngle = 0;

var g_animationOn = false;
var g_startTime = performance.now() / 1000.0;
var g_seconds = 0;

var g_mouseDown = false;
var g_lastMouseX = 0;
var g_lastMouseY = 0;
var g_mouseXAngle = 0;

var g_pokeAnimating = false;
var g_pokeStartTime = 0;

function main() {
  setupWebGL();
  connectVariablesToGLSL();

  document.getElementById('resetBtn').addEventListener('click', function() {
    g_leftUpperArmAngle = 0;
    g_leftLowerArmAngle = 0;
    g_rightUpperArmAngle = 0;
    g_rightLowerArmAngle = 0;
    g_leftUpperLegAngle = 0;
    g_leftLowerLegAngle = 0;
    g_rightUpperLegAngle = 0;
    g_rightLowerLegAngle = 0;
    g_globalAngle = 180;
    g_mouseXAngle = 0;
    document.getElementById('leftUpperArmSlider').value = 0;
    document.getElementById('leftLowerArmSlider').value = 0;
    document.getElementById('rightUpperArmSlider').value = 0;
    document.getElementById('rightLowerArmSlider').value = 0;
    document.getElementById('leftUpperLegSlider').value = 0;
    document.getElementById('leftLowerLegSlider').value = 0;
    document.getElementById('rightUpperLegSlider').value = 0;
    document.getElementById('rightLowerLegSlider').value = 0;
    document.getElementById('globalRotSlider').value = 180;
    renderScene();
  });

  document.getElementById('globalRotSlider').addEventListener('input', function() {
    g_globalAngle = this.value; renderScene();
  });
  document.getElementById('leftUpperArmSlider').addEventListener('input', function() {
    g_leftUpperArmAngle = this.value; renderScene();
  });
  document.getElementById('leftLowerArmSlider').addEventListener('input', function() {
    g_leftLowerArmAngle = this.value; renderScene();
  });
  document.getElementById('rightUpperArmSlider').addEventListener('input', function() {
    g_rightUpperArmAngle = this.value; renderScene();
  });
  document.getElementById('rightLowerArmSlider').addEventListener('input', function() {
    g_rightLowerArmAngle = this.value; renderScene();
  });
  document.getElementById('leftUpperLegSlider').addEventListener('input', function() {
    g_leftUpperLegAngle = this.value; renderScene();
  });
  document.getElementById('leftLowerLegSlider').addEventListener('input', function() {
    g_leftLowerLegAngle = this.value; renderScene();
  });
  document.getElementById('rightUpperLegSlider').addEventListener('input', function() {
    g_rightUpperLegAngle = this.value; renderScene();
  });
  document.getElementById('rightLowerLegSlider').addEventListener('input', function() {
    g_rightLowerLegAngle = this.value; renderScene();
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
  canvas.onmouseup = function(ev) { g_mouseDown = false; };
  canvas.onmousemove = function(ev) {
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
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotation = gl.getUniformLocation(gl.program, 'u_GlobalRotation');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
}

function tick() {
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
    if (pokeTime < 0.3) {
      g_rightUpperArmAngle = -90 * (pokeTime / 0.3);
      g_rightLowerArmAngle = -45 * (pokeTime / 0.3);
    } else if (pokeTime < 1.3) {
      g_rightUpperArmAngle = -90;
      g_rightLowerArmAngle = -45;
    } else if (pokeTime < 2.0) {
      g_rightUpperArmAngle = -90 * (1.0 - (pokeTime - 1.3) / 0.7);
      g_rightLowerArmAngle = -45 * (1.0 - (pokeTime - 1.3) / 0.7);
    } else {
      g_rightUpperArmAngle = 0;
      g_rightLowerArmAngle = 0;
      g_pokeAnimating = false;
    }
    return; // don't run normal animation during poke
  }

  if (g_animationOn) {
    g_leftUpperArmAngle = 30 * Math.sin(g_seconds * 2);
    g_rightUpperArmAngle = -30 * Math.sin(g_seconds * 2);
    g_leftUpperLegAngle = -20 * Math.sin(g_seconds * 2);
    g_rightUpperLegAngle = 20 * Math.sin(g_seconds * 2);
    g_leftLowerLegAngle = 15 * Math.abs(Math.sin(g_seconds * 2));
    g_rightLowerLegAngle = 15 * Math.abs(Math.sin(g_seconds * 2));
  }
}

function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // camera
  var projMat = new Matrix4();
  projMat.setPerspective(60, canvas.width / canvas.height, 0.1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  var viewMat = new Matrix4();
  viewMat.setLookAt(0, 0, -3, 0, 0, 0, 0, 1, 0);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  var globalRotMat = new Matrix4()
    .rotate(g_globalAngle, 0, 1, 0)
    .rotate(g_mouseXAngle, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotation, false, globalRotMat.elements);

  // --- BODY ---
  gl.uniform4f(u_FragColor, 0.47, 0.47, 0.47, 1.0);
  var body = new Matrix4();
  body.translate(-0.4, -0.33, -0.28);
  body.scale(0.8, 0.65, 0.55);
  drawCube(body);

  // --- HEAD ---
  gl.uniform4f(u_FragColor, 0.55, 0.55, 0.55, 1.0);
  var head = new Matrix4();
  head.translate(-0.3, 0.35, -0.28);
  head.scale(0.6, 0.55, 0.55);
  drawCube(head);

  // --- NOSE ---
  gl.uniform4f(u_FragColor, 0.2, 0.15, 0.1, 1.0);
  var nose = new Matrix4();
  nose.translate(-0.13, 0.47, 0.25);
  nose.scale(0.26, 0.18, 0.06);
  drawCube(nose);

  // --- LEFT EAR ---
  gl.uniform4f(u_FragColor, 0.58, 0.58, 0.58, 1.0);
  var leftEar = new Matrix4();
  leftEar.translate(-0.38, 0.87, -0.22);
  leftEar.scale(0.28, 0.28, 0.22);
  drawCube(leftEar);

  // --- RIGHT EAR ---
  gl.uniform4f(u_FragColor, 0.58, 0.58, 0.58, 1.0);
  var rightEar = new Matrix4();
  rightEar.translate(0.1, 0.87, -0.22);
  rightEar.scale(0.28, 0.28, 0.22);
  drawCube(rightEar);

  // --- LEFT UPPER ARM ---
  // save pre-scale base so children don't inherit skewed scale
  gl.uniform4f(u_FragColor, 0.5, 0.5, 0.5, 1.0);
  var leftUpperArm = new Matrix4();
  leftUpperArm.translate(-0.58, 0.1, -0.22);
  leftUpperArm.rotate(g_leftUpperArmAngle, 1, 0, 0);
  var leftUpperArmBase = new Matrix4(leftUpperArm); // save before scale
  leftUpperArm.scale(0.18, 0.25, 0.18);
  drawCube(leftUpperArm);

  // --- LEFT LOWER ARM ---
  gl.uniform4f(u_FragColor, 0.52, 0.52, 0.52, 1.0);
  var leftLowerArm = new Matrix4(leftUpperArmBase);
  leftLowerArm.translate(0, -0.25, 0); // actual world height of upper arm
  leftLowerArm.rotate(g_leftLowerArmAngle, 1, 0, 0);
  var leftLowerArmBase = new Matrix4(leftLowerArm);
  leftLowerArm.scale(0.18, 0.2, 0.18);
  drawCube(leftLowerArm);

  // --- LEFT PAW ---
  gl.uniform4f(u_FragColor, 0.45, 0.45, 0.45, 1.0);
  var leftPaw = new Matrix4(leftLowerArmBase);
  leftPaw.translate(-0.02, -0.2, -0.02);
  leftPaw.scale(0.24, 0.07, 0.22);
  drawCube(leftPaw);

  // --- RIGHT UPPER ARM ---
  gl.uniform4f(u_FragColor, 0.5, 0.5, 0.5, 1.0);
  var rightUpperArm = new Matrix4();
  rightUpperArm.translate(0.4, 0.1, -0.22);
  rightUpperArm.rotate(g_rightUpperArmAngle, 1, 0, 0);
  var rightUpperArmBase = new Matrix4(rightUpperArm);
  rightUpperArm.scale(0.18, 0.25, 0.18);
  drawCube(rightUpperArm);

  // --- RIGHT LOWER ARM ---
  gl.uniform4f(u_FragColor, 0.52, 0.52, 0.52, 1.0);
  var rightLowerArm = new Matrix4(rightUpperArmBase);
  rightLowerArm.translate(0, -0.25, 0);
  rightLowerArm.rotate(g_rightLowerArmAngle, 1, 0, 0);
  var rightLowerArmBase = new Matrix4(rightLowerArm);
  rightLowerArm.scale(0.18, 0.2, 0.18);
  drawCube(rightLowerArm);

  // --- RIGHT PAW ---
  gl.uniform4f(u_FragColor, 0.45, 0.45, 0.45, 1.0);
  var rightPaw = new Matrix4(rightLowerArmBase);
  rightPaw.translate(-0.02, -0.2, -0.02);
  rightPaw.scale(0.24, 0.07, 0.22);
  drawCube(rightPaw);

  // --- LEFT UPPER LEG ---
  gl.uniform4f(u_FragColor, 0.5, 0.5, 0.5, 1.0);
  var leftUpperLeg = new Matrix4();
  leftUpperLeg.translate(-0.32, -0.62, -0.18);
  leftUpperLeg.rotate(g_leftUpperLegAngle, 1, 0, 0);
  var leftUpperLegBase = new Matrix4(leftUpperLeg);
  leftUpperLeg.scale(0.26, 0.32, 0.26);
  drawCube(leftUpperLeg);

  // --- LEFT LOWER LEG ---
  gl.uniform4f(u_FragColor, 0.52, 0.52, 0.52, 1.0);
  var leftLowerLeg = new Matrix4(leftUpperLegBase);
  leftLowerLeg.translate(0, -0.32, 0);
  leftLowerLeg.rotate(g_leftLowerLegAngle, 1, 0, 0);
  var leftLowerLegBase = new Matrix4(leftLowerLeg);
  leftLowerLeg.scale(0.26, 0.24, 0.26);
  drawCube(leftLowerLeg);

  // --- LEFT FOOT ---
  gl.uniform4f(u_FragColor, 0.45, 0.45, 0.45, 1.0);
  var leftFoot = new Matrix4(leftLowerLegBase);
  leftFoot.translate(-0.03, -0.24, -0.13);
  leftFoot.scale(0.34, 0.09, 0.52);
  drawCube(leftFoot);

  // --- RIGHT UPPER LEG ---
  gl.uniform4f(u_FragColor, 0.5, 0.5, 0.5, 1.0);
  var rightUpperLeg = new Matrix4();
  rightUpperLeg.translate(0.06, -0.62, -0.18);
  rightUpperLeg.rotate(g_rightUpperLegAngle, 1, 0, 0);
  var rightUpperLegBase = new Matrix4(rightUpperLeg);
  rightUpperLeg.scale(0.26, 0.32, 0.26);
  drawCube(rightUpperLeg);

  // --- RIGHT LOWER LEG ---
  gl.uniform4f(u_FragColor, 0.52, 0.52, 0.52, 1.0);
  var rightLowerLeg = new Matrix4(rightUpperLegBase);
  rightLowerLeg.translate(0, -0.32, 0);
  rightLowerLeg.rotate(g_rightLowerLegAngle, 1, 0, 0);
  var rightLowerLegBase = new Matrix4(rightLowerLeg);
  rightLowerLeg.scale(0.26, 0.24, 0.26);
  drawCube(rightLowerLeg);

  // --- RIGHT FOOT ---
  gl.uniform4f(u_FragColor, 0.45, 0.45, 0.45, 1.0);
  var rightFoot = new Matrix4(rightLowerLegBase);
  rightFoot.translate(-0.03, -0.24, -0.13);
  rightFoot.scale(0.34, 0.09, 0.52);
  drawCube(rightFoot);
}

function drawTriangle3D(vertices) {
  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
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