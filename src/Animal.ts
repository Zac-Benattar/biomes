import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import Item, { ItemParams, UrlScaleOffset } from "./Item";

export enum AnimalType {
  Hippo,
  Baboon,
  Elephant,
  Horse,
  Goat,
  BlackBear,
  Octopus,
  RedPanda,
  Bison,
  Fox,
  Giraffe,
  Ibex,
  Kangaroo,
  Lion,
  Penguin,
  PolarBear,
  Shark,
  Snake,
  Camel,
  Alligator,
  Turtle,
}

/* Bodge fix to get model file, scale and yOffset from animal type. 
This should be replaced with a proper model loader class, 
and models should be scaled and zero'd correctly at the creation level. */
function getModelFileScaleOffsetFromAnimalType(
  animalType: AnimalType
): UrlScaleOffset {
  switch (animalType) {
    case AnimalType.Baboon:
      return new UrlScaleOffset("./assets/models/baboon.glb", 0.05, -0.5);
    case AnimalType.BlackBear:
      return new UrlScaleOffset("./assets/models/black_bear.glb", 1, -0.46);
    case AnimalType.Elephant:
      return new UrlScaleOffset("./assets/models/elephant.glb", 0.1, -0.5);
    case AnimalType.Goat:
      return new UrlScaleOffset("./assets/models/goat.glb", 0.1, -0.19);
    case AnimalType.Hippo:
      return new UrlScaleOffset("./assets/models/hippo.glb", 0.45, -0.21);
    case AnimalType.Horse:
      return new UrlScaleOffset("./assets/models/horse.glb", 0.5, 0.1);
    case AnimalType.Octopus:
      return new UrlScaleOffset("./assets/models/octopus.glb", 0.03, -0.5);
    case AnimalType.RedPanda:
      return new UrlScaleOffset("./assets/models/red_panda.glb", 0.001, -0.2);
    case AnimalType.Bison:
        return new UrlScaleOffset("./assets/models/bison.glb", 0.01, 0.28);
    case AnimalType.Fox:
        return new UrlScaleOffset("./assets/models/fox.glb", 0.012, -0.68);
    case AnimalType.Giraffe:
        return new UrlScaleOffset("./assets/models/giraffe.glb", 3, 0.9);
    case AnimalType.Ibex:
        return new UrlScaleOffset("./assets/models/ibex.glb", 0.001, 0);
    case AnimalType.Kangaroo:
        return new UrlScaleOffset("./assets/models/kangaroo.glb", 3, -0.5);
    case AnimalType.Lion:
        return new UrlScaleOffset("./assets/models/lion.glb", 0.0038, -0.05);
    case AnimalType.Penguin:
        return new UrlScaleOffset("./assets/models/penguin.glb", 0.11, -0.42);
    case AnimalType.PolarBear:
        return new UrlScaleOffset("./assets/models/polar_bear.glb", 0.8, -0.5);
    case AnimalType.Shark:
        return new UrlScaleOffset("./assets/models/shark.glb", 0.08, 0);
    case AnimalType.Snake:
        return new UrlScaleOffset("./assets/models/snaek.glb", 7, -0.38);
    case AnimalType.Camel:
        return new UrlScaleOffset("./assets/models/camel.glb", 0.0045, -0.5);
    case AnimalType.Alligator:
        return new UrlScaleOffset("./assets/models/alligator.glb", 0.2, -0.49);
    case AnimalType.Turtle:
        return new UrlScaleOffset("./assets/models/turtle.glb", 0.12, -0.5);
    default:
      console.log("No model found for animal type: " + animalType);
  }
}

export class Animal extends Item {
  animalType: AnimalType;

  constructor(params: ItemParams, animalType: AnimalType) {
    const { url, scale, yOffset } = getModelFileScaleOffsetFromAnimalType(animalType);
    super(params, url, scale, yOffset);
    this.Init(animalType);
  }

  /* Loads model from url. Sets position, shadow settings and yOffset. 
  Randomly rotates the model in the z axis so each animal doesnt face
  the same direction every time. */
  loadModel(url: string, scale: number = 1) {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      this.model = gltf.scene.children[0] as THREE.Group;
      this.model.scale.set(scale, scale, scale);
      this.gameController.scene.add(this.model);

      this.model.castShadow = true;
      this.model.receiveShadow = true;

      this.model.rotateZ(Math.random() * 2 * Math.PI);

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
    this.model.position.copy(modelPosition);
    this.collider.body.position.copy(
      new CANNON.Vec3(position.x, position.y, position.z)
    );
  }

  private Init(animalType: AnimalType) {
    this.animalType = animalType;
  }
}
