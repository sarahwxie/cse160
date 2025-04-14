// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
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
var g_selectedColor = [0.5, 0.5, 0.5, 1.0];
var g_selectedSize = 10;
var g_points = [];

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById("webgl");

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }
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
    g_points = [];
    renderAllShapes();
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

  // size sliders
  document.getElementById("size").addEventListener("mouseup", function () {
    g_selectedSize = this.value;
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

  var len = g_points.length;
  for (var i = 0; i < len; i++) {
    g_points[i].render();
  }
}

function handleMouseClick(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  // set coordinates based on origin
  x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  // Print coordinate in console
  // console.log("("+x+","+y+")");

  const point = new Point([x, y, 0.0], g_selectedColor.slice(), g_selectedSize);

  return point;
}

function click(ev) {
  // Handle the mouse click and get the position and color
  const point = handleMouseClick(ev, canvas);

  // Store the coordinates and color in the global arrays
  g_points.push(point);

  // Render all the shapes
  renderAllShapes(gl, a_Position, u_FragColor);
}
