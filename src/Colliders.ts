import * as CANNON from "cannon-es";

const CAPSULE_SEGMENTS = 8;

export enum CollisionGroups {
	Default = 1,
	Characters = 2,
	TrimeshColliders = 4
}

export class BoxColliderOptions {
  public mass: number;
  public position: CANNON.Vec3;
  public width: number;
  public height: number;
  public depth: number;
  public friction: number;

  constructor(mass, position, width, height, depth, friction) {
    this.mass = mass;
    this.position = position;
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.friction = friction;
  }
}

export class CapsuleColliderOptions {
  public mass: number;
  public position: CANNON.Vec3;
  public height: number;
  public radius: number;
  public friction: number;

  constructor(mass, position, height, radius, friction) {
    this.mass = mass;
    this.position = position;
    this.height = height;
    this.radius = radius;
    this.friction = friction;
  }
}

export abstract class Collider {
  public body: CANNON.Body;

  constructor(body: CANNON.Body) {
    this.body = body;
  }
}

export class CapsuleCollider extends Collider{
  public options: CapsuleColliderOptions;

  constructor(options: CapsuleColliderOptions) {

    const material = new CANNON.Material("capsuleMaterial");
    material.friction = options.friction;

    let cannonBody = new CANNON.Body({
      mass: options.mass,
      material: material,
    });

    const baseCyliner = new CANNON.Cylinder(
      options.radius,
      options.radius,
      options.height,
      CAPSULE_SEGMENTS
    );

    const sphere = new CANNON.Sphere(options.radius);

    cannonBody.addShape(baseCyliner, new CANNON.Vec3(0, 0, 0));
    cannonBody.addShape(sphere, new CANNON.Vec3(0, options.height / 2, 0));
    cannonBody.addShape(sphere, new CANNON.Vec3(0, -options.height / 2, 0));

    cannonBody.allowSleep = false;
    cannonBody.fixedRotation = true;
    cannonBody.updateMassProperties();
    cannonBody.position.copy(options.position);
    // different group for raycasting
    cannonBody.collisionFilterGroup = 2;

    super(cannonBody);
  }
}

export class BoxCollider extends Collider {
  public options: BoxColliderOptions;
  public body: CANNON.Body;

  constructor(options: BoxColliderOptions) {
    const material = new CANNON.Material("boxMaterial");
    material.friction = options.friction;

    let cannonBody = new CANNON.Body({
      mass: options.mass,
      material: material,
    });

    const box = new CANNON.Box(
      new CANNON.Vec3(options.width / 2, options.height / 2, options.depth / 2)
    );

    cannonBody.addShape(box, new CANNON.Vec3(0, 0, 0));

    cannonBody.allowSleep = false;
    cannonBody.fixedRotation = true;
    cannonBody.updateMassProperties();
    cannonBody.position.copy(options.position);
    cannonBody.collisionFilterGroup = 2;

    super(cannonBody);
  }
}
