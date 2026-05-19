// ============================================================
// TREES
// ============================================================
var g_treePositions = [
  [2,  2],  [2,  18], [2,  28],
  [28, 2],  [28, 18], [28, 28],
  [10, 25], [20, 25], [7,  15],
];

function drawTexCube(M, texNum) {
  gl.uniform1i(u_texColorWeight, texNum);
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

function drawTree(wx, wz) {
  // Trunk — 4 units tall
  for (var y = 0; y < 4; y++) {
    var trunk = new Matrix4();
    trunk.setTranslate(wx, y, wz);
    drawTexCube(trunk, 4);
  }

  // Leaf layout mimicking Minecraft oak tree
  // Layer at y=4 — wide cross shape (5x5 with corners cut)
  var layer4 = [
    [-1,0],[ 0,0],[ 1,0],[ 2,0],
    [-1,1],[ 0,1],[ 1,1],[ 2,1],
    [-1,2],[ 0,2],[ 1,2],[ 2,2],
    [-1,-1],[ 0,-1],[ 1,-1],[ 2,-1],
    [-2,0],[ 3,0],[-2,1],[ 3,1],[-2,2],[ 3,2],
  ];
  // Layer at y=5 — same
  var layer5 = layer4;
  // Layer at y=6 — smaller cross
  var layer6 = [
    [ 0,0],[ 1,0],
    [ 0,1],[ 1,1],
    [-1,0],[ 2,0],[-1,1],[ 2,1],
    [ 0,-1],[ 1,-1],[ 0,2],[ 1,2],
  ];
  // Layer at y=7 — tiny top
  var layer7 = [
    [ 0,0],[ 1,0],[ 0,1],[ 1,1],
  ];

  var layers = [
    { y: 4, offsets: layer4 },
    { y: 5, offsets: layer5 },
    { y: 6, offsets: layer6 },
    { y: 7, offsets: layer7 },
  ];

  for (var l = 0; l < layers.length; l++) {
    var ly = layers[l].y;
    var offsets = layers[l].offsets;
    for (var i = 0; i < offsets.length; i++) {
      var leaf = new Matrix4();
      leaf.setTranslate(wx + offsets[i][0], ly, wz + offsets[i][1]);
      drawTexCube(leaf, 5);
    }
  }
}

// Tree positions — place them around the world
function drawAllTrees() {
  drawTree(2,  2);
  drawTree(2,  18);
  drawTree(2,  28);
  drawTree(28, 2);
  drawTree(28, 18);
  drawTree(28, 28);
  drawTree(20, 25);
  drawTree(7,  15);
}