// ============================================================
// TALL GRASS  — geometry baked into a static VBO at init time
// ============================================================

var g_grassVBO      = null;
var g_grassVertCount = 0;

function initGrass() {
  var rng = 42;
  function rand() { rng = (rng * 1664525 + 1013904223) & 0xffffffff; return (rng >>> 0) / 0xffffffff; }

  var h    = 1.5;
  var verts = [];

  for (var z = 2; z < 30; z++) {
    for (var x = 2; x < 30; x++) {
      if (g_map[z][x] === 0 && rand() < 0.18) {
        var ox = rand() * 0.7 - 0.35;
        var oz = rand() * 0.7 - 0.35;
        var cx = x + 0.5 + ox;
        var cz = z + 0.5 + oz;

        // 0° quad — along X axis, centered at (cx, 0, cz)
        verts.push(
          cx-0.5, 0, cz,  0, 0,  0, 1, 0,
          cx+0.5, 0, cz,  1, 0,  0, 1, 0,
          cx+0.5, h, cz,  1, 1,  0, 1, 0,
          cx-0.5, 0, cz,  0, 0,  0, 1, 0,
          cx+0.5, h, cz,  1, 1,  0, 1, 0,
          cx-0.5, h, cz,  0, 1,  0, 1, 0
        );

        // 90° quad — along Z axis (Y-rotated 90°)
        verts.push(
          cx, 0, cz+0.5,  0, 0,  0, 1, 0,
          cx, 0, cz-0.5,  1, 0,  0, 1, 0,
          cx, h, cz-0.5,  1, 1,  0, 1, 0,
          cx, 0, cz+0.5,  0, 0,  0, 1, 0,
          cx, h, cz-0.5,  1, 1,  0, 1, 0,
          cx, h, cz+0.5,  0, 1,  0, 1, 0
        );
      }
    }
  }

  g_grassVertCount = verts.length / 8;
  g_grassVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_grassVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
}

function drawGrass() {
  if (!g_grassVBO || g_grassVertCount === 0) return;

  gl.uniform1i(u_texColorWeight, 6);

  var identity = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identity.elements);

  const FSIZE = 4;
  gl.bindBuffer(gl.ARRAY_BUFFER, g_grassVBO);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 8 * FSIZE, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_UV,       2, gl.FLOAT, false, 8 * FSIZE, 3 * FSIZE);
  gl.enableVertexAttribArray(a_UV);
  gl.vertexAttribPointer(a_Normal,   3, gl.FLOAT, false, 8 * FSIZE, 5 * FSIZE);
  gl.enableVertexAttribArray(a_Normal);

  gl.drawArrays(gl.TRIANGLES, 0, g_grassVertCount);
}
