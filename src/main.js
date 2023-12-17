import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import Island from "./island";
import { Biome } from "./island";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0, 0);
document.body.appendChild(renderer.domElement);

camera.position.y = 20;
camera.position.z = 20;

const light = new THREE.PointLight(0xffcb8e, 400, 200);
light.position.set(10, 20, 10);
light.castShadow = true;
light.shadow.mapSize.width = 512;
light.shadow.mapSize.height = 512;
light.shadow.camera.near = 1;
light.shadow.camera.far = 200;
scene.add(light);

const light2 = new THREE.PointLight(0xffcb8e, 100, 200);
light2.position.set(0, 20, 0);
light2.castShadow = true;
light2.shadow.mapSize.width = 512;
light2.shadow.mapSize.height = 512;
light2.shadow.camera.near = 1;
light2.shadow.camera.far = 200;
scene.add(light2);

const MAX_HEIGHT = 10;

(async function () {
  let island = new Island(Biome.Alpine, 0, 15, 0, 0, 0, MAX_HEIGHT, 2);
  island.addToScene(scene);

  renderer.setAnimationLoop(() => {
    controls.update();
    island.update();
    renderer.render(scene, camera);
  });
})();
