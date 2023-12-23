import * as THREE from "three";
import * as CANNON from "cannon-es";
import { BoxCollider } from "./Colliders";
import { World } from "./World";

export enum ItemType {
  Animal,
}

export enum AnimalType {
  Giraffe,
  Penguin,
}

export class ItemParams {
  world: World;
  position: THREE.Vector3;

  constructor(world: World, position: THREE.Vector3) {
    this.world = world;
    this.position = position;
  }
}

export default abstract class Item extends THREE.Object3D {
  world: World;
  light: THREE.PointLight;
  model: THREE.Group = new THREE.Group();
  collider: BoxCollider;

  constructor(params: ItemParams, model: THREE.Group) {
    super();
    this.world = params.world;

    // Placeholder box model
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.light = new THREE.PointLight(0x404040, 2);
    this.model.add(new THREE.Mesh(geometry, material));

    this.model.add(this.light);
    this.model.castShadow = true;
    this.model.receiveShadow = true;

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
      friction: 0.5,
    });

    this.collider.body.addEventListener("collide", (e) => {
      if (e.body.collisionFilterGroup === 2) this.world.onGoalReached();
    });

    this.setPosition(params.position);

    this.world.scene.add(this.model);
    this.world.physicsWorld.addBody(this.collider.body);
  }

  public setPosition(position: THREE.Vector3): void {
    this.model.position.copy(position);
    this.collider.body.position.copy(
      new CANNON.Vec3(position.x, position.y, position.z)
    );
  }

  public getLight(): THREE.PointLight {
    return this.light;
  }
}

export class Animal extends Item {
  animalType: AnimalType;

  constructor(params: ItemParams, animalType: AnimalType) {
    // Add logic to select model based on animalType
    const animalModel = new THREE.Group();
    super(params, animalModel);
    this.Init(animalType);
  }

  private Init(animalType: AnimalType) {
    this.animalType = animalType;
  }
}
