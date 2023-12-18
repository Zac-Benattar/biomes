import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import Island from "./island";
import { Biome } from "./island";
import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";

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

camera.position.y = 30;
camera.position.z = 30;

const light = new THREE.PointLight(0xffcb8e, 100, 200);
light.position.set(10, 20, 10);
light.castShadow = true;
light.shadow.mapSize.width = 512;
light.shadow.mapSize.height = 512;
light.shadow.camera.near = 1;
light.shadow.camera.far = 200;
scene.add(light);

const sun = new THREE.DirectionalLight(0xffcb8e, 1.5);
sun.position.set(40, 200, 40);
sun.castShadow = true;
sun.shadow.mapSize.width = 512;
sun.shadow.mapSize.height = 512;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 200;
sun.target.position.set(0, 0, 0);
scene.add(sun);

const moon = new THREE.DirectionalLight(0xffcb8e, 0.1);
moon.position.set(-40, -200, -40);
moon.castShadow = true;
moon.shadow.mapSize.width = 512;
moon.shadow.mapSize.height = 512;
moon.shadow.camera.near = 1;
moon.shadow.camera.far = 200;
moon.target.position.set(0, 0, 0);
scene.add(moon);

const MAX_HEIGHT = 10;

(async function () {
  let island = new Island(Biome.Alpine, 0, 15, 0, 0, 0, MAX_HEIGHT, 2);
  island.addToScene(scene);
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

  const testSphere = new CANNON.Body({
    mass: 1,
    type: CANNON.Body.DYNAMIC,
    shape: new CANNON.Sphere(1),
    material: new CANNON.Material(),
  });
  testSphere.position.set(0, 10, 0);
  physicsWorld.addBody(testSphere);

  let cannonDebugger = new CannonDebugger(scene, physicsWorld);

  // add the cannon bodies of the island to the physics world
  island.getCannonBodies().forEach((body) => {
    physicsWorld.addBody(body);
  });

  renderer.setAnimationLoop(() => {
    physicsWorld.fixedStep();
    cannonDebugger.update();
    controls.update();
    island.update();
    renderer.render(scene, camera);
  });
})();
