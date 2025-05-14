import * as THREE from "three";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/loaders/GLTFLoader.js";

const BALL_SIZES = {
  beachBall: 2,
  basketball: 1.8,
  soccerBall: 1.5,
};

function setupOrbitControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // Enable smooth damping (inertia)
  controls.dampingFactor = 0.05; // Damping factor
  controls.screenSpacePanning = true; // Allow panning in screen space
  controls.rotateSpeed = -1; // Reverse the horizontal rotation direction
  return controls;
}

function setupSky(scene) {
  const loader = new THREE.CubeTextureLoader();
  const skyboxTexture = loader.load([
    "./textures/skybox/skybox_px.jpg", // Right (+X)
    "./textures/skybox/skybox_nx.jpg", // Left (-X)
    "./textures/skybox/skybox_py.jpg", // Top (+Y)
    "./textures/skybox/skybox_ny.jpg", // Bottom (-Y)
    "./textures/skybox/skybox_pz.jpg", // Front (+Z)
    "./textures/skybox/skybox_nz.jpg", // Back (-Z)
  ]);
  scene.background = skyboxTexture;
}

function loadTextures() {
  const textureLoader = new THREE.TextureLoader();

  // Load all textures and store them in an object
  const textures = {
    grass: textureLoader.load("./textures/grass.jpg", () =>
      console.log("Grass texture loaded")
    ),
    picnicBlanket: textureLoader.load("./textures/picnic_blanket.jpg", () =>
      console.log("Picnic blanket texture loaded")
    ),
    beachBall: textureLoader.load("./textures/balls/BeachBallColor.jpg", () =>
      console.log("Beach ball texture loaded")
    ),
    basketball: textureLoader.load("./textures/balls/BasketballColor.jpg", () =>
      console.log("Basketball texture loaded")
    ),
    football: textureLoader.load("./textures/balls/FootballColor.jpg", () =>
      console.log("Football texture loaded")
    ),
    checkers: textureLoader.load("./textures/checkers.jpg", () =>
      console.log("Checkers texture loaded")
    ),
  };

  return textures;
}

function setupGround(scene, textures) {
  const grassTexture = textures.grass;

  // Set the texture to repeat
  grassTexture.wrapS = THREE.RepeatWrapping;
  grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(10, 10);

  // Create a rectangular prism for the ground
  const groundGeometry = new THREE.BoxGeometry(70, 3, 70); // Width: 50, Height: 1, Depth: 50
  const groundMaterial = new THREE.MeshPhongMaterial({ map: grassTexture }); // Use the grass texture
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);

  // Position the ground slightly above the origin
  ground.position.set(0, -1.5, 0); // Lower the ground to align its top surface with y = 0
  scene.add(ground);
}

function setupCamera(canvas) {
  const fov = 75;
  const aspect = canvas.clientWidth / canvas.clientHeight;
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(-5, 7, -9);
  camera.lookAt(0, 0, 0);
  return camera;
}

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

function createBall(type, textures) {
  let texture;
  const radius = BALL_SIZES[type]; // Get the radius based on the ball type

  if (!radius) {
    console.error("Invalid ball type:", type);
    return null;
  }

  // Select the texture based on the type of ball
  switch (type) {
    case "beachBall":
      texture = textures.beachBall;
      break;
    case "basketball":
      texture = textures.basketball;
      break;
    case "soccerBall":
      texture = textures.football; // Assuming soccerBall uses the football texture
      break;
    default:
      console.error("Invalid ball type:", type);
      return null;
  }

  // Create the geometry and material
  const geometry = new THREE.SphereGeometry(radius, 32, 16);
  const material = new THREE.MeshPhongMaterial({
    map: texture,
    bumpMap: texture,
    bumpScale: 0.01,
  });

  // Create the mesh
  const ball = new THREE.Mesh(geometry, material);
  return ball;
}

function addTrees(scene) {
  const loader = new GLTFLoader();
  loader.load(
    "./models/oak_trees.glb",
    (gltf) => {
      const model = gltf.scene;
      model.position.set(16, 0, 0);
      model.scale.set(20, 20, 20);
      scene.add(model);
      console.log("Custom model loaded successfully!");
    },
    undefined,
    (error) => {
      console.error("An error occurred while loading the model:", error);
    }
  );
}

function addPicnicBasket(scene) {
  const loader = new GLTFLoader();
  loader.load(
    "./models/picnic_basket.glb", // Path to the picnic basket model
    (gltf) => {
      const model = gltf.scene;
      model.scale.set(2.2, 2.2, 2.2);
      model.rotation.y = Math.PI / 4;

      // Compute the bounding box of the model
      const box = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      box.getCenter(center);

      model.position.sub(center);
      model.position.set(32, 0, 32);

      // Add the model to the scene
      scene.add(model);
      console.log("Picnic basket loaded, scaled, and positioned successfully!");
    },
    undefined,
    (error) => {
      console.error(
        "An error occurred while loading the picnic basket:",
        error
      );
    }
  );
}

function createCheckerPiece(color = "red") {
  const radius = 0.5;
  const height = 0.2;
  const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);

  const material = new THREE.MeshPhongMaterial({
    color: color === "red" ? 0xff0000 : 0x000000, // red or black
  });

  const piece = new THREE.Mesh(geometry, material);
  piece.castShadow = true;
  piece.receiveShadow = true;
  return piece;
}

function addCheckerPieces(scene, board) {
  const boardSize = 5;
  const numSquares = 8;
  const squareSize = boardSize / numSquares;

  const boardX = board.position.x;
  const boardZ = board.position.z;
  const pieceY = board.position.y + 0.125; // Slightly above the board

  function createCheckerPiece(color) {
    const geometry = new THREE.CylinderGeometry(0.25, 0.25, 0.2, 32);
    const material = new THREE.MeshPhongMaterial({
      color: color === "red" ? 0xff0000 : 0x000000,
    });
    const piece = new THREE.Mesh(geometry, material);
    piece.castShadow = true;
    piece.receiveShadow = true;
    return piece;
  }

  for (let row = 0; row < numSquares; row++) {
    for (let col = 0; col < numSquares; col++) {
      if ((row + col) % 2 === 1 && (row < 3 || row > 4)) {
        const color = row < 3 ? "red" : "black";
        const piece = createCheckerPiece(color);

        // Calculate x and z positions based on board center
        const x = boardX - boardSize / 2 + col * squareSize + squareSize / 2;
        const z = boardZ - boardSize / 2 + row * squareSize + squareSize / 2;

        piece.position.set(x, pieceY, z);
        scene.add(piece);
      }
    }
  }
}

function drawStaticScene(scene, textures) {
  // Use the preloaded picnic blanket texture
  const blanketTexture = textures.picnicBlanket;

  // Zoom in on the texture
  blanketTexture.wrapS = THREE.RepeatWrapping;
  blanketTexture.wrapT = THREE.RepeatWrapping;
  blanketTexture.repeat.set(0.5, 0.5); // Zoom in by reducing the repeat values

  // Create a flat object for the picnic blanket
  const blanketGeometry = new THREE.PlaneGeometry(25, 25); // 20x20 flat object
  const blanketMaterial = new THREE.MeshPhongMaterial({ map: blanketTexture }); // Use the texture
  const blanket = new THREE.Mesh(blanketGeometry, blanketMaterial);

  // Position the blanket slightly above the ground
  blanket.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
  blanket.position.set(0, 0.01, 0); // Slightly above the ground to avoid z-fighting
  scene.add(blanket);

  // Add a beach ball to the top-left corner of the picnic blanket
  const beachBall = createBall("beachBall", textures);
  beachBall.position.set(-8, BALL_SIZES.beachBall - 0.1, 12); // Adjust Y based on size
  beachBall.rotation.z = THREE.MathUtils.degToRad(50); // Rotate 50 degrees about the Z-axis
  scene.add(beachBall);

  // Add a basketball to the center of the picnic blanket
  const basketball = createBall("basketball", textures);
  basketball.position.set(-4.5, BALL_SIZES.basketball - 0.1, 8.8); // Adjust Y based on size
  scene.add(basketball);

  // Add a soccer ball to the bottom-right corner of the picnic blanket
  const soccerBall = createBall("soccerBall", textures);
  soccerBall.position.set(-8.5, BALL_SIZES.soccerBall - 0.1, 8); // Adjust Y based on size
  scene.add(soccerBall);

  // -------- Create checkerboard --------
  const boardSize = 5;
  const boardHeight = 0.2;
  const boardX = 3;
  const boardY = 0.125;
  const boardZ = -3;

  const boardGeometry = new THREE.BoxGeometry(
    boardSize,
    boardHeight,
    boardSize
  );
  const boardMaterial = new THREE.MeshPhongMaterial({ map: textures.checkers });
  const board = new THREE.Mesh(boardGeometry, boardMaterial);
  board.position.set(boardX, boardY, boardZ);
  scene.add(board);

  // Add checker pieces
  addCheckerPieces(scene, board);
}

function setupLights(scene) {
  // Add a directional light
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 10, 10);
  scene.add(light);

  // Add an ambient light
  const ambientLight = new THREE.AmbientLight(0x404040); // Soft light
  scene.add(ambientLight);
}

function render(renderer, scene, camera, controls, textures) {
  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  controls.update(); // Update the controls

  // Render the scene
  renderer.render(scene, camera);
  requestAnimationFrame(() =>
    render(renderer, scene, camera, controls, textures)
  );
}

function main() {
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

  const camera = setupCamera(canvas);
  const scene = new THREE.Scene();

  // Load all textures
  const textures = loadTextures();

  // Setup the sky, ground, and controls
  setupSky(scene);
  setupGround(scene, textures);
  const controls = setupOrbitControls(camera, renderer);

  // Setup lights
  setupLights(scene);

  // Load custom models
  addTrees(scene);
  addPicnicBasket(scene);

  // Draw the scene once
  drawStaticScene(scene, textures);

  // Start rendering
  render(renderer, scene, camera, controls, textures);
}

main();
