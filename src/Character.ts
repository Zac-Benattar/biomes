import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import {
  CylinderCollider,
  CylinderColliderOptions,
  CollisionGroups,
} from "./Colliders";
import { RelativeSpringSimulator } from "./physics/SpringSimulation/RelativeSpringSimulator";
import { VectorSpringSimulator } from "./physics/SpringSimulation/VectorSpringSimulator";
import { Idle } from "./CharacterStates/Idle";
import * as CANNON from "cannon-es";
import Tile from "./Tile";
import World from "./World";
import * as Utils from "./Utils";
import { ICharacterState } from "./CharacterStates/ICharacterState";

export class KeyBinding {
  public eventCodes: string[];
  public isPressed: boolean = false;
  public justPressed: boolean = false;
  public justReleased: boolean = false;

  constructor(...code: string[]) {
    this.eventCodes = code;
  }
}

export class Character extends THREE.Object3D {
  public state: ICharacterState;
  public mixer: THREE.AnimationMixer;
  public manager: THREE.LoadingManager;
  public actions: { [action: string]: KeyBinding };
  public model: THREE.Group;
  public height: number = 1;
  public radius: number = 0.15;

  // Movement
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public velocityTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public velocityInfluence: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public acceleration: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public decceleration: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  public movementSpeed: number = 5.0;
  public angularVelocity: number = 0.0;
  public orientation: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
  public orientationTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
  public collider: CylinderCollider;
  public defaultVelocitySimulatorDamping: number = 0.8;
  public defaultVelocitySimulatorMass: number = 60;
  public defaultRotationSimulatorDamping: number = 0.5;
  public defaultRotationSimulatorMass: number = 10;
  public viewVector: THREE.Vector3;
  public velocityIsAdditive: boolean = false;
  public groundImpactVelocity: THREE.Vector3 = new THREE.Vector3();

  // Raycasting
  public rayResult: CANNON.RaycastResult = new CANNON.RaycastResult();
  public rayHasHit: boolean = false;
  public rayCastLength: number = 0.5;
  public raySafeOffset: number = 0.03;
  public wantsToJump: boolean = false;
  public initJumpSpeed: number = -1;
  public raycastCylinder: THREE.Mesh;

  public world: World;

  public physicsEnabled: boolean = true;
  public rotationSimulator: any;
  public velocitySimulator: any;

  constructor(world: World) {
    super();
    this.Init(world);
  }

  public Init(world: World): void {
    this.world = world;
    this.decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
    this.acceleration = new THREE.Vector3(1, 0.25, 50.0);

    this.velocitySimulator = new VectorSpringSimulator(
      60,
      this.defaultVelocitySimulatorMass,
      this.defaultVelocitySimulatorDamping
    );
    this.rotationSimulator = new RelativeSpringSimulator(
      60,
      this.defaultRotationSimulatorMass,
      this.defaultRotationSimulatorDamping
    );

    this.viewVector = new THREE.Vector3();

    this.actions = {
      up: new KeyBinding("KeyW"),
      down: new KeyBinding("KeyS"),
      left: new KeyBinding("KeyA"),
      right: new KeyBinding("KeyD"),
      jump: new KeyBinding("Space"),
    };

    this.collider = new CylinderCollider(
      new CylinderColliderOptions(1, new CANNON.Vec3(0, 5, 0), this.height, this.radius, 0.3)
    );

    // Raycast debug
    const cylGeo = new THREE.CylinderGeometry(this.radius, this.radius, 0.6, 8);
    const cylMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.raycastCylinder = new THREE.Mesh(cylGeo, cylMat);
    this.raycastCylinder.visible = true;
    // this.world.scene.add(this.raycastCylinder);

    this.LoadModels();

    this.setPhysicsEnabled(true);

    this.world.physicsWorld.addEventListener("preStep", () => {
      this.physicsPreStep(this.collider.body, this);
    });

    this.world.physicsWorld.addEventListener("postStep", () => {
      this.physicsPostStep(this.collider.body, this);
    });

    this.setState(new Idle(this));
  }

  public LoadModels() {
    const loader = new FBXLoader();
    loader.setPath("./assets/models/zombie/");
    loader.load("mremireh_o_desbiens.fbx", (fbx: THREE.Group<THREE.Object3DEventMap>) => {
      fbx.scale.setScalar(0.005);
      fbx.position.set(0, 10, 0);
      fbx.traverse(function (object: any) {
        if (object.isMesh) object.castShadow = true;
      });

      this.model = fbx;
      this.world.scene.add(this.model);

      this.mixer = new THREE.AnimationMixer(this.model);

      this.manager = new THREE.LoadingManager();

      const OnLoad = (animName: string, anim: any) => {
        anim.animations[0].name = animName;
        const clip = anim.animations[0];
        this.animations.push(clip);
      };

      const loader = new FBXLoader(this.manager);
      loader.setPath("./assets/models/zombie/");
      loader.load("walk.fbx", (a: any) => {
        OnLoad("Walk", a);
      });
      loader.load("idle.fbx", (a: any) => {
        OnLoad("Idle", a);
      });
      loader.load("dance.fbx", (a: any) => {
        OnLoad("Dance", a);
      });
    });
  }

  public setPhysicsEnabled(enabled: boolean): void {
    this.physicsEnabled = enabled;

    if (enabled) {
      this.world.physicsWorld.addBody(this.collider.body);
    } else {
      this.world.physicsWorld.removeBody(this.collider.body);
    }
  }

  public setPosition(position: THREE.Vector3): void {
    this.model.position.copy(position);

    if (this.physicsEnabled)
      this.collider.body.position.copy(
        new CANNON.Vec3(position.x, position.y, position.z)
      );
  }

  public resetVelocity(): void {
    this.velocity = new THREE.Vector3(0, 0, 0);

    this.collider.body.velocity = new CANNON.Vec3(0, 0, 0);
  }

  public setVelocityTarget(velocity: THREE.Vector3): void {
    this.velocityTarget = velocity;
  }

  public setOrientationTarget(orientation: THREE.Vector3): void {
    this.orientationTarget = orientation;
  }

  public resetOrientation(): void {
    this.orientation = new THREE.Vector3(0, 0, 1);
  }

  public setViewVector(vector: THREE.Vector3): void {
    this.viewVector.copy(vector).normalize();
  }

  public syncModel(): void {
    this.lookAt(
      this.position.x + this.orientation.x,
      this.position.y + this.orientation.y,
      this.position.z + this.orientation.z
    );

    if (this.model === undefined) return; // Model loaded asynchronously, might not be available yet

    this.model.position.x = this.collider.body.position.x;
    this.model.position.y = this.collider.body.position.y - this.height / 2;
    this.model.position.z = this.collider.body.position.z;
    
    this.model.quaternion.copy(this.quaternion);
  }

  public jump(initialJumpSpeed: number = -1): void {
    this.wantsToJump = true;
    this.initJumpSpeed = initialJumpSpeed;
  }

  public handleKeyboardEvent(
    event: KeyboardEvent,
    code: string,
    pressed: boolean
  ): void {
    for (const action in this.actions) {
      if (this.actions.hasOwnProperty(action)) {
        // Update view vector so movement is relative to the camera
        this.viewVector = new THREE.Vector3().subVectors(
          this.position,
          this.world.camera.position
        );

        const binding = this.actions[action];
        if (binding.eventCodes.indexOf(code) !== -1)
          this.triggerAction(action, pressed);
      }
    }
  }

  public triggerAction(actionName: string, value: boolean): void {
    let action = this.actions[actionName];

    if (action.isPressed !== value) {
      action.isPressed = value;

      action.justPressed = false;
      action.justReleased = false;

      if (value) action.justPressed = true;
      else action.justReleased = true;

      this.state.onInputChange();

      action.justPressed = false;
      action.justReleased = false;
    }
  }

  public getFeetPosition(): THREE.Vector3 {
    return new THREE.Vector3(
      this.collider.body.position.x,
      this.collider.body.position.y - this.height,
      this.collider.body.position.z
    );
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

  public update(timeInSeconds: number) {
    this.state?.update(timeInSeconds);

    if (this.physicsEnabled) {
      this.springMovement(timeInSeconds);
      this.springRotation(timeInSeconds);
      this.syncModel();
    }
    if (this.mixer !== undefined) this.mixer.update(timeInSeconds);

    // Sync physics/graphics
    if (this.physicsEnabled) {
      this.position.set(
        this.collider.body.interpolatedPosition.x,
        this.collider.body.interpolatedPosition.y,
        this.collider.body.interpolatedPosition.z
      );
    } else {
      let newPos = new THREE.Vector3();
      // this.getWorldPosition(newPos);

      this.collider.body.position.copy(
        new CANNON.Vec3(newPos.x, newPos.y, newPos.z)
      );
      this.collider.body.interpolatedPosition.copy(
        new CANNON.Vec3(newPos.x, newPos.y, newPos.z)
      );
    }

    this.updateMatrixWorld();
  }

  public springMovement(timeStep: number): void {
    // Simulator
    this.velocitySimulator.target.copy(this.velocityTarget);
    this.velocitySimulator.simulate(timeStep);

    // Update values
    this.velocity.copy(this.velocitySimulator.position);
    this.acceleration.copy(this.velocitySimulator.velocity);
  }

  public springRotation(timeStep: number): void {
    // Spring rotation
    // Figure out angle between current and target orientation
    let angle = Utils.getSignedAngleBetweenVectors(
      this.orientation,
      this.orientationTarget
    );

    this.rotationSimulator.target = angle;
    this.rotationSimulator.simulate(timeStep);
    let rot = this.rotationSimulator.position;

    this.orientation.applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
    this.angularVelocity = this.rotationSimulator.velocity;
  }

  public getLocalMovementDirection(): THREE.Vector3 {
    const positiveX = this.actions.right.isPressed ? -1 : 0;
    const negativeX = this.actions.left.isPressed ? 1 : 0;
    const positiveZ = this.actions.up.isPressed ? 1 : 0;
    const negativeZ = this.actions.down.isPressed ? -1 : 0;

    return new THREE.Vector3(
      positiveX + negativeX,
      0,
      positiveZ + negativeZ
    ).normalize();
  }

  public setState(state: ICharacterState): void {
    this.state = state;
    this.state.onInputChange();
  }

  public setVelocityInfluence(x: number, y: number = x, z: number = x): void {
    this.velocityInfluence.set(x, y, z);
  }

  public setAnimation(clipName: string, fadeIn: number): number {
    if (this.mixer !== undefined) {
      // gltf
      let clip = THREE.AnimationClip.findByName(this.animations, clipName);

      let action = this.mixer.clipAction(clip);
      if (action === null) {
        console.error(`Animation ${clipName} not found!`);
        return 0;
      }

      this.mixer.stopAllAction();
      action.fadeIn(fadeIn);
      action.play();

      return action.getClip().duration;
    }
    return -1;
  }

  public physicsPreStep(body: CANNON.Body, character: Character): void {
    character.feetRaycast();

    if (character.rayHasHit) {
      if (character.raycastCylinder.visible) {
        character.raycastCylinder.position.x = character.rayResult.hitPointWorld.x;
        character.raycastCylinder.position.y = character.rayResult.hitPointWorld.y;
        character.raycastCylinder.position.z = character.rayResult.hitPointWorld.z;
      }
    } else {
      if (character.raycastCylinder.visible) {
        character.raycastCylinder.position.set(
          body.position.x,
          body.position.y - character.rayCastLength - character.raySafeOffset,
          body.position.z
        );
      }
    }
  }

  public feetRaycast(): void {
    let body = this.collider.body;
    const start = new CANNON.Vec3(
      body.position.x,
      body.position.y,
      body.position.z
    );
    const end = new CANNON.Vec3(
      body.position.x,
      body.position.y - this.rayCastLength - this.raySafeOffset,
      body.position.z
    );
    const rayCastOptions = {
      collisionFilterMask: CollisionGroups.Default,
      skipBackfaces: true,
    };
    let rayResult: CANNON.RaycastResult = new CANNON.RaycastResult();
    this.rayHasHit = this.world.physicsWorld.raycastClosest(
      start,
      end,
      rayCastOptions,
      rayResult
    );
    this.rayResult = rayResult;
  }

  public physicsPostStep(body: CANNON.Body, character: Character): void {
    let simulatedVelocity = new THREE.Vector3(
      body.velocity.x,
      body.velocity.y,
      body.velocity.z
    );

    let velocity = new THREE.Vector3()
      .copy(character.velocity)
      .multiplyScalar(character.movementSpeed);

    // Convert local velocity to global
    velocity = Utils.applyVectorMatrixXZ(character.orientation, velocity);

    let newVelocity = new THREE.Vector3();

    if (character.velocityIsAdditive) {
      newVelocity.copy(simulatedVelocity);

      let globalVelocityTarget = Utils.applyVectorMatrixXZ(
        character.orientation,
        character.velocityTarget
      );
      let add = new THREE.Vector3()
        .copy(velocity)
        .multiply(character.velocityInfluence);

      if (
        Math.abs(simulatedVelocity.x) <
          Math.abs(globalVelocityTarget.x * character.movementSpeed) ||
        Utils.haveDifferentSigns(simulatedVelocity.x, velocity.x)
      ) {
        newVelocity.x += add.x;
      }
      if (
        Math.abs(simulatedVelocity.y) <
          Math.abs(globalVelocityTarget.y * character.movementSpeed) ||
        Utils.haveDifferentSigns(simulatedVelocity.y, velocity.y)
      ) {
        newVelocity.y += add.y;
      }
      if (
        Math.abs(simulatedVelocity.z) <
          Math.abs(globalVelocityTarget.z * character.movementSpeed) ||
        Utils.haveDifferentSigns(simulatedVelocity.z, velocity.z)
      ) {
        newVelocity.z += add.z;
      }
    } else {
      newVelocity = new THREE.Vector3(
        THREE.MathUtils.lerp(
          simulatedVelocity.x,
          velocity.x,
          character.velocityInfluence.x
        ),
        THREE.MathUtils.lerp(
          simulatedVelocity.y,
          velocity.y,
          character.velocityInfluence.y
        ),
        THREE.MathUtils.lerp(
          simulatedVelocity.z,
          velocity.z,
          character.velocityInfluence.z
        )
      );
    }

    // If we're hitting the ground, stick to ground
    if (character.rayHasHit) {
      // Flatten velocity
      newVelocity.y = 0;

      // Move on top of moving objects
      if (character.rayResult.body.mass > 0) {
        let pointVelocity = new CANNON.Vec3();
        character.rayResult.body.getVelocityAtWorldPoint(
          character.rayResult.hitPointWorld,
          pointVelocity
        );
        newVelocity.add(
          new THREE.Vector3(pointVelocity.x, pointVelocity.y, pointVelocity.z)
        );
      }

      // Measure the normal vector offset from direct "up" vector and transform it into a matrix
      let up = new THREE.Vector3(0, 1, 0);
      let normal = new THREE.Vector3(
        character.rayResult.hitNormalWorld.x,
        character.rayResult.hitNormalWorld.y,
        character.rayResult.hitNormalWorld.z
      );
      let q = new THREE.Quaternion().setFromUnitVectors(up, normal);
      let m = new THREE.Matrix4().makeRotationFromQuaternion(q);

      // Rotate the velocity vector
      newVelocity.applyMatrix4(m);

      // Compensate for gravity
      // newVelocity.y -= body.world.physicsWorld.gravity.y / body.character.world.physicsFrameRate;

      // Apply velocity
      body.velocity.x = newVelocity.x;
      body.velocity.y = newVelocity.y;
      body.velocity.z = newVelocity.z;
      // Ground character
      body.position.y =
        character.rayResult.hitPointWorld.y +
        character.rayCastLength +
        newVelocity.y / character.world.physicsFrameRate;
    } else {
      // If we're in air
      body.velocity.x = newVelocity.x;
      body.velocity.y = newVelocity.y;
      body.velocity.z = newVelocity.z;

      // Save last in-air information
      character.groundImpactVelocity.x = body.velocity.x;
      character.groundImpactVelocity.y = body.velocity.y;
      character.groundImpactVelocity.z = body.velocity.z;
    }

    // Jumping
    if (character.wantsToJump) {
      // If initJumpSpeed is set
      if (character.initJumpSpeed > -1) {
        // Flatten velocity
        body.velocity.y = 0;
        let speed = Math.max(
          character.velocitySimulator.position.length() * character.movementSpeed,
          character.initJumpSpeed
        );
        body.velocity = Utils.cannonVector(
          character.orientation.clone().multiplyScalar(speed)
        );
      } else {
        // Moving objects compensation
        let add = new CANNON.Vec3();
        character.rayResult.body.getVelocityAtWorldPoint(
          character.rayResult.hitPointWorld,
          add
        );
        body.velocity.vsub(add, body.velocity);
      }

      // Add positive vertical velocity
      body.velocity.y += character.movementSpeed;
      // Move above ground by 2x safe offset value
      body.position.y += character.raySafeOffset * 2;
      // Reset flag
      character.wantsToJump = false;
    }
  }

  public getCameraRelativeMovementVector(): THREE.Vector3 {
    const localDirection = this.getLocalMovementDirection();
    const flatViewVector = new THREE.Vector3(
      this.viewVector.x,
      0,
      this.viewVector.z
    ).normalize();

    return Utils.applyVectorMatrixXZ(flatViewVector, localDirection);
  }

  public setCameraRelativeOrientationTarget(): void {
    let moveVector = this.getCameraRelativeMovementVector();

    if (moveVector.x === 0 && moveVector.y === 0 && moveVector.z === 0) {
      this.setOrientation(this.orientation);
    } else {
      this.setOrientation(moveVector);
    }
  }

  public setOrientation(
    vector: THREE.Vector3,
    instantly: boolean = false
  ): void {
    let lookVector = new THREE.Vector3().copy(vector).setY(0).normalize();
    this.orientationTarget.copy(lookVector);

    if (instantly) {
      this.orientation.copy(lookVector);
    }
  }
}
