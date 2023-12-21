import * as THREE from "three";

export enum ItemType {
  Animal,
}

export enum AnimalType {
  Giraffe,
  Penguin,
}

export default abstract class Item {
  light: THREE.PointLight;
  constructor() {
    this.light = new THREE.PointLight(0x404040, 2);
  }

  public abstract getMesh(): THREE.Mesh;
  public getLight(): THREE.PointLight {
    return this.light;
  }
}

export class Animal extends Item {
  animalType: AnimalType;
  mesh: THREE.Mesh;

  constructor(params) {
    super();
    this.Init(params);
  }

  private Init(params) {
    this.animalType = params.animalType;
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.mesh = new THREE.Mesh(geometry, material);
  }

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }
}
