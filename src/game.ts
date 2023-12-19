import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Island from "./island";
import Player from "./player";
import { Biome } from "./island";
import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import {
  BasicCharacterController,
  ControlsParams,
} from "./CharacterController";

export default class Game {
  private threejs: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private island: Island;
  private player: Player;
  private controls: BasicCharacterController;
  private mixers: THREE.AnimationMixer[];
  private previousRAF: number;

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
    this.camera.position.set(25, 10, 25);

    this.scene = new THREE.Scene();

    const controls = new OrbitControls(this.camera, this.threejs.domElement);
    controls.target.set(0, 10, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.update();

    this.island = new Island(Biome.Alpine, 0, 15, 0, 0, 0);
    this.island.addToScene(this.scene);
    this.island.enableLights(this.scene);

    this.mixers = [];
    this.previousRAF = -1;

    this.LoadAnimatedModel();
    this.RAF();
  }

  LoadAnimatedModel() {
    const params: ControlsParams = {
      camera: this.camera,
      scene: this.scene,
    };
    this.controls = new BasicCharacterController(params);
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
  }
}

// (async function () {
//   const physicsWorld = new CANNON.World({
//     gravity: new CANNON.Vec3(0, -9.82, 0),
//   });
//   const groundBody = new CANNON.Body({
//     mass: 0,
//     type: CANNON.Body.STATIC,
//     shape: new CANNON.Plane(),
//     material: new CANNON.Material(),
//   });
//   groundBody.quaternion.setFromAxisAngle(
//     new CANNON.Vec3(1, 0, 0),
//     -Math.PI / 2
//   );
//   physicsWorld.addBody(groundBody);

//   let cannonDebugger = new CannonDebugger(scene, physicsWorld);

//   island.getCannonBodies().forEach((body) => {
//     physicsWorld.addBody(body);
//   });

//   // // event listeners for arrow keys
//   // window.addEventListener("keydown", (e) => {
//   //   if (e.key === "a") {
//   //     player.move(new THREE.Vector3(-1, 0, 0));
//   //   } else if (e.key === "d") {
//   //     player.move(new THREE.Vector3(1, 0, 0));
//   //   } else if (e.key === "w") {
//   //     player.move(new THREE.Vector3(0, 0, -1));
//   //   } else if (e.key === "s") {
//   //     player.move(new THREE.Vector3(0, 0, 1));
//   //   } else if (e.key === " ") {
//   //     let feetPosition = player.getFeetPosition();
//   //     let tileBelow = island.getTileBelow(feetPosition.x, feetPosition.z);
//   //     let distanceToTileBelow = feetPosition.y - tileBelow.getTileTopPosition().z;
//   //     if (distanceToTileBelow < 0.01) {
//   //       player.jump();
//   //     }
//   //   }
//   // });
// })();
