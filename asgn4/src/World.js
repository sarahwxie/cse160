// ColoredPoint.js (c) 2012 matsuda
// Name: Sarah Xie
// Student Email: swxie@ucsc.edu
// Resources: GPT4 & YouTube Videos

// Vertex shader program
var VSHADER_SOURCE = `
   precision mediump float;
   attribute vec4 a_Position;
   attribute vec2 a_UV;
   attribute vec3 a_Normal;
   varying vec2 v_UV;
   varying vec3 v_Normal;
   varying vec4 v_VertPos;
   uniform mat4 u_ModelMatrix;
   uniform mat4 u_NormalMatrix;
   uniform mat4 u_GlobalRotateMatrix;
   uniform mat4 u_ViewMatrix;
   uniform mat4 u_ProjectionMatrix;
   void main() {
      gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
      v_UV = a_UV;
      v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal,1)));
      v_VertPos = u_ModelMatrix * a_Position;
   }`;

// Fragment shader program ========================================
var FSHADER_SOURCE = `
    precision mediump float;
    varying vec2 v_UV;
    varying vec3 v_Normal;
    uniform vec4 u_FragColor;
    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform int u_whichTexture;
    uniform vec3 u_lightPos;
    uniform vec3 u_cameraPos;
    varying vec4 v_VertPos;
    uniform bool u_lightOn;
    uniform vec3 u_lightColor;

    uniform vec3 u_spotDirection; // Direction the spotlight is pointing
    uniform float u_spotCutoff;   // Cosine of spotlight cutoff angle (e.g. cos(radians(12.5)))
    uniform bool u_spotLightOn;   // Whether spotlight is active
    uniform vec3 u_spotLightPos;

    void main() {
      if(u_whichTexture == -3){
         gl_FragColor = vec4((v_Normal+1.0)/2.0, 1.0); // Use normal
      } else if(u_whichTexture == -2){
         gl_FragColor = u_FragColor;                  // Use color
      } else if (u_whichTexture == -1){
         gl_FragColor = vec4(v_UV, 1.0, 1.0);         // Use UV debug color
      } else if(u_whichTexture == 0){
         gl_FragColor = texture2D(u_Sampler0, v_UV);  // Use texture0
      } else {
         gl_FragColor = vec4(1,.2,.2,1);              
      }

      vec3 lightVector = u_lightPos-vec3(v_VertPos);
      float r = length(lightVector);

      // N dot L
      vec3 L = normalize(lightVector);
      vec3 N = normalize(v_Normal);
      float nDotL = max(dot(N,L), 0.0);

      // Reflection
      vec3 R = reflect(-L,N);

      // eye
      vec3 E = normalize(u_cameraPos-vec3(v_VertPos));

      // Specular
      float specular = pow(max(dot(E,R), 0.0), 10.0)* 0.5;

      vec3 diffuse = vec3(gl_FragColor) * nDotL * 0.6;

      vec3 ambient = vec3(gl_FragColor) * 0.5;
      if (u_spotLightOn) {
        ambient = vec3(gl_FragColor) * 0.1; 
      } else if (u_lightOn) {
        ambient = vec3(gl_FragColor) * 0.3; 
      }
      
      vec3 finalColor = ambient;

      if (u_lightOn || u_spotLightOn) {
        vec3 totalLight = vec3(0.0);

        // === Regular Light ===
        if (u_lightOn) {
          totalLight += diffuse + specular;
        }

        // === Spotlight ===
        if (u_spotLightOn) {
          vec3 spotLightDir = normalize(u_spotLightPos - vec3(v_VertPos));
          float theta = dot(spotLightDir, normalize(-u_spotDirection));

          if (theta > u_spotCutoff) {
            float spotEffect = pow(theta, 10.0); // spotlight falloff

            // Compute spotlight's diffuse/specular
            vec3 L_spot = normalize(u_spotLightPos - vec3(v_VertPos));
            vec3 N_spot = normalize(v_Normal);
            float nDotL_spot = max(dot(N_spot, L_spot), 0.0);

            vec3 R_spot = reflect(-L_spot, N_spot);
            vec3 E_spot = normalize(u_cameraPos - vec3(v_VertPos));

            float specular_spot = pow(max(dot(E_spot, R_spot), 0.0), 10.0) * 0.5;
            vec3 diffuse_spot = vec3(gl_FragColor) * nDotL_spot * 0.6;

            totalLight += spotEffect * (diffuse_spot + specular_spot);
          }
        }

        finalColor += totalLight;
      }

      gl_FragColor = vec4(finalColor * u_lightColor, 1.0);
    }`;

const SNAKE_COLOR = [6 / 255, 100 / 255, 70 / 255, 1];

// Global WebGL variables
let canvas,
  gl,
  a_Position,
  a_UV,
  a_Normal,
  u_FragColor,
  u_ModelMatrix,
  u_ProjectionMatrix,
  u_ViewMatrix,
  u_GlobalRotateMatrix,
  u_Sampler0,
  u_whichTexture,
  u_lightPos,
  u_cameraPos,
  u_lightOn,
  u_spotLightOn,
  u_lightColor,
  u_spotLightPos,
  u_spotDirection,
  u_spotCutoff;

// UI-controlled globals
let g_yellowAngle = 0;
let g_magAngle = 0;
let g_toungueLen = 0.7;
let g_yellowAnimation = false;
let g_magentaAnimation = false;
let g_toungueAnimation = false;
let g_lightAnimation = true;

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
let g_normalOn = true;

// lighting
let g_lightPos = [0, 1, 1];
let g_lightColor = [1, 0.9, 0.8];
let g_lightOn = true;
let g_spotLightOn = false;

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
  a_Normal = gl.getAttribLocation(gl.program, "a_Normal");
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  u_GlobalRotateMatrix = gl.getUniformLocation(
    gl.program,
    "u_GlobalRotateMatrix"
  );

  u_NormalMatrix = gl.getUniformLocation(gl.program, "u_NormalMatrix");
  if (!u_NormalMatrix) {
    console.log("Failed to get the storage location of u_NormalMatrix");
    return;
  }

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

  u_lightPos = gl.getUniformLocation(gl.program, "u_lightPos");
  if (!u_lightPos) {
    console.log("Failed to get u_lightPos");
    return;
  }

  u_cameraPos = gl.getUniformLocation(gl.program, "u_cameraPos");
  if (!u_cameraPos) {
    console.log("Failed to get u_cameraPos");
    return;
  }

  u_lightOn = gl.getUniformLocation(gl.program, "u_lightOn");
  if (!u_lightOn) {
    console.log("Failed to get u_lightOn");
    return;
  }

  u_lightColor = gl.getUniformLocation(gl.program, "u_lightColor");
  if (!u_lightColor) {
    console.log("Failed to get the storage location of u_lightColor");
    return;
  }

  u_spotDirection = gl.getUniformLocation(gl.program, "u_spotDirection");
  u_spotCutoff = gl.getUniformLocation(gl.program, "u_spotCutoff");
  u_spotLightOn = gl.getUniformLocation(gl.program, "u_spotLightOn");
  u_spotLightPos = gl.getUniformLocation(gl.program, "u_spotLightPos");

  if (
    a_Position < 0 ||
    a_UV < 0 ||
    a_Normal < 0 ||
    !u_FragColor ||
    !u_ModelMatrix ||
    !u_GlobalRotateMatrix ||
    !u_ViewMatrix ||
    !u_ProjectionMatrix ||
    !u_spotDirection ||
    !u_spotCutoff ||
    !u_spotLightOn ||
    !u_spotLightPos
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

  document.getElementById("normalOn").onclick = () => (g_normalOn = true);
  document.getElementById("normalOff").onclick = () => (g_normalOn = false);

  document.getElementById("lightOn").onclick = () => (g_lightOn = true);
  document.getElementById("lightOff").onclick = () => (g_lightOn = false);

  document.getElementById("spotLightOn").onclick = () => (g_spotLightOn = true);
  document.getElementById("spotLightOff").onclick = () =>
    (g_spotLightOn = false);

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
    .getElementById("lightSlideX")
    .addEventListener("mousemove", function () {
      g_lightPos[0] = this.value;
      renderScene();
    });

  document
    .getElementById("lightSlideX")
    .addEventListener("mousedown", function () {
      g_lightAnimation = false;
    });

  document
    .getElementById("lightSlideX")
    .addEventListener("mouseup", function () {
      g_lightAnimation = true;
    });

  document
    .getElementById("lightSlideY")
    .addEventListener("mousemove", function () {
      g_lightPos[1] = this.value;
      renderScene();
    });

  document
    .getElementById("lightSlideZ")
    .addEventListener("mousemove", function () {
      g_lightPos[2] = this.value;
      renderScene();
    });

  document
    .getElementById("lightRed")
    .addEventListener("mousemove", function () {
      g_lightColor[0] = this.value / 255;
      renderScene();
    });
  document
    .getElementById("lightGreen")
    .addEventListener("mousemove", function () {
      g_lightColor[1] = this.value / 255;
      renderScene();
    });
  document
    .getElementById("lightBlue")
    .addEventListener("mousemove", function () {
      g_lightColor[2] = this.value / 255;
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
  image.src = "sky.jpg";

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
  if (g_yellowAnimation) g_yellowAngle = 22.5 * Math.sin(g_seconds) - 7.5;
  if (g_magentaAnimation) g_magAngle = 22.5 * Math.sin(g_seconds) - 7.5;
  if (g_toungueAnimation)
    g_toungueLen = 0.65 + 0.35 * Math.sin(g_seconds * 1.5);

  if (g_lightAnimation) g_lightPos[0] = 2 * Math.cos(g_seconds);
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

  // Set the light position
  gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);

  // Set the camera position
  gl.uniform3f(
    u_cameraPos,
    camera.eye.elements[0],
    camera.eye.elements[1],
    camera.eye.elements[2]
  );

  // Set the light color
  gl.uniform3f(u_lightColor, g_lightColor[0], g_lightColor[1], g_lightColor[2]);

  // Set the light on/off
  gl.uniform1i(u_lightOn, g_lightOn);

  // Set the spotlight on/off
  gl.uniform1i(u_spotLightOn, g_spotLightOn);
  gl.uniform3f(u_spotLightPos, -2.0, 2.4, 3);
  gl.uniform3f(u_spotDirection, 4.0, -6.0, -6.0);
  gl.uniform1f(u_spotCutoff, Math.cos((12.5 * Math.PI) / 180)); // convert degrees to radians

  // Draw the light
  var light = new Cube();
  light.color = g_lightColor;
  light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  light.matrix.scale(-0.1, -0.1, -0.1);
  light.matrix.translate(-0.5, -0.5, -0.5);
  light.render();

  // Draw the floor
  var floor = new Cube();
  floor.color = [0.9, 0.9, 0.9, 1.0];
  floor.matrix.translate(0, -0.75, 0.0);
  floor.matrix.scale(10, 0.01, 10);
  floor.matrix.translate(-0.5, 0, -0.5);
  floor.render();

  // Draw the sky
  var sky = new Cube();
  sky.type = "sky";
  sky.color = [135 / 255, 206 / 255, 235 / 255, 1];
  if (g_normalOn) sky.textureNum = -3; // Use normals
  sky.matrix.scale(-10, -10, -10);
  sky.matrix.translate(-0.5, -0.5, -0.5); // Center the box
  sky.render();

  // Snake Base
  const body = new Cube();
  body.color = SNAKE_COLOR;
  if (g_normalOn) body.textureNum = -3; // Use normals
  body.matrix.translate(-0.1, -0.75 + g_snakeJump, 0.0);
  body.matrix.rotate(-5, 1, 0, 0);
  body.matrix.scale(1.5, 0.3, 0.3);
  body.render();

  // snake body
  const leftArm = new Cube();
  leftArm.color = SNAKE_COLOR;
  if (g_normalOn) leftArm.textureNum = -3; // Use normals
  leftArm.matrix.setTranslate(0, -0.5 + g_snakeJump, 0.0);
  leftArm.matrix.rotate(-5, 1, 0, 0);
  leftArm.matrix.rotate(-g_yellowAngle, 0, 0, 1);
  const yellowCoordinatesMat = new Matrix4(leftArm.matrix);
  leftArm.matrix.scale(0.25, 0.7, 0.25);
  leftArm.matrix.translate(-0.5, 0, 0.0);
  leftArm.render();

  // snake head
  const box = new Cube();
  box.color = SNAKE_COLOR;
  if (g_normalOn) box.textureNum = -3; // Use normals
  box.matrix = yellowCoordinatesMat;
  box.matrix.translate(0, 0.65, 0.0);
  box.matrix.rotate(-g_magAngle, 0, 0.0, 1.0);
  box.matrix.scale(0.3, 0.3, 0.3);
  box.matrix.translate(-0.5, 0, -0.001);
  const headCoordinatesMat = new Matrix4(box.matrix); // Save head matrix for tongue
  box.render();

  // Snake tongue
  const tongue = new Pyramid();
  tongue.color = [1.0, 0.0, 0.0, 1.0];
  if (g_normalOn) tongue.textureNum = -3; // Use normals
  tongue.matrix = headCoordinatesMat;
  tongue.matrix.rotate(-90, 0, 1, 0);
  tongue.matrix.translate(0.35, 0.2, 0);
  tongue.matrix.scale(0.2, 0.2, g_toungueLen);
  tongue.render();

  // Draw the sphere in the middle of the screen
  const sphere = new Sphere();
  sphere.color = [0.5, 0.5, 1.0, 1.0]; // Light blue color
  if (g_normalOn) sphere.textureNum = -3; // Use normals
  sphere.matrix.translate(-1, 0, 0); // Center of the screen
  sphere.matrix.scale(0.5, 0.5, 0.5); // Adjust size
  sphere.render();
}
