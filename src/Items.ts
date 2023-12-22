import * as THREE from "three";
import * as CANNON from "cannon-es";
import { BoxCollider} from "./Colliders";
import { World } from "./World";

export enum ItemType {
  Animal,
}

export enum AnimalType {
  Giraffe,
  Penguin,
}

export default abstract class Item extends THREE.Object3D {
  world: World;
  light: THREE.PointLight;
  model: THREE.Group = new THREE.Group();
  collider: BoxCollider;

  constructor(world: World, model: THREE.Group) {
    super();
    this.world = world;

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
      position: new CANNON.Vec3(0, 0, 0),
      width: 1,
      height: 1,
      depth: 1,
      friction: 0.5,
    });

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

  constructor(world: World, animalType: AnimalType) {
    // Add logic to select model based on animalType
    const animalModel = new THREE.Group();
    super(world, animalModel);
    this.Init(animalType);
  }

  private Init(animalType: AnimalType) {
    this.animalType = animalType;
  }
}