import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Island from "./Island";
import { BiomeType, IslandParameters } from "./Island";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { Character } from "./Character";
import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";

export class World {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  public scene: THREE.Scene;
  public physicsWorld: CANNON.World;
  private island: Island;
  private character: Character;
  private seed: number = 0;
  private physicsFrameTime: number = 1 / 60;
  private timeScaleTarget: number = 1;
  private timeScale: number = 1;
  private clock: THREE.Clock = new THREE.Clock();
  private delta: number = 0;

  private cannonDebugger: typeof CannonDebugger;
  private physicsDebug: boolean = false;

  constructor() {
    this.Init();
  }

  private Init() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this.renderer.domElement);

    window.addEventListener(
      "resize",
      () => {
        this.OnWindowResize();
      },
      false
    );

    window.addEventListener("keydown", (e) => {
      if (e.key === "p") {
        this.EnablePhsyicsDebug();
      } else if (e.key === "l") {
        this.island.toggleLightDebug();
      } else {
        this.character.handleKeyboardEvent(e, e.code, true);
      }
    });

    window.addEventListener("keyup", (e) => {
      this.character.handleKeyboardEvent(e, e.code, false);
    });

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(20, 20, 20);

    this.scene = new THREE.Scene();

    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.target.set(0, 10, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.update();

    this.seed = Math.random();
    this.CreateIsland();

    this.CreatePhysicsWorld();

    this.character = new Character(this);
    this.island.CreateGoal(
      this.island.GetTileBelow(
        this.character.getFeetPosition().x,
        this.character.getFeetPosition().z
      )
    );

    this.render(this);
  }

  EnablePhsyicsDebug(): void {
    if (!this.physicsDebug) {
      this.physicsDebug = true;
      if (this.physicsDebug) {
        this.cannonDebugger = new CannonDebugger(this.scene, this.physicsWorld);
      }
    }
  }

  CreatePhysicsWorld(): void {
    this.physicsWorld = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.81, 0),
      broadphase: new CANNON.SAPBroadphase(this.physicsWorld),
      allowSleep: true,
    });

    const groundBody = new CANNON.Body({
      mass: 0,
      type: CANNON.Body.STATIC,
      shape: new CANNON.Plane(),
      material: new CANNON.Material(),
    });
    groundBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    );

    this.physicsWorld.addBody(groundBody);

    // TODO: combine all tiles to a single body
    this.island.GetCannonBodies().forEach((body) => {
      this.physicsWorld.addBody(body);
    });
  }

  CreateIsland(): void {
    const params = new IslandParameters(
      this.scene,
      BiomeType.Alpine,
      this.seed,
      15
    );
    this.island = new Island(params);
  }

  OnWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render(world: World): void {
    this.delta = this.clock.getDelta();

    requestAnimationFrame(() => {
      world.render(world);
    });

    let timeStep = this.delta * this.timeScale;
    timeStep = Math.min(timeStep, 1 / 30);

    world.update(timeStep);

    this.renderer.render(this.scene, this.camera);
  }

  update(timeStep: number): void {
    this.physicsWorld.step(this.physicsFrameTime, timeStep);

    this.character.update(timeStep);

    this.island.Update(timeStep);

    if (this.physicsDebug) {
      this.cannonDebugger.update();
    }

    this.timeScale = THREE.MathUtils.lerp(
      this.timeScale,
      this.timeScaleTarget,
      0.2
    );
  }
}
