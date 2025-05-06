import * as THREE from "three";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/OrbitControls.js";

function main() {
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

  const fov = 75;
  const aspect = canvas.clientWidth / canvas.clientHeight;
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 0, 0);

  const scene = new THREE.Scene();

  // Set the sky color
  scene.background = new THREE.Color(0x86aab5); // Updated sky color

  // Load the grass texture
  const textureLoader = new THREE.TextureLoader();
  const grassTexture = textureLoader.load("./textures/grass.jpg");

  // Set the texture to repeat
  grassTexture.wrapS = THREE.RepeatWrapping;
  grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(10, 10); // Repeat the texture 10 times in both directions

  // Create the ground
  const groundGeometry = new THREE.PlaneGeometry(50, 50);
  const groundMaterial = new THREE.MeshPhongMaterial({ map: grassTexture }); // Use the texture
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
  scene.add(ground);

  // Add a light source
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 10, 10);
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0x404040); // Soft light
  scene.add(ambientLight);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // Enable smooth damping (inertia)
  controls.dampingFactor = 0.05; // Damping factor
  controls.screenSpacePanning = true; // Allow panning in screen space
  controls.rotateSpeed = -1; // Reverse the horizontal rotation direction

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

  function render() {
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    controls.update(); // Update the controls

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();
