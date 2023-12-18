import * as THREE from "three";
import * as CANNON from "cannon-es";
import Tile from "./tile";

export default class Player {
  body: CANNON.Body;
  mesh: THREE.Mesh;
  velocity: CANNON.Vec3 = new CANNON.Vec3(0, 0, 0);
  rotation: THREE.Euler;

  constructor(position, rotation) {
    this.rotation = rotation;
    const geometry = new THREE.BoxGeometry(0.5, 1, 0.5);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const box = new THREE.Mesh(geometry, material);
    box.position.copy(position);
    this.mesh = box;
    const shape = new CANNON.Box(new CANNON.Vec3(0.25, 0.5, 0.25));
    const body = new CANNON.Body({ mass: 1 });
    body.addShape(shape);
    body.position.copy(position);
    body.velocity.copy(this.velocity);
    this.body = body;
  }

  public getFeetPosition() {
    return new THREE.Vector3(
      this.mesh.position.x,
      this.mesh.position.y - 0.5,
      this.mesh.position.z
    );
  }

  public move(direction: THREE.Vector3) {
    this.velocity.copy(direction);
    this.body.velocity.copy(direction);
  }

  public jump() {
    this.body.velocity.y = 5;
  }

  public distanceToTile(currentTile: Tile) {
    return this.mesh.position.distanceTo(currentTile.position);
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
    scene.add(this.mesh);
  }

  public updateVisuals() {
    this.mesh.position.copy(this.body.position);
    this.mesh.quaternion.copy(this.body.quaternion);
  }
}
