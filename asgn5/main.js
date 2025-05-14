import * as THREE from "three";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/OrbitControls.js";

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
  };

  return textures;
}

function setupGround(scene, textures) {
  const grassTexture = textures.grass;

  // Set the texture to zoom in
  grassTexture.wrapS = THREE.RepeatWrapping;
  grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(10, 10);

  const groundGeometry = new THREE.PlaneGeometry(50, 50);
  const groundMaterial = new THREE.MeshPhongMaterial({ map: grassTexture }); // Use the texture
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
  scene.add(ground);
}

function setupCamera(canvas) {
  const fov = 75;
  const aspect = canvas.clientWidth / canvas.clientHeight;
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(-10, 10, -5);
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

// code pulled from sportballs library: https://github.com/jeromeetienne/threex.sportballs/tree/master
// library was not used directly, because it's outdated & uses old version of THREE
function createBeachBall(textures) {
  const texture = textures.beachBall; // Use the preloaded beach ball texture

  const geometry = new THREE.SphereGeometry(2, 32, 32);
  const material = new THREE.MeshPhongMaterial({
    map: texture,
    bumpMap: texture,
    bumpScale: 0.01,
  });

  const beachBall = new THREE.Mesh(geometry, material);
  return beachBall;
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

function drawScene(scene, textures) {
  // Create a cube
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1); // Cube with dimensions 1x1x1
  const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 }); // Green color
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

  // Set the cube's position to the origin
  cube.position.set(0, 0.5, 0); // Slightly raise it above the ground (y = 0.5)
  scene.add(cube);

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
  beachBall.position.set(10, BALL_SIZES.beachBall - 0.1, 10); // Adjust Y based on size
  beachBall.rotation.z = THREE.MathUtils.degToRad(50); // Rotate 50 degrees about the Z-axis
  scene.add(beachBall);

  // Add a basketball to the center of the picnic blanket
  const basketball = createBall("basketball", textures);
  basketball.position.set(7, BALL_SIZES.basketball - 0.1, 0); // Adjust Y based on size
  scene.add(basketball);

  // Add a soccer ball to the bottom-right corner of the picnic blanket
  const soccerBall = createBall("soccerBall", textures);
  soccerBall.position.set(7, BALL_SIZES.soccerBall - 0.1, 5); // Adjust Y based on size
  scene.add(soccerBall);
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

  // Add a light source
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 10, 10);
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0x404040); // Soft light
  scene.add(ambientLight);

  // Draw the scene once
  drawScene(scene, textures);

  // Start rendering
  render(renderer, scene, camera, controls, textures);
}

main();
