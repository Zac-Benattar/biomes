import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  CollisionGroups,
  CapsuleCollider,
  CapsuleColliderOptions,
} from "./Colliders";
import { RelativeSpringSimulator } from "./physics/SpringSimulation/RelativeSpringSimulator";
import { VectorSpringSimulator } from "./physics/SpringSimulation/VectorSpringSimulator";
import { Idle } from "./CharacterStates/Idle";
import * as CANNON from "cannon-es";
import Tile from "./Tile";
import GameController from "./GameController";
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
  public radius: number = 0.1;
  public spawnHeight: number = 20;

  // Movement
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public velocityTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public velocityInfluence: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public acceleration: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public decceleration: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public movementSpeed: number = 3.0;
  public angularVelocity: number = 0.0;
  public orientation: THREE.Vector3 = new THREE.Vector3(1, 0, 0);
  public orientationTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
  public collider: CapsuleCollider;
  public defaultVelocitySimulatorDamping: number = 0.8;
  public defaultVelocitySimulatorMass: number = 60;
  public defaultRotationSimulatorDamping: number = 0.5;
  public defaultRotationSimulatorMass: number = 10;
  public viewVector: THREE.Vector3;
  public velocityIsAdditive: boolean = false;
  public groundImpactVelocity: THREE.Vector3 = new THREE.Vector3();

  // Raycasting
  public rayResult: CANNON.RaycastResult = new CANNON.RaycastResult();
  public rayHitTarget: boolean = false;
  public rayCastLength: number = 0.5;
  public raySafeOffset: number = 0.03;
  public wantsToJump: boolean = false;
  public initJumpSpeed: number = -1;

  public gameController: GameController;

  public rotationSimulator: any;
  public velocitySimulator: any;

  public grounded: boolean = false;

  constructor(gameController: GameController) {
    super();
    this.Init(gameController);
  }

  public Init(gameController: GameController): void {
    this.gameController = gameController;
    this.decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
    this.acceleration = new THREE.Vector3(1, 0.25, 50.0);
    this.spawnHeight = this.gameController.spawnHeight;

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

    this.collider = new CapsuleCollider(
      new CapsuleColliderOptions(
        1,
        new CANNON.Vec3(0, 5, 0),
        this.height,
        this.radius,
        0.3,
        20
      )
    );
    this.collider.body.position.y = this.spawnHeight;

    this.loadModel();

    this.addToPhysicsWorld();

    this.gameController.physicsWorld.addEventListener("preStep", () => {
      this.physicsPreStep(this);
    });

    this.gameController.physicsWorld.addEventListener("postStep", () => {
      this.physicsPostStep(this.collider.body, this);
    });

    this.setState(new Idle(this));
  }

  public loadModel() {
    const loader = new GLTFLoader();
    loader.load("./assets/models/space_survivor.glb", (gltf) => {
      this.model = gltf.scene.children[0] as THREE.Group;
      const modelScale = 0.6;
      this.model.scale.set(modelScale, modelScale, modelScale);
      this.gameController.scene.add(this.model);

      this.mixer = new THREE.AnimationMixer(this.model);

      gltf.animations.forEach((clip) => {
        this.animations.push(clip);
      });

      this.model.castShadow = true;
      this.model.receiveShadow = true;
    });
  }

  public addToPhysicsWorld(): void {
    this.gameController.physicsWorld.addBody(this.collider.body);
  }

  public setPosition(position: THREE.Vector3): void {
    this.grounded = false;
    this.model.position.copy(position);

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

    let axis = new THREE.Vector3(-1, 0, 0);
    let angle = Math.PI / 2;
    let rotation = new THREE.Quaternion().setFromAxisAngle(axis, angle);
    let newQuaternion = this.quaternion.clone().multiply(rotation);
    axis = new THREE.Vector3(0, 0, 1);
    angle = Math.PI;
    rotation = new THREE.Quaternion().setFromAxisAngle(axis, angle);
    newQuaternion = newQuaternion.multiply(rotation);
    this.model.quaternion.copy(newQuaternion);
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
          this.gameController.camera.position
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
      currentTile.height + 0.5,
      currentTile.position.z
    );

    const distance = this.getFeetPosition().distanceTo(topOfTile);
    return distance;
  }

  public update(timeInSeconds: number) {
    this.state?.update(timeInSeconds);

    this.springMovement(timeInSeconds);
    this.springRotation(timeInSeconds);
    this.syncModel();

    if (this.mixer !== undefined) this.mixer.update(timeInSeconds);

    // Sync physics body position with the model
    this.position.set(
      this.collider.body.interpolatedPosition.x,
      this.collider.body.interpolatedPosition.y,
      this.collider.body.interpolatedPosition.z
    );

    this.updateMatrixWorld();
  }


  // Performs a spring simulation on the character's velocity
  public springMovement(timeStep: number): void {
    // Get simulation result
    this.velocitySimulator.target.copy(this.velocityTarget);
    this.velocitySimulator.simulate(timeStep);

    // Apply result
    this.velocity.copy(this.velocitySimulator.position);
    this.acceleration.copy(this.velocitySimulator.velocity);
  }

  // Performs a spring simulation on the character's orientation
  public springRotation(timeStep: number): void {
    // Figure out angle between current and target orientation
    let angle = Utils.getSignedAngleBetweenVectors(
      this.orientation,
      this.orientationTarget
    );

    // Get simulation result
    this.rotationSimulator.target = angle;
    this.rotationSimulator.simulate(timeStep);
    let rot = this.rotationSimulator.position;

    // Apply rotation
    this.orientation.applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
    this.angularVelocity = this.rotationSimulator.velocity;
  }

  // Returns a vector representing the direction the character is moving in
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

  // For use in physics pre-step event
  public physicsPreStep(character: Character): void {
    character.feetRaycast();
  }

  // Casts rays from the character's feet to the ground to check for ground contact
  public feetRaycast(): void {
    let body = this.collider.body;

    // Create raycast start points at each corner of the cylinder collider, end points a set distance below
    let startPoints: CANNON.Vec3[] = [];
    let endPoints: CANNON.Vec3[] = [];
    for (let i = 0; i < this.collider.segments; i++) {
      let angle = (i / this.collider.segments) * Math.PI * 2;
      let startPoint = new CANNON.Vec3(
        body.position.x + Math.sin(angle) * this.radius,
        body.position.y,
        body.position.z + Math.cos(angle) * this.radius
      );
      let endPoint = new CANNON.Vec3(
        startPoint.x,
        startPoint.y - this.rayCastLength - this.raySafeOffset,
        startPoint.z
      );
      startPoints.push(startPoint);
      endPoints.push(endPoint);
    }

    const rayCastOptions = {
      collisionFilterMask: CollisionGroups.Default,
      skipBackfaces: true,
    };

    // Cast each ray
    let rayResults: CANNON.RaycastResult[] = [];
    let index = 0;
    for (index = 0; index < startPoints.length; index++) {
      let rayResult: CANNON.RaycastResult = new CANNON.RaycastResult();
      this.gameController.physicsWorld.raycastClosest(
        startPoints[index],
        endPoints[index],
        rayCastOptions,
        rayResult
      );
      rayResults.push(rayResult);
    }

    // Find closest raycast hit - we must be stood on that body
    let rayResult = rayResults.reduce((prev, curr) => {
      if (prev === undefined || prev.distance == -1) return curr;
      if (curr === undefined || curr.distance == -1) return prev;
      if (prev.distance < curr.distance) return prev;
      else return curr;
    });

    // Check whether we actually hit anything
    if (rayResult.distance > -1) {
      this.rayHitTarget = true;
    } else {
      this.rayHitTarget = false;
    }

    // Set the rayresult for use in other methods
    this.rayResult = rayResult;
  }

  public physicsPostStep(body: CANNON.Body, character: Character): void {
    let outsideIsland =
      Math.pow(this.position.x, 2) + Math.pow(this.position.z, 2) >
      Math.pow(this.gameController.island.params.radius, 2);

    // Reset character if outside of island or fell below y=0
    if (outsideIsland || this.position.y < 0) {
      this.reset();
    }

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

    // Check if we have ground contact
    if (character.rayHitTarget) {
      // Set grounded flag
      this.grounded = true;

      // Stop falling
      newVelocity.y = 0;

      // Add velocity from moving objects
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

      // Measure normal offset from up vector and transform it into a matrix
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

      // Apply velocity
      body.velocity.x = newVelocity.x;
      body.velocity.y = newVelocity.y;
      body.velocity.z = newVelocity.z;

      // Set character y position to the exact floor y value
      body.position.y =
        character.rayResult.hitPointWorld.y +
        character.rayCastLength +
        newVelocity.y / character.gameController.physicsFrameRate;
    } else {
      // We are in the air
      this.grounded = false;

      body.velocity.x = newVelocity.x;
      body.velocity.y = newVelocity.y;
      body.velocity.z = newVelocity.z;

      // Save last in-air information
      character.groundImpactVelocity.x = body.velocity.x;
      character.groundImpactVelocity.y = body.velocity.y;
      character.groundImpactVelocity.z = body.velocity.z;
    }

    // Handle jumping
    if (character.wantsToJump) {
      // If initJumpSpeed is set
      if (character.initJumpSpeed > -1) {
        // Cancel previous y velocity to standarise jump speed
        body.velocity.y = 0;
        let speed = Math.max(
          character.velocitySimulator.position.length() *
            character.movementSpeed,
          character.initJumpSpeed
        );
        body.velocity = Utils.cannonVector(
          character.orientation.clone().multiplyScalar(speed)
        );
      } else {
        // Compensate for potential velocity of a moving floor
        let add = new CANNON.Vec3();
        character.rayResult.body.getVelocityAtWorldPoint(
          character.rayResult.hitPointWorld,
          add
        );
        body.velocity.vsub(add, body.velocity);
      }

      // Add positive vertical velocity
      body.velocity.y += 4;
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

  public reset(): void {
    this.setPosition(new THREE.Vector3(0, this.spawnHeight, 0));
    this.resetVelocity();
    this.resetOrientation();
  }
}
