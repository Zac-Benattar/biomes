import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Island from "./Island";
import { BiomeType, IslandParameters } from "./Island";
import { Character } from "./Character";
import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";

export default class World {
  private menu: HTMLElement;
  private hud: HTMLElement;
  private menuVisible: boolean = false;
  private renderer: THREE.WebGLRenderer;
  public camera: THREE.PerspectiveCamera;
  public scene: THREE.Scene;
  public physicsWorld: CANNON.World;
  public island: Island;
  private character: Character;
  public physicsFrameRate: number = 60;
  public physicsFrameTime: number = 1 / this.physicsFrameRate;
  private timeScaleTarget: number = 1;
  private timeScale: number = 1;
  private clock: THREE.Clock = new THREE.Clock();
  private delta: number = 0;
  private animalsFound: number = 0;

  private cannonDebugger: typeof CannonDebugger;
  private physicsDebug: boolean = false;

  constructor() {
    this.Init();
  }

  private Init(): void {
    this.createMenu();

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
      } else if (e.key === "h") {
        this.toggleShadows();
      } else if (e.key === "Escape") {
        this.toggleMenu();
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

    this.generateIsland();
    this.render(this);
    this.toggleMenu();
    this.createHUD();
  }

  private togglePause(): void {
    if (this.timeScaleTarget === 0) {
      this.timeScaleTarget = 1;
    } else {
      this.timeScaleTarget = 0;
    }
  }

  private toggleMenu(): void {
    this.togglePause();
    this.menuVisible = !this.menuVisible;
    if (this.menuVisible) {
      this.menu.style.display = "block";
    } else {
      this.menu.style.display = "none";
    }
  }

  private createMenu(): void {
    const menu = document.createElement("div");
    menu.id = "menu";
    menu.style.display = "none";
    menu.style.position = "absolute";
    menu.style.width = "200px";
    menu.style.height = "200px";
    menu.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    menu.style.color = "#fff";
    menu.style.padding = "10px";
    menu.style.zIndex = "100";
    menu.style.top = window.innerHeight / 2 - 200 / 2 + "px";
    menu.style.left = window.innerWidth / 2 - 200 / 2 + "px";

    const title = document.createElement("h1");
    title.innerHTML = "Biomes";
    title.style.margin = "0";
    title.style.padding = "0";
    menu.appendChild(title);

    const description = document.createElement("p");
    description.innerHTML =
      "A game about exploring biomes and finding animals.";
    description.style.marginTop = "0";
    description.style.paddingTop = "0";
    menu.appendChild(description);

    const controls = document.createElement("p");
    controls.innerHTML = "Controls: <br />" + "WASD - Move <br /> Space - Jump <br /> P - Enable Physics Debug <br /> L - Toggle Light Debug <br /> H - Toggle Shadows <br /> Esc - Toggle Menu";
    controls.style.marginTop = "0";
    controls.style.paddingTop = "0";
    menu.appendChild(controls);

    document.body.appendChild(menu);
    this.menu = menu;
  }

  private createHUD(): void {
    const hud = document.createElement("div");
    hud.id = "hud";
    hud.style.position = "absolute";
    hud.style.backgroundColor = "rgba(0, 0, 0, 0.0)";
    hud.style.color = "#fff";
    hud.style.padding = "10px";
    hud.style.zIndex = "100";
    hud.style.top = "0";
    hud.style.left = "0";

    const title = document.createElement("h1");
    title.innerHTML = "Animals Found: " + this.animalsFound;
    title.style.margin = "0";
    title.style.padding = "0";
    hud.appendChild(title);

    document.body.appendChild(hud);
    this.hud = hud;
  }

  private updateHUD(): void {
    this.hud.innerHTML = "Animals Found: " + this.animalsFound;
  }

  private generateIsland(): void {
    const seed = Math.random();
    this.CreateIsland(BiomeType.Ocean, seed);

    this.CreatePhysicsWorld();

    this.character = new Character(this);
    this.island.CreateGoal(
      this.island.GetTileBelow(
        this.character.getFeetPosition().x,
        this.character.getFeetPosition().z
      )
    );
  }

  // fix
  public onGoalReached(): void {
    this.animalsFound++;
    this.generateIsland();
    this.updateHUD();
  }

  public toggleShadows(): void {
    this.renderer.shadowMap.enabled = !this.renderer.shadowMap.enabled;
  }

  public EnablePhsyicsDebug(): void {
    if (!this.physicsDebug) {
      this.physicsDebug = true;
      if (this.physicsDebug) {
        this.cannonDebugger = new CannonDebugger(this.scene, this.physicsWorld);
      }
    }
  }

  private CreatePhysicsWorld(): void {
    this.physicsWorld = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.81, 0),
      broadphase: new CANNON.SAPBroadphase(this.physicsWorld),
      allowSleep: true,
    });

    // TODO: combine all tiles to a single body
    this.island.GetCannonBodies().forEach((body) => {
      this.physicsWorld.addBody(body);
    });
  }

  private CreateIsland(biomeType: BiomeType, seed: number): void {
    const params = new IslandParameters(this, biomeType, seed, 15);
    this.island = new Island(params);
  }

  private OnWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private render(world: World): void {
    this.delta = this.clock.getDelta();

    requestAnimationFrame(() => {
      world.render(world);
    });

    let timeStep = this.delta * this.timeScale;
    timeStep = Math.min(timeStep, 1 / 30);

    world.update(timeStep);

    this.renderer.render(this.scene, this.camera);
  }

  private update(timeStep: number): void {
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
