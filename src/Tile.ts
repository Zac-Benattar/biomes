import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import Item, { Animal, AnimalType, ItemParams } from "./Item";
import * as CANNON from "cannon-es";
import World from "./World";
import { Collider } from "./Colliders";
import { FeatureType } from "./TileFeature";

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

export default class Tile {
  public world: World;
  public model: THREE.Group = new THREE.Group();
  public collider: Collider;
  public height: number;
  public position: THREE.Vector3;
  public tileType: TileType;
  public feature: FeatureType;
  public item: Item;
  public top: TileTop;
  public cannonBody: CANNON.Body;
  public marked: boolean;

  constructor(
    world: World,
    height: number,
    position: THREE.Vector3,
    tileType: TileType,
    feature: FeatureType,
    item: Item,
    top: TileTop
  ) {
    this.world = world;
    this.height = height;
    this.position = position;
    this.tileType = tileType;
    this.feature = feature;
    this.item = item;
    this.top = top;
    this.marked = false;

    this.Init();
  }

  private Init(): void {
    this.generateModel();
    this.world.scene.add(this.model);
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
          color: 0x8b4513,
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

    if (this.feature != TileFeature.None) {
      let featureMesh: THREE.Group = new THREE.Group();
      if (this.feature === TileFeature.Rock) {
        featureMesh.add(this.rock(this.height, this.position));
      } else if (this.feature === TileFeature.AlpineTree) {
        featureMesh.add(this.alpineTree(this.height, this.position));
      } else if (this.feature === TileFeature.BasicTree) {
        featureMesh.add(this.basicTree(this.height, this.position));
      } else if (this.feature === TileFeature.JungleTree) {
        featureMesh.add(this.jungleTree(this.height, this.position));
      }

      featureMesh.castShadow = true;
      featureMesh.receiveShadow = true;
      this.model.add(featureMesh);
    }
  }

  public getTileTopPosition(): THREE.Vector3 {
    return new THREE.Vector3(
      this.position.x,
      this.height + 0.5,
      this.position.z
    );
  }

  //refactor
  public getCannonBodies(): CANNON.Body {
    let shape = new CANNON.Cylinder(1, 1, this.height, 6);
    let tileBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(
        this.position.x,
        this.height / 2,
        this.position.z
      ),
      shape: shape,
    });
    this.cannonBody = tileBody;

    // let featureBody = new CANNON.Body();
    // if (this.feature === TileFeature.Rock) {
    //   featureBody = this.getRockCannonBody();
    // } else if (this.feature === TileFeature.AlpineTree) {
    //   featureBody = this.getAlpineTreeCannonBody();
    // }

    return tileBody;
  }

  public GetItem(): Item {
    return this.item;
  }

  public SetGoal(animal: AnimalType): void {
    const itemParams = new ItemParams(this.world, this.getTileTopPosition());
    this.item = new Animal(itemParams, animal);
  }
}
