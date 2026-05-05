// ============================================================
// SHEEP SYSTEM
// ============================================================

var g_sheep = [];
var g_gameWon = false;

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

  if (s.x >= PEN_X1+1 && s.x <= PEN_X2-1 && s.z >= PEN_Z1+1 && s.z <= PEN_Z2-1) {
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

function drawSheep(x, z, following, herded) {
  var base = new Matrix4();

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