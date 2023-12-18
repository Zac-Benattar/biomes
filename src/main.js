import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import Island from "./island";
import Player from "./player";
import { Biome } from "./island";
import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";

const windowSize = {
  width: window.innerWidth,
  height: window.innerHeight
}

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

camera.position.y = 25;
camera.position.z = 25;

const MAX_HEIGHT = 10;

window.addEventListener("resize", () => {
  windowSize.width = window.innerWidth;
  windowSize.height = window.innerHeight;

  camera.aspect = windowSize.width / windowSize.height;
  camera.updateProjectionMatrix();

  renderer.setSize(windowSize.width, windowSize.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

(async function () {
  let island = new Island(Biome.Alpine, 0, 15, 0, 0, 0, MAX_HEIGHT, 2);
  island.addToScene(scene);
  island.enableLights(scene);

  let player = new Player(new THREE.Vector3(0, 10, 0), 1);
  player.addToScene(scene);

  const physicsWorld = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0),
  });
  const groundBody = new CANNON.Body({
    mass: 0,
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
    material: new CANNON.Material(),
  });
  groundBody.quaternion.setFromAxisAngle(
    new CANNON.Vec3(1, 0, 0),
    -Math.PI / 2
  );
  physicsWorld.addBody(groundBody);
  physicsWorld.addBody(player.body);

  let cannonDebugger = new CannonDebugger(scene, physicsWorld);

  island.getCannonBodies().forEach((body) => {
    physicsWorld.addBody(body);
  });

  renderer.setAnimationLoop(() => {
    physicsWorld.fixedStep();
    player.updateVisuals();
    cannonDebugger.update();
    controls.update();
    island.update();
    renderer.render(scene, camera);
  });
})();
