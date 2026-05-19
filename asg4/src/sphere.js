// Shared static VBO — built once, reused by every Sphere instance
var _sphereVBO   = null;
var _sphereCount = 0;

function _initSphereVBO() {
  const LAT = 24, LON = 24;
  var verts = [];

  for (var lat = 0; lat < LAT; lat++) {
    var phi1 = (lat     / LAT) * Math.PI;
    var phi2 = ((lat+1) / LAT) * Math.PI;

    for (var lon = 0; lon < LON; lon++) {
      var th1 = (lon     / LON) * 2 * Math.PI;
      var th2 = ((lon+1) / LON) * 2 * Math.PI;

      var pts = [
        [Math.sin(phi1)*Math.cos(th1), Math.cos(phi1), Math.sin(phi1)*Math.sin(th1)],
        [Math.sin(phi2)*Math.cos(th1), Math.cos(phi2), Math.sin(phi2)*Math.sin(th1)],
        [Math.sin(phi1)*Math.cos(th2), Math.cos(phi1), Math.sin(phi1)*Math.sin(th2)],
        [Math.sin(phi2)*Math.cos(th2), Math.cos(phi2), Math.sin(phi2)*Math.sin(th2)],
      ];
      var uvs = [
        [th1/(2*Math.PI), 1-phi1/Math.PI],
        [th1/(2*Math.PI), 1-phi2/Math.PI],
        [th2/(2*Math.PI), 1-phi1/Math.PI],
        [th2/(2*Math.PI), 1-phi2/Math.PI],
      ];

      function push(i) {
        verts.push(pts[i][0], pts[i][1], pts[i][2],
                   uvs[i][0], uvs[i][1],
                   pts[i][0], pts[i][1], pts[i][2]);
      }
      push(0); push(1); push(3);
      push(0); push(3); push(2);
    }
  }

  _sphereCount = verts.length / 8;
  _sphereVBO   = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, _sphereVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
}

class Sphere {
  constructor() {
    this.color      = [1.0, 1.0, 1.0, 1.0];
    this.matrix     = new Matrix4();
    this.textureNum = -1;
  }

  render() {
    if (!_sphereVBO) _initSphereVBO();

    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    gl.uniform1i(u_texColorWeight, this.textureNum);
    if (this.textureNum < 0) {
      gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    }

    const FSIZE = 4;
    gl.bindBuffer(gl.ARRAY_BUFFER, _sphereVBO);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 8 * FSIZE, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.vertexAttribPointer(a_UV,       2, gl.FLOAT, false, 8 * FSIZE, 3 * FSIZE);
    gl.enableVertexAttribArray(a_UV);
    gl.vertexAttribPointer(a_Normal,   3, gl.FLOAT, false, 8 * FSIZE, 5 * FSIZE);
    gl.enableVertexAttribArray(a_Normal);

    gl.drawArrays(gl.TRIANGLES, 0, _sphereCount);
  }
}
