// ============================================================
// KOALA
// ============================================================

var g_koalaTime = 0;
var g_koalaX = 15.2;
var g_koalaZ = 11.0;
var g_koalaFacing = 0;
var g_koalaWanderAngle = 0;
var g_koalaWanderTimer = 120;

function setColor(r, g_, b) {
  gl.uniform4f(u_FragColor, r, g_, b, 1.0);
}

function drawKoalaCube(M) {
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
    verts.push(0.5,0.5,0, 0,0, x1,y1,0, 1,0, x2,y2,0, 1,1);
    verts.push(0.5,0.5,1, 0,0, x2,y2,1, 1,0, x1,y1,1, 1,1);
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
  g_koalaTime = performance.now() / 1000.0;
  var base = new Matrix4();
  base.setTranslate(g_koalaX, 1, g_koalaZ);
  base.rotate(g_koalaFacing, 0, 1, 0);
  base.scale(1, 1, 1);

  setColor(0.47, 0.47, 0.47);
  var body = new Matrix4(base);
  body.translate(-0.35, -0.25, -0.7);
  body.scale(0.7, 0.5, 1.4);
  drawKoalaCube(body);

  setColor(0.55, 0.55, 0.55);
  var head = new Matrix4(base);
  head.translate(-0.32, 0.0, 0.4);
  head.scale(0.64, 0.62, 0.58);
  drawKoalaCube(head);

  setColor(0.12, 0.08, 0.06);
  var nose = new Matrix4(base);
  nose.translate(-0.17, 0.1, 0.95);
  nose.scale(0.34, 0.22, 0.07);
  drawKoalaCube(nose);

  setColor(0.08, 0.08, 0.08);
  var leftEye = new Matrix4(base);
  leftEye.translate(-0.28, 0.28, 0.96);
  leftEye.scale(0.08, 0.08, 0.04);
  drawKoalaCube(leftEye);

  setColor(0.08, 0.08, 0.08);
  var rightEye = new Matrix4(base);
  rightEye.translate(0.2, 0.28, 0.96);
  rightEye.scale(0.08, 0.08, 0.04);
  drawKoalaCube(rightEye);

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

  setColor(0.5, 0.5, 0.5);
  var tail = new Matrix4(base);
  tail.translate(-0.05, 0.18, -0.72);
  tail.scale(0.18, 0.14, 0.1);
  drawKoalaCube(tail);

  // FRONT LEFT LEG
  setColor(0.5, 0.5, 0.5);
  var flUpper = new Matrix4(base);
  flUpper.translate(-0.52, -0.25, 0.45);
  flUpper.rotate(25 * Math.sin(g_koalaTime * 3), 1, 0, 0);  // ADD
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

  // FRONT RIGHT LEG
  setColor(0.5, 0.5, 0.5);
  var frUpper = new Matrix4(base);
  frUpper.translate(0.3, -0.25, 0.45);
  frUpper.rotate(-25 * Math.sin(g_koalaTime * 3), 1, 0, 0);  // ADD 
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

  // BACK LEFT LEG
  setColor(0.5, 0.5, 0.5);
  var blUpper = new Matrix4(base);
  blUpper.translate(-0.52, -0.25, -0.55);
  blUpper.rotate(-25 * Math.sin(g_koalaTime * 3), 1, 0, 0);
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

  // BACK RIGHT LEG
  setColor(0.5, 0.5, 0.5);
  var brUpper = new Matrix4(base);
  brUpper.translate(0.3, -0.25, -0.55);
  brUpper.rotate(25 * Math.sin(g_koalaTime * 3), 1, 0, 0);  // ADD
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

function updateKoala(delta) {
  g_koalaWanderTimer--;
  if (g_koalaWanderTimer <= 0) {
    g_koalaWanderAngle = Math.random() * Math.PI * 2;
    g_koalaWanderTimer = Math.floor(Math.random() * 200) + 80;
  }
  var wx = Math.cos(g_koalaWanderAngle) * 0.008 * delta * 60;
  var wz = Math.sin(g_koalaWanderAngle) * 0.008 * delta * 60;
  var nx = g_koalaX + wx;
  var nz = g_koalaZ + wz;
  var mx = Math.floor(nx), mz = Math.floor(nz);
  if (mx >= 1 && mx < 31 && mz >= 1 && mz < 31 && g_map[mz][mx] === 0) {
    g_koalaX = nx; g_koalaZ = nz;
    g_koalaFacing = Math.atan2(wx, wz) * 180 / Math.PI;
  } else {
    g_koalaWanderAngle = Math.random() * Math.PI * 2;
    g_koalaWanderTimer = 30;
  }
}