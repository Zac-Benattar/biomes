import * as THREE from "three";
import * as CANNON from "cannon-es";
import { BoxCollider } from "./Colliders";
import GameController from "./GameController";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export enum AnimalType {
  Hippo,
  Baboon,
  Elephant,
  Horse,
  Goat,
  BlackBear,
  Octopus,
  RedPanda,
}

class UrlScaleOffset {
  url: string;
  scale: number;
  yOffset: number = 0;

  constructor(url: string, scale: number, yOffset: number = 0) {
    this.url = url;
    this.scale = scale;
    this.yOffset = yOffset;
  }
}

export class ItemParams {
  gameContoller: GameController;
  position: THREE.Vector3;

  constructor(gameContoller: GameController, position: THREE.Vector3) {
    this.gameContoller = gameContoller;
    this.position = position;
  }
}

function getModelFileScaleOffset(animalType: AnimalType): UrlScaleOffset {
  switch (animalType) {
    case AnimalType.Baboon:
      return new UrlScaleOffset("./assets/models/baboon.glb", 0.05, -0.5);
    case AnimalType.BlackBear:
      return new UrlScaleOffset("./assets/models/black_bear.glb", 1.2, -0.4);
    case AnimalType.Elephant:
      return new UrlScaleOffset("./assets/models/elephant.glb", 0.1, -0.5);
    case AnimalType.Goat:
      return new UrlScaleOffset("./assets/models/goat.glb", 0.1, -0.19);
    case AnimalType.Hippo:
      return new UrlScaleOffset("./assets/models/hippo.glb", 0.45, -0.21);
    case AnimalType.Horse:
      return new UrlScaleOffset("./assets/models/horse.glb", 0.5, 0.2);
    case AnimalType.Octopus:
      return new UrlScaleOffset("./assets/models/octopus.glb", 0.03, -0.5);
    case AnimalType.RedPanda:
      return new UrlScaleOffset("./assets/models/red_panda.glb", 0.001, -0.2);
    default:
      console.log("No model found for animal type: " + animalType);
  }
}

export default abstract class Item extends THREE.Object3D {
  gameController: GameController;
  light: THREE.PointLight;
  model: THREE.Group = new THREE.Group();
  collider: BoxCollider;
  yOffset: number = 0;

  constructor(
    params: ItemParams,
    url: string,
    scale: number = 1,
    yOffset: number = 0
  ) {
    super();
    this.gameController = params.gameContoller;
    this.yOffset = yOffset;

    // Placeholder box model
    this.loadModel(url, scale, yOffset);

    this.collider = new BoxCollider({
      mass: 1,
      position: new CANNON.Vec3(
        this.position.x,
        this.position.y,
        this.position.z
      ),
      width: 1,
      height: 1,
      depth: 1,
      friction: 0,
    });

    this.collider.body.addEventListener("collide", (e: CANNON.EventTarget) => {
      if (!this.gameController.goalReached && e.body.collisionFilterGroup === 2)
        this.gameController.onGoalReached();
    });

    this.setPosition(params.position);

    this.gameController.scene.add(this.model);
    this.gameController.physicsWorld.addBody(this.collider.body);
  }

  protected abstract loadModel(
    url: string,
    scale: number,
    yOffset: number
  ): void;

  public setPosition(position: THREE.Vector3): void {
    this.position.copy(position);
    this.model.position.copy(position);
    this.collider.body.position.copy(
      new CANNON.Vec3(position.x, position.y, position.z)
    );
    console.log("Item position: " + this.position);
  }

  public getLight(): THREE.PointLight {
    return this.light;
  }
}

export class Animal extends Item {
  animalType: AnimalType;

  constructor(params: ItemParams, animalType: AnimalType) {
    // Add logic to select model based on animalType
    const { url, scale, yOffset } = getModelFileScaleOffset(animalType);
    super(params, url, scale, yOffset);
    this.Init(animalType);
  }

  loadModel(url: string, scale: number = 1) {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      this.model = gltf.scene.children[0] as THREE.Group;
      this.model.scale.set(scale, scale, scale);
      this.gameController.scene.add(this.model);

      this.model.castShadow = true;
      this.model.receiveShadow = true;

      // Update model position to match collider
      this.setPosition(this.position);
    });
  }

  setPosition(position: THREE.Vector3): void {
    const modelPosition = new THREE.Vector3(
      position.x,
      position.y + this.yOffset,
      position.z
    );
    this.position.copy(position);
    console.log("offset " + this.yOffset);
    this.model.position.copy(modelPosition);
    this.collider.body.position.copy(
      new CANNON.Vec3(position.x, position.y, position.z)
    );
  }

  private Init(animalType: AnimalType) {
    this.animalType = animalType;
  }
}
