import * as THREE from "three";
import * as CANNON from "cannon-es";

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

  public addToScene(scene: THREE.Scene) {
    scene.add(this.mesh);
  }

  public updateVisuals() {
    this.mesh.position.copy(this.body.position);
    this.mesh.quaternion.copy(this.body.quaternion);
  }
}
