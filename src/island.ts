import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createNoise2D } from "simplex-noise";
import Item from "./items";
import Tile from "./tiles";

export enum Biome {
  Forest,
  Desert,
  Alpine,
  Plains,
  Ocean,
}

export default class Island {
  Biome: Biome;
  seed: number;
  x: number;
  y: number;
  z: number;
  max_height: number;
  min_height: number;
  tiles: Array<Tile>;
  items: Array<Item>;

  constructor(biome, seed, x, y, z, max_height, min_height) {
    this.Biome = biome;
    this.seed = seed;
    this.x = x;
    this.y = y;
    this.z = z;
    this.max_height = max_height;
    this.min_height = min_height;
    this.tiles = [];
    this.items = [];

    let stoneGeo = new THREE.BoxGeometry(0, 0, 0);
    let dirtGeo = new THREE.BoxGeometry(0, 0, 0);
    let dirt2Geo = new THREE.BoxGeometry(0, 0, 0);
    let sandGeo = new THREE.BoxGeometry(0, 0, 0);
    let grassGeo = new THREE.BoxGeometry(0, 0, 0);

    const noise2D = createNoise2D(this.randomFunction); // Create a seeded 2D noise function - gives values between -1 and 1

    for (let y = -15; y < 15; y++) {
      for (let x = -15; x < 15; x++) {
        let position = this.tileToPosition(x, y);
        if (position.length() > 16) continue;

        let noise = (noise2D(x * 0.1, y * 0.1) + 1) / 2; // Normalize noise to 0-1
        noise = Math.pow(noise, 1.5); // Smooths out the noise
        let height = noise * max_height;

        this.createHex(height, this.tileToPosition(x, y));
      }
    }

    let stoneMesh = new THREE.Mesh(
      stoneGeo,
      new THREE.MeshBasicMaterial({
        color: 0x888888,
        // flatShading: true,
      })
    );

    let dirtMesh = new THREE.Mesh(
      dirtGeo,
      new THREE.MeshBasicMaterial({
        color: 0x8b4513,
        // flatShading: true,
      })
    );

    let dirt2Mesh = new THREE.Mesh(
      dirt2Geo,
      new THREE.MeshBasicMaterial({
        color: 0x8b4543,
        // flatShading: true,
      })
    );

    let sandMesh = new THREE.Mesh(
      sandGeo,
      new THREE.MeshBasicMaterial({
        color: 0xf4a460,
        // flatShading: true,
      })
    );

    let grassMesh = new THREE.Mesh(
      grassGeo,
      new THREE.MeshBasicMaterial({
        color: 0x85bb65,
        // flatShading: true,
      })
    );

    let waterMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(17, 17, max_height * 0.2, 50),
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
    waterMesh.position.set(0, max_height * 0.1, 0);
    scene.add(waterMesh);

    let islandContainerMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(17.1, 17.1, max_height * 0.25, 1, true),
      new THREE.MeshPhysicalMaterial({
        color: 0xaaaaff,
        roughness: 1,
        side: THREE.DoubleSide,
      })
    );
    islandContainerMesh.receiveShadow = true;
    islandContainerMesh.position.set(0, max_height * 0.125, 0);
    scene.add(islandContainerMesh);

    let islandFloorMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(17.1, 17.1, max_height * 0.1, 50),
      new THREE.MeshBasicMaterial({
        color: 0x888888,
        // flatShading: true,
        side: THREE.DoubleSide,
      })
    );
    islandFloorMesh.receiveShadow = true;
    islandFloorMesh.position.set(0, max_height * 0.05, 0);
    scene.add(islandFloorMesh);

    scene.add(stoneMesh, dirtMesh, dirt2Mesh, sandMesh, grassMesh);

    this.getClouds();
  }

  private tileToPosition(tileX, tileY) {
    return new THREE.Vector2((tileX + (tileY % 2) * 0.5) * 1.77, tileY * 1.535);
  }
  
  private randomFunction() {
    return Math.random();
  }

  private getClouds() {
    let geo: THREE.BufferGeometry = new THREE.SphereGeometry(0, 0, 0);
    let count = Math.floor(Math.pow(Math.random(), 0.45) * 5);

    for (let i = 0; i < count; i++) {
      const puff1 = new THREE.SphereGeometry(1.2, 7, 7);
      const puff2 = new THREE.SphereGeometry(1.5, 7, 7);
      const puff3 = new THREE.SphereGeometry(0.9, 7, 7);

      puff1.translate(-1.85, Math.random() * 0.3, 0);
      puff2.translate(0, Math.random() * 0.3, 0);
      puff3.translate(1.85, Math.random() * 0.3, 0);

      const cloudGeo = BufferGeometryUtils.mergeGeometries([
        puff1,
        puff2,
        puff3,
      ]);
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

    return mesh;
  }

  distanceToPoint(x, y, z) {
    return Math.sqrt(
      Math.pow(this.x - x, 2) +
        Math.pow(this.y - y, 2) +
        Math.pow(this.z - z, 2)
    );
  }
}
