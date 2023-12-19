import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import * as CANNON from "cannon-es";
import Tile from "./tile";

export const W = "w";
export const A = "a";
export const S = "s";
export const D = "d";
export const SHIFT = "shift";
export const DIRECTIONS = [W, A, S, D];
export enum Action {
  Idle = "Idle",
  Walk = "Walk",
  Run = "Run",
}

export class ControlsParams {
  camera: THREE.Camera;
  scene: THREE.Scene;
}

class BasicCharacterControllerProxy {
  public animations: Map<string, THREE.AnimationAction>;
  constructor(animations) {
    this.animations = animations;
  }
}

export class BasicCharacterController {
  protected params: ControlsParams;
  protected mixer: THREE.AnimationMixer;
  protected manager: THREE.LoadingManager;
  protected stateMachine: CharacterFSM;
  protected animations: Map<string, THREE.AnimationAction>; // Walk, Run, Idle
  protected target: any;
  protected acceleration: THREE.Vector3;
  protected decceleration: THREE.Vector3;
  protected input: any;
  protected physicsBody: CANNON.Body;

  constructor(params: ControlsParams) {
    this.Init(params);
  }

  protected Init(params: ControlsParams) {
    this.params = params;
    this.decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
    this.acceleration = new THREE.Vector3(1, 0.25, 50.0);
    this.animations = new Map<string, THREE.AnimationAction>();
    this.input = new BasicCharacterControllerInput();
    this.stateMachine = new CharacterFSM(
      new BasicCharacterControllerProxy(this.animations)
    );

    this.LoadModels();
    this.CreatePhysicsBody();
  }

  protected LoadModels() {
    const loader = new FBXLoader();
    loader.setPath("./assets/models/zombie/");
    loader.load("mremireh_o_desbiens.fbx", (fbx) => {
      fbx.scale.setScalar(0.005);
      fbx.position.set(0, 10, 0);
      fbx.traverse(function (object: any) {
        if (object.isMesh) object.castShadow = true;
      });

      this.target = fbx;
      this.params.scene.add(this.target);

      this.mixer = new THREE.AnimationMixer(this.target);

      this.manager = new THREE.LoadingManager();
      this.manager.onLoad = () => {
        this.stateMachine.SetState("Idle");
      };

      const OnLoad = (animName: string, anim: any) => {
        const clip = anim.animations[0];
        const action = this.mixer.clipAction(clip);

        this.animations[animName] = {
          clip: clip,
          action: action,
        };
      };

      const loader = new FBXLoader(this.manager);
      loader.setPath("./assets/models/zombie/");
      loader.load("walk.fbx", (a) => {
        OnLoad("Walk", a);
      });
      loader.load("run.fbx", (a) => {
        OnLoad("Run", a);
      });
      loader.load("idle.fbx", (a) => {
        OnLoad("Idle", a);
      });
      loader.load("dance.fbx", (a) => {
        OnLoad("Dance", a);
      });
    });
  }

  private CreatePhysicsBody() {
    this.physicsBody = new CANNON.Body({
      mass: 1,
      type: CANNON.Body.DYNAMIC,
      shape: new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5)),
      position: new CANNON.Vec3(0, 10, 0),
    });
  }

  public getPhysicsBody() {
    return this.physicsBody;
  }

  public getFeetPosition() {
    return new THREE.Vector3(
      this.physicsBody.position.x,
      this.physicsBody.position.y - 0.5,
      this.physicsBody.position.z
    );
  }

  public distanceToTile(currentTile: Tile) {
    return this.physicsBody.position.distanceTo(currentTile.position);
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

  Update(timeInSeconds: number) {
    if (!this.target) {
      return;
    }

    this.stateMachine.Update(timeInSeconds, this.input);

    const velocity = this.physicsBody.velocity;
    const frameDecceleration = new CANNON.Vec3(
      velocity.x * this.decceleration.x,
      velocity.y * this.decceleration.y,
      velocity.z * this.decceleration.z
    );
    frameDecceleration.scale(timeInSeconds);
    frameDecceleration.z =
      Math.sign(frameDecceleration.z) *
      Math.min(Math.abs(frameDecceleration.z), Math.abs(velocity.z));

    this.physicsBody.velocity.vadd(frameDecceleration);

    const Q = new CANNON.Quaternion();
    const A = new CANNON.Vec3();
    const R = this.physicsBody.quaternion.clone();

    const acc = this.acceleration.clone();
    if (this.input.keys.shift) {
      acc.multiplyScalar(2.0);
    }

    if (
      this.stateMachine.GetState() == null ||
      this.stateMachine.GetState().Name == "Dance"
    ) {
      acc.multiplyScalar(0.0);
    }

    if (this.input.keys.forward) {
      velocity.z += acc.z * timeInSeconds;
    }
    if (this.input.keys.backward) {
      velocity.z -= acc.z * timeInSeconds;
    }
    if (this.input.keys.left) {
      A.set(0, 1, 0);
      Q.setFromAxisAngle(
        A,
        4.0 * Math.PI * timeInSeconds * this.acceleration.y
      );
      R.mult(Q);
    }
    if (this.input.keys.right) {
      A.set(0, 1, 0);
      Q.setFromAxisAngle(
        A,
        4.0 * -Math.PI * timeInSeconds * this.acceleration.y
      );
      R.mult(Q);
    }

    this.physicsBody.quaternion.copy(R);

    const oldPosition = new CANNON.Vec3();
    oldPosition.copy(this.physicsBody.position);

    const forward = new THREE.Vector3(0, 0, 1);
    const threeQuatForward = new THREE.Quaternion(
      this.physicsBody.quaternion.x,
      this.physicsBody.quaternion.y,
      this.physicsBody.quaternion.z,
      this.physicsBody.quaternion.w
    );
    forward.applyQuaternion(threeQuatForward);
    forward.normalize();

    const sideways = new THREE.Vector3(1, 0, 0);
    const threeQuatSideways = new THREE.Quaternion(
      this.physicsBody.quaternion.x,
      this.physicsBody.quaternion.y,
      this.physicsBody.quaternion.z,
      this.physicsBody.quaternion.w
    );
    sideways.applyQuaternion(threeQuatSideways);
    sideways.normalize();

    const sidewaysCANNON = new CANNON.Vec3(sideways.x, sideways.y, sideways.z);
    const forwardCANNON = new CANNON.Vec3(forward.x, forward.y, forward.z);

    sidewaysCANNON.scale(velocity.x * timeInSeconds);
    forwardCANNON.scale(velocity.z * timeInSeconds);

    this.physicsBody.position.vadd(forwardCANNON);
    this.physicsBody.position.vadd(sidewaysCANNON);

    this.target.position.copy(this.physicsBody.position);
    this.target.quaternion.copy(this.physicsBody.quaternion);

    oldPosition.copy(this.physicsBody.position);

    console.log(this.physicsBody.position);

    if (this.mixer) {
      this.mixer.update(timeInSeconds);
    }
  }
}

class BasicCharacterControllerInput {
  keys: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    space: boolean;
    shift: boolean;
  };

  constructor() {
    this.Init();
  }

  private Init() {
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      space: false,
      shift: false,
    };
    document.addEventListener("keydown", (e) => this.onKeyDown(e), false);
    document.addEventListener("keyup", (e) => this.onKeyUp(e), false);
  }

  private onKeyDown(event) {
    switch (event.keyCode) {
      case 87: // w
        this.keys.forward = true;
        break;
      case 65: // a
        this.keys.left = true;
        break;
      case 83: // s
        this.keys.backward = true;
        break;
      case 68: // d
        this.keys.right = true;
        break;
      case 32: // SPACE
        this.keys.space = true;
        break;
      case 16: // SHIFT
        this.keys.shift = true;
        break;
    }
  }

  private onKeyUp(event) {
    switch (event.keyCode) {
      case 87: // w
        this.keys.forward = false;
        break;
      case 65: // a
        this.keys.left = false;
        break;
      case 83: // s
        this.keys.backward = false;
        break;
      case 68: // d
        this.keys.right = false;
        break;
      case 32: // SPACE
        this.keys.space = false;
        break;
      case 16: // SHIFT
        this.keys.shift = false;
        break;
    }
  }
}

class FiniteStateMachine {
  protected states;
  protected currentState;

  constructor() {
    this.states = {};
    this.currentState = null;
  }

  AddState(name, type) {
    this.states[name] = type;
  }

  GetState() {
    return this.currentState;
  }

  SetState(name) {
    const prevState = this.currentState;

    if (prevState) {
      if (prevState.Name == name) {
        return;
      }
      prevState.Exit();
    }

    const state = new this.states[name](this);

    this.currentState = state;
    state.Enter(prevState);
  }

  Update(timeElapsed, input) {
    if (this.currentState) {
      this.currentState.Update(timeElapsed, input);
    }
  }
}

class CharacterFSM extends FiniteStateMachine {
  protected proxy;
  constructor(proxy) {
    super();
    this.proxy = proxy;
    this.Init();
  }

  private Init() {
    this.AddState("Idle", IdleState);
    this.AddState("Walk", WalkState);
    this.AddState("Run", RunState);
    this.AddState("Dance", DanceState);
  }
}

class State {
  protected parent;
  constructor(parent) {
    this.parent = parent;
  }

  Enter(prevState) {}
  Exit() {}
  Update(timeElapsed, input) {}
}

//   //     let feetPosition = player.getFeetPosition();
//   //     let tileBelow = island.getTileBelow(feetPosition.x, feetPosition.z);
//   //     let distanceToTileBelow = feetPosition.y - tileBelow.getTileTopPosition().z;
//   //     if (distanceToTileBelow < 0.01) {
//   //       player.jump();
//   //     }

class DanceState extends State {
  FinishedCallback = () => {};
  CleanupCallback = () => {};

  constructor(parent) {
    super(parent);

    this.FinishedCallback = () => {
      this.Finished();
    };
  }

  get Name() {
    return "Dance";
  }

  Enter(prevState) {
    const curAction = this.parent.proxy.animations["Dance"].action;
    const mixer = curAction.getMixer();
    mixer.addEventListener("finished", this.FinishedCallback);

    if (prevState) {
      const prevAction = this.parent.proxy.animations[prevState.Name].action;

      curAction.reset();
      curAction.setLoop(THREE.LoopOnce, 1);
      curAction.clampWhenFinished = true;
      curAction.crossFadeFrom(prevAction, 0.2, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Finished() {
    this.Cleanup();
    this.parent.SetState("Idle");
  }

  Cleanup() {
    const action = this.parent.proxy.animations["Dance"].action;

    action.getMixer().removeEventListener("finished", this.CleanupCallback);
  }

  Exit() {
    this.Cleanup();
  }

  Update(_) {}
}

class WalkState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return "Walk";
  }

  Enter(prevState) {
    const curAction = this.parent.proxy.animations["Walk"].action;
    if (prevState) {
      const prevAction = this.parent.proxy.animations[prevState.Name].action;

      curAction.enabled = true;

      if (prevState.Name == "Run") {
        const ratio =
          curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;
      } else {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
      }

      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Exit() {}

  Update(timeElapsed, input) {
    if (input.keys.forward || input.keys.backward) {
      if (input.keys.shift) {
        this.parent.SetState("Run");
      }
      return;
    }

    this.parent.SetState("Idle");
  }
}

class RunState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return "Run";
  }

  Enter(prevState) {
    const curAction = this.parent.proxy.animations["Run"].action;
    if (prevState) {
      const prevAction = this.parent.proxy.animations[prevState.Name].action;

      curAction.enabled = true;

      if (prevState.Name == "Walk") {
        const ratio =
          curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;
      } else {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
      }

      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Exit() {}

  Update(timeElapsed, input) {
    if (input.keys.forward || input.keys.backward) {
      if (!input.keys.shift) {
        this.parent.SetState("Walk");
      }
      return;
    }

    this.parent.SetState("Idle");
  }
}

class IdleState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return "Idle";
  }

  Enter(prevState) {
    const IdleAction = this.parent.proxy.animations["Idle"].action;
    if (prevState) {
      const prevAction = this.parent.proxy.animations[prevState.Name].action;
      IdleAction.time = 0.0;
      IdleAction.enabled = true;
      IdleAction.setEffectiveTimeScale(1.0);
      IdleAction.setEffectiveWeight(1.0);
      IdleAction.crossFadeFrom(prevAction, 0.5, true);
      IdleAction.play();
    } else {
      IdleAction.play();
    }
  }

  Exit() {}

  Update(_, input) {
    if (input.keys.forward || input.keys.backward) {
      this.parent.SetState("Walk");
    } else if (input.keys.space) {
      this.parent.SetState("Dance");
    }
  }
}
