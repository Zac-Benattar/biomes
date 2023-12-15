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

const light = new THREE.PointLight(0xffcb8e, 800, 200);
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

  if (height > 8) {
    stoneGeo = BufferGeometryUtils.mergeGeometries([stoneGeo, geo]);

    if (Math.random() > 0.8) {
      stoneGeo = BufferGeometryUtils.mergeGeometries([
        stoneGeo,
        rock(height, position),
      ]);
    }
  } else if (height > 7) {
    dirtGeo = BufferGeometryUtils.mergeGeometries([dirtGeo, geo]);
  } else if (height > 5) {
    dirt2Geo = BufferGeometryUtils.mergeGeometries([dirt2Geo, geo]);
  } else if (height > 3) {
    grassGeo = BufferGeometryUtils.mergeGeometries([grassGeo, geo]);

    if (Math.random() > 0.8) {
      alpineTree(height, position);
    }
  } else if (height > 0) {
    sandGeo = BufferGeometryUtils.mergeGeometries([sandGeo, geo]);

    if (Math.random() > 0.8) {
      sandGeo = BufferGeometryUtils.mergeGeometries([
        sandGeo,
        rock(height, position),
      ]);
    }
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

let waterMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(17, 17, MAX_HEIGHT * 0.2, 50),
  new THREE.MeshPhysicalMaterial({
    color: 0x55aaff,
    transparent: true,
    transmission: 0.9,
    opacity: 0.5,
    ior: 1.4,
    reflectivity: 0.5,
    metalness: 0.02,
    roughness: 1,
    thickness: 1.5,
  })
);
waterMesh.receiveShadow = true;
waterMesh.position.set(0, MAX_HEIGHT * 0.1, 0);
scene.add(waterMesh);

let islandContainerMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(17.1, 17.1, MAX_HEIGHT * 0.25, 1, true),
  new THREE.MeshPhysicalMaterial({
    color: 0xaaaaff,
    roughness: 1,
    side: THREE.DoubleSide,
  })
);
islandContainerMesh.receiveShadow = true;
islandContainerMesh.position.set(0, MAX_HEIGHT * 0.125, 0);
scene.add(islandContainerMesh);

let islandFloorMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(17.1, 17.1, MAX_HEIGHT * 0.1, 50),
  new THREE.MeshStandardMaterial({
    color: 0x888888,
    flatShading: true,
    side: THREE.DoubleSide,
  })
);
islandFloorMesh.receiveShadow = true;
islandFloorMesh.position.set(0, MAX_HEIGHT * 0.05, 0);
scene.add(islandFloorMesh);

function rock(height, position) {
  const px = Math.random() * 0.5 - 0.25;
  const py = Math.random() * 0.5 - 0.25;

  const geo = new THREE.SphereGeometry(Math.random() * 0.3 + 0.1, 7, 7);
  geo.translate(position.x + px, height, position.y + py);

  return geo;
}

function alpineTree(height, position) {
  const treeHeight = Math.random() * 1 + 1.25;

  const trunkGeo = new THREE.CylinderGeometry(0.1, 0.2, treeHeight, 10);
  trunkGeo.translate(position.x, height + treeHeight * 0.4, position.y);

  const lowerLeavesGeo = new THREE.CylinderGeometry(0, 1.3, treeHeight, 3);
  lowerLeavesGeo.translate(
    position.x,
    height + treeHeight * 0.3 + 1,
    position.y
  );

  const midLeavesGeo = new THREE.CylinderGeometry(0, 1, treeHeight, 3);
  midLeavesGeo.translate(position.x, height + treeHeight * 0.7 + 1, position.y);

  const upperLeavesGeo = new THREE.CylinderGeometry(0, 0.6, treeHeight, 3);
  upperLeavesGeo.translate(
    position.x,
    height + treeHeight * 1.25 + 1,
    position.y
  );

  const leaves = BufferGeometryUtils.mergeGeometries([
    lowerLeavesGeo,
    midLeavesGeo,
    upperLeavesGeo,
  ]);

  let leavesMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    flatShading: true,
  });

  let trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    flatShading: true,
  });

  let trunkMesh = new THREE.Mesh(trunkGeo, trunkMaterial);

  let leavesMesh = new THREE.Mesh(leaves, leavesMaterial);

  let tree = new THREE.Group();
  tree.add(trunkMesh, leavesMesh);

  scene.add(tree);

  return tree;
}

function clouds() {
  let geo = new THREE.SphereGeometry(0, 0, 0);
  let count = Math.floor(Math.pow(Math.random(), 0.45) * 5);

  for (let i = 0; i < count; i++) {
    const puff1 = new THREE.SphereGeometry(1.2, 7, 7);
    const puff2 = new THREE.SphereGeometry(1.5, 7, 7);
    const puff3 = new THREE.SphereGeometry(0.9, 7, 7);

    puff1.translate(-1.85, Math.random() * 0.3, 0);
    puff2.translate(0, Math.random() * 0.3, 0);
    puff3.translate(1.85, Math.random() * 0.3, 0);

    const cloudGeo = BufferGeometryUtils.mergeGeometries([puff1, puff2, puff3]);
    cloudGeo.translate(
      Math.random() * 20 - 10,
      Math.random() * 7 + 7,
      Math.random() * 20 - 10
    );
    cloudGeo.rotateY(Math.random() * Math.PI * 2);

    geo = BufferGeometryUtils.mergeGeometries([geo, cloudGeo]);
  }

  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      flatShading: true,
      transparent: true,
      opacity: 0.9,
    })
  );

  scene.add(mesh);
}

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

  clouds();

  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });
})();
