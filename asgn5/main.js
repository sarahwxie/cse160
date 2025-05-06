import * as THREE from "three";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/OrbitControls.js";

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

function setupGround(scene) {
  const textureLoader = new THREE.TextureLoader();
  const grassTexture = textureLoader.load("./textures/grass.jpg");

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
  camera.position.set(0, 5, 10);
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

function render(renderer, scene, camera, controls) {
  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  controls.update(); // Update the controls
  renderer.render(scene, camera);
  requestAnimationFrame(() => render(renderer, scene, camera, controls));
}

function main() {
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

  const camera = setupCamera(canvas);
  const scene = new THREE.Scene();

  // Setup the sky, ground, and controls
  setupSky(scene);
  setupGround(scene);
  const controls = setupOrbitControls(camera, renderer);

  // Add a light source
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 10, 10);
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0x404040); // Soft light
  scene.add(ambientLight);

  // Start rendering
  render(renderer, scene, camera, controls);
}

main();
