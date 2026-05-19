// ============================================================
// OBJ LOADER
// ============================================================

var g_dragon = null;

function loadOBJ(url, onReady) {
  fetch(url)
    .then(r => r.text())
    .then(text => {
      var model = new OBJModel();
      model.setData(parseOBJ(text));
      onReady(model);
    })
    .catch(err => console.error('OBJ load failed:', url, err));
}

function parseOBJ(text) {
  var lines     = text.split('\n');
  var positions = [];   // flat: x,y,z,...
  var normals   = [];   // flat: nx,ny,nz,...
  var out       = [];   // interleaved: x,y,z, 0,0, nx,ny,nz per vertex

  for (var i = 0; i < lines.length; i++) {
    var parts = lines[i].trim().split(/\s+/);
    var tag   = parts[0];

    if (tag === 'v') {
      positions.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
    } else if (tag === 'vn') {
      normals.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
    } else if (tag === 'f') {
      // fan-triangulate: handles triangles and quads
      var n = parts.length - 1;
      for (var j = 1; j < n - 1; j++) {
        pushFaceVert(out, positions, normals, parts[1]);
        pushFaceVert(out, positions, normals, parts[j + 1]);
        pushFaceVert(out, positions, normals, parts[j + 2]);
      }
    }
  }
  return new Float32Array(out);
}

// token formats: "v", "v/vt", "v//vn", "v/vt/vn"
function pushFaceVert(out, positions, normals, token) {
  var tok = token.split('/');
  var vi  = (parseInt(tok[0]) - 1) * 3;
  var ni  = tok[2] ? (parseInt(tok[2]) - 1) * 3 : -1;

  out.push(
    positions[vi],     positions[vi + 1], positions[vi + 2],
    0, 0,              // no UVs in this file
    ni >= 0 ? normals[ni]     : 0,
    ni >= 0 ? normals[ni + 1] : 0,
    ni >= 0 ? normals[ni + 2] : 1
  );
}

// ============================================================
// OBJModel — uploads once to a dedicated VBO, renders fast
// ============================================================
class OBJModel {
  constructor() {
    this.matrix    = new Matrix4();
    this.color     = [0.65, 0.50, 0.30, 1.0];
    this.buffer    = null;
    this.vertCount = 0;
  }

  setData(float32array) {
    this.vertCount = float32array.length / 8;
    this.buffer    = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, float32array, gl.STATIC_DRAW);
  }

  render() {
    if (!this.buffer) return;
    gl.uniform1i(u_texColorWeight, -1);
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    const FSIZE = 4;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 8 * FSIZE, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.vertexAttribPointer(a_UV,       2, gl.FLOAT, false, 8 * FSIZE, 3 * FSIZE);
    gl.enableVertexAttribArray(a_UV);
    gl.vertexAttribPointer(a_Normal,   3, gl.FLOAT, false, 8 * FSIZE, 5 * FSIZE);
    gl.enableVertexAttribArray(a_Normal);

    gl.drawArrays(gl.TRIANGLES, 0, this.vertCount);
  }
}
