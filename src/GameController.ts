import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Island from "./Island";
import { IslandParams } from "./Island";
import { BiomeType } from "./Biomes";
import { Character } from "./Character";
import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";
import { FlyingSaucer } from "./FlyingSaucer";
import { AnimalType } from "./Animal";

const GAME_LENGTH = 60;
const SAUCER_HEIGHT = 18;
const ISLAND_RADIUS = 15;

export default class GameController {
  private menu: HTMLElement;
  private hud: HTMLElement;
  private scoreScreen: HTMLElement;
  private menuVisible: boolean = false;
  private scoreScreenVisible: boolean = false;
  private renderer: THREE.WebGLRenderer;
  public camera: THREE.PerspectiveCamera;
  public controls: OrbitControls;
  public scene: THREE.Scene;
  public physicsWorld: CANNON.World;
  public island: Island;
  private character: Character;
  private flyingSaucer: FlyingSaucer;
  public physicsFrameRate: number = 60;
  public physicsFrameTime: number = 1 / this.physicsFrameRate;
  private timeScaleTarget: number = 1;
  private timeScale: number = 1;
  private clock: THREE.Clock = new THREE.Clock();
  private delta: number = 0;
  private animalsCollected: number = 0;
  public goalReached: boolean = false;
  private gameStarted: boolean = false;
  private timeRemaining: number = GAME_LENGTH;
  private timeAtPause: number = 0;
  private initialPlayerGroundingOccurred: boolean = false;
  public spawnHeight: number = SAUCER_HEIGHT;

  private cannonDebugger: typeof CannonDebugger;
  private physicsDebug: boolean = false;

  constructor() {
    this.Init();
  }

  /* Initialises the game controller class */
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
        this.onWindowResize();
      },
      false
    );

    window.addEventListener("keydown", (e) => {
      if (e.key === "p") {
        this.enablePhsyicsDebug();
      } else if (e.key === "l") {
        this.island.toggleLightDebug();
      } else if (e.key === "h") {
        this.toggleShadowCasting();
      } else if (e.key === "Escape") {
        if (!this.scoreScreenVisible) this.toggleMenu();
      } else {
        if (
          this.gameStarted &&
          this.timeRemaining > 0 &&
          !this.menuVisible &&
          !this.scoreScreenVisible
        )
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

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 10, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.update();

    this.createPhysicsWorld();

    this.character = new Character(this);
    this.flyingSaucer = new FlyingSaucer(
      this,
      new THREE.Vector3(0, SAUCER_HEIGHT, 0)
    );
    this.flyingSaucer.enableBeam(new THREE.Vector3(0, -5, 0));

    this.generateIsland();
    this.render(this);
    this.toggleMenu();
    this.createHUD();
  }

  /* Resets the camera to the default position */
  private resetCamera(): void {
    this.camera.position.set(20, 20, 20);
    this.camera.lookAt(0, 10, 0);
    this.camera.updateMatrixWorld();
    this.controls.target.set(0, 10, 0);
  }

  /* Toggles the pause state of the game */
  private togglePause(): void {
    if (this.timeScaleTarget === 0) {
      this.timeScaleTarget = 1;
    } else {
      this.timeScaleTarget = 0;
    }

    this.timeAtPause = this.clock.getElapsedTime();
  }

  /* Toggles whether the menu is visible */
  private toggleMenu(): void {
    this.togglePause();

    if (this.gameStarted) {
      this.menu.getElementsByClassName("startButton")[0].innerHTML = "Resume";
      const restartButton =
        this.menu.getElementsByClassName("restartButton")[0];
      restartButton.style.display = "block";
    }

    this.menuVisible = !this.menuVisible;
    if (this.menuVisible) {
      this.menu.style.display = "block";
    } else {
      this.menu.style.display = "none";
    }

    if (this.menuVisible) {
      this.controls.enabled = false;
      this.clock.stop();
    } else {
      this.controls.enabled = true;
      this.clock.start();
    }

    if (!this.gameStarted && this.initialPlayerGroundingOccurred) {
      this.gameStarted = true;
    }
  }

  /* Creates the menu HTML element */
  private createMenu(): void {
    const menu = document.createElement("div");
    menu.id = "menu";
    menu.style.display = "none";
    menu.style.position = "absolute";
    menu.style.width = (window.innerWidth * 0.4).toString() + "px";
    menu.style.height = (window.innerHeight * 0.6).toString() + "px";
    menu.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    menu.style.color = "#fff";
    menu.style.padding = "10px";
    menu.style.zIndex = "100";
    menu.style.top =
      (window.innerHeight / 2 - window.innerHeight * 0.3).toString() + "px";
    menu.style.left =
      (window.innerWidth / 2 - window.innerWidth * 0.2).toString() + "px";
    menu.style.textAlign = "center";

    const title = document.createElement("h1");
    title.innerHTML = "Biomes";
    menu.appendChild(title);

    const description = document.createElement("p");
    description.innerHTML =
      "A game about exploring biomes and finding animals.";
    menu.appendChild(description);

    const controls = document.createElement("p");
    controls.innerHTML =
      "Controls: <br />" +
      "WASD - Move <br /> Space - Jump <br /> P - Enable Physics Debug <br /> L - Toggle Light Debug <br /> H - Toggle Shadow Casting <br /> Esc - Toggle Menu";
    menu.appendChild(controls);

    const startButton = document.createElement("button");
    startButton.className = "startButton";
    startButton.innerHTML = "Start";
    startButton.style.margin = "10px";
    startButton.style.padding = "10px";
    startButton.style.backgroundColor = "#fff";
    startButton.style.color = "#000";
    startButton.style.border = "none";
    startButton.style.borderRadius = "5px";
    startButton.style.cursor = "pointer";
    startButton.style.fontSize = "1.2em";
    startButton.addEventListener("click", () => {
      if (!this.gameStarted && this.initialPlayerGroundingOccurred) {
        this.gameStarted = true;
      }
      this.toggleMenu();
    });
    menu.appendChild(startButton);

    const restartButton = document.createElement("button");
    restartButton.className = "restartButton";
    restartButton.innerHTML = "Restart";
    restartButton.style.margin = "10px";
    restartButton.style.padding = "10px";
    restartButton.style.backgroundColor = "#fff";
    restartButton.style.color = "#000";
    restartButton.style.border = "none";
    restartButton.style.borderRadius = "5px";
    restartButton.style.cursor = "pointer";
    restartButton.style.fontSize = "1.2em";
    restartButton.addEventListener("click", () => {
      this.initialPlayerGroundingOccurred = false;
      this.timeRemaining = GAME_LENGTH;
      this.animalsCollected = 0;
      this.gameStarted = false;
      if (this.scoreScreenVisible) this.toggleScoreScreen();
      this.toggleMenu();
      this.generateNextIsland();
    });
    restartButton.style.display = "none";
    menu.appendChild(restartButton);

    document.body.appendChild(menu);
    this.menu = menu;
  }

  /* Creates the HUD HTML element */
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

    const time = document.createElement("h2");
    time.className = "time";
    time.innerHTML = "Time: " + this.timeRemaining + "s";
    time.style.margin = "1";
    time.style.padding = "1";
    hud.appendChild(time);

    const animalsCollected = document.createElement("h2");
    animalsCollected.className = "animalsCollected";
    animalsCollected.innerHTML = "Animals Collected: " + this.animalsCollected;
    animalsCollected.style.margin = "1";
    animalsCollected.style.padding = "1";
    hud.appendChild(animalsCollected);

    const biomeName = document.createElement("h2");
    biomeName.className = "biomeName";
    biomeName.innerHTML = "Biome: " + BiomeType[this.island.params.biome];
    biomeName.style.margin = "1";
    biomeName.style.padding = "1";
    hud.appendChild(biomeName);

    const animalToLookFor = document.createElement("h2");
    animalToLookFor.className = "animalToLookFor";
    animalToLookFor.innerHTML = "Animal: " + "???";
    animalToLookFor.style.margin = "1";
    animalToLookFor.style.padding = "1";
    hud.appendChild(animalToLookFor);

    document.body.appendChild(hud);
    this.hud = hud;
  }

  /* Updates the HUD HTML element to reflect current game state */
  private updateHUD(): void {
    this.hud.getElementsByClassName("time")[0].innerHTML =
      "Time: " + this.timeRemaining.toFixed(3) + "s";
    this.hud.getElementsByClassName("animalsCollected")[0].innerHTML =
      "Animals Collected: " + this.animalsCollected;
    this.hud.getElementsByClassName("biomeName")[0].innerHTML =
      "Biome: " + BiomeType[this.island.params.biome];
    if (this.island.goal)
      this.hud.getElementsByClassName("animalToLookFor")[0].innerHTML =
        "Animal: " + AnimalType[this.island.goal.animalType];
  }

  /* Creates the score screen HTML element */
  private createScoreScreen(): void {
    const scoreScreen = document.createElement("div");
    scoreScreen.id = "scoreScreen";
    scoreScreen.style.position = "absolute";
    scoreScreen.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    scoreScreen.style.color = "#fff";
    scoreScreen.style.padding = "10px";
    scoreScreen.style.zIndex = "100";
    scoreScreen.style.width = (window.innerWidth * 0.4).toString() + "px";
    scoreScreen.style.height = (window.innerHeight * 0.6).toString() + "px";
    scoreScreen.style.top =
      (window.innerHeight / 2 - window.innerHeight * 0.3).toString() + "px";
    scoreScreen.style.left =
      (window.innerWidth / 2 - window.innerWidth * 0.2).toString() + "px";
    scoreScreen.style.textAlign = "center";

    const title = document.createElement("h1");
    title.innerHTML = "Game Over";
    scoreScreen.appendChild(title);

    const description = document.createElement("p");
    description.innerHTML =
      "You found " +
      this.animalsCollected +
      " animals! <br />" +
      "Thanks for playing!";
    scoreScreen.appendChild(description);

    const restartButton = document.createElement("button");
    restartButton.className = "scoreScreenRestartButton";
    restartButton.innerHTML = "Restart";
    restartButton.style.margin = "10px";
    restartButton.style.padding = "10px";
    restartButton.style.backgroundColor = "#fff";
    restartButton.style.color = "#000";
    restartButton.style.border = "none";
    restartButton.style.borderRadius = "5px";
    restartButton.style.cursor = "pointer";
    restartButton.style.fontSize = "1.2em";
    restartButton.addEventListener("click", () => {
      this.initialPlayerGroundingOccurred = false;
      this.timeRemaining = GAME_LENGTH;
      this.animalsCollected = 0;
      this.gameStarted = false;
      this.toggleScoreScreen();
      this.toggleMenu();
      this.generateNextIsland();
    });
    scoreScreen.appendChild(restartButton);

    document.body.appendChild(scoreScreen);
    this.scoreScreen = scoreScreen;
  }

  /* Toggles whether the score screen is visible */
  private toggleScoreScreen(): void {
    if (this.scoreScreenVisible) {
      this.controls.enabled = true;
      this.scoreScreen.style.display = "none";
      this.scoreScreenVisible = false;
    } else {
      this.controls.enabled = false;
      this.scoreScreen.style.display = "block";
      this.scoreScreenVisible = true;
    }
  }

  /* Generates a new island */
  private generateIsland(): void {
    if (this.island) {
      this.island.removeFromWorld();
    }

    const seed = Math.random();
    const biomeOptions = Object.keys(BiomeType).length / 2;
    const biomeType: BiomeType = Math.floor(seed * biomeOptions);

    // If we're generating the same biome, just regenerate the island
    if (this.island && this.island.params.biome === biomeType) {
      this.generateIsland();
      return;
    }

    this.createIsland(biomeType, seed);

    this.island.createGoal(this.island.getTileFromXZ(0, 0));
  }

  /* Pauses game and sets the game state to goal reached.
  Moves saucer to goal tile and enables beam.
  Moves camera to goal tile.
  Starts 5 second timer to generate the next biome */
  public onGoalReached(): void {
    if (!this.goalReached) {
      this.timeAtPause += this.clock.getElapsedTime();
      this.goalReached = true;
      this.animalsCollected++;

      setTimeout(() => {
        this.generateNextIsland();
      }, 5000);

      const goalTilePosition = this.island.goalTile.getTileTopPosition();
      this.flyingSaucer.setPosition(
        new THREE.Vector3(goalTilePosition.x, SAUCER_HEIGHT, goalTilePosition.z)
      );
      this.flyingSaucer.enableBeam(goalTilePosition);

      this.moveCameraToGoal();
    }
  }

  /* Moves the camera to the goal tile */
  private moveCameraToGoal(): void {
    const goalPosition = this.island.goalTile.getTileTopPosition();
    const goalDirection = goalPosition.normalize();
    const cameraPosition = new THREE.Vector3(
      goalDirection.x * ISLAND_RADIUS * 1.2,
      SAUCER_HEIGHT + 5,
      goalDirection.z * ISLAND_RADIUS * 1.2
    );

    this.camera.position.copy(cameraPosition);
    this.camera.lookAt(goalPosition);
    this.camera.updateMatrixWorld();
  }

  /* Generates the next island */
  private generateNextIsland(): void {
    this.goalReached = false;
    this.initialPlayerGroundingOccurred = false;

    // Reset character position, velocity, rotation
    this.character.reset();

    // Reset flying saucer position, velocity, rotation
    const flyingSaucerPosition: THREE.Vector3 = new THREE.Vector3(
      0,
      SAUCER_HEIGHT,
      0
    );
    this.flyingSaucer.setPosition(flyingSaucerPosition);
    this.flyingSaucer.enableBeam(
      this.island.getTileFromXZ(0, 0).getTileItemPosition()
    );

    // Generate new island
    this.generateIsland();

    // Refresh debug view
    if (this.physicsDebug) {
      this.cannonDebugger.update();
    }

    this.resetCamera();
    this.updateHUD();

    this.timeAtPause += this.clock.getElapsedTime();
    this.clock.start();
  }

  /* Toggles whether shadows are cast */
  public toggleShadowCasting(): void {
    this.renderer.shadowMap.enabled = !this.renderer.shadowMap.enabled;
  }

  /* Enables physics debug view */
  public enablePhsyicsDebug(): void {
    if (!this.physicsDebug) {
      this.physicsDebug = true;
      if (this.physicsDebug) {
        this.cannonDebugger = new CannonDebugger(this.scene, this.physicsWorld);
      }
    }
  }

  /* Creates the physics world */
  private createPhysicsWorld(): void {
    this.physicsWorld = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.81, 0),
      broadphase: new CANNON.SAPBroadphase(this.physicsWorld),
      allowSleep: true,
    });
  }

  /* Creates the island */
  private createIsland(biomeType: BiomeType, seed: number): void {
    const params = new IslandParams(this, biomeType, seed, 15);
    this.island = new Island(params);
  }

  /* Updates the camera render settings to match window size */
  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /* Renders the scene, progresses times and calls a game state update*/
  private render(gameContoller: GameController): void {
    this.delta = this.clock.getDelta();

    requestAnimationFrame(() => {
      gameContoller.render(gameContoller);
    });

    let timeStep = this.delta * this.timeScale;
    timeStep = Math.min(timeStep, 1 / 30);

    gameContoller.update(timeStep);

    this.renderer.render(this.scene, this.camera);
  }

  /* Updates the game state. Performs checks for goal reached and time up */
  private update(timeStep: number): void {
    if (this.timeRemaining <= 0) {
      if (this.goalReached) this.clock.stop();
      if (!this.scoreScreenVisible) {
        this.createScoreScreen();
        this.toggleScoreScreen();
      }
    }

    if (this.gameStarted) {
      if (!this.goalReached && this.timeRemaining > 0 && !this.menuVisible) {
        const newTime =
          this.timeRemaining - this.clock.getElapsedTime() * 0.001;
        if (newTime < 0) {
          this.timeRemaining = 0;
        } else {
          this.timeRemaining = newTime;
        }

        if (
          this.island.getTileFromXZ(
            this.character.position.x,
            this.character.position.z
          ) === this.island.goalTile
        ) {
          this.onGoalReached();
        }
      }
    }

    if (this.hud) this.updateHUD();

    this.physicsWorld.step(this.physicsFrameTime, timeStep);

    this.character.update(timeStep);

    // Check if the player has landed on the ground for the first time
    if (this.character.grounded && !this.initialPlayerGroundingOccurred) {
      this.initialPlayerGroundingOccurred = true;
      this.flyingSaucer.disableBeam();
      this.gameStarted = true;
    }

    this.island.update(timeStep);

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
