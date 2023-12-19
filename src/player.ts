import * as THREE from "three";
import * as CANNON from "cannon-es";
import Tile from "./tile";
import { CharacterControls, Action } from "../characterControls";

export default class Player {
  body: CANNON.Body;
  velocity: CANNON.Vec3 = new CANNON.Vec3(0, 0, 0);
  rotation: THREE.Euler;
  controls: CharacterControls;

  constructor(position, rotation, orbitControl, camera, scene) {
    this.rotation = rotation;
    const shape = new CANNON.Box(new CANNON.Vec3(0.25, 0.5, 0.25));
    const body = new CANNON.Body({ mass: 1 });
    body.addShape(shape);
    body.position.copy(position);
    body.velocity.copy(this.velocity);
    this.body = body;
    this.controls = new CharacterControls();
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

  public update(delta: number, keysPressed: any) {
    this.controls.update(delta, keysPressed);
  }
}
