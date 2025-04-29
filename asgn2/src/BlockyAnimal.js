// ColoredPoint.js (c) 2012 matsuda
// Name: Sarah Xie
// Student Email: swxie@ucsc.edu

// Vertex shader program
const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`;

// Fragment shader program
const FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`;

const SNAKE_COLOR = [6 / 255, 100 / 255, 70 / 255, 1.0];

// Global WebGL variables
let canvas, gl, a_Position, u_FragColor, u_ModelMatrix, u_GlobalRotateMatrix;

// UI-controlled globals
let g_globalAngle = 10;
let g_yellowAngle = 0;
let g_magAngle = 0;
let g_yellowAnimation = false;
let g_magentaAnimation = false;

// Animation timing
let g_startTime = performance.now() / 1000.0;
let g_seconds = performance.now() / 1000.0 - g_startTime;

// Set up WebGL context and enable transparency
function setupWebGL() {
  canvas = document.getElementById("webgl");
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

  if (!gl) {
    console.log("Failed to get WebGL context");
    return;
  }

  gl.enable(gl.BLEND);
  gl.enable(gl.DEPTH_TEST);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

// Connect JavaScript variables to GLSL shader variables
function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to initialize shaders.");
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  u_GlobalRotateMatrix = gl.getUniformLocation(
    gl.program,
    "u_GlobalRotateMatrix"
  );

  if (
    a_Position < 0 ||
    !u_FragColor ||
    !u_ModelMatrix ||
    !u_GlobalRotateMatrix
  ) {
    console.log("Failed to get GLSL variable locations");
    return;
  }

  // Set the initial model matrix to identity
  const identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

  return true;
}

// Set up HTML UI event handlers
function addActionsForHtmlUI() {
  document.getElementById("aniOff").onclick = () => (g_yellowAnimation = false);
  document.getElementById("aniOn").onclick = () => (g_yellowAnimation = true);

  document.getElementById("magAniOff").onclick = () =>
    (g_magentaAnimation = false);
  document.getElementById("magAniOn").onclick = () =>
    (g_magentaAnimation = true);

  document
    .getElementById("angleSlide")
    .addEventListener("mousemove", function () {
      g_globalAngle = this.value;
      renderScene();
    });

  document
    .getElementById("yellowAngle")
    .addEventListener("mousemove", function () {
      g_yellowAngle = this.value;
      renderScene();
    });

  document
    .getElementById("magAngle")
    .addEventListener("mousemove", function () {
      g_magAngle = this.value;
      renderScene();
    });
}

// Main entry point
function main() {
  setupWebGL();
  addActionsForHtmlUI();

  if (!connectVariablesToGLSL()) {
    console.log("Failed to connect variables to GLSL.");
    return;
  }

  gl.clearColor(1, 1, 1, 1.0);

  requestAnimationFrame(tick);
}

// Animation tick - update and render continuously
function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;
  updateAnimationAngles();
  renderScene();
  requestAnimationFrame(tick);
}

// Update angles based on animation toggles
function updateAnimationAngles() {
  if (g_yellowAnimation) g_yellowAngle = 15 * Math.sin(g_seconds);
  if (g_magentaAnimation) g_magAngle = 15 * Math.sin(g_seconds);
}

// Render all objects in the scene
function renderScene() {
  const globalRotMatrix = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMatrix.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Snake Base
  const body = new Cube();
  body.color = SNAKE_COLOR;
  body.matrix.translate(-0.1, -0.75, 0.0);
  body.matrix.rotate(-5, 1, 0, 0);
  body.matrix.scale(1.5, 0.3, 0.3);
  body.render();

  // snake body
  const leftArm = new Cube();
  leftArm.color = SNAKE_COLOR;
  leftArm.matrix.setTranslate(0, -0.5, 0.0);
  leftArm.matrix.rotate(-5, 1, 0, 0);
  leftArm.matrix.rotate(-g_yellowAngle, 0, 0, 1);
  const yellowCoordinatesMat = new Matrix4(leftArm.matrix);
  leftArm.matrix.scale(0.25, 0.7, 0.25);
  leftArm.matrix.translate(-0.5, 0, 0.0);
  leftArm.render();

  // snake head
  const box = new Cube();
  box.color = SNAKE_COLOR;
  box.matrix = yellowCoordinatesMat;
  box.matrix.translate(0, 0.65, 0.0);
  box.matrix.rotate(-g_magAngle, 0, 0.0, 1.0);
  box.matrix.scale(0.3, 0.3, 0.3);
  box.matrix.translate(-0.5, 0, -0.001);
  const headCoordinatesMat = new Matrix4(box.matrix); // Save head matrix for tongue
  box.render();

  // Snake tongue
  const tongue = new Cube();
  tongue.color = [1.0, 0.0, 0.0, 1.0];
  tongue.matrix = headCoordinatesMat;
  tongue.matrix.translate(-1, 0.4, 0.5);
  tongue.matrix.scale(1, 0.2, 0.2);
  tongue.render();
}
