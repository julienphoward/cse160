// ============================================================
// PEN
// ============================================================

var PEN_X1 = 13, PEN_X2 = 17;
var PEN_Z1 = 5,  PEN_Z2 = 9;

function fenceCube(tx, ty, tz, sx, sy, sz) {
  var M = new Matrix4();
  M.setTranslate(tx, ty, tz);
  M.scale(sx, sy, sz);
  gl.uniform1i(u_texColorWeight, 3);
  gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);

  var ux = sx, uy = sy, uz = sz;
  var verts = new Float32Array([
    // Front (0,0,-1)
    0,0,0, 0,0,   0,0,-1,  1,0,0, ux,0,  0,0,-1,  1,1,0, ux,uy, 0,0,-1,
    0,0,0, 0,0,   0,0,-1,  1,1,0, ux,uy, 0,0,-1,  0,1,0, 0,uy,  0,0,-1,
    // Back (0,0,1)
    1,0,1, 0,0,   0,0,1,   0,0,1, ux,0,  0,0,1,   0,1,1, ux,uy, 0,0,1,
    1,0,1, 0,0,   0,0,1,   0,1,1, ux,uy, 0,0,1,   1,1,1, 0,uy,  0,0,1,
    // Top (0,1,0)
    0,1,0, 0,0,   0,1,0,   0,1,1, 0,uz,  0,1,0,   1,1,1, ux,uz, 0,1,0,
    0,1,0, 0,0,   0,1,0,   1,1,1, ux,uz, 0,1,0,   1,1,0, ux,0,  0,1,0,
    // Bottom (0,-1,0)
    0,0,1, 0,0,   0,-1,0,  0,0,0, 0,uz,  0,-1,0,  1,0,0, ux,uz, 0,-1,0,
    0,0,1, 0,0,   0,-1,0,  1,0,0, ux,uz, 0,-1,0,  1,0,1, ux,0,  0,-1,0,
    // Left (-1,0,0)
    0,0,1, 0,0,   -1,0,0,  0,0,0, uz,0,  -1,0,0,  0,1,0, uz,uy, -1,0,0,
    0,0,1, 0,0,   -1,0,0,  0,1,0, uz,uy, -1,0,0,  0,1,1, 0,uy,  -1,0,0,
    // Right (1,0,0)
    1,0,0, 0,0,   1,0,0,   1,0,1, uz,0,  1,0,0,   1,1,1, uz,uy, 1,0,0,
    1,0,0, 0,0,   1,0,0,   1,1,1, uz,uy, 1,0,0,   1,1,0, 0,uy,  1,0,0,
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

  // POSTS
  var postX = [13, 15, 17];
  for (var i = 0; i < postX.length; i++) {
    fenceCube(postX[i], 0, 5,   0.2, 1.0, 0.2); // front
    fenceCube(postX[i], 0, 8.8, 0.2, 1.0, 0.2); // back
  }
  fenceCube(13,  0, 7, 0.2, 1.0, 0.2); // left mid
  fenceCube(17,  0, 7, 0.2, 1.0, 0.2); // right mid

  // RAILS — front left half only (entrance gap on right)
  fenceCube(13.2, 0.6, 5.0, 1.8, 0.12, 0.12);
  fenceCube(13.2, 0.3, 5.0, 1.8, 0.12, 0.12);

  // RAILS — back (full)
  fenceCube(13.2, 0.6, 8.88, 3.8, 0.12, 0.12);
  fenceCube(13.2, 0.3, 8.88, 3.8, 0.12, 0.12);

  // RAILS — left side
  fenceCube(13.0, 0.6, 5.2, 0.12, 0.12, 3.6);
  fenceCube(13.0, 0.3, 5.2, 0.12, 0.12, 3.6);

  // RAILS — right side
  fenceCube(17, 0.6, 5.2, 0.12, 0.12, 3.6);
  fenceCube(17, 0.3, 5.2, 0.12, 0.12, 3.6);
}