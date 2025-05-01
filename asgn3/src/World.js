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
    uniform int u_whichTexture;
    void main() {
      if (u_whichTexture == -2) {
        gl_FragColor = u_FragColor; // Use color
      } else if (u_whichTexture == -1) {
        gl_FragColor = vec4(v_UV, 1.0, 1.0); // Use UV debug color
      } else if (u_whichTexture == 0) {
        gl_FragColor = texture2D(u_Sampler0, v_UV); // Use texture0
      } else {
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
  document.getElementById("aniOff").onclick = () => (g_yellowAnimation = false);
  document.getElementById("aniOn").onclick = () => (g_yellowAnimation = true);

  document.getElementById("magAniOff").onclick = () =>
    (g_magentaAnimation = false);
  document.getElementById("magAniOn").onclick = () =>
    (g_magentaAnimation = true);

  document.getElementById("tOff").onclick = () => (g_toungueAnimation = false);
  document.getElementById("tOn").onclick = () => (g_toungueAnimation = true);

  document
    .getElementById("angleSlide")
    .addEventListener("mousemove", function () {
      g_yRotation = this.value;
      renderScene();
    });

  document
    .getElementById("angleSlideY")
    .addEventListener("mousemove", function () {
      g_xRotation = this.value;
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

  document.getElementById("tLen").addEventListener("mousemove", function () {
    g_toungueLen = this.value;
    renderScene();
  });
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
  canvas.addEventListener("mousedown", (event) => {
    if (event.shiftKey && !g_isJumping) {
      // Start the jump animation
      g_isJumping = true;
      g_jumpStartTime = performance.now() / 1000.0; // Record the start time
      animateJump();
    } else {
      isMouseDown = true;
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
    }
  });

  canvas.addEventListener("mousemove", (event) => {
    if (isMouseDown) {
      const deltaX = event.clientX - lastMouseX;
      const deltaY = event.clientY - lastMouseY;

      // Map mouse movement to rotation angles
      g_yRotation += deltaX * 0.5;
      g_xRotation += deltaY * 0.5;

      // Normalize rotation values to stay within 0-360 degrees
      g_yRotation = g_yRotation % 360;
      g_xRotation = Math.max(-90, Math.min(90, g_xRotation));

      lastMouseX = event.clientX;
      lastMouseY = event.clientY;

      renderScene();
    }
  });

  canvas.addEventListener("mouseup", () => {
    isMouseDown = false;
  });

  canvas.addEventListener("mouseleave", () => {
    isMouseDown = false;
  });
}

function initTextures() {
  var image = new Image(); // Create the image object
  if (!image) {
    console.log("Failed to create the image object");
    return false;
  }

  // Register the event handler to be called on loading an image
  image.onload = function () {
    sendImageToTEXTURE0(image);
  };
  // Tell the browser to load an image
  image.src = "dirt.jpg";

  return true;
}

function sendImageToTEXTURE0(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log("Failed to create the texture object");
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler0, 0);

  console.log("Texture loaded successfully");
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
  switch (ev.key) {
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
    default:
      console.log(`Unhandled key: ${ev.key}`);
      return; // Exit if the key is not handled
  }
  renderScene();
}

function drawMap() {
  for (let x = 0; x < 32; x++) {
    for (let y = 0; y < 32; y++) {
      if (g_map[x][y] !== 0) {
        var body = new Cube();
        body.color = [0.8, 1.0, 0.1, 1.0];
        body.textureNum = 0;
        body.matrix.translate(0, -0.75, 0);
        body.matrix.scale(0.3, 0.3, 0.3);
        body.matrix.translate(x - 16, 0, y - 16);
        body.renderFast();
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
  const globalRotMatrix = new Matrix4()
    .rotate(g_yRotation, 0, 1, 0) // Rotate around y-axis
    .rotate(g_xRotation, 1, 0, 0); // Rotate around x-axis
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMatrix.elements);

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
  sky.textureNum = -2;
  sky.matrix.scale(50, 50, 50);
  sky.matrix.translate(-0.5, -0.5, -0.5); // Center the box
  sky.renderFast();

  // draw the map
  drawMap();
}
