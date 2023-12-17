import * as THREE from "three";

enum ItemType {
  Coin,
}

export default abstract class Item {
  position: THREE.Vector3;
  type: ItemType;

  constructor(position, type) {
    this.position = position;
    this.type = type;
  }

  public abstract getMesh(): THREE.Mesh;
}
