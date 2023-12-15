import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import { BoxGeometry } from "three";
import { createNoise2D } from "simplex-noise";

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

const light = new THREE.PointLight(0xffcb8e, 80, 200);
light.position.set(10, 20, 10);
light.castShadow = true;
light.shadow.mapSize.width = 512;
light.shadow.mapSize.height = 512;
light.shadow.camera.near = 1;
light.shadow.camera.far = 200;
scene.add(light);

const MAX_HEIGHT = 10;

function hexGeometry(height, position) {
  let geo = new THREE.CylinderGeometry(1, 1, height, 6, 1, false);
  geo.translate(position.x, height / 2, position.y);

  return geo;
}

function createHex(height, position) {
  let geo = hexGeometry(height, position);

  if (height > 9) {
    stoneGeo = BufferGeometryUtils.mergeGeometries([stoneGeo, geo]);
  }
  else if (height > 7) {
    dirtGeo = BufferGeometryUtils.mergeGeometries([dirtGeo, geo]);
  }
  else if (height > 5) {
    dirt2Geo = BufferGeometryUtils.mergeGeometries([dirt2Geo, geo]);
  }
  else if (height > 3) {
    sandGeo = BufferGeometryUtils.mergeGeometries([sandGeo, geo]);
  }
  else if (height > 0) {
    grassGeo = BufferGeometryUtils.mergeGeometries([grassGeo, geo]);
  }
}

function tileToPosition(tileX, tileY) {
  return new THREE.Vector2((tileX + (tileY % 2) * 0.5) * 1.77, tileY * 1.535);
}

let stoneGeo = new THREE.BoxGeometry(0, 0, 0);
let dirtGeo = new THREE.BoxGeometry(0, 0, 0);
let dirt2Geo = new THREE.BoxGeometry(0, 0, 0);
let sandGeo = new THREE.BoxGeometry(0, 0, 0);
let grassGeo = new THREE.BoxGeometry(0, 0, 0);

function randomFunction() {
  return Math.random();
}

(async function () {
  const noise2D = createNoise2D(randomFunction); // Create a seeded 2D noise function - gives values between -1 and 1

  for (let y = -15; y < 15; y++) {
    for (let x = -15; x < 15; x++) {
      let position = tileToPosition(x, y);
      if (position.length() > 16) continue;

      let noise = (noise2D(x * 0.1, y * 0.1) + 1) / 2; // Normalize noise to 0-1
      noise = Math.pow(noise, 1.5); // Smooths out the noise
      let height = noise * MAX_HEIGHT;

      createHex(height, tileToPosition(x, y));
    }
  }

  let stoneMesh = new THREE.Mesh(
    stoneGeo,
    new THREE.MeshStandardMaterial({
      color: 0x888888,
      flatShading: true,
    })
  );

  let dirtMesh = new THREE.Mesh(
    dirtGeo,
    new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      flatShading: true,
    })
  );

  let dirt2Mesh = new THREE.Mesh(
    dirt2Geo,
    new THREE.MeshStandardMaterial({
      color: 0x8b4543,
      flatShading: true,
    })
  );

  let sandMesh = new THREE.Mesh(
    sandGeo,
    new THREE.MeshStandardMaterial({
      color: 0xf4a460,
      flatShading: true,
    })
  );

  let grassMesh = new THREE.Mesh(
    grassGeo,
    new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      flatShading: true,
    })
  );

  scene.add(stoneMesh, dirtMesh, dirt2Mesh, sandMesh, grassMesh);

  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });
})();
