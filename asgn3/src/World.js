// ColoredPoint.js (c) 2012 matsuda
// Name: Sarah Xie
// Student Email: swxie@ucsc.edu
// Resources: GPT4 & YouTube Videos

// Vertex shader program
var VSHADER_SOURCE = `
    precision mediump float;
    attribute vec4 a_Position;
    attribute vec2 a_UV;
    varying vec2 v_UV;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    void main() {
      gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
      v_UV = a_UV;
    }
`;

// Fragment shader program
const FSHADER_SOURCE = `
    precision mediump float;
    varying vec2 v_UV;
    uniform vec4 u_FragColor;
    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform int u_whichTexture;
    void main() {
      if (u_whichTexture == -2) {
        gl_FragColor = u_FragColor; // Use color
      } else if (u_whichTexture == -1) {
        gl_FragColor = vec4(v_UV, 1.0, 1.0); // Use UV debug color
      } else if (u_whichTexture == 0) {
        gl_FragColor = texture2D(u_Sampler0, v_UV); // Use texture0
      } else if (u_whichTexture == 1) {
       gl_FragColor = texture2D(u_Sampler1, v_UV); // Use texture1
      } else{
        gl_FragColor = vec4(1, 0.2, 0.2, 1); // Error, put Redish
      }
    }
`;

const SNAKE_COLOR = [6 / 255, 100 / 255, 70 / 255, 1];

// Global WebGL variables
let canvas,
  gl,
  a_Position,
  a_UV,
  u_FragColor,
  u_ModelMatrix,
  u_ProjectionMatrix,
  u_ViewMatrix,
  u_GlobalRotateMatrix,
  u_Sampler0,
  u_Sampler1,
  u_whichTexture;

// UI-controlled globals
let g_yellowAngle = 0;
let g_magAngle = 0;
let g_toungueLen = 0.7;
let g_yellowAnimation = false;
let g_magentaAnimation = false;
let g_toungueAnimation = false;

// Snake jump trackers
let g_snakeJump = 0;
let g_isJumping = false;
let g_jumpStartTime = 0;

// Variables to track rotation angles
let g_xRotation = 0;
let g_yRotation = 0;

// Variables to track mouse interaction
let isMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Animation timing
let g_startTime = performance.now() / 1000.0;
let g_seconds = performance.now() / 1000.0 - g_startTime;

// view
let camera;
var g_eye = [0, 0, 3];
var g_at = [0, 0, -100];
var g_up = [0, 1, 0];

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
  a_UV = gl.getAttribLocation(gl.program, "a_UV");
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  u_GlobalRotateMatrix = gl.getUniformLocation(
    gl.program,
    "u_GlobalRotateMatrix"
  );

  u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");

  // Get the storage location of u_Sampler
  u_Sampler0 = gl.getUniformLocation(gl.program, "u_Sampler0");
  if (!u_Sampler0) {
    console.log("Failed to get the storage location of u_Sampler0");
    return false;
  }

  // Get the storage location of u_Sampler
  u_Sampler1 = gl.getUniformLocation(gl.program, "u_Sampler1");
  if (!u_Sampler1) {
    console.log("Failed to get the storage location of u_Sampler1");
    return false;
  }

  u_whichTexture = gl.getUniformLocation(gl.program, "u_whichTexture");
  if (!u_whichTexture) {
    console.log("Failed to get the storage location of u_whichTexture");
    return false;
  }

  if (
    a_Position < 0 ||
    a_UV < 0 || // check a_UV too
    !u_FragColor ||
    !u_ModelMatrix ||
    !u_GlobalRotateMatrix ||
    !u_ViewMatrix ||
    !u_ProjectionMatrix
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
  // currently no HTML buttons for Minecraft
}

// Function to animate the jump
function animateJump() {
  const currentTime = performance.now() / 1000.0;
  const elapsedTime = currentTime - g_jumpStartTime;

  // Use a parabolic equation for the jump (e.g., -4x^2 + 4x for a smooth jump)
  if (elapsedTime <= 1.0) {
    g_snakeJump = -4 * Math.pow(elapsedTime - 0.5, 2) + 1; // Peak at t = 0.5
    renderScene();
    requestAnimationFrame(animateJump);
  } else {
    // End the jump animation
    g_snakeJump = 0;
    g_isJumping = false;
    renderScene();
  }
}

// Add mouse event listeners
function addMouseControl() {
  // escape pointer lock
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.exitPointerLock();
    }
  });

  // Lock pointer on click
  canvas.addEventListener("click", () => {
    canvas.requestPointerLock =
      canvas.requestPointerLock ||
      canvas.mozRequestPointerLock ||
      canvas.webkitRequestPointerLock;
    canvas.requestPointerLock();
  });

  // Handle mouse movement when pointer is locked
  document.addEventListener("mousemove", (event) => {
    if (
      document.pointerLockElement === canvas ||
      document.mozPointerLockElement === canvas ||
      document.webkitPointerLockElement === canvas
    ) {
      const deltaX =
        event.movementX || event.mozMovementX || event.webkitMovementX || 0;
      const deltaY =
        event.movementY || event.mozMovementY || event.webkitMovementY || 0;

      const yaw = deltaX * 0.3;
      const pitch = deltaY * 0.3;

      camera.rotate(yaw, pitch);
      renderScene();
    }
  });
}

function initTextures() {
  const dirtImage = new Image();
  dirtImage.onload = () => {
    sendImageToTexture(dirtImage, 0); // TEXTURE0
  };
  dirtImage.src = "dirt.jpg";

  const stoneImage = new Image();
  stoneImage.onload = () => {
    sendImageToTexture(stoneImage, 1); // TEXTURE1
  };
  stoneImage.src = "sky.jpg";

  return true;
}

function sendImageToTexture(image, textureUnit) {
  const texture = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl[`TEXTURE${textureUnit}`]);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(textureUnit === 0 ? u_Sampler0 : u_Sampler1, textureUnit);
}

// Main entry point
function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();
  addMouseControl();

  camera = new Camera();

  document.onkeydown = keydown;

  initTextures(gl, 0);
  gl.clearColor(1, 1, 1, 1.0);

  requestAnimationFrame(tick);
}

// Animation tick - update and render continuously
function tick() {
  const currentTime = performance.now();
  g_seconds = currentTime / 1000.0 - g_startTime;

  updateAnimationAngles();
  renderScene();
  requestAnimationFrame(tick);
}

// Update angles based on animation toggles
function updateAnimationAngles() {
  if (g_yellowAnimation) g_yellowAngle = -(10 * Math.sin(g_seconds) + 5);
  if (g_magentaAnimation) g_magAngle = 15 * Math.sin(g_seconds);
  if (g_toungueAnimation)
    g_toungueLen = 0.65 + 0.35 * Math.sin(g_seconds * 1.5);
}

function keydown(ev) {
  switch (ev.key.toLowerCase()) {
    case "w": // Move forward
      camera.forward();
      break;
    case "s": // Move backward
      camera.back();
      break;
    case "a": // Move left
      camera.left();
      break;
    case "d": // Move right
      camera.right();
      break;
    case "q": // Rotate camera left
      camera.rotate(-5, 0);
      break;
    case "e": // Rotate camera right
      camera.rotate(5, 0);
      break;
    default:
      console.log(`Unhandled key: ${ev.key}`);
      return; // Exit if the key is not handled
  }
  renderScene();
}

function drawMap() {
  for (let x = 0; x < 32; x++) {
    for (let y = 0; y < 32; y++) {
      let height = g_map[x][y];
      if (height !== 0) {
        for (let h = 0; h < height; h++) {
          let block = new Cube();
          block.color = [0.8, 1.0, 0.1, 1.0];
          block.textureNum = 0;

          // Scale first (affects cube size)
          block.matrix.scale(0.3, 0.3, 0.3);

          // Then translate (after scale!)
          // Each cube is stacked by translating 1 unit up in cube space (0.3 world units)
          block.matrix.translate(x - 16, h, y - 16);

          // Offset Y position by -0.75 / 0.3 = -2.5 blocks to touch the floor
          block.matrix.translate(0, -2.5, 0);

          block.renderFast();
        }
      }
    }
  }
}

// Render all objects in the scene
function renderScene() {
  // Pass the projection matrix
  var projMat = new Matrix4();
  projMat.setPerspective(60, canvas.width / canvas.height, 0.1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  // Pass the view matrix
  var viewMat = new Matrix4();
  viewMat.setLookAt(
    camera.eye.elements[0],
    camera.eye.elements[1],
    camera.eye.elements[2],
    camera.at.elements[0],
    camera.at.elements[1],
    camera.at.elements[2],
    camera.up.elements[0],
    camera.up.elements[1],
    camera.up.elements[2]
  );
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  // ------------------
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, new Matrix4().elements); // identity

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Draw the floor
  var floor = new Cube();
  floor.color = [82 / 255, 105 / 255, 53 / 255, 1.0];
  floor.textureNum = -2;
  floor.matrix.translate(0, -0.75, 0.0);
  floor.matrix.scale(11, 0.01, 11);
  floor.matrix.translate(-0.5, 0, -0.5);
  floor.renderFast();

  // Draw the sky
  var sky = new Cube();
  sky.color = [135 / 255, 206 / 255, 235 / 255, 1];
  sky.textureNum = 1;
  sky.matrix.scale(50, 50, 50);
  sky.matrix.translate(-0.5, -0.5, -0.5); // Center the box
  sky.renderFast();

  // draw the map
  drawMap();
}
