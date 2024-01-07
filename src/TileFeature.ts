import * as THREE from "three";
import * as CANNON from "cannon-es";
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";
import GameController from "./GameController";

export enum FeatureType {
  Rock = "Rock",
  BasicTree = "BasicTree",
  AlpineTree = "AlpineTree",
  JungleTree = "JungleTree",
  SavannaTree = "SavannaTree",
  // Cactus = "Cactus",
  // Tumbleweed = "Tumbleweed",
  // AnimalSkull = "AnimalSkull",
  // Coral = "Coral",
  // Seaweed = "Seaweed",
  // Shell = "Shell",
  // Anchor = "Anchor",
  // RockFormation = "RockFormation",
  // Log = "Log",
  // Mushroom = "Mushroom",
  // Lilypad = "Lilypad",
  // Flowers = "Flowers",
  // Acorn = "Acorn",
}

export class TileFeature extends THREE.Object3D {
  public gameContoller: GameController;
  public featureType: FeatureType;
  public model: THREE.Group = new THREE.Group();
  public cannonBody: CANNON.Body;
  private tileRadius = 0.5;

  constructor(
    gameContoller: GameController,
    featureType: FeatureType,
    position: THREE.Vector3
  ) {
    super();
    this.gameContoller = gameContoller;
    this.featureType = featureType;

    switch (featureType) {
      case FeatureType.Rock:
        this.rock(position);
        break;
      case FeatureType.BasicTree:
        this.basicTree(position);
        break;
      case FeatureType.AlpineTree:
        this.alpineTree(position);
        break;
      case FeatureType.JungleTree:
        this.jungleTree(position);
        break;
      case FeatureType.SavannaTree:
        this.savannaTree(position);
        break;
    }

    this.gameContoller.scene.add(this.model);
    this.gameContoller.physicsWorld.addBody(this.cannonBody);
  }

  /* Creates a rock mesh at the specified position */
  private rock(position: THREE.Vector3) {
    const px = Math.random() * 0.5 - this.tileRadius / 2;
    const pz = Math.random() * 0.5 - this.tileRadius / 2;
    const radius = Math.random() * 0.3 + 0.1;

    const geo = new THREE.SphereGeometry(radius, 7, 7);
    geo.translate(position.x + px, position.y, position.z + pz);

    let rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      flatShading: true,
    });

    let rockMesh = new THREE.Mesh(geo, rockMaterial);
    rockMesh.castShadow = true;
    rockMesh.receiveShadow = true;

    this.model.clear();
    this.model.add(rockMesh);
    this.cannonBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Sphere(radius),
      position: new CANNON.Vec3(position.x + px, position.y, position.z + pz),
    });
  }

  /* Creates an alpine tree mesh at the specified position */
  private alpineTree(position: THREE.Vector3) {
    const treeHeight = Math.random() * 1 + 1.25;

    const trunkGeo = new THREE.CylinderGeometry(0.1, 0.2, treeHeight, 10);
    trunkGeo.translate(position.x, position.y + treeHeight * 0.4, position.z);

    const lowerLeavesGeo = new THREE.CylinderGeometry(0, 1.3, treeHeight, 3);
    lowerLeavesGeo.translate(
      position.x,
      position.y + treeHeight * 0.3 + 1,
      position.z
    );

    const midLeavesGeo = new THREE.CylinderGeometry(0, 1, treeHeight, 3);
    midLeavesGeo.translate(
      position.x,
      position.y + treeHeight * 0.7 + 1,
      position.z
    );

    const upperLeavesGeo = new THREE.CylinderGeometry(0, 0.6, treeHeight, 3);
    upperLeavesGeo.translate(
      position.x,
      position.y + treeHeight * 1.25 + 1,
      position.z
    );

    const leaves = BufferGeometryUtils.mergeGeometries([
      lowerLeavesGeo,
      midLeavesGeo,
      upperLeavesGeo,
    ]);

    let leavesMaterial = new THREE.MeshStandardMaterial({
      color: 0x4f7942,
      flatShading: true,
    });

    let trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      flatShading: true,
    });

    let trunkMesh = new THREE.Mesh(trunkGeo, trunkMaterial);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;

    let leavesMesh = new THREE.Mesh(leaves, leavesMaterial);
    leavesMesh.castShadow = true;
    leavesMesh.receiveShadow = true;

    let tree = new THREE.Group();
    tree.add(trunkMesh, leavesMesh);

    this.model.clear();
    this.model.add(tree);
    this.cannonBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Cylinder(0.1, 0.2, treeHeight, 10),
      position: new CANNON.Vec3(position.x, position.y, position.z),
    });
  }

  /* Creates a basic tree mesh at the specified position */
  private basicTree(position: THREE.Vector3) {
    const treeHeight = Math.random() * 1 + 1.25;

    const trunkGeo = new THREE.CylinderGeometry(0.1, 0.2, treeHeight, 10);
    trunkGeo.translate(position.x, position.y + treeHeight * 0.4, position.z);

    const puff1Radius = Math.random() * 0.5 + 0.2;
    const puff2Radius = Math.random() * 0.5 + 0.5;
    const puff3Radius = Math.random() * 0.5 + 0.2;

    const puff1 = new THREE.SphereGeometry(puff1Radius, 7, 7);
    const puff2 = new THREE.SphereGeometry(puff2Radius, 7, 7);
    const puff3 = new THREE.SphereGeometry(puff3Radius, 7, 7);

    puff1.translate(-puff1Radius, 0, 0);
    puff1.rotateY(puff1Radius * Math.PI * 2);
    puff2.translate(0, 0, 0);
    puff3.translate(puff3Radius, 0, 0);
    puff3.rotateY(puff3Radius * Math.PI * 2);

    const leavesGeo = BufferGeometryUtils.mergeGeometries([
      puff1,
      puff2,
      puff3,
    ]);
    leavesGeo.translate(position.x, position.y + treeHeight * 0.9, position.z);

    let leavesMaterial = new THREE.MeshStandardMaterial({
      color: 0x4f7942,
      flatShading: true,
    });

    let trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      flatShading: true,
    });

    let trunkMesh = new THREE.Mesh(trunkGeo, trunkMaterial);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;

    let leavesMesh = new THREE.Mesh(leavesGeo, leavesMaterial);
    leavesMesh.castShadow = true;
    leavesMesh.receiveShadow = true;

    let tree = new THREE.Group();
    tree.add(trunkMesh, leavesMesh);

    this.model.clear();
    this.model.add(tree);
    this.cannonBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Cylinder(0.1, 0.2, treeHeight, 10),
      position: new CANNON.Vec3(position.x, position.y, position.z),
    });
  }

  /* Creates a jungle tree mesh at the specified position */
  private jungleTree(position: THREE.Vector3) {
    const treeHeight = Math.random() * 3 + 4;

    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, treeHeight, 10);
    trunkGeo.translate(position.x, position.y + treeHeight * 0.4, position.z);

    const puff1Radius = Math.random() * 0.8 + 0.5;
    const puff2Radius = Math.random() * 0.8 + 0.8;
    const puff3Radius = Math.random() * 0.8 + 0.5;
    const puff1 = new THREE.SphereGeometry(puff1Radius, 7, 7);
    const puff2 = new THREE.SphereGeometry(puff2Radius, 7, 7);
    const puff3 = new THREE.SphereGeometry(puff3Radius, 7, 7);

    puff1.translate(-puff1Radius, 0, 0);
    puff1.rotateY(puff1Radius * Math.PI * 2);
    puff2.translate(0, 0, 0);
    puff3.translate(puff3Radius, 0, 0);
    puff3.rotateY(puff3Radius * Math.PI * 2);

    const leavesGeo = BufferGeometryUtils.mergeGeometries([
      puff1,
      puff2,
      puff3,
    ]);
    leavesGeo.translate(position.x, position.y + treeHeight * 0.9, position.z);

    let leavesMaterial = new THREE.MeshStandardMaterial({
      color: 0x4f7942,
      flatShading: true,
    });

    let trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      flatShading: true,
    });

    let trunkMesh = new THREE.Mesh(trunkGeo, trunkMaterial);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;

    let leavesMesh = new THREE.Mesh(leavesGeo, leavesMaterial);
    leavesMesh.castShadow = true;
    leavesMesh.receiveShadow = true;

    let tree = new THREE.Group();
    tree.add(trunkMesh, leavesMesh);

    this.model.clear();
    this.model.add(tree);
    this.cannonBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Cylinder(0.3, 0.4, treeHeight, 10),
      position: new CANNON.Vec3(position.x, position.y, position.z),
    });
  }

  /* Creates a savanna tree mesh at the specified position */
  private savannaTree(position: THREE.Vector3) {
    const puffCount = 200;
    const treeHeight = Math.random() * 1 + 3.5;
    const domeHeight = Math.random() * 0.1 + 0.3;
    const domeRadius = 2;

    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.3, treeHeight, 10);
    trunkGeo.translate(position.x, position.y + treeHeight * 0.4, position.z);

    let puffs = [];

    for (let i = 0; i < puffCount; i++) {
      const puffRadius = Math.random() * 0.2 + 0.1;
      const puff = new THREE.SphereGeometry(puffRadius, 7, 7);

      // Generate random spherical coordinates
      const theta = Math.random() * 2 * Math.PI; // azimuthal angle
      const phi = Math.acos(2 * Math.random() - 1) * domeHeight; // polar angle

      // Convert spherical coordinates to Cartesian coordinates
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);

      // Scale the coordinates to the dome's radius
      const scaledX = x * domeRadius;
      const scaledY = y * domeRadius;
      const scaledZ = z * domeRadius;

      puff.translate(scaledX, scaledY - domeRadius, scaledZ);
      puffs.push(puff);
    }

    const leavesGeo = BufferGeometryUtils.mergeGeometries(puffs);
    leavesGeo.translate(position.x, position.y + treeHeight * 0.9, position.z);

    let leavesMaterial = new THREE.MeshStandardMaterial({
      color: 0x4f7942,
      flatShading: true,
    });

    let trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      flatShading: true,
    });

    let trunkMesh = new THREE.Mesh(trunkGeo, trunkMaterial);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;

    let leavesMesh = new THREE.Mesh(leavesGeo, leavesMaterial);
    leavesMesh.castShadow = true;
    leavesMesh.receiveShadow = true;

    let tree = new THREE.Group();
    tree.add(trunkMesh, leavesMesh);

    this.model.clear();
    this.model.add(tree);
    this.cannonBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Cylinder(0.25, 0.3, treeHeight, 10),
      position: new CANNON.Vec3(
        position.x,
        position.y + treeHeight * 0.4,
        position.z
      ),
    });
  }
}
