import * as CANNON from "cannon-es";

const SEGMENTS = 8;

export enum CollisionGroups {
	Default = 1,
	Characters = 2,
	TrimeshColliders = 4
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

export class CapsuleCollider {
  public options: CapsuleColliderOptions;
  public body: CANNON.Body;

  constructor(options: CapsuleColliderOptions) {
    this.options = options;

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
      SEGMENTS
    );

    const sphere = new CANNON.Sphere(options.radius);

    cannonBody.addShape(baseCyliner, new CANNON.Vec3(0, 0, 0));
    cannonBody.addShape(sphere, new CANNON.Vec3(0, options.height / 2, 0));
    cannonBody.addShape(sphere, new CANNON.Vec3(0, -options.height / 2, 0));

    this.body = cannonBody;
    this.body.allowSleep = false;
    this.body.fixedRotation = true;
    this.body.updateMassProperties();
    this.body.position.copy(options.position);
    // different group for raycasting
    this.body.collisionFilterGroup = 2;
  }
}
