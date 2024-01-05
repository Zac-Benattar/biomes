import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createNoise2D } from "simplex-noise";
import Item, { AnimalType } from "./Item";
import Tile, { TileTop, TileType } from "./Tile";
import { FeatureType, TileFeature } from "./TileFeature";
import * as CANNON from "cannon-es";
import GameController from "./GameController";
import { BiomeData, BiomeHelper, BiomeType, Layer } from "./Biomes";

export class IslandParams {
  gameController: GameController;
  biome: BiomeType;
  biomeParams: BiomeData;
  seed: number = Math.random();
  radius: number = 15;

  constructor(gameController: GameController, biome: BiomeType, seed?: number, radius?: number) {
    this.gameController = gameController;
    this.biome = biome;
  }
}

enum Weather {
  None,
  Rain,
  Snow,
}

export default class Island {
  public params: IslandParams;
  public tiles: Array<Tile>;
  public goalTile: Tile | null = null;
  private weather: Weather = Weather.None;
  private particles: THREE.Points<THREE.BufferGeometry> | null;
  private sun: THREE.DirectionalLight;
  private moon: THREE.DirectionalLight;
  private sunHelper: THREE.DirectionalLightHelper;
  private moonHelper: THREE.DirectionalLightHelper;
  private sunShadowHelper: THREE.CameraHelper;
  private moonShadowHelper: THREE.CameraHelper;
  private sunAngle: number;
  private moonAngle: number;
  private previousRAF: number = 0;
  private orbitRadius: number = 100;
  private orbitSpeed: number = 0.05;
  private lightDebug: boolean;

  constructor(params: IslandParams) {
    this.Init(params);
  }

  private Init(params: IslandParams) {
    this.params = params;
    this.tiles = [];

    this.params.biomeParams = BiomeHelper.parseBiomeData(this.params.biome);

    const noise2D = createNoise2D(this.randomFunction(this.params.seed)); // Create a seeded 2D noise function - gives values between -1 and 1

    for (let z = -this.params.radius; z < this.params.radius; z++) {
      for (let x = -this.params.radius; x < this.params.radius; x++) {
        let position = this.tileXZToPosition(x, z);
        if (position.length() > this.params.radius - 1) continue; // Skip tiles outside of the island radius

        let noise = (noise2D(x * 0.1, z * 0.1) + 1) / 2; // Normalize noise to 0-1
        noise = Math.pow(noise, this.params.biomeParams.heightVariance); // Smooth out the noise
        let height = Math.min(
          noise * (this.params.biomeParams.maxHeight - this.getMinHeight()) +
            this.getMinHeight(),
          this.params.biomeParams.maxHeight
        );
        let featureType: FeatureType;
        let item: Item = null;

        let tileLayer: Layer | undefined = this.params.biomeParams.layers.find(
          (layer) => {
            return height >= layer.minHeight;
          }
        );

        if (tileLayer === undefined) {
          console.log("No layer found for height " + height);
          continue;
        }

        // Pick a feature based on probability
        if (tileLayer.features.length > 0) {
          const featureProbability = Math.random();
          let cumulativeProbability = 0;
          for (let i = 0; i < tileLayer.features.length; i++) {
            cumulativeProbability += tileLayer.features[i].probability;
            if (featureProbability <= cumulativeProbability) {
              featureType = tileLayer.features[i].featureType;
              break;
            }
          }
        }

        const tileType: TileType =
          tileLayer.tileTypes[
            Math.floor(Math.random() * tileLayer.tileTypes.length)
          ];

        const tiletop: TileTop =
          tileLayer.topTypes[
            Math.floor(Math.random() * tileLayer.topTypes.length)
          ];

        this.tiles.push(
          new Tile(
            this.params.gameController,
            height,
            position,
            tileType,
            featureType,
            item,
            tiletop
          )
        );
      }
    }

    this.enableLights(this.params.gameController.scene);
    this.createIslandBase(this.params.gameController.scene);
  }

  public update(t: number): void {
    this.updateParticles(t);
    this.updateLightOrbits(t);
    this.previousRAF += t;
  }

  public getMaxHeight(): number {
    return this.params.biomeParams.layers.reduce((max, layer) => {
      return Math.max(max, layer.minHeight);
    }, 0);
  }

  private getMinHeight(): number {
    return this.params.biomeParams.layers.reduce((min, layer) => {
      return Math.min(min, layer.minHeight);
    }, this.params.biomeParams.maxHeight);
  }

  private tileXZToPosition(tileX: number, tileZ: number): THREE.Vector3 {
    return new THREE.Vector3(
      (tileX + (tileZ % 2) * 0.5) * 1.77,
      0,
      tileZ * 1.535
    );
  }

  private randomFunction(seed: number): Function {
    // Constants (A and M) for the LCG algorithm
    const A = 1664525;
    const M = 2 ** 32;

    let state = seed;

    function lcg() {
      state = (A * state) % M;
      return state / M;
    }

    return function () {
      return lcg();
    };
  }

  public setShadowMapSize(width: number, height: number): void {
    this.sun.shadow.mapSize.width = width;
    this.sun.shadow.mapSize.height = height;
    this.moon.shadow.mapSize.width = width;
    this.moon.shadow.mapSize.height = height;
  }

  private getClouds(): THREE.Mesh<
    THREE.BufferGeometry<THREE.NormalBufferAttributes>,
    THREE.MeshStandardMaterial,
    THREE.Object3DEventMap
  > {
    let geo: THREE.BufferGeometry = new THREE.SphereGeometry(0, 0, 0);
    let count = this.params.biomeParams.weather.clouds.count;

    for (let i = 0; i < count; i++) {
      const puff1 = new THREE.SphereGeometry(1.2, 7, 7);
      const puff2 = new THREE.SphereGeometry(1.5, 7, 7);
      const puff3 = new THREE.SphereGeometry(0.9, 7, 7);

      puff1.translate(-1.85, Math.random() * 0.3, 0);
      puff2.translate(0, Math.random() * 0.3, 0);
      puff3.translate(1.85, Math.random() * 0.3, 0);

      const cloudGeo = BufferGeometryUtils.mergeGeometries([
        puff1,
        puff2,
        puff3,
      ]);
      cloudGeo.translate(
        Math.random() * this.params.radius - 5,
        Math.random() * 5 + this.params.biomeParams.weather.clouds.minHeight,
        Math.random() * this.params.radius - 5
      );
      cloudGeo.rotateY(Math.random() * Math.PI * 2);

      geo = BufferGeometryUtils.mergeGeometries([geo, cloudGeo]);
    }

    const colour = new THREE.Color(
      this.params.biomeParams.weather.clouds.colour
    );
    const opacity = 0.9;

    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        color: colour,
        flatShading: true,
        transparent: true,
        opacity: opacity,
      })
    );
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    return mesh;
  }

  private getSnow(): THREE.Points<THREE.BufferGeometry> {
    let particles;
    let positions: number[] = [];
    let velocities: number[] = [];
    const particleCount = 250;
    const geo = new THREE.BufferGeometry();
    const textureLoader = new THREE.TextureLoader();

    for (let i = 0; i < particleCount; i++) {
      positions.push(
        Math.floor((Math.random() - 0.5) * (this.params.radius * 1.7)),
        Math.floor(Math.random() * this.getMaxHeight()),
        Math.floor((Math.random() - 0.5) * (this.params.radius * 1.7))
      );
      velocities.push(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.05) * -5 - 0.05,
        (Math.random() - 0.5) * 0.5
      );
    }

    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geo.setAttribute(
      "velocity",
      new THREE.Float32BufferAttribute(velocities, 3)
    );

    // Create a basic white square particle
    const material = new THREE.PointsMaterial({
      size: 0.5,
      map: textureLoader.load("assets/snowflake.png"),
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true,
      opacity: 0.8,
    });

    particles = new THREE.Points(geo, material);
    return particles;
  }

  private getRain(): THREE.Points<THREE.BufferGeometry> {
    let particles;
    let positions: number[] = [];
    let velocities: number[] = [];
    const particleCount = 250;
    const geo = new THREE.BufferGeometry();
    const textureLoader = new THREE.TextureLoader();

    for (let i = 0; i < particleCount; i++) {
      positions.push(
        Math.floor((Math.random() - 0.5) * (this.params.radius * 1.7)),
        Math.floor(Math.random() * this.getMaxHeight()),
        Math.floor((Math.random() - 0.5) * (this.params.radius * 1.7))
      );
      velocities.push(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.05) * -5 - 3,
        (Math.random() - 0.5) * 0.2
      );
    }

    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geo.setAttribute(
      "velocity",
      new THREE.Float32BufferAttribute(velocities, 3)
    );

    // Create a basic white square particle
    const material = new THREE.PointsMaterial({
      size: 0.5,
      map: textureLoader.load("assets/raindrop.png"),
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true,
      opacity: 0.8,
    });

    particles = new THREE.Points(geo, material);
    return particles;
  }

  private updateParticles(t: number): void {
    const min_height = this.getMinHeight();
    if (this.particles) {
      for (
        let i = 0;
        i < this.particles.geometry.attributes.position.count;
        i++
      ) {
        let x = this.particles.geometry.attributes.position.array[i * 3];
        let y = this.particles.geometry.attributes.position.array[i * 3 + 1];
        let z = this.particles.geometry.attributes.position.array[i * 3 + 2];

        if (
          y < min_height ||
          Math.abs(x) > this.params.radius - 1 ||
          Math.abs(z) > this.params.radius - 1
        ) {
          let driftMultiplier = 0.2;
          let speedOffset = 3;
          if (this.weather === Weather.Snow) {
            driftMultiplier = 0.5;
            speedOffset = 0.5;
          }

          this.particles.geometry.attributes.position.array[i * 3] = Math.floor(
            (Math.random() - 0.5) * (this.params.radius * 1.7)
          );
          this.particles.geometry.attributes.position.array[i * 3 + 1] =
            Math.floor(
              Math.random() * 5 +
                this.params.biomeParams.weather.clouds.minHeight
            );
          this.particles.geometry.attributes.position.array[i * 3 + 2] =
            Math.floor((Math.random() - 0.5) * (this.params.radius * 1.7));

          this.particles.geometry.attributes.velocity.array[i * 3] =
            (Math.random() - 0.5) * driftMultiplier;
          this.particles.geometry.attributes.velocity.array[i * 3 + 1] =
            (Math.random() - 0.05) * -5 - speedOffset;
          this.particles.geometry.attributes.velocity.array[i * 3 + 2] =
            (Math.random() - 0.5) * driftMultiplier;
          this.particles.geometry.attributes.position.needsUpdate = true;
          continue;
        }

        this.particles.geometry.attributes.position.array[i * 3] =
          x + this.particles.geometry.attributes.velocity.array[i * 3] * t;
        this.particles.geometry.attributes.position.array[i * 3 + 1] =
          y + this.particles.geometry.attributes.velocity.array[i * 3 + 1] * t;
        this.particles.geometry.attributes.position.array[i * 3 + 2] =
          z + this.particles.geometry.attributes.velocity.array[i * 3 + 2] * t;

        this.particles.geometry.attributes.position.needsUpdate = true;
      }
    }
  }

  public createIslandBase(scene: THREE.Scene): void {
    if (this.params.biomeParams.water) {
      let waterMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(
          this.params.radius + 1,
          this.params.radius + 1,
          this.params.biomeParams.water.height,
          6
        ),
        new THREE.MeshPhysicalMaterial({
          color: 0x55aaff,
          transparent: true,
          transmission: 0.9,
          opacity: 0.5,
          ior: 1.4,
          reflectivity: 0.5,
          metalness: 0.02,
          roughness: 1,
          thickness: 1.5,
        })
      );
      waterMesh.position.set(0, this.params.biomeParams.water.height / 2, 0);

      scene.add(waterMesh);
    }

    let islandContainerMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        this.params.radius + 2,
        this.params.radius + 2,
        this.params.biomeParams.maxHeight * 0.25,
        1,
        6,
        true
      ),
      new THREE.MeshPhysicalMaterial({
        color: 0x888888,
        roughness: 1,
        side: THREE.DoubleSide,
      })
    );
    islandContainerMesh.position.set(
      0,
      this.params.biomeParams.maxHeight * 0.125,
      0
    );

    let islandFloorMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        this.params.radius + 2,
        this.params.radius + 2,
        this.params.biomeParams.maxHeight * 0.1,
        6
      ),
      new THREE.MeshStandardMaterial({
        color: 0x888888,
        flatShading: true,
        side: THREE.DoubleSide,
      })
    );
    islandFloorMesh.position.set(
      0,
      this.params.biomeParams.maxHeight * 0.02,
      0
    );

    scene.add(islandContainerMesh, islandFloorMesh);

    if (this.params.biomeParams.weather) {
      if (this.params.biomeParams.weather.clouds) {
        scene.add(this.getClouds());
      }

      // Implement precipitation
      if (this.params.biomeParams.weather.precipitation) {
        // Determine whether it should snow or rain
        if (
          Math.random() < this.params.biomeParams.weather.precipitation.snowBias
        ) {
          this.particles = this.getSnow();
          scene.add(this.particles);
        } else {
          this.particles = this.getRain();
          scene.add(this.particles);
        }
      }
    }
  }

  public getTileFromXZ(x: number, z: number): Tile | null {
    // Find the tile with the closest center x,z to the given position
    let closestTile: Tile | null = null;
    let closestDistance = 1000;
    for (let i = 0; i < this.tiles.length; i++) {
      let distance = Math.sqrt(
        Math.pow(this.tiles[i].position.x - x, 2) +
          Math.pow(this.tiles[i].position.z - z, 2)
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTile = this.tiles[i];
      }
    }
    return closestTile;
  }

  private enableLights(scene: THREE.Scene): void {
    const ambientLight = new THREE.AmbientLight(0xffcb8e, 0.1);
    ambientLight.castShadow = false;
    scene.add(ambientLight);

    this.sunAngle = Math.random() * Math.PI * 2;
    this.sun = new THREE.DirectionalLight(0xffcb8e, 4);
    this.setLightAngle(this.sun, this.sunAngle);
    this.sun.castShadow = true;
    this.sun.shadow.camera.zoom = 0.3;
    this.sun.shadow.camera.near = this.orbitRadius - this.params.radius * 1.3;
    this.sun.shadow.camera.far = this.orbitRadius + this.params.radius * 1.3;
    this.sun.target.position.set(0, 0, 0);
    scene.add(this.sun);

    this.moonAngle = this.sunAngle + Math.PI;
    this.moon = new THREE.DirectionalLight(0xffffff, 1);
    this.setLightAngle(this.moon, this.moonAngle);
    this.moon.castShadow = true;
    this.moon.shadow.camera.zoom = 0.3;
    this.moon.shadow.camera.near = this.orbitRadius - this.params.radius * 1.3;
    this.moon.shadow.camera.far = this.orbitRadius + this.params.radius * 1.3;
    this.moon.target.position.set(0, 0, 0);
    scene.add(this.moon);

    this.setShadowMapSize(512, 512);
  }

  public toggleLightDebug(): void {
    this.lightDebug = !this.lightDebug;
    if (this.lightDebug) {
      this.sunHelper = new THREE.DirectionalLightHelper(this.sun, 5);
      this.params.gameController.scene.add(this.sunHelper);
      this.sunShadowHelper = new THREE.CameraHelper(this.sun.shadow.camera);
      this.params.gameController.scene.add(this.sunShadowHelper);
      this.moonHelper = new THREE.DirectionalLightHelper(this.moon, 5);
      this.params.gameController.scene.add(this.moonHelper);
      this.moonShadowHelper = new THREE.CameraHelper(this.moon.shadow.camera);
      this.params.gameController.scene.add(this.moonShadowHelper);
      this.params.gameController.scene.add(this.sunHelper);
      this.params.gameController.scene.add(this.sunShadowHelper);
      this.params.gameController.scene.add(this.moonHelper);
      this.params.gameController.scene.add(this.moonShadowHelper);
    } else {
      this.params.gameController.scene.remove(this.sunHelper);
      this.params.gameController.scene.remove(this.sunShadowHelper);
      this.params.gameController.scene.remove(this.moonHelper);
      this.params.gameController.scene.remove(this.moonShadowHelper);
      this.sunHelper = null;
      this.sunShadowHelper = null;
      this.moonHelper = null;
      this.moonShadowHelper = null;
    }
  }

  private setLightAngle(light: THREE.DirectionalLight, angle: number): void {
    light.position.set(
      this.orbitRadius * Math.sin(angle),
      this.orbitRadius * Math.cos(angle),
      0
    );
  }

  private updateLightOrbits(t: number) {
    this.sunAngle += t * this.orbitSpeed;
    if (this.sunAngle > Math.PI * 2) this.sunAngle -= Math.PI * 2;
    this.setLightAngle(this.sun, this.sunAngle);

    this.moonAngle += t * this.orbitSpeed;
    if (this.moonAngle > Math.PI * 2) this.moonAngle -= Math.PI * 2;
    this.setLightAngle(this.moon, this.moonAngle);

    this.sun.target.updateMatrixWorld();
    this.moon.target.updateMatrixWorld();

    this.sun.shadow.camera.updateProjectionMatrix();
    this.moon.shadow.camera.updateProjectionMatrix();

    if (this.lightDebug) {
      this.sunHelper.update();
      this.moonHelper.update();
      this.sunShadowHelper.update();
      this.moonShadowHelper.update();
    }
  }

  public createGoal(playerTile: Tile): void {
    if (this.goalTile == null) {
      let goalTile: Tile | null = null;
      while (
        goalTile === null ||
        goalTile === playerTile ||
        goalTile.feature !== TileFeature.None
      ) {
        goalTile = this.tiles[Math.floor(Math.random() * this.tiles.length)];
      }
      goalTile.SetGoal(AnimalType.Penguin);
      this.goalTile = goalTile;
    }
  }
}
