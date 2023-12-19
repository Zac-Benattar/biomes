import * as THREE from "three";
import * as CANNON from "cannon-es";
import Tile from "./tile";
import { CharacterControls, Action } from "../characterControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default class Player {
  model: THREE.Group;
  mixer: THREE.AnimationMixer;
  animationsMap: Map<string, THREE.AnimationAction>;
  body: CANNON.Body;
  velocity: CANNON.Vec3 = new CANNON.Vec3(0, 0, 0);
  rotation: THREE.Euler;
  controls: CharacterControls;

  constructor(position, rotation, orbitControl, camera) {
    this.rotation = rotation;
    const shape = new CANNON.Box(new CANNON.Vec3(0.25, 0.5, 0.25));
    const body = new CANNON.Body({ mass: 1 });
    body.addShape(shape);
    body.position.copy(position);
    body.velocity.copy(this.velocity);
    this.body = body;
    this.loadGLTFModel();
    this.controls = new CharacterControls(
      this.model,
      this.mixer,
      this.animationsMap,
      orbitControl,
      camera,
      Action.Idle
    );
  }

  public getFeetPosition() {
    return new THREE.Vector3(
      this.body.position.x,
      this.body.position.y - 0.5,
      this.body.position.z
    );
  }

  public move(direction: THREE.Vector3) {
    this.velocity.copy(direction);
    this.body.velocity.copy(direction);
  }

  public jump() {
    this.body.velocity.y = 5;
  }

  public switchRunToggle() {
    this.controls.switchRunToggle();
  }

  public distanceToTile(currentTile: Tile) {
    return this.body.position.distanceTo(currentTile.position);
  }

  public distanceFromFeetToTopOfTileBelow(currentTile: Tile) {
    const topOfTile = new THREE.Vector3(
      currentTile.position.x,
      currentTile.position.y,
      currentTile.height + 0.5
    );
    const distance = this.getFeetPosition().distanceTo(topOfTile);
    return distance;
  }

  public addToScene(scene: THREE.Scene) {
    scene.add(this.model);
  }

  public update(delta: number, keysPressed: any) {
    this.controls.update(delta, keysPressed);
  }

  public loadGLTFModel() {
    new GLTFLoader().load("models/Soldier.glb", function (gltf) {
      this.model = gltf.scene;
      this.model.traverse(function (object: any) {
        if (object.isMesh) object.castShadow = true;
      });

      const gltfAnimations: THREE.AnimationClip[] = gltf.animations;
      this.mixer = new THREE.AnimationMixer(this.model);
      this.animationsMap = new Map();
      gltfAnimations
        .filter((a) => a.name != "TPose")
        .forEach((a: THREE.AnimationClip) => {
          this.animationsMap.set(a.name, this.mixer.clipAction(a));
        });
    });
  }
}
