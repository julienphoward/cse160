// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform float u_Size;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = u_Size;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +  // uniform変数
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

class Point {
  constructor(x, y, color, size) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
  }

  render() {
    gl.vertexAttrib3f(a_Position, this.x, this.y, 0.0);
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniform1f(u_Size, this.size);
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}

class Triangle {
  constructor(x, y, color, size) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
  }
  render() {
    var d = this.size / 200;
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    drawTriangle([
      this.x, this.y + d,
      this.x - d, this.y - d,
      this.x + d, this.y - d
    ]);
  }
}

class Circle {
  constructor(x, y, color, size, segments) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.segments = segments;
  }
  render() {
    var d = this.size / 200;
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    var angleStep = (2 * Math.PI) / this.segments;
    for (var i = 0; i < this.segments; i++) {
      var angle1 = i * angleStep;
      var angle2 = (i + 1) * angleStep;
      drawTriangle([
        this.x, this.y,
        this.x + d * Math.cos(angle1), this.y + d * Math.sin(angle1),
        this.x + d * Math.cos(angle2), this.y + d * Math.sin(angle2)
      ]);
    }
  }
}

var canvas;
var gl;
var a_Position;
var u_FragColor;
var g_selectedColor = [1.0, 1.0, 1.0, 1.0];
var u_Size;
var g_selectedSize = 10.0;
var g_shapesList = [];
var g_selectedType = 'point';
var g_selectedSegments = 10;

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  canvas.onmousedown = function(ev) { click(ev); };
  canvas.onmousemove = function(ev) { if (ev.buttons == 1) click(ev); };
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  document.getElementById('redSlider').addEventListener('input', function() {
    g_selectedColor[0] = this.value / 255;
  });
  document.getElementById('greenSlider').addEventListener('input', function() {
    g_selectedColor[1] = this.value / 255;
  });
  document.getElementById('blueSlider').addEventListener('input', function() {
    g_selectedColor[2] = this.value / 255;
  });
  document.getElementById('sizeSlider').addEventListener('input', function() {
  g_selectedSize = this.value;
  });
  document.getElementById('clearButton').addEventListener('click', function() {
    g_shapesList = [];
    renderAllShapes();
  });
  document.getElementById('pointBtn').addEventListener('click', function() {
    g_selectedType = 'point';
  });
  document.getElementById('triangleBtn').addEventListener('click', function() {
    g_selectedType = 'triangle';
  });
  document.getElementById('circleBtn').addEventListener('click', function() {
  g_selectedType = 'circle';
  });
  document.getElementById('segmentSlider').addEventListener('input', function() {
    g_selectedSegments = this.value;
  });
  document.getElementById('drawPictureBtn').addEventListener('click', function() {
    drawPicture();
  });
  document.getElementById('opacitySlider').addEventListener('input', function() {
    g_selectedColor[3] = this.value / 100;
  });
  g_selectedColor[0] = document.getElementById('redSlider').value / 255;
  g_selectedColor[1] = document.getElementById('greenSlider').value / 255;
  g_selectedColor[2] = document.getElementById('blueSlider').value / 255;
  g_selectedColor[3] = document.getElementById('opacitySlider').value / 100;
  g_selectedSize = document.getElementById('sizeSlider').value;
  g_selectedSegments = document.getElementById('segmentSlider').value;
  }

function click(ev) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();
  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  var shape;
  if (g_selectedType == 'point') {
    shape = new Point(x, y, g_selectedColor.slice(), g_selectedSize);
  } else if (g_selectedType == 'triangle') {
    shape = new Triangle(x, y, g_selectedColor.slice(), g_selectedSize);
  } else if (g_selectedType == 'circle') {
    shape = new Circle(x, y, g_selectedColor.slice(), g_selectedSize, g_selectedSegments);
  }
  g_shapesList.push(shape);
  renderAllShapes();
}

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  for (var i = 0; i < g_shapesList.length; i++) {
    g_shapesList[i].render();
  }
}

function drawTriangle(vertices) {
  var n = 3;
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, n);
  gl.disableVertexAttribArray(a_Position);
}

function drawPicture() {
  // J canopy (draw first so stem appears on top)
  gl.uniform4f(u_FragColor, 0.43, 0.75, 0.40, 1.0);
  drawTriangle([-0.9, -0.2, -0.45, 0.35, 0, -0.2]);

  // J stem alternating browns
  const jTriangles = [
    [-0.3,0,-0.3,-0.1,-0.4,-0.1],[-0.4,0,-0.4,-0.1,-0.3,0],
    [-0.4,0,-0.4,-0.1,-0.5,-0.1],[-0.5,0,-0.4,0,-0.5,-0.1],
    [-0.5,0,-0.5,-0.1,-0.6,-0.1],[-0.6,0,-0.5,0,-0.6,-0.1],
    [-0.4,-0.1,-0.4,-0.2,-0.5,-0.2],[-0.5,-0.1,-0.5,-0.2,-0.4,-0.1],
    [-0.4,-0.2,-0.4,-0.3,-0.5,-0.3],[-0.5,-0.2,-0.4,-0.2,-0.5,-0.3],
    [-0.4,-0.3,-0.4,-0.4,-0.5,-0.4],[-0.5,-0.3,-0.4,-0.3,-0.5,-0.4],
    [-0.4,-0.4,-0.4,-0.5,-0.5,-0.5],[-0.5,-0.4,-0.4,-0.4,-0.5,-0.5],
    [-0.4,-0.5,-0.4,-0.6,-0.5,-0.6],[-0.5,-0.5,-0.4,-0.5,-0.5,-0.6],
    [-0.4,-0.6,-0.4,-0.7,-0.5,-0.7],[-0.5,-0.6,-0.4,-0.6,-0.5,-0.7],
    [-0.6,-0.7,-0.5,-0.6,-0.5,-0.7],[-0.6,-0.6,-0.6,-0.7,-0.5,-0.6],
    [-0.7,-0.6,-0.6,-0.7,-0.6,-0.6],[-0.7,-0.5,-0.7,-0.6,-0.6,-0.6],
    [-0.6,-0.1,-0.7,-0.1,-0.6,0],[-0.3,-0.1,-0.2,-0.1,-0.3,0]
  ];
  jTriangles.forEach((t, i) => {
    if (i % 2 === 0) gl.uniform4f(u_FragColor, 0.55, 0.27, 0.07, 1.0);
    else gl.uniform4f(u_FragColor, 0.36, 0.18, 0.05, 1.0);
    drawTriangle(t);
  });

  // H roof - brown
  gl.uniform4f(u_FragColor, 0.45, 0.25, 0.08, 1.0);
  drawTriangle([0, 0, 0.4, 0.4, 0.8, 0]);

  // H left column - alternating brick
  gl.uniform4f(u_FragColor, 0.72, 0.25, 0.05, 1.0);
  drawTriangle([0.1, 0, 0.1, -0.1, 0.2, 0]);
  gl.uniform4f(u_FragColor, 0.55, 0.18, 0.04, 1.0);
  drawTriangle([0.2, 0, 0.2, -0.1, 0.1, -0.1]);
  gl.uniform4f(u_FragColor, 0.72, 0.25, 0.05, 1.0);
  drawTriangle([0.2, -0.1, 0.2, -0.2, 0.1, -0.2]);
  gl.uniform4f(u_FragColor, 0.55, 0.18, 0.04, 1.0);
  drawTriangle([0.1, -0.1, 0.2, -0.1, 0.1, -0.2]);
  gl.uniform4f(u_FragColor, 0.72, 0.25, 0.05, 1.0);
  drawTriangle([0.2, -0.2, 0.2, -0.3, 0.1, -0.3]);
  gl.uniform4f(u_FragColor, 0.55, 0.18, 0.04, 1.0);
  drawTriangle([0.1, -0.2, 0.2, -0.2, 0.1, -0.3]);
  gl.uniform4f(u_FragColor, 0.72, 0.25, 0.05, 1.0);
  drawTriangle([0.2, -0.3, 0.2, -0.4, 0.1, -0.4]);
  gl.uniform4f(u_FragColor, 0.55, 0.18, 0.04, 1.0);
  drawTriangle([0.1, -0.3, 0.2, -0.3, 0.1, -0.4]);
  gl.uniform4f(u_FragColor, 0.72, 0.25, 0.05, 1.0);
  drawTriangle([0.2, -0.4, 0.2, -0.5, 0.1, -0.5]);
  gl.uniform4f(u_FragColor, 0.55, 0.18, 0.04, 1.0);
  drawTriangle([0.1, -0.4, 0.2, -0.4, 0.1, -0.5]);
  gl.uniform4f(u_FragColor, 0.72, 0.25, 0.05, 1.0);
  drawTriangle([0.2, -0.5, 0.2, -0.6, 0.1, -0.6]);
  gl.uniform4f(u_FragColor, 0.55, 0.18, 0.04, 1.0);
  drawTriangle([0.1, -0.5, 0.2, -0.5, 0.1, -0.6]);
  gl.uniform4f(u_FragColor, 0.72, 0.25, 0.05, 1.0);
  drawTriangle([0.2, -0.6, 0.2, -0.7, 0.1, -0.7]);
  gl.uniform4f(u_FragColor, 0.55, 0.18, 0.04, 1.0);
  drawTriangle([0.1, -0.6, 0.2, -0.6, 0.1, -0.7]);

  // window - light grey (two large middle upper triangles)
  gl.uniform4f(u_FragColor, 0.82, 0.82, 0.82, 0.35);
  drawTriangle([0.2, -0.3, 0.6, 0, 0.2, 0]);
  drawTriangle([0.2, -0.3, 0.6, -0.3, 0.6, 0]);

  // crossbar - alternating brick
  gl.uniform4f(u_FragColor, 0.72, 0.25, 0.05, 1.0);
  drawTriangle([0.3, -0.3, 0.3, -0.4, 0.2, -0.4]);
  gl.uniform4f(u_FragColor, 0.55, 0.18, 0.04, 1.0);
  drawTriangle([0.2, -0.3, 0.3, -0.3, 0.2, -0.4]);
  gl.uniform4f(u_FragColor, 0.72, 0.25, 0.05, 1.0);
  drawTriangle([0.4, -0.3, 0.4, -0.4, 0.3, -0.4]);
  gl.uniform4f(u_FragColor, 0.55, 0.18, 0.04, 1.0);
  drawTriangle([0.3, -0.3, 0.4, -0.3, 0.3, -0.4]);
  gl.uniform4f(u_FragColor, 0.72, 0.25, 0.05, 1.0);
  drawTriangle([0.5, -0.3, 0.5, -0.4, 0.4, -0.4]);
  gl.uniform4f(u_FragColor, 0.55, 0.18, 0.04, 1.0);
  drawTriangle([0.4, -0.3, 0.5, -0.3, 0.4, -0.4]);
  gl.uniform4f(u_FragColor, 0.72, 0.25, 0.05, 1.0);
  drawTriangle([0.6, -0.3, 0.6, -0.4, 0.5, -0.4]);
  gl.uniform4f(u_FragColor, 0.55, 0.18, 0.04, 1.0);
  drawTriangle([0.5, -0.3, 0.6, -0.3, 0.5, -0.4]);

  // H right column - alternating brick
  gl.uniform4f(u_FragColor, 0.72, 0.25, 0.05, 1.0);
  drawTriangle([0.7, 0, 0.7, -0.1, 0.6, -0.1]);
  gl.uniform4f(u_FragColor, 0.55, 0.18, 0.04, 1.0);
  drawTriangle([0.7, 0, 0.6, 0, 0.6, -0.1]);
  gl.uniform4f(u_FragColor, 0.72, 0.25, 0.05, 1.0);
  drawTriangle([0.7, -0.1, 0.7, -0.2, 0.6, -0.2]);
  gl.uniform4f(u_FragColor, 0.55, 0.18, 0.04, 1.0);
  drawTriangle([0.7, -0.1, 0.6, -0.1, 0.6, -0.2]);
  gl.uniform4f(u_FragColor, 0.72, 0.25, 0.05, 1.0);
  drawTriangle([0.7, -0.2, 0.7, -0.3, 0.6, -0.3]);
  gl.uniform4f(u_FragColor, 0.55, 0.18, 0.04, 1.0);
  drawTriangle([0.7, -0.2, 0.6, -0.2, 0.6, -0.3]);
  gl.uniform4f(u_FragColor, 0.72, 0.25, 0.05, 1.0);
  drawTriangle([0.7, -0.3, 0.7, -0.4, 0.6, -0.4]);
  gl.uniform4f(u_FragColor, 0.55, 0.18, 0.04, 1.0);
  drawTriangle([0.7, -0.3, 0.6, -0.3, 0.6, -0.4]);
  gl.uniform4f(u_FragColor, 0.72, 0.25, 0.05, 1.0);
  drawTriangle([0.7, -0.4, 0.7, -0.5, 0.6, -0.5]);
  gl.uniform4f(u_FragColor, 0.55, 0.18, 0.04, 1.0);
  drawTriangle([0.7, -0.4, 0.6, -0.4, 0.6, -0.5]);
  gl.uniform4f(u_FragColor, 0.72, 0.25, 0.05, 1.0);
  drawTriangle([0.7, -0.5, 0.7, -0.6, 0.6, -0.6]);
  gl.uniform4f(u_FragColor, 0.55, 0.18, 0.04, 1.0);
  drawTriangle([0.7, -0.5, 0.6, -0.5, 0.6, -0.6]);
  gl.uniform4f(u_FragColor, 0.72, 0.25, 0.05, 1.0);
  drawTriangle([0.7, -0.6, 0.7, -0.7, 0.6, -0.7]);
  gl.uniform4f(u_FragColor, 0.55, 0.18, 0.04, 1.0);
  drawTriangle([0.7, -0.6, 0.6, -0.6, 0.6, -0.7]);

  // navy sides of door
  gl.uniform4f(u_FragColor, 0.0, 0.13, 0.38, 1.0);
  drawTriangle([0.2, -0.7, 0.3, -0.4, 0.3, -0.7]);
  drawTriangle([0.3, -0.4, 0.2, -0.4, 0.2, -0.7]);
  drawTriangle([0.5, -0.4, 0.6, -0.7, 0.5, -0.7]);
  drawTriangle([0.5, -0.4, 0.6, -0.4, 0.6, -0.7]);

  // door - red
  gl.uniform4f(u_FragColor, 0.85, 0.07, 0.07, 1.0);
  drawTriangle([0.5, -0.4, 0.3, -0.7, 0.3, -0.4]);
  drawTriangle([0.3, -0.7, 0.5, -0.7, 0.5, -0.4]);

  // doorknob - gold/yellow
  gl.uniform4f(u_FragColor, 0.9, 0.7, 0.1, 1.0);
  drawTriangle([0.44, -0.53, 0.44, -0.57, 0.48, -0.57]);
  drawTriangle([0.44, -0.53, 0.48, -0.53, 0.48, -0.57]);

  // ground - dark grass green
  gl.uniform4f(u_FragColor, 0.13, 0.37, 0.13, 1.0);
  drawTriangle([-1.0, -0.7, 1.0, -0.7, -1.0, -1.0]);
  drawTriangle([1.0, -0.7, 1.0, -1.0, -1.0, -1.0]);

  // chimney - solid brown rectangle
  gl.uniform4f(u_FragColor, 0.35, 0.18, 0.05, 1.0);
  drawTriangle([0.5, 0.1, 0.5, 0.3, 0.6, 0.3]);
  drawTriangle([0.5, 0.1, 0.6, 0.1, 0.6, 0.3]);

  // smoke layer 1 - dark grey, alpha 0.85
  gl.uniform4f(u_FragColor, 0.4, 0.4, 0.4, 0.85);
  drawTriangle([0.45, 0.3, 0.65, 0.3, 0.55, 0.45]);
  drawTriangle([0.5, 0.35, 0.7, 0.35, 0.6, 0.5]);

  // smoke layer 2 - medium grey, alpha 0.6
  gl.uniform4f(u_FragColor, 0.6, 0.6, 0.6, 0.6);
  drawTriangle([0.4, 0.47, 0.72, 0.47, 0.56, 0.62]);
  drawTriangle([0.45, 0.53, 0.77, 0.53, 0.61, 0.68]);

  // smoke layer 3 - light grey, alpha 0.35
  gl.uniform4f(u_FragColor, 0.78, 0.78, 0.78, 0.35);
  drawTriangle([0.35, 0.63, 0.8, 0.63, 0.57, 0.8]);
  drawTriangle([0.4, 0.7, 0.85, 0.7, 0.62, 0.87]);

// main bird - dark silhouette
  gl.uniform4f(u_FragColor, 0.05, 0.05, 0.3, 1.0);
  // left outer wing
  drawTriangle([-0.5, 0.6, -0.35, 0.72, -0.3, 0.62]);
  // left inner wing
  drawTriangle([-0.3, 0.62, -0.35, 0.72, -0.2, 0.68]);
  // right inner wing
  drawTriangle([-0.2, 0.68, -0.05, 0.72, -0.1, 0.62]);
  // right outer wing
  drawTriangle([-0.1, 0.62, -0.05, 0.72, 0.1, 0.6]);
}