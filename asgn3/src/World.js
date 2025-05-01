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
  varying vec3 v_Pos;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  void main() {
    vec4 worldPos = u_ModelMatrix * a_Position;
    v_Pos = vec3(worldPos);
    v_UV = a_UV;
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * worldPos;
  }
`;

// Fragment shader program
const FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Pos;

  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform int u_whichTexture;

  uniform bool u_lightOn;
  uniform vec3 u_lightPos;
  uniform vec3 u_cameraPos;

  void main() {
    vec4 baseColor;
    if (u_whichTexture == -2) {
      baseColor = u_FragColor;
    } else if (u_whichTexture == -1) {
      baseColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_whichTexture == 0) {
      baseColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {
      baseColor = texture2D(u_Sampler1, v_UV);
    } else {
      baseColor = vec4(1.0, 0.2, 0.2, 1.0);
    }

    // Default ambient
    vec3 color = baseColor.rgb * (u_lightOn ? 0.1 : 0.5);

    if (u_lightOn) {
      float dist = length(v_Pos - u_lightPos);
      float intensity = clamp(1.0 / (dist * dist), 0.0, 1.0);
      color += baseColor.rgb * intensity;
    }

    gl_FragColor = vec4(color, baseColor.a);
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
  u_whichTexture,
  u_lightOn,
  u_cameraPos,
  u_lightPos;

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

// game mechanics
let nuggetsToWin = 20;
let nuggetCount = 0;
let nightMode = false;

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

  u_lightOn = gl.getUniformLocation(gl.program, "u_lightOn");
  if (!u_lightOn) {
    console.log("Failed to get u_lightOn");
    return;
  }

  u_cameraPos = gl.getUniformLocation(gl.program, "u_cameraPos");
  u_lightPos = gl.getUniformLocation(gl.program, "u_lightPos");

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
  document.getElementById("debugBtn").addEventListener("click", () => {
    nuggetsToWin = 3;
    document.querySelector(".right-column p").textContent =
      "Get 3 gold nuggets to win! (Debug Mode)";
  });
  document.querySelectorAll(".btn").forEach((btn) => {
    if (btn.textContent === "Day") {
      btn.addEventListener("click", () => {
        nightMode = false;
        renderScene();
      });
    } else if (btn.textContent === "Night") {
      btn.addEventListener("click", () => {
        nightMode = true;
        renderScene();
      });
    }
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
    case "w":
      camera.forward();
      break;
    case "s":
      camera.back();
      break;
    case "a":
      camera.left();
      break;
    case "d":
      camera.right();
      break;
    case "q":
      camera.rotate(-5, 0);
      break;
    case "e":
      camera.rotate(5, 0);
      break;

    case "z": {
      // Add block
      let [x, y] = getForwardBlockCoords();
      if (g_map[x][y] < 10) g_map[x][y]++; // Max height cap
      break;
    }
    case "x": {
      // Remove block
      let [x, y] = getForwardBlockCoords();
      if (g_map[x][y] > 0) g_map[x][y]--;
      break;
    }

    default:
      console.log(`Unhandled key: ${ev.key}`);
      return;
  }
  renderScene();
}

function drawMap() {
  for (let x = 0; x < 32; x++) {
    for (let y = 0; y < 32; y++) {
      let height = g_map[x][y];

      if (height === -1) {
        let nugget = new Cube();
        nugget.color = [239 / 255, 191 / 255, 4 / 255, 1.0];
        nugget.textureNum = -2; // solid color, change if using texture
        nugget.matrix.translate(x - 16, 0.2, y - 16); // position it slightly above the ground
        nugget.matrix.scale(0.2, 0.2, 0.2); // smaller size
        nugget.matrix.translate(-0.5, 0, -0.5); // center the cube
        nugget.render();
        continue;
      }

      if (height !== 0) {
        for (let h = 0; h < height; h++) {
          let block = new Cube();
          block.color = [0.8, 1.0, 0.1, 1.0];
          block.textureNum = 0;

          // Then translate (after scale!)
          // Each cube is stacked by translating 1 unit up in cube space (0.3 world units)
          block.matrix.translate(x - 16, h, y - 16);

          // Offset Y position by -0.75 / 0.3 = -2.5 blocks to touch the floor
          block.matrix.translate(0, -0.75, 0);

          block.render();
        }
      }
    }
  }
}

function addGoldNugget() {
  nuggetCount++;
  document.getElementById("nuggetCount").textContent = nuggetCount;

  if (nuggetCount >= nuggetsToWin) {
    document.getElementById("winOverlay").style.display = "flex";
  }
}

function getForwardBlockCoords() {
  // Direction the camera is facing
  let dir = new Vector3(camera.at.elements);
  dir.sub(camera.eye);
  dir.normalize();
  dir.mul(2); // Step forward 2 units instead of 1

  // Compute the target position two units ahead
  let target = new Vector3(camera.eye.elements);
  target.add(dir);

  // Map coordinates
  let x = Math.floor(target.elements[0]) + 16;
  let y = Math.floor(target.elements[2]) + 16;

  // Clamp within bounds
  x = Math.max(0, Math.min(31, x));
  y = Math.max(0, Math.min(31, y));

  return [x, y];
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

  // is night mode on?
  if (nightMode) {
    gl.uniform3f(
      u_cameraPos,
      camera.eye.elements[0],
      camera.eye.elements[1],
      camera.eye.elements[2]
    );
    gl.uniform1i(u_lightOn, true); // enable flashlight
    gl.uniform3f(
      u_lightPos,
      camera.eye.elements[0],
      camera.eye.elements[1],
      camera.eye.elements[2]
    );
  } else {
    gl.uniform1i(u_lightOn, false); // disable flashlight
  }

  // Draw the floor
  var floor = new Cube();
  floor.color = [82 / 255, 105 / 255, 53 / 255, 1.0];
  floor.textureNum = -2;
  floor.matrix.translate(0, -0.75, 0.0);
  floor.matrix.scale(32, 0.01, 32);
  floor.matrix.translate(-0.5, 0, -0.5);
  floor.render();

  // Draw the sky
  var sky = new Cube();
  sky.color = [135 / 255, 206 / 255, 235 / 255, 1];
  sky.textureNum = 1;
  sky.matrix.scale(100, 100, 100);
  sky.matrix.translate(-0.5, -0.4, -0.5); // Center the box
  sky.render();

  // nugget pickup logic
  for (let x = 0; x < 32; x++) {
    for (let y = 0; y < 32; y++) {
      if (g_map[x][y] === -1) {
        const nuggetWorldX = x - 16;
        const nuggetWorldZ = y - 16;

        const dx = camera.eye.elements[0] - nuggetWorldX;
        const dz = camera.eye.elements[2] - nuggetWorldZ;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 0.5) {
          // Within pickup radius
          g_map[x][y] = 0; // Remove nugget
          addGoldNugget(); // Increment counter
        }
      }
    }
  }

  // draw the map
  drawMap();
}
