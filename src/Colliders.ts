import * as CANNON from "cannon-es";

export enum CollisionGroups {
  Default = 1,
  Characters = 2,
  TrimeshColliders = 4,
}

export class BoxColliderOptions {
  public mass: number;
  public position: CANNON.Vec3;
  public width: number;
  public height: number;
  public depth: number;
  public friction: number;

  constructor(
    mass: number,
    position: CANNON.Vec3,
    width: number,
    height: number,
    depth: number,
    friction: number
  ) {
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
  public segments: number;

  constructor(
    mass: number,
    position: CANNON.Vec3,
    height: number,
    radius: number,
    friction: number,
    segments: number
  ) {
    this.mass = mass;
    this.position = position;
    this.height = height;
    this.radius = radius;
    this.friction = friction;
    this.segments = segments;
  }
}

export class CylinderColliderOptions {
  public mass: number;
  public position: CANNON.Vec3;
  public height: number;
  public radius: number;
  public friction: number;
  public segments: number;

  constructor(
    mass: number,
    position: CANNON.Vec3,
    height: number,
    radius: number,
    friction: number,
    segments: number
  ) {
    this.mass = mass;
    this.position = position;
    this.height = height;
    this.radius = radius;
    this.friction = friction;
    this.segments = segments;
  }
}

export class HexColliderOptions {
  public mass: number;
  public position: CANNON.Vec3;
  public height: number;
  public radius: number;
  public friction: number;

  constructor(
    mass: number,
    position: CANNON.Vec3,
    height: number,
    radius: number,
    friction: number
  ) {
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

export class CylinderCollider extends Collider {
  constructor(options: CylinderColliderOptions) {
    const material = new CANNON.Material("cylinderMaterial");
    material.friction = options.friction;

    const baseCyliner = new CANNON.Cylinder(
      options.radius,
      options.radius,
      options.height,
      options.segments
    );

    let cannonBody = new CANNON.Body({
      mass: options.mass,
      material: material,
      shape: baseCyliner,
    });

    cannonBody.allowSleep = false;
    cannonBody.fixedRotation = true;
    cannonBody.updateMassProperties();
    cannonBody.position.copy(options.position);
    // different group for raycasting
    cannonBody.collisionFilterGroup = 2;

    super(cannonBody);
  }
}

export class CapsuleCollider extends Collider {
  segments: number;
  constructor(options: CylinderColliderOptions) {

    const material = new CANNON.Material("capsuleMaterial");
    material.friction = options.friction;

    const sphereShape = new CANNON.Sphere(options.radius);

    let cannonBody = new CANNON.Body({
      mass: options.mass,
      material: material,
    });

    cannonBody.addShape(sphereShape, new CANNON.Vec3(0, options.radius, 0));
    cannonBody.addShape(
      sphereShape,
      new CANNON.Vec3(0, options.height / 2 + options.radius, 0)
    );
    cannonBody.addShape(
      sphereShape,
      new CANNON.Vec3(0, -options.height / 2 + options.radius, 0)
    );

    cannonBody.allowSleep = false;
    cannonBody.fixedRotation = true;
    cannonBody.updateMassProperties();
    cannonBody.position.copy(options.position);
    // different group for raycasting
    cannonBody.collisionFilterGroup = 2;

    super(cannonBody);

    this.segments = options.segments;
  }
}

export class BoxCollider extends Collider {
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

    cannonBody.addShape(box, options.position);

    cannonBody.allowSleep = false;
    cannonBody.fixedRotation = true;
    cannonBody.updateMassProperties();
    cannonBody.collisionFilterGroup = 2;

    super(cannonBody);
  }
}

export class HexTileCollider extends Collider {
  public body: CANNON.Body;

  constructor(options: HexColliderOptions) {
    const material = new CANNON.Material("hexMaterial");
    material.friction = options.friction;

    let cannonBody = new CANNON.Body({
      mass: options.mass,
      material: material,
    });

    const shape = new CANNON.Cylinder(
      options.radius,
      options.radius,
      options.height,
      6
    );

    cannonBody.addShape(shape, new CANNON.Vec3(options.position.x, options.position.y - options.height / 2, options.position.z));

    super(cannonBody);
  }
}
