// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }
`;

// Fragment shader program
const FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }
`;

var canvas, gl, a_Position, u_FragColor, u_Size;

// Globals related to UI elements
var g_selectedColor = [0.5, 0.5, 0.5, 0.5];
var g_selectedSize = 10;
var g_selectedType = POINT;
var g_shapes = [];
var g_circleSegments = 10;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById("webgl");

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }

  // Enable blending for transparency
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to initialize shaders.");
    return false;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  if (a_Position < 0) {
    console.log("Failed to get the storage location of a_Position");
    return false;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  if (!u_FragColor) {
    console.log("Failed to get the storage location of u_FragColor");
    return false;
  }

  // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, "u_Size");
  if (!u_Size) {
    console.log("Failed to get the storage location of u_Size");
    return false;
  }

  return true;
}

function addActionsForHtmlUI() {
  //button events
  document.getElementById("clearButton").onclick = function () {
    g_shapes = [];
    renderAllShapes();
  };

  document.getElementById("drawCat").onclick = function () {
    g_shapes = [];
    drawCat();
  };

  document.getElementById("point").onclick = function () {
    g_selectedType = POINT;
  };

  document.getElementById("triangle").onclick = function () {
    g_selectedType = TRIANGLE;
  };

  document.getElementById("circle").onclick = function () {
    g_selectedType = CIRCLE;
  };

  // Color sliders
  document.getElementById("red").addEventListener("mouseup", function () {
    g_selectedColor[0] = this.value * 0.1;
  });
  document.getElementById("green").addEventListener("mouseup", function () {
    g_selectedColor[1] = this.value * 0.1;
  });
  document.getElementById("blue").addEventListener("mouseup", function () {
    g_selectedColor[2] = this.value * 0.1;
  });

  // size slider
  document.getElementById("size").addEventListener("mouseup", function () {
    g_selectedSize = this.value;
  });

  // circle segments slider
  document
    .getElementById("circleSlider")
    .addEventListener("mouseup", function () {
      g_circleSegments = this.value;
    });

  // opacity slider
  document.getElementById("opacity").addEventListener("mouseup", function () {
    g_selectedColor[3] = this.value * 0.01;
  });
}

function main() {
  setupWebGL();
  addActionsForHtmlUI();

  // Connect JavaScript variables to GLSL
  if (!connectVariablesToGLSL(gl)) {
    console.log("Failed to connect variables to GLSL.");
    return;
  }

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function (ev) {
    if (ev.buttons == 1) {
      click(ev);
    }
  };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function renderAllShapes() {
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapes.length;
  for (var i = 0; i < len; i++) {
    g_shapes[i].render();
  }
}

function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  // set coordinates based on origin
  x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  return [x, y];
}

function click(ev) {
  var [x, y] = convertCoordinatesEventToGL(ev);
  // Handle the mouse click and get the position and color
  var point;
  if (g_selectedType == POINT) {
    point = new Point();
  } else if (g_selectedType == TRIANGLE) {
    console.log("tri selected");
    point = new Triangle();
  } else if (g_selectedType == CIRCLE) {
    point = new Circle();
    point.segments = g_circleSegments;
  }

  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;

  // Store the coordinates and color in the global arrays
  g_shapes.push(point);

  // Render all the shapes
  renderAllShapes(gl, a_Position, u_FragColor);
}

function drawCatHalf(isRightSide) {
  var catOrange = [1.0, 0.5, 0.3, 1.0];
  var sign = isRightSide ? 1 : -1;

  // white space -- background
  gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
  drawTriangle([0, 0, 0, -0.2, 0.5 * sign, 0]);
  drawTriangle([0, 0, 0.4 * sign, 0.4, 0.4 * sign, 0]);
  drawTriangle([0, 0, 0.4 * sign, 0.4, 0, 0.4]);
  drawTriangle([0.1 * sign, 0.4, 0.2 * sign, 0.4, 0.2 * sign, 0.5]);
  drawTriangle([0.4 * sign, 0.2, 0.5 * sign, 0.2, 0.4 * sign, 0.1]);

  // body
  gl.uniform4f(
    u_FragColor,
    catOrange[0],
    catOrange[1],
    catOrange[2],
    catOrange[3]
  );
  drawTriangle([0, -0.9, 0.4 * sign, -0.9, 0.0, -0.2]);

  // head
  drawTriangle([0, 0.5, 0, 0.3, 0.2 * sign, 0.5]);
  drawTriangle([0.2 * sign, 0.5, 0.2 * sign, 0.4, 0.4 * sign, 0.4]);
  drawTriangle([0.2 * sign, 0.5, 0.4 * sign, 0.7, 0.4 * sign, 0.4]);
  drawTriangle([0.5 * sign, 0.2, 0.4 * sign, 0.2, 0.4 * sign, 0.4]);
  drawTriangle([0.3 * sign, 0, 0.5 * sign, 0, 0.5 * sign, 0.2]);

  // face details
  gl.uniform4f(u_FragColor, 0.2, 0.2, 0.2, 1);
  drawTriangle([0.1 * sign, 0.2, 0.2 * sign, 0.2, 0.2 * sign, 0.3]);
  drawTriangle([0, 0, 0, -0.05, 0.05 * sign, 0]);

  // whiskers
  gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
  drawTriangle([0.5 * sign, 0.05, 0.5 * sign, 0.1, 0.7 * sign, 0.1]);
  drawTriangle([0.5 * sign, 0.1, 0.5 * sign, 0.15, 0.7 * sign, 0.15]);
  drawTriangle([0.5 * sign, 0.15, 0.5 * sign, 0.2, 0.7 * sign, 0.2]);
}

function drawCat() {
  drawCatHalf(true); // Draw the right side
  drawCatHalf(false); // Draw the left side
}
