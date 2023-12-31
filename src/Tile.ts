import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import Item, { Animal, AnimalType, ItemParams } from "./Item";
import * as CANNON from "cannon-es";
import World from "./World";
import { Collider } from "./Colliders";

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

export enum TileFeature {
  Rock = "Rock",
  BasicTree = "BasicTree",
  AlpineTree = "AlpineTree",
  JungleTree = "JungleTree",
  SavannaTree = "SavannaTree",
  Grass = "Grass",
  Snow = "Snow",
  Cactus = "Cactus",
  Tumbleweed = "Tumbleweed",
  AnimalSkull = "AnimalSkull",
  Coral = "Coral",
  Seaweed = "Seaweed",
  Shell = "Shell",
  Anchor = "Anchor",
  RockFormation = "RockFormation",
  Log = "Log",
  Mushroom = "Mushroom",
  Lilypad = "Lilypad",
  Flowers = "Flowers",
  Acorn = "Acorn",
  None = "None",
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
  public feature: TileFeature;
  public item: Item;
  public top: TileTop;
  public cannonBody: CANNON.Body;
  public marked: boolean;

  constructor(
    world: World,
    height: number,
    position: THREE.Vector3,
    tileType: TileType,
    feature: TileFeature,
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
    } else if (this.tileType === TileType.Dirt2) {
      let dirt2Geo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
      dirt2Geo = BufferGeometryUtils.mergeGeometries([dirt2Geo, geo]);
      let dirt2Mesh = new THREE.Mesh(
        dirt2Geo,
        new THREE.MeshStandardMaterial({
          color: 0x8b4543,
          flatShading: true,
        })
      );
      dirt2Mesh.castShadow = true;
      dirt2Mesh.receiveShadow = true;
      dirt2Mesh.name = "baseHexagon";
      this.model.add(dirt2Mesh);
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
        new THREE.Vector3(this.position.x, this.position.y, this.height + 0.05)
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

  private rock(height: number, position: THREE.Vector3): THREE.Mesh {
    const px = Math.random() * 0.5 - 0.25;
    const pz = Math.random() * 0.5 - 0.25;

    const geo = new THREE.SphereGeometry(Math.random() * 0.3 + 0.1, 7, 7);
    geo.translate(position.x + px, height, position.z + pz);

    let rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      flatShading: true,
    });

    let rockMesh = new THREE.Mesh(geo, rockMaterial);
    rockMesh.castShadow = true;
    rockMesh.receiveShadow = true;

    return rockMesh;
  }

  private alpineTree(height: number, position: THREE.Vector3): THREE.Group {
    const treeHeight = Math.random() * 1 + 1.25;

    const trunkGeo = new THREE.CylinderGeometry(0.1, 0.2, treeHeight, 10);
    trunkGeo.translate(position.x, height + treeHeight * 0.4, position.z);

    const lowerLeavesGeo = new THREE.CylinderGeometry(0, 1.3, treeHeight, 3);
    lowerLeavesGeo.translate(
      position.x,
      height + treeHeight * 0.3 + 1,
      position.z
    );

    const midLeavesGeo = new THREE.CylinderGeometry(0, 1, treeHeight, 3);
    midLeavesGeo.translate(
      position.x,
      height + treeHeight * 0.7 + 1,
      position.z
    );

    const upperLeavesGeo = new THREE.CylinderGeometry(0, 0.6, treeHeight, 3);
    upperLeavesGeo.translate(
      position.x,
      height + treeHeight * 1.25 + 1,
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

    return tree;
  }

  private basicTree(height: number, position: THREE.Vector3): THREE.Group {
    const treeHeight = Math.random() * 1 + 1.25;

    const trunkGeo = new THREE.CylinderGeometry(0.1, 0.2, treeHeight, 10);
    trunkGeo.translate(position.x, height + treeHeight * 0.4, position.z);

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
    leavesGeo.translate(position.x, height + treeHeight * 0.9, position.z);

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

    return tree;
  }

  private jungleTree(height: number, position: THREE.Vector3): THREE.Group {
    const treeHeight = Math.random() * 3 + 3;

    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, treeHeight, 10);
    trunkGeo.translate(position.x, height + treeHeight * 0.4, position.z);

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
    leavesGeo.translate(position.x, height + treeHeight * 0.9, position.z);

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

    return tree;
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
