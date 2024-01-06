import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import Item, { ItemParams } from "./Item";
import { Animal, AnimalType } from "./Animal";
import * as CANNON from "cannon-es";
import GameController from "./GameController";
import { HexTileCollider } from "./Colliders";
import { FeatureType, TileFeature } from "./TileFeature";

export enum TileType {
  Stone = "Stone",
  Dirt = "Dirt",
  Mud = "Mud",
  Sand = "Sand",
  Grass = "Grass",
  Water = "Water",
  MartianSand = "MartianSand",
  Snow = "Snow",
}

export enum TileTop {
  None = "None",
  Snow = "Snow",
  Grass = "Grass",
}

export default class Tile extends THREE.Object3D {
  public gameContoller: GameController;
  public model: THREE.Group = new THREE.Group();
  public collider: HexTileCollider;
  public height: number;
  public position: THREE.Vector3;
  public tileType: TileType;
  public feature: TileFeature;
  public item: Item;
  public top: TileTop;

  constructor(
    gameContoller: GameController,
    height: number,
    position: THREE.Vector3,
    tileType: TileType,
    featureType: FeatureType,
    item: Item,
    top: TileTop
  ) {
    super();
    this.gameContoller = gameContoller;
    this.height = height;
    this.position.set(position.x, position.y, position.z);
    this.tileType = tileType;
    if (featureType !== undefined)
      this.feature = new TileFeature(
        gameContoller,
        featureType,
        new THREE.Vector3(position.x, height, position.z)
      );
    this.item = item;
    this.top = top;

    this.Init();
  }

  private Init(): void {
    this.generateModel();
    this.createPhysicsBody();
    this.gameContoller.scene.add(this.model);
    this.gameContoller.physicsWorld.addBody(this.collider.body);
  }

  public removeFromWorld(): void {
    if (this.feature !== undefined && this.feature !== null) {
      this.gameContoller.scene.remove(this.feature.model);
      this.gameContoller.physicsWorld.removeBody(this.feature.cannonBody);
    }
    if (this.item !== undefined && this.item !== null) {
      this.gameContoller.scene.remove(this.item.model);
      this.gameContoller.physicsWorld.removeBody(this.item.collider.body);
    }
    this.gameContoller.scene.remove(this.model);
    this.gameContoller.physicsWorld.removeBody(this.collider.body);
  }

  private hexGeometry(
    height: number,
    position: THREE.Vector3
  ): THREE.BufferGeometry {
    let geo = new THREE.CylinderGeometry(1, 1, height, 6, 1, false);
    geo.translate(position.x, height / 2, position.z);

    return geo;
  }

  private snowGeometry(position: THREE.Vector3): THREE.BufferGeometry {
    let geo = new THREE.CylinderGeometry(1, 1, 0.1, 6, 1, false);
    geo.translate(position.x, position.y, position.z);

    return geo;
  }

  private generateModel(): void {
    let geo = this.hexGeometry(this.height, this.position);
    geo.name = "baseHexagon";

    if (this.tileType === TileType.Stone) {
      let stoneGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
      stoneGeo = BufferGeometryUtils.mergeGeometries([stoneGeo, geo]);
      let stoneMesh = new THREE.Mesh(
        stoneGeo,
        new THREE.MeshStandardMaterial({
          color: 0x888888,
          flatShading: true,
        })
      );
      stoneMesh.castShadow = true;
      stoneMesh.receiveShadow = true;
      stoneMesh.name = "baseHexagon";
      this.model.add(stoneMesh);
    } else if (this.tileType === TileType.Dirt) {
      let dirtGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
      dirtGeo = BufferGeometryUtils.mergeGeometries([dirtGeo, geo]);
      let dirtMesh = new THREE.Mesh(
        dirtGeo,
        new THREE.MeshStandardMaterial({
          color: 0x8b4513,
          flatShading: true,
        })
      );
      dirtMesh.castShadow = true;
      dirtMesh.receiveShadow = true;
      dirtMesh.name = "baseHexagon";
      this.model.add(dirtMesh);
    } else if (this.tileType === TileType.Mud) {
      let mudGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
      mudGeo = BufferGeometryUtils.mergeGeometries([mudGeo, geo]);
      let mudMesh = new THREE.Mesh(
        mudGeo,
        new THREE.MeshStandardMaterial({
          color: 0x8b4543,
          flatShading: true,
        })
      );
      mudMesh.castShadow = true;
      mudMesh.receiveShadow = true;
      mudMesh.name = "baseHexagon";
      this.model.add(mudMesh);
    } else if (this.tileType === TileType.Grass) {
      let grassGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
      grassGeo = BufferGeometryUtils.mergeGeometries([grassGeo, geo]);
      let grassMesh = new THREE.Mesh(
        grassGeo,
        new THREE.MeshStandardMaterial({
          color: 0x4f7942,
          flatShading: true,
        })
      );
      grassMesh.castShadow = true;
      grassMesh.receiveShadow = true;
      grassMesh.name = "baseHexagon";
      this.model.add(grassMesh);
    } else if (this.tileType === TileType.Sand) {
      let sandGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
      sandGeo = BufferGeometryUtils.mergeGeometries([sandGeo, geo]);
      let sandMesh = new THREE.Mesh(
        sandGeo,
        new THREE.MeshStandardMaterial({
          color: 0xc2b280,
          flatShading: true,
        })
      );
      sandMesh.castShadow = true;
      sandMesh.receiveShadow = true;
      sandMesh.name = "baseHexagon";
      this.model.add(sandMesh);
    } else if (this.tileType === TileType.MartianSand) {
      let martianSandGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
      martianSandGeo = BufferGeometryUtils.mergeGeometries([
        martianSandGeo,
        geo,
      ]);
      let martianSandMesh = new THREE.Mesh(
        martianSandGeo,
        new THREE.MeshStandardMaterial({
          color: 0x8b4513,
          flatShading: true,
        })
      );
      martianSandMesh.castShadow = true;
      martianSandMesh.receiveShadow = true;
      martianSandMesh.name = "baseHexagon";
      this.model.add(martianSandMesh);
    }

    if (this.top === TileTop.Snow) {
      let snowGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
      let snowTopGeo = this.snowGeometry(
        new THREE.Vector3(this.position.x, this.height + 0.05, this.position.z)
      );
      snowGeo = BufferGeometryUtils.mergeGeometries([snowGeo, snowTopGeo]);
      let snowMesh = new THREE.Mesh(
        snowGeo,
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          flatShading: true,
        })
      );
      snowMesh.receiveShadow = true;
      this.model.add(snowMesh);
    } else if (this.top === TileTop.Grass) {
      let grassGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
      let grassTopGeo = this.snowGeometry(
        new THREE.Vector3(this.position.x, this.height + 0.05, this.position.z)
      );
      grassGeo = BufferGeometryUtils.mergeGeometries([grassGeo, grassTopGeo]);
      let grassMesh = new THREE.Mesh(
        grassGeo,
        new THREE.MeshStandardMaterial({
          color: 0x4f7942,
          flatShading: true,
        })
      );
      grassMesh.receiveShadow = true;
      this.model.add(grassMesh);
    }
  }

  public getTileTopPosition(): THREE.Vector3 {
    return new THREE.Vector3(this.position.x, this.height, this.position.z);
  }

  public getTileItemPosition(): THREE.Vector3 {
    return new THREE.Vector3(
      this.position.x,
      this.height + 0.5,
      this.position.z
    );
  }

  private createPhysicsBody() {
    this.collider = new HexTileCollider({
      mass: 0,
      position: new CANNON.Vec3(this.position.x, this.height, this.position.z),
      radius: 1,
      height: this.height,
      friction: 0.3,
    });
  }

  public GetItem(): Item {
    return this.item;
  }

  public SetGoal(animal: AnimalType): Animal {
    const itemParams = new ItemParams(
      this.gameContoller,
      this.getTileItemPosition()
    );
    this.item = new Animal(itemParams, animal);
    return this.item as Animal;
  }
}
