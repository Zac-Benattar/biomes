import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Biome from "./BiomeController";
import { BiomeType, BiomeParameters } from "./BiomeController";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import {
  BasicCharacterController,
  ControlsParams,
} from "./CharacterController";
import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";

export default class Game {
  private threejs: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private island: Biome;
  private controls: BasicCharacterController;
  private mixers: THREE.AnimationMixer[];
  private previousRAF: number;
  private physicsWorld: CANNON.World;
  private cannonDebugger: typeof CannonDebugger;
  private seed: number = 0;

  constructor() {
    this.Init();
  }

  private Init() {
    this.threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.threejs.shadowMap.enabled = true;
    this.threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this.threejs.setPixelRatio(window.devicePixelRatio);
    this.threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this.threejs.domElement);

    window.addEventListener(
      "resize",
      () => {
        this.OnWindowResize();
      },
      false
    );

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(20, 20, 20);

    this.scene = new THREE.Scene();

    const controls = new OrbitControls(this.camera, this.threejs.domElement);
    controls.target.set(0, 10, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.update();

    this.seed = Math.random();
    this.CreateIsland();

    this.mixers = [];
    this.previousRAF = -1;

    this.CreatePhysicsWorld();

    this.LoadAnimatedModel();
    this.island.CreateGoal(
      this.island.GetTileBelow(
        this.controls.getFeetPosition().x,
        this.controls.getFeetPosition().z
      )
    );

    this.RAF();
  }

  CreatePhysicsWorld() {
    this.physicsWorld = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.81, 0),
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

    this.cannonDebugger = new CannonDebugger(this.scene, this.physicsWorld);

    this.island.GetCannonBodies().forEach((body) => {
      this.physicsWorld.addBody(body);
    });
  }

  CreateIsland() {
    const params = new BiomeParameters(
      this.scene,
      BiomeType.Forest,
      this.seed,
      15
    );
    this.island = new Biome(params);
  }

  LoadAnimatedModel() {
    const params: ControlsParams = {
      camera: this.camera,
      scene: this.scene,
    };
    this.controls = new BasicCharacterController(params);

    this.physicsWorld.addBody(this.controls.getPhysicsBody());
  }

  LoadAnimatedModelAndPlay(path, modelFile, animFile, offset) {
    const loader = new FBXLoader();
    loader.setPath(path);
    loader.load(modelFile, (fbx) => {
      fbx.scale.setScalar(0.1);
      fbx.traverse((c) => {
        c.castShadow = true;
      });
      fbx.position.copy(offset);

      const anim = new FBXLoader();
      anim.setPath(path);
      anim.load(animFile, (anim) => {
        const m = new THREE.AnimationMixer(fbx);
        this.mixers.push(m);
        const idle = m.clipAction(anim.animations[0]);
        idle.play();
      });
      this.scene.add(fbx);
    });
  }

  LoadModel() {
    const loader = new GLTFLoader();
    loader.load("./resources/thing.glb", (gltf) => {
      gltf.scene.traverse((c) => {
        c.castShadow = true;
      });
      this.scene.add(gltf.scene);
    });
  }

  OnWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.threejs.setSize(window.innerWidth, window.innerHeight);
  }

  RAF() {
    requestAnimationFrame((t) => {
      if (this.previousRAF === -1) {
        this.previousRAF = t;
      }

      this.RAF();

      this.threejs.render(this.scene, this.camera);
      this.Step(t - this.previousRAF);
      this.previousRAF = t;
    });
  }

  Step(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;
    if (this.mixers) {
      this.mixers.map((m) => m.update(timeElapsedS));
    }

    if (this.controls) {
      this.controls.Update(timeElapsedS);
    }

    if (this.island) {
      this.island.Update(timeElapsedS);
    }

    if (this.physicsWorld) {
      this.physicsWorld.step(timeElapsedS);
      if (this.cannonDebugger) {
        this.cannonDebugger.update();
      }
    }
  }
}
