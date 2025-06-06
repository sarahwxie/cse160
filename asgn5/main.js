import * as THREE from "three";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/OutlinePass.js";
import { ShaderPass } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/ShaderPass.js";
import { GammaCorrectionShader } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/shaders/GammaCorrectionShader.js";

const BALL_SIZES = {
  beachBall: 2,
  basketball: 1.8,
  soccerBall: 1.5,
};

const MOVES = [
  { from: [2, 1], to: [3, 2] }, // red
  { from: [5, 2], to: [4, 3] }, // black
  { from: [2, 3], to: [3, 4] }, // red
  { from: [5, 4], to: [4, 5] }, // black
  { from: [3, 2], to: [5, 4] }, // red captures black at [4,3]
  { from: [5, 6], to: [4, 7] }, // black
  { from: [2, 5], to: [3, 6] }, // red
  { from: [6, 1], to: [5, 2] }, // black
  { from: [3, 4], to: [4, 3] }, // red
  { from: [5, 2], to: [3, 4] }, // black captures red at [4,5]
];

let scene = null;
let board = null;
let raycaster = null;
let hoveredObject = null;
let mouse = null;
let billboard = null;
let yellowBook = null;

function createBillboard(scene) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 256;
  canvas.height = 128;

  // Draw text on the canvas
  context.fillStyle = "yellow";
  context.font = "bold 30px monospace";
  context.textAlign = "center";
  context.fillText("Key Found!", canvas.width / 2, canvas.height / 2);

  // Create a texture from the canvas
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  billboard = new THREE.Sprite(material);

  // Position the billboard above the yellow book
  billboard.scale.set(2, 1, 1); // Adjust size
  billboard.visible = false; // Initially hidden
  scene.add(billboard);
}

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
    coke: textureLoader.load("./textures/coke.png", () =>
      console.log("Coke texture loaded")
    ), // Load the coke texture
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
  ground.receiveShadow = true; // Ground receives shadows
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

function resizeRendererToDisplaySize(renderer, composer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;

  if (needResize) {
    renderer.setSize(width, height, false); // Update renderer size
    composer.setSize(width, height); // Update composer size
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

      // Enable shadows for all meshes in the model
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true; // Enable casting shadows
          child.receiveShadow = true; // Enable receiving shadows
        }
      });

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

      // Enable shadows for all meshes in the model
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true; // Enable casting shadows
          child.receiveShadow = true; // Enable receiving shadows
        }
      });

      model.position.set(32, 0, 32);
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

function addLantern(scene) {
  const loader = new GLTFLoader();
  loader.load(
    "./models/lantern.glb", // Path to the lantern model
    (gltf) => {
      const model = gltf.scene;
      model.position.set(8, 0.8, 5); // Position the lantern
      model.scale.set(0.01, 0.01, 0.01); // Scale the lantern
      model.rotation.y = Math.PI / 4; // Rotate the lantern if needed

      // Add a point light to the lantern
      const lanternLight = new THREE.PointLight(0xffe08a, 2, 20); // Softer yellow light, stronger intensity, slower falloff
      lanternLight.position.set(8, 1.5, 5); // Slightly above the lantern
      lanternLight.castShadow = true; // Enable shadow casting

      // Configure shadow properties
      lanternLight.shadow.mapSize.width = 1024; // Shadow map resolution
      lanternLight.shadow.mapSize.height = 1024;
      lanternLight.shadow.camera.near = 0.1; // Near clipping plane
      lanternLight.shadow.camera.far = 30; // Far clipping plane

      scene.add(lanternLight); // Add the light to the scene
      scene.add(model); // Add the lantern model to the scene

      console.log("Lantern model and light loaded successfully!");
    },
    undefined,
    (error) => {
      console.error(
        "An error occurred while loading the lantern model:",
        error
      );
    }
  );
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
    piece.userData.isCheckerPiece = true; // Mark as a checker piece
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

function playCheckersGame(scene, board) {
  const boardSize = 5;
  const numSquares = 8;
  const squareSize = boardSize / numSquares;

  const boardX = board.position.x;
  const boardZ = board.position.z;
  const pieceY = board.position.y + 0.125; // Slightly above the board

  // Define the initial positions of the pieces
  const pieces = [];
  scene.traverse((object) => {
    if (object.userData.isCheckerPiece) {
      pieces.push(object);
    }
  });

  // Helper function to calculate positions
  function getPosition(row, col) {
    const x = boardX - boardSize / 2 + col * squareSize + squareSize / 2;
    const z = boardZ - boardSize / 2 + row * squareSize + squareSize / 2;
    return { x, y: pieceY, z };
  }

  // Animate the moves using GSAP
  function animateMoves(index = 0) {
    if (index >= MOVES.length) {
      // Reset the board after the game finishes
      setTimeout(() => resetBoard(scene, board), 2000);
      return;
    }

    const move = MOVES[index];
    const fromPos = getPosition(move.from[0], move.from[1]);
    const toPos = getPosition(move.to[0], move.to[1]);

    // Find the piece at the starting position
    const piece = pieces.find(
      (p) =>
        Math.abs(p.position.x - fromPos.x) < 0.01 &&
        Math.abs(p.position.z - fromPos.z) < 0.01
    );

    // console.log(`Move #${index + 1}:`, move);

    if (piece) {
      // Detect if it's a capture (move spans two rows/cols)
      const rowDiff = Math.abs(move.from[0] - move.to[0]);
      const colDiff = Math.abs(move.from[1] - move.to[1]);
      let capturedPiece = null;

      if (rowDiff === 2 && colDiff === 2) {
        // Get midpoint of the move
        const midRow = (move.from[0] + move.to[0]) / 2;
        const midCol = (move.from[1] + move.to[1]) / 2;
        const midPos = getPosition(midRow, midCol);

        // Find the piece to be captured
        capturedPiece = pieces.find(
          (p) =>
            Math.abs(p.position.x - midPos.x) < 0.01 &&
            Math.abs(p.position.z - midPos.z) < 0.01
        );

        if (!capturedPiece) {
          console.log(
            `Move #${index + 1} is illegal: No piece to capture at midpoint.`
          );
        }
      }

      // Animate the move
      gsap.to(piece.position, {
        x: toPos.x,
        z: toPos.z,
        duration: 1.5, // Increased duration for slower movement
        onComplete: () => {
          if (capturedPiece) {
            scene.remove(capturedPiece);
            pieces.splice(pieces.indexOf(capturedPiece), 1);
          }

          // Check if two pieces occupy the same space
          const overlappingPiece = pieces.find(
            (p) =>
              p !== piece &&
              Math.abs(p.position.x - piece.position.x) < 0.01 &&
              Math.abs(p.position.z - piece.position.z) < 0.01
          );

          if (overlappingPiece) {
            // Calculate the row and column from the position
            const col = Math.round(
              (piece.position.x - (boardX - boardSize / 2)) / squareSize
            );
            const row = Math.round(
              (piece.position.z - (boardZ - boardSize / 2)) / squareSize
            );

            console.log(
              `Error: After move #${
                index + 1
              }, two pieces occupy the same space at row ${row}, column ${col}.`
            );
          }

          animateMoves(index + 1);
        },
      });
    } else {
      console.log(
        `Move #${index + 1} is illegal: No piece found at starting position.`
      );
      animateMoves(index + 1); // Skip to the next move
    }
  }

  // Start the animation
  animateMoves();
}

function resetBoard(scene, board) {
  if (!scene || !board) {
    console.error("Scene or board is undefined in resetBoard.");
    return;
  }

  // Remove all checker pieces
  const toRemove = [];
  scene.traverse((object) => {
    if (object.userData.isCheckerPiece) {
      toRemove.push(object);
    }
  });
  toRemove.forEach((obj) => scene.remove(obj));

  // Re-add the checker pieces
  addCheckerPieces(scene, board);

  // Replay the game
  playCheckersGame(scene, board);
}

function createBlock(width, height, depth, color) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshPhongMaterial({ color });
  const block = new THREE.Mesh(geometry, material);
  block.castShadow = true;
  block.receiveShadow = true;
  return block;
}

function addPyramid(scene) {
  const cubeSize = 1; // Smaller size for each cube
  const cubeHeight = cubeSize; // Height of each cube (same as size for a cube)

  // Offset for fine-tuning the position of the stack
  const stackPosition = { x: 2, z: 8.5 };

  // Bottom-left cube
  const bottomLeftCube = createBlock(cubeSize, cubeHeight, cubeSize, 0xfaa0a0);
  bottomLeftCube.position.set(
    stackPosition.x - cubeSize / 2,
    cubeHeight / 2,
    stackPosition.z
  );
  bottomLeftCube.rotation.y = Math.PI / 3; // Rotate 45 degrees about the Y-axis
  scene.add(bottomLeftCube);

  // Bottom-right cube
  const bottomRightCube = createBlock(cubeSize, cubeHeight, cubeSize, 0xc1e1c1);
  bottomRightCube.position.set(
    stackPosition.x + cubeSize / 2 + 0.4,
    cubeHeight / 2,
    stackPosition.z
  );
  bottomRightCube.rotation.y = Math.PI / 5; // Rotate 45 degrees about the Y-axis
  scene.add(bottomRightCube);

  // Top cube
  const topCube = createBlock(cubeSize, cubeHeight, cubeSize, 0xa7c7e7);
  topCube.position.set(
    stackPosition.x,
    cubeHeight + cubeHeight / 2,
    stackPosition.z
  );
  topCube.rotation.y = Math.PI / 6; // Rotate 45 degrees about the Y-axis
  scene.add(topCube);
}

function drawSodas(scene, clumpX, clumpZ, textures) {
  const sodaRadius = 0.5; // Radius of the soda can
  const sodaHeight = 1.5; // Height of the soda can
  const sodaColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff]; // Colors for the soda cans

  // Define positions and rotations for the soda cans
  const sodaPositions = [
    { x: -5, z: 5, rotationX: 0, rotationZ: 0 }, // Standing upright
    { x: -4, z: 6, rotationX: Math.PI / 2, rotationZ: -Math.PI / 4 }, // Lying down, rotated 45° about Y
    { x: -6, z: 4.5, rotationX: 0, rotationZ: 0 }, // Standing upright
    { x: -5.5, z: 6.5, rotationX: Math.PI / 2, rotationZ: Math.PI / 3 }, // Lying down, rotated 60° about Y
    { x: -4.5, z: 4, rotationX: 0, rotationZ: 0 }, // Standing upright
  ];

  for (let i = 0; i < sodaPositions.length; i++) {
    const geometry = new THREE.CylinderGeometry(
      sodaRadius,
      sodaRadius,
      sodaHeight,
      32
    );

    // Create materials for the sides and the top/bottom
    const topBottomMaterial = new THREE.MeshPhongMaterial({
      map: textures.coke,
    });
    const sideMaterial = new THREE.MeshPhongMaterial({ color: 0xc0c0c0 });

    // Combine the materials into an array
    const materials = [topBottomMaterial, sideMaterial, topBottomMaterial];

    // Create the soda can mesh
    const sodaCan = new THREE.Mesh(geometry, materials);

    // Adjust the y position based on rotation
    const isLyingDown = sodaPositions[i].rotationX === Math.PI / 2;
    const adjustedY = isLyingDown
      ? sodaHeight / 2 - sodaRadius // Adjust for lying down
      : sodaHeight / 2; // Default for standing upright

    // Set position and rotation
    sodaCan.position.set(
      clumpX + sodaPositions[i].x,
      adjustedY,
      clumpZ + sodaPositions[i].z
    );
    sodaCan.rotation.x = sodaPositions[i].rotationX; // Rotate to lie down if needed
    sodaCan.rotation.z = sodaPositions[i].rotationZ; // Rotate about Y-axis if lying down

    // Add the soda can to the scene
    scene.add(sodaCan);
  }
}

function drawBooks(scene, x, y, z) {
  const bookWidth = 3; // Width of the book
  const bookHeight = 0.5; // Height of the book
  const bookDepth = 2; // Depth of the book

  // Colors for the books
  const bookColors = [0xacb1d9, 0xdbc38c]; // Blue and yellow

  // Create the bottom book
  const bottomBook = createBlock(
    bookWidth,
    bookHeight,
    bookDepth,
    bookColors[0]
  );
  bottomBook.position.set(x, y + bookHeight / 2, z); // Position the bottom book
  bottomBook.rotation.y = Math.PI / 12; // Rotate the bottom book slightly about the Y-axis
  scene.add(bottomBook);

  // Create the top (yellow) book
  yellowBook = createBlock(bookWidth, bookHeight, bookDepth, bookColors[1]);
  yellowBook.position.set(x, y + bookHeight + bookHeight / 2, z); // Position the top book above the bottom book
  yellowBook.rotation.y = -Math.PI / 18; // Rotate the top book slightly about the Y-axis
  scene.add(yellowBook);
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

  // draw the block pyramid
  addPyramid(scene);

  // draw sodas
  drawSodas(scene, 14, -5, textures);
  drawSodas(scene, -1, -10, textures);

  // draw books
  drawBooks(scene, -7, 0, -1);

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
  board = new THREE.Mesh(boardGeometry, boardMaterial);
  board.position.set(boardX, boardY, boardZ);
  scene.add(board);

  // Add checker pieces
  addCheckerPieces(scene, board);

  // Start the checkers game
  playCheckersGame(scene, board);
}

function setupLights(scene) {
  // Add a stronger directional light
  const light = new THREE.DirectionalLight(0xffffff, 0.3);
  light.position.set(13, 20, 13);
  light.castShadow = true; // Enable shadow casting

  // Optional: Configure shadow properties
  light.shadow.mapSize.width = 1024; // Shadow map resolution
  light.shadow.mapSize.height = 1024;
  light.shadow.camera.near = 0.5; // Near clipping plane
  light.shadow.camera.far = 50; // Far clipping plane
  light.shadow.camera.left = -20; // Adjust the shadow camera frustum
  light.shadow.camera.right = 20;
  light.shadow.camera.top = 20;
  light.shadow.camera.bottom = -20;
  scene.add(light);

  // Add a softer ambient light
  const ambientLight = new THREE.AmbientLight(0x404040, 0.3); // Reduced intensity to 0.5
  scene.add(ambientLight);

  // Add a hemisphere light
  const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x228b22, 0.1); // Sky color, ground color, intensity
  scene.add(hemisphereLight);
}

function enableShadowsForAllObjects(scene) {
  scene.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true; // Enable casting shadows
      object.receiveShadow = true; // Enable receiving shadows
    }
  });
}

function render(
  renderer,
  scene,
  camera,
  controls,
  textures,
  composer,
  outlinePass
) {
  if (resizeRendererToDisplaySize(renderer, composer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  controls.update(); // Update the controls

  // Perform raycasting
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true); // Check all objects in the scene

  if (intersects.length > 0) {
    const firstIntersected = intersects[0].object;

    // If the hovered object changes, reset the previous one
    if (hoveredObject && hoveredObject !== firstIntersected) {
      outlinePass.selectedObjects = []; // Clear the outline for the previous object
      hoveredObject = null;
      if (billboard) billboard.visible = false; // Hide the billboard
    }

    // Highlight the new hovered object
    if (firstIntersected.isMesh) {
      hoveredObject = firstIntersected;
      outlinePass.selectedObjects = [hoveredObject]; // Add the object to the outline pass
      // Show the billboard if the yellow book is hovered
      if (hoveredObject === yellowBook && billboard) {
        billboard.position.set(
          yellowBook.position.x,
          yellowBook.position.y + 1.5,
          yellowBook.position.z
        );
        billboard.visible = true;
      }
    }
  } else if (hoveredObject) {
    // Reset the previously hovered object if no object is intersected
    outlinePass.selectedObjects = [];
    hoveredObject = null;
    if (billboard) billboard.visible = false; // Hide the billboard
  }

  // Render the scene with postprocessing
  composer.render();
  requestAnimationFrame(() =>
    render(renderer, scene, camera, controls, textures, composer, outlinePass)
  );
}

function main() {
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  renderer.shadowMap.enabled = true; // Enable shadow maps
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const camera = setupCamera(canvas);
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x808080, 10, 50);

  // Raycasting
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Mouse event listener
  window.addEventListener("mousemove", (event) => {
    const canvas = renderer.domElement;

    // Convert mouse position to normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / canvas.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / canvas.clientHeight) * 2 + 1;
  });

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
  addLantern(scene);

  // Draw the scene once
  drawStaticScene(scene, textures);

  // Create the billboard
  createBillboard(scene);

  // Enable shadows for all objects
  enableShadowsForAllObjects(scene);

  // Postprocessing setup
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const outlinePass = new OutlinePass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    scene,
    camera
  );
  outlinePass.edgeStrength = 2.5; // Strength of the outline
  outlinePass.edgeGlow = 0.0; // Glow effect
  outlinePass.edgeThickness = 1.0; // Thickness of the outline
  outlinePass.pulsePeriod = 0; // No pulsing
  outlinePass.visibleEdgeColor.set(0xffff00); // Yellow outline
  outlinePass.hiddenEdgeColor.set(0x000000); // Hidden edges are black
  composer.addPass(outlinePass);

  const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
  composer.addPass(gammaCorrectionPass);

  // Start rendering
  render(renderer, scene, camera, controls, textures, composer, outlinePass);
}

main();
