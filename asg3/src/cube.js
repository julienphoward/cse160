class Cube {
  constructor() {
    this.type = 'cube';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.textureNum = -1; // -1 = use solid color
  }

  render() {
    // Set model matrix
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // Set texture/color mode
    gl.uniform1i(u_texColorWeight, this.textureNum);
    if (this.textureNum < 0) {
      gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    }

    // All 6 faces, each as 2 triangles, with UV coords
    // Format per vertex: [x,y,z, u,v]
    let verts = new Float32Array([
      // Front (z=0)
      0,0,0, 0,0,  1,0,0, 1,0,  1,1,0, 1,1,
      0,0,0, 0,0,  1,1,0, 1,1,  0,1,0, 0,1,
      // Back (z=1)
      1,0,1, 0,0,  0,0,1, 1,0,  0,1,1, 1,1,
      1,0,1, 0,0,  0,1,1, 1,1,  1,1,1, 0,1,
      // Top (y=1)
      0,1,0, 0,0,  0,1,1, 0,1,  1,1,1, 1,1,
      0,1,0, 0,0,  1,1,1, 1,1,  1,1,0, 1,0,
      // Bottom (y=0)
      0,0,1, 0,0,  0,0,0, 0,1,  1,0,0, 1,1,
      0,0,1, 0,0,  1,0,0, 1,1,  1,0,1, 1,0,
      // Left (x=0)
      0,0,1, 0,0,  0,0,0, 1,0,  0,1,0, 1,1,
      0,0,1, 0,0,  0,1,0, 1,1,  0,1,1, 0,1,
      // Right (x=1)
      1,0,0, 0,0,  1,0,1, 1,0,  1,1,1, 1,1,
      1,0,0, 0,0,  1,1,1, 1,1,  1,1,0, 0,1,
    ]);

    const FSIZE = verts.BYTES_PER_ELEMENT;
    const stride = 5 * FSIZE;

    gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, stride, 3 * FSIZE);
    gl.enableVertexAttribArray(a_UV);

    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }
}
