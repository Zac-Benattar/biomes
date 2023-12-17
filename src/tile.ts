import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import Item from "./items";
import { Biome } from "./island";

export enum TileType {
  Stone,
  Dirt,
  Dirt2,
  Sand,
  Grass,
  Water,
  MartianSand,
}

export enum TileFeature {
  Rock,
  AlpineTree,
  Grass,
  Snow,
  Cactus,
  Tumbleweed,
  AnimalSkull,
  Coral,
  Seaweed,
  Shell,
  Anchor,
  Rockformation,
  Log,
  Mushroom,
  Lillypad,
  Flowers,
  Acorn,
  None,
}

export default class Tile {
  height: number;
  position: THREE.Vector3;
  tileType: TileType;
  feature: TileFeature;
  item: Item;

  constructor(height, position, tile_type, feature, item) {
    this.height = height;
    this.position = position;
    this.tileType = tile_type;
    this.feature = feature;
    this.item = item;
  }

  private hexGeometry(height, position) {
    let geo = new THREE.CylinderGeometry(1, 1, height, 6, 1, false);
    geo.translate(position.x, height / 2, position.y);

    return geo;
  }

  public getHexTileGeometry() {
    let geo = this.hexGeometry(this.height, this.position);
    let stoneGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
    let dirtGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
    let dirt2Geo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
    let sandGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
    let grassGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
    let martianSandGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
    let featureMesh: THREE.Group = new THREE.Group();
    let itemMesh: THREE.Group = new THREE.Group();

    if (this.tileType === TileType.Stone) {
      stoneGeo = BufferGeometryUtils.mergeGeometries([stoneGeo, geo]);
    } else if (this.tileType === TileType.Dirt) {
      dirtGeo = BufferGeometryUtils.mergeGeometries([dirtGeo, geo]);
    } else if (this.tileType === TileType.Dirt2) {
      dirt2Geo = BufferGeometryUtils.mergeGeometries([dirt2Geo, geo]);
    } else if (this.tileType === TileType.Grass) {
      grassGeo = BufferGeometryUtils.mergeGeometries([grassGeo, geo]);
    } else if (this.tileType === TileType.Sand) {
      sandGeo = BufferGeometryUtils.mergeGeometries([sandGeo, geo]);
    } else if (this.tileType === TileType.MartianSand) {
      sandGeo = BufferGeometryUtils.mergeGeometries([sandGeo, geo]);
    }

    if (this.feature === TileFeature.Rock) {
      featureMesh.add(this.rock(this.height, this.position));
    } else if (this.feature === TileFeature.AlpineTree) {
      featureMesh.add(this.alpineTree(this.height, this.position));
    }

    // return a list of geometries
    return [
      stoneGeo,
      dirtGeo,
      dirt2Geo,
      sandGeo,
      grassGeo,
      martianSandGeo,
      featureMesh,
      itemMesh,
    ];
  }

  private rock(height, position) {
    const px = Math.random() * 0.5 - 0.25;
    const py = Math.random() * 0.5 - 0.25;

    const geo = new THREE.SphereGeometry(Math.random() * 0.3 + 0.1, 7, 7);
    geo.translate(position.x + px, height, position.y + py);

    let rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      flatShading: true,
    });

    let rockMesh = new THREE.Mesh(geo, rockMaterial);

    return rockMesh;
  }

  private alpineTree(height, position) {
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
    midLeavesGeo.translate(
      position.x,
      height + treeHeight * 0.7 + 1,
      position.y
    );

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
      color: 0x4f7942,
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

    return tree;
  }
}
