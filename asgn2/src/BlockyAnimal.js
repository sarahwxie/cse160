// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
// Name: Sarah Xie
// Student Email: swxie@ucsc.edu

// Grader notes:
// used video playlist & GPT-4o

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix*u_ModelMatrix*a_Position;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`;

var canvas, gl, a_Position, u_FragColor, u_ModelMatrix, u_GlobalRotateMatrix;

// Globals related to UI elements
var g_selectedColor = [0.5, 0.5, 0.5, 0.5];
var g_globalAngle = 10;
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
  gl.enable(gl.DEPTH_TEST);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to intialize shaders.");
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  if (a_Position < 0) {
    console.log("Failed to get the storage location of a_Position");
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  if (!u_FragColor) {
    console.log("Failed to get the storage location of u_FragColor");
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  if (!u_ModelMatrix) {
    console.log("Failed to get the storage location of u_ModelMatrix");
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(
    gl.program,
    "u_GlobalRotateMatrix"
  );
  if (!u_GlobalRotateMatrix) {
    console.log("Failed to get the storage location of u_GlobalRotateMatrix");
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

  return true;
}

function addActionsForHtmlUI() {
  //button events
  document.getElementById("clearButton").onclick = function () {
    g_shapes = [];
    renderScene();
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
  document
    .getElementById("angleSlide")
    .addEventListener("mousemove", function () {
      g_globalAngle = this.value;
      renderScene();
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
  renderScene();
}

function renderScene() {
  var globalRotMatrix = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMatrix.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // draw the body cube
  var body = new Cube();
  body.color = [1.0, 0.0, 0.0, 1.0];
  body.matrix.translate(-0.25, -0.5, 0);
  body.matrix.scale(0.5, 1, 0.5);
  body.render();

  // draw the body cube
  var leftArm = new Cube();
  leftArm.color = [1.0, 1.0, 0.0, 1.0];
  leftArm.matrix.translate(0.7, -0, 0);
  leftArm.matrix.rotate(45, 0, 0, 1);
  leftArm.matrix.scale(0.25, 0.7, 0.5);
  leftArm.render();
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
  // point.size = g_selectedSize;

  // Store the coordinates and color in the global arrays
  g_shapes.push(point);

  // Render all the shapes
  renderScene(gl, a_Position, u_FragColor);
}
