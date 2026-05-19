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
    // Front (0,0,-1)
    0,0,0, 0,0, 0,0,-1,  1,0,0, 1,0, 0,0,-1,  1,1,0, 1,1, 0,0,-1,
    0,0,0, 0,0, 0,0,-1,  1,1,0, 1,1, 0,0,-1,  0,1,0, 0,1, 0,0,-1,
    // Back (0,0,1)
    1,0,1, 0,0, 0,0,1,   0,0,1, 1,0, 0,0,1,   0,1,1, 1,1, 0,0,1,
    1,0,1, 0,0, 0,0,1,   0,1,1, 1,1, 0,0,1,   1,1,1, 0,1, 0,0,1,
    // Top (0,1,0)
    0,1,0, 0,0, 0,1,0,   0,1,1, 0,1, 0,1,0,   1,1,1, 1,1, 0,1,0,
    0,1,0, 0,0, 0,1,0,   1,1,1, 1,1, 0,1,0,   1,1,0, 1,0, 0,1,0,
    // Bottom (0,-1,0)
    0,0,1, 0,0, 0,-1,0,  0,0,0, 0,1, 0,-1,0,  1,0,0, 1,1, 0,-1,0,
    0,0,1, 0,0, 0,-1,0,  1,0,0, 1,1, 0,-1,0,  1,0,1, 1,0, 0,-1,0,
    // Left (-1,0,0)
    0,0,1, 0,0, -1,0,0,  0,0,0, 1,0, -1,0,0,  0,1,0, 1,1, -1,0,0,
    0,0,1, 0,0, -1,0,0,  0,1,0, 1,1, -1,0,0,  0,1,1, 0,1, -1,0,0,
    // Right (1,0,0)
    1,0,0, 0,0, 1,0,0,   1,0,1, 1,0, 1,0,0,   1,1,1, 1,1, 1,0,0,
    1,0,0, 0,0, 1,0,0,   1,1,1, 1,1, 1,0,0,   1,1,0, 0,1, 1,0,0,
  ]);
  const FSIZE = verts.BYTES_PER_ELEMENT;
  gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 8*FSIZE, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 8*FSIZE, 3*FSIZE);
  gl.enableVertexAttribArray(a_UV);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 8*FSIZE, 5*FSIZE);
  gl.enableVertexAttribArray(a_Normal);
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
    // outward radial normals for the side faces
    var nx1 = Math.cos(a1), ny1 = Math.sin(a1);
    var nx2 = Math.cos(a2), ny2 = Math.sin(a2);
    // cap z=0, normal (0,0,-1)
    verts.push(0.5,0.5,0, 0.5,0.5, 0,0,-1,  x1,y1,0, 0,0, 0,0,-1,  x2,y2,0, 1,0, 0,0,-1);
    // cap z=1, normal (0,0,1)
    verts.push(0.5,0.5,1, 0.5,0.5, 0,0,1,   x2,y2,1, 0,0, 0,0,1,   x1,y1,1, 1,0, 0,0,1);
    // side triangle 1
    verts.push(x1,y1,0, 0,0, nx1,ny1,0,  x1,y1,1, 1,0, nx1,ny1,0,  x2,y2,1, 1,1, nx2,ny2,0);
    // side triangle 2
    verts.push(x1,y1,0, 0,0, nx1,ny1,0,  x2,y2,1, 1,0, nx2,ny2,0,  x2,y2,0, 1,1, nx2,ny2,0);
  }
  var arr = new Float32Array(verts);
  const FSIZE = arr.BYTES_PER_ELEMENT;
  gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, arr, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 8*FSIZE, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 8*FSIZE, 3*FSIZE);
  gl.enableVertexAttribArray(a_UV);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 8*FSIZE, 5*FSIZE);
  gl.enableVertexAttribArray(a_Normal);
  gl.drawArrays(gl.TRIANGLES, 0, sides * 4 * 3);
}

function drawKoala() {
  g_koalaTime = performance.now() / 1000.0;
  var base = new Matrix4();
  base.setTranslate(g_koalaX, 1.02, g_koalaZ);
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

  var t = g_koalaTime * 3;

  // FRONT LEFT LEG  (hip +, knee -, paw +)
  setColor(0.5, 0.5, 0.5);
  var flHip = new Matrix4(base);
  flHip.translate(-0.52, 0.25, 0.45);
  flHip.rotate(25 * Math.sin(t), 1, 0, 0);
  var flHipSave = new Matrix4(flHip);
  flHip.translate(0, -0.55, 0);
  flHip.scale(0.28, 0.55, 0.28);
  drawKoalaCube(flHip);

  setColor(0.48, 0.48, 0.48);
  var flKnee = new Matrix4(flHipSave);
  flKnee.translate(0, -0.55, 0);
  flKnee.rotate(-20 * Math.min(0, Math.sin(t)), 1, 0, 0);
  var flKneeSave = new Matrix4(flKnee);
  flKnee.translate(0, -0.40, 0);
  flKnee.scale(0.28, 0.40, 0.28);
  drawKoalaCube(flKnee);

  setColor(0.3, 0.3, 0.3);
  var flAnkle = new Matrix4(flKneeSave);
  flAnkle.translate(-0.03, -0.40, -0.03);
  flAnkle.rotate(8 * Math.sin(t), 1, 0, 0);
  flAnkle.translate(0, -0.20, 0);
  flAnkle.scale(0.34, 0.15, 0.34);
  drawKoalaCube(flAnkle);

  // FRONT RIGHT LEG  (hip -, knee +, paw -)
  setColor(0.5, 0.5, 0.5);
  var frHip = new Matrix4(base);
  frHip.translate(0.3, 0.25, 0.45);
  frHip.rotate(-25 * Math.sin(t), 1, 0, 0);
  var frHipSave = new Matrix4(frHip);
  frHip.translate(0, -0.55, 0);
  frHip.scale(0.28, 0.55, 0.28);
  drawKoalaCube(frHip);

  setColor(0.48, 0.48, 0.48);
  var frKnee = new Matrix4(frHipSave);
  frKnee.translate(0, -0.55, 0);
  frKnee.rotate(20 * Math.max(0, Math.sin(t)), 1, 0, 0);
  var frKneeSave = new Matrix4(frKnee);
  frKnee.translate(0, -0.40, 0);
  frKnee.scale(0.28, 0.40, 0.28);
  drawKoalaCube(frKnee);

  setColor(0.3, 0.3, 0.3);
  var frAnkle = new Matrix4(frKneeSave);
  frAnkle.translate(-0.03, -0.40, -0.03);
  frAnkle.rotate(-8 * Math.sin(t), 1, 0, 0);
  frAnkle.translate(0, -0.20, 0);
  frAnkle.scale(0.34, 0.15, 0.34);
  drawKoalaCube(frAnkle);

  // BACK LEFT LEG  (hip -, knee +, paw -) — diagonal pair with front right
  setColor(0.5, 0.5, 0.5);
  var blHip = new Matrix4(base);
  blHip.translate(-0.52, 0.25, -0.55);
  blHip.rotate(-25 * Math.sin(t), 1, 0, 0);
  var blHipSave = new Matrix4(blHip);
  blHip.translate(0, -0.55, 0);
  blHip.scale(0.28, 0.55, 0.28);
  drawKoalaCube(blHip);

  setColor(0.48, 0.48, 0.48);
  var blKnee = new Matrix4(blHipSave);
  blKnee.translate(0, -0.55, 0);
  blKnee.rotate(20 * Math.max(0, Math.sin(t)), 1, 0, 0);
  var blKneeSave = new Matrix4(blKnee);
  blKnee.translate(0, -0.40, 0);
  blKnee.scale(0.28, 0.40, 0.28);
  drawKoalaCube(blKnee);

  setColor(0.3, 0.3, 0.3);
  var blAnkle = new Matrix4(blKneeSave);
  blAnkle.translate(-0.03, -0.40, -0.03);
  blAnkle.rotate(-8 * Math.sin(t), 1, 0, 0);
  blAnkle.translate(0, -0.20, 0);
  blAnkle.scale(0.34, 0.15, 0.34);
  drawKoalaCube(blAnkle);

  // BACK RIGHT LEG  (hip +, knee -, paw +) — diagonal pair with front left
  setColor(0.5, 0.5, 0.5);
  var brHip = new Matrix4(base);
  brHip.translate(0.3, 0.25, -0.55);
  brHip.rotate(25 * Math.sin(t), 1, 0, 0);
  var brHipSave = new Matrix4(brHip);
  brHip.translate(0, -0.55, 0);
  brHip.scale(0.28, 0.55, 0.28);
  drawKoalaCube(brHip);

  setColor(0.48, 0.48, 0.48);
  var brKnee = new Matrix4(brHipSave);
  brKnee.translate(0, -0.55, 0);
  brKnee.rotate(-20 * Math.min(0, Math.sin(t)), 1, 0, 0);
  var brKneeSave = new Matrix4(brKnee);
  brKnee.translate(0, -0.40, 0);
  brKnee.scale(0.28, 0.40, 0.28);
  drawKoalaCube(brKnee);

  setColor(0.3, 0.3, 0.3);
  var brAnkle = new Matrix4(brKneeSave);
  brAnkle.translate(-0.03, -0.40, -0.03);
  brAnkle.rotate(8 * Math.sin(t), 1, 0, 0);
  brAnkle.translate(0, -0.20, 0);
  brAnkle.scale(0.34, 0.15, 0.34);
  drawKoalaCube(brAnkle);

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