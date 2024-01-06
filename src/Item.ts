import * as THREE from "three";
import * as CANNON from "cannon-es";
import { BoxCollider } from "./Colliders";
import GameController from "./GameController";

export class UrlScaleOffset {
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

    this.loadModel(url, scale, yOffset);

    this.collider = new BoxCollider({
      mass: 0,
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
  }

  public getLight(): THREE.PointLight {
    return this.light;
  }
}