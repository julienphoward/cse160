// ============================================================
// SHEEP SYSTEM
// ============================================================

var g_sheep = [];
var g_gameWon = false;
var g_sheepTime = 0;

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
  for (var i = 0; i < 10; i++) {
    g_sheep.push({
      x: candidates[i].x + 0.5,
      z: candidates[i].z + 0.5,
      following: false,
      herded: false,
      prevPlayerX: 0,
      prevPlayerZ: 0,
      wanderAngle: Math.random() * Math.PI * 2,
      wanderTimer: Math.floor(Math.random() * 120) + 60,
      facingAngle: 0,
      isMoving: false,
    });
  }
}

function updateSheep() {
  if (g_gameWon) return;
  g_sheepTime += 0.1;
  var px = g_camera.eye.elements[0];
  var pz = g_camera.eye.elements[2];
  var herded = 0;

  for (var i = 0; i < g_sheep.length; i++) {
    var s = g_sheep[i];
    if (s.herded) { herded++; continue; }

  if (s.x >= PEN_X1+1 && s.x <= PEN_X2-1 && s.z >= PEN_Z1+1 && s.z <= PEN_Z2-1) {
      s.herded = true;
      s.following = false;
      s.isMoving = false;
      herded++;
      continue;
    }

    var dx = px - s.x;
    var dz = pz - s.z;

    if (s.following) {
      var tx = s.prevPlayerX - s.x;
      var tz = s.prevPlayerZ - s.z;
      var tlen = Math.sqrt(tx*tx + tz*tz);
      if (tlen > 0.1) {
        s.x += (tx/tlen) * 0.03;
        s.z += (tz/tlen) * 0.03;
        s.facingAngle = Math.atan2(tx, tz) * 180 / Math.PI;
        s.isMoving = true;
      }
    } else {
      s.wanderTimer--;
      s.isMoving = false;
      if (s.wanderTimer <= 0) {
        s.wanderAngle = Math.random() * Math.PI * 2;
        s.wanderTimer = Math.floor(Math.random() * 180) + 60;
      }
      var wx = Math.cos(s.wanderAngle) * 0.012;
      var wz = Math.sin(s.wanderAngle) * 0.012;
      var nx = s.x + wx, nz = s.z + wz;
      var mx = Math.floor(nx), mz = Math.floor(nz);
      if (mx >= 1 && mx < 31 && mz >= 1 && mz < 31 && g_map[mz][mx] === 0) {
        s.x = nx; s.z = nz;
        s.facingAngle = Math.atan2(wx, wz) * 180 / Math.PI;
        s.isMoving = true;
      } else {
        s.wanderAngle = Math.random() * Math.PI * 2;
        s.wanderTimer = 30;
        s.isMoving = false;
      }
    }
    s.prevPlayerX = px;
    s.prevPlayerZ = pz;
  }

  var el = document.getElementById('sheepCounter');
  if (el) el.textContent = herded + '/10';

  if (herded === 10) {
    g_gameWon = true;
    document.getElementById('winMessage').style.display = 'block';
    setTimeout(() => { document.getElementById('winMessage').style.display = 'none'; }, 30000);
  }
}

function drawSheep(s) {
  var x = s.x, z = s.z;
  var base = new Matrix4();
  base.setTranslate(x, 0, z);
  base.rotate(s.facingAngle || 0, 0, 1, 0);
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
    var legAngle = 0;
    if (s.isMoving) {
      legAngle = (i % 2 === 0) ? Math.sin(g_sheepTime * 1.5) * 20 : -Math.sin(g_sheepTime * 1.5) * 20;    }
    var leg = new Matrix4(base);
    leg.translate(legPositions[i][0], 0.3, legPositions[i][1]);
    leg.rotate(legAngle, 1, 0, 0);
    leg.translate(0, -0.3, 0);
    leg.scale(0.15, 0.3, 0.15);
    drawKoalaCube(leg);
  }
  
}

function trySelectSheep() {
  var px = g_camera.eye.elements[0];
  var pz = g_camera.eye.elements[2];
  var f = g_camera._forward();
  var fx = f[0], fz = f[2];
  var bestDist = 3.5, bestIdx = -1;
  for (var i = 0; i < g_sheep.length; i++) {
    var s = g_sheep[i];
    if (s.herded) continue;
    var dx = s.x - px, dz = s.z - pz;
    var dist = Math.sqrt(dx*dx + dz*dz);
    if (dist < bestDist) {
      var dot = (dx/dist)*fx + (dz/dist)*fz;
      if (dot > 0.3) { bestDist = dist; bestIdx = i; }
    }
  }
  if (bestIdx >= 0) {
    g_sheep[bestIdx].following = !g_sheep[bestIdx].following;
    if (g_sheep[bestIdx].following) {
      for (var i = 0; i < g_sheep.length; i++) {
        if (i !== bestIdx) g_sheep[i].following = false;
      }
    }
  }
}

function drawAllSheep() {
  for (var i = 0; i < g_sheep.length; i++) {
    drawSheep(g_sheep[i]);
  }
}