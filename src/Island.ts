import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createNoise2D } from "simplex-noise";
import Item, { AnimalType } from "./Items";
import Tile, { TileFeature, TileTop, TileType } from "./Tile";
import * as CANNON from "cannon-es";

export enum BiomeType {
  Jungle,
  Forest,
  Desert,
  Alpine,
  Savanna,
  Ocean,
  Mesa,
  Volcano,
  Tundra,
  Swamp,
  Plains,
  Taiga, // Less snowy than Alpine
  Beach,
  Meadow,
  MartianDesert,
}

export enum Weather {
  Sunny,
  Rainy,
  Snowy,
  Stormy,
  Clear,
}

class TileFeatureProbability {
  feature: TileFeature;
  probability: number;

  constructor(feature: TileFeature, probability: number) {
    this.feature = feature;
    this.probability = probability;
  }
}

class Layer {
  min_height: number;
  tileTypes: TileType[];
  features: TileFeatureProbability[];

  constructor(
    min_height: number,
    tileTypes: TileType[],
    features: TileFeatureProbability[]
  ) {
    this.min_height = min_height;
    this.tileTypes = tileTypes;
    this.features = features;
  }
}

export class IslandParameters {
  scene: THREE.Scene;
  biome: BiomeType;
  seed: number = Math.random();
  radius: number = 15;

  constructor(
    scene: THREE.Scene,
    biome: BiomeType,
    seed: number,
    radius: number
  ) {
    this.scene = scene;
    this.biome = biome;
    this.seed = seed;
    this.radius = radius;
  }
}

export class BiomeGenerationParameters {
  max_height: number;
  height_variance: number;
  weather: Weather;
  clouds: boolean;
  clouds_min_height: number;
  water: boolean;
  water_height: number = 0.5;
  layers: Layer[];
}

export default class Island {
  private Params: IslandParameters;
  private GenerationParams: BiomeGenerationParameters;
  private tiles: Array<Tile>;
  private items: Array<Item>;
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
  private orbitSpeed: number = 0.05; // 0.05 for production
  private lightDebug: boolean;

  constructor(params: IslandParameters) {
    this.Init(params);
  }

  private Init(params: IslandParameters) {
    this.Params = params;
    this.tiles = [];
    this.items = [];

    switch (this.Params.biome) {
      case BiomeType.Alpine:
        this.GenerationParams = {
          max_height: 14,
          height_variance: 1.5,
          weather: Weather.Snowy,
          clouds: true,
          clouds_min_height: 13,
          water: false,
          water_height: 0.5,
          layers: [
            new Layer(
              8,
              [TileType.Stone],
              [
                new TileFeatureProbability(TileFeature.Rock, 0.1),
                new TileFeatureProbability(TileFeature.AlpineTree, 0.3),
              ]
            ),
            new Layer(
              7,
              [TileType.Dirt],
              [
                new TileFeatureProbability(TileFeature.AlpineTree, 0.2),
                new TileFeatureProbability(TileFeature.Snow, 0.8),
              ]
            ),
            new Layer(6, [TileType.Dirt], []),
            new Layer(4, [TileType.Grass], []),
            new Layer(1, [TileType.Grass], []),
          ],
        };
        break;
      case BiomeType.Desert:
        this.GenerationParams = {
          max_height: 3,
          height_variance: 0.5,
          weather: Weather.Sunny,
          clouds: false,
          clouds_min_height: 11,
          water: false,
          water_height: 0.5,
          layers: [
            new Layer(
              1,
              [TileType.Sand],
              [
                new TileFeatureProbability(TileFeature.Rock, 0.2),
                new TileFeatureProbability(TileFeature.Tumbleweed, 0.2),
                new TileFeatureProbability(TileFeature.Cactus, 0.2),
              ]
            ),
          ],
        };
        break;
      case BiomeType.MartianDesert:
        this.GenerationParams = {
          max_height: 3,
          height_variance: 0.5,
          weather: Weather.Sunny,
          clouds: false,
          clouds_min_height: 11,
          water: false,
          water_height: 0.5,
          layers: [
            new Layer(
              1,
              [TileType.MartianSand],
              [
                new TileFeatureProbability(TileFeature.Rock, 0.2),
                new TileFeatureProbability(TileFeature.Tumbleweed, 0.2),
                new TileFeatureProbability(TileFeature.Cactus, 0.2),
              ]
            ),
          ],
        };
        break;
      case BiomeType.Forest:
        this.GenerationParams = {
          max_height: 8,
          height_variance: 1,
          weather: Weather.Sunny,
          clouds: true,
          clouds_min_height: 11,
          water: true,
          water_height: 2,
          layers: [
            new Layer(
              7,
              [TileType.Stone],
              [new TileFeatureProbability(TileFeature.Rock, 0.1)]
            ),
            new Layer(
              6,
              [TileType.Dirt],
              [
                new TileFeatureProbability(TileFeature.BasicTree, 0.3),
                new TileFeatureProbability(TileFeature.Grass, 0.7),
              ]
            ),
            new Layer(
              4,
              [TileType.Dirt],
              [new TileFeatureProbability(TileFeature.BasicTree, 0.4)]
            ),
            new Layer(
              1,
              [TileType.Grass],
              [new TileFeatureProbability(TileFeature.BasicTree, 0.2)]
            ),
          ],
        };
        break;
      case BiomeType.Jungle:
        this.GenerationParams = {
          max_height: 8,
          height_variance: 1,
          weather: Weather.Sunny,
          clouds: true,
          clouds_min_height: 13,
          water: true,
          water_height: 2,
          layers: [
            new Layer(
              5,
              [TileType.Dirt],
              [
                new TileFeatureProbability(TileFeature.JungleTree, 0.3),
                new TileFeatureProbability(TileFeature.Grass, 0.7),
              ]
            ),
            new Layer(
              3,
              [TileType.Dirt],
              [new TileFeatureProbability(TileFeature.JungleTree, 0.2)]
            ),
            new Layer(
              1,
              [TileType.Grass],
              [new TileFeatureProbability(TileFeature.JungleTree, 0.2)]
            ),
          ],
        };
        break;
      case BiomeType.Savanna:
        this.GenerationParams = {
          max_height: 4,
          height_variance: 1,
          weather: Weather.Sunny,
          clouds: true,
          clouds_min_height: 11,
          water: false,
          water_height: 1,
          layers: [
            new Layer(
              1,
              [TileType.Dirt],
              [
                new TileFeatureProbability(TileFeature.BasicTree, 0.1),
                new TileFeatureProbability(TileFeature.Grass, 0.7),
              ]
            ),
          ],
        };
        break;
      case BiomeType.Ocean:
        this.GenerationParams = {
          max_height: 6,
          height_variance: 0.7,
          weather: Weather.Sunny,
          clouds: true,
          clouds_min_height: 11,
          water: true,
          water_height: 5,
          layers: [
            new Layer(
              5.5,
              [TileType.Dirt],
              [
                new TileFeatureProbability(TileFeature.BasicTree, 0.05),
                new TileFeatureProbability(TileFeature.Grass, 0.2),
              ]
            ),
            new Layer(
              1,
              [TileType.Sand],
              [
                new TileFeatureProbability(TileFeature.Seaweed, 0.1),
                new TileFeatureProbability(TileFeature.Rock, 0.1),
              ]
            ),
            new Layer(
              0,
              [TileType.Stone],
              [
                new TileFeatureProbability(TileFeature.Seaweed, 0.05),
                new TileFeatureProbability(TileFeature.Rock, 0.1),
              ]
            ),
          ],
        };
        break;
      case BiomeType.Mesa:
        this.GenerationParams = {
          max_height: 5,
          height_variance: 0.7,
          weather: Weather.Sunny,
          clouds: true,
          clouds_min_height: 11,
          water: false,
          water_height: 0.5,
          layers: [
            new Layer(
              4,
              [TileType.Dirt],
              [
                new TileFeatureProbability(TileFeature.Rock, 0.1),
                new TileFeatureProbability(TileFeature.Cactus, 0.1),
              ]
            ),
            new Layer(
              1,
              [TileType.Sand],
              [
                new TileFeatureProbability(TileFeature.Rock, 0.1),
                new TileFeatureProbability(TileFeature.Cactus, 0.1),
              ]
            ),
          ],
        };
        break;
      case BiomeType.Meadow:
        this.GenerationParams = {
          max_height: 4,
          height_variance: 0.7,
          weather: Weather.Sunny,
          clouds: true,
          clouds_min_height: 11,
          water: false,
          water_height: 0.5,
          layers: [
            new Layer(
              3,
              [TileType.Dirt],
              [
                new TileFeatureProbability(TileFeature.Grass, 0.1),
                new TileFeatureProbability(TileFeature.BasicTree, 0.1),
              ]
            ),
            new Layer(
              1,
              [TileType.Grass],
              [
                new TileFeatureProbability(TileFeature.Grass, 0.1),
                new TileFeatureProbability(TileFeature.BasicTree, 0.1),
              ]
            ),
          ],
        };
        break;
      case BiomeType.Plains:
        this.GenerationParams = {
          max_height: 4,
          height_variance: 0.7,
          weather: Weather.Sunny,
          clouds: true,
          clouds_min_height: 11,
          water: false,
          water_height: 0.5,
          layers: [
            new Layer(
              3,
              [TileType.Dirt],
              [
                new TileFeatureProbability(TileFeature.Grass, 0.1),
                new TileFeatureProbability(TileFeature.BasicTree, 0.1),
              ]
            ),
            new Layer(
              1,
              [TileType.Grass],
              [
                new TileFeatureProbability(TileFeature.Grass, 0.1),
                new TileFeatureProbability(TileFeature.BasicTree, 0.1),
              ]
            ),
          ],
        };
        break;
      case BiomeType.Taiga:
        this.GenerationParams = {
          max_height: 8,
          height_variance: 1,
          weather: Weather.Sunny,
          clouds: true,
          clouds_min_height: 11,
          water: true,
          water_height: 2,
          layers: [
            new Layer(
              7,
              [TileType.Stone],
              [new TileFeatureProbability(TileFeature.Rock, 0.1)]
            ),
            new Layer(
              6,
              [TileType.Dirt],
              [
                new TileFeatureProbability(TileFeature.BasicTree, 0.3),
                new TileFeatureProbability(TileFeature.Grass, 0.7),
              ]
            ),
            new Layer(
              4,
              [TileType.Dirt],
              [new TileFeatureProbability(TileFeature.BasicTree, 0.4)]
            ),
            new Layer(
              1,
              [TileType.Grass],
              [new TileFeatureProbability(TileFeature.BasicTree, 0.2)]
            ),
          ],
        };
        break;
      case BiomeType.Tundra:
        this.GenerationParams = {
          max_height: 8,
          height_variance: 1,
          weather: Weather.Snowy,
          clouds: true,
          clouds_min_height: 11,
          water: true,
          water_height: 2,
          layers: [
            new Layer(
              7,
              [TileType.Stone],
              [new TileFeatureProbability(TileFeature.Rock, 0.1)]
            ),
            new Layer(
              6,
              [TileType.Dirt],
              [
                new TileFeatureProbability(TileFeature.BasicTree, 0.3),
                new TileFeatureProbability(TileFeature.Grass, 0.7),
              ]
            ),
            new Layer(
              4,
              [TileType.Dirt],
              [new TileFeatureProbability(TileFeature.BasicTree, 0.4)]
            ),
            new Layer(
              1,
              [TileType.Grass],
              [new TileFeatureProbability(TileFeature.BasicTree, 0.2)]
            ),
          ],
        };
        break;
      case BiomeType.Swamp:
        this.GenerationParams = {
          max_height: 4,
          height_variance: 0.7,
          weather: Weather.Rainy,
          clouds: true,
          clouds_min_height: 11,
          water: true,
          water_height: 2,
          layers: [
            new Layer(
              3,
              [TileType.Dirt],
              [
                new TileFeatureProbability(TileFeature.Grass, 0.1),
                new TileFeatureProbability(TileFeature.BasicTree, 0.1),
              ]
            ),
            new Layer(
              1,
              [TileType.Grass],
              [
                new TileFeatureProbability(TileFeature.Grass, 0.1),
                new TileFeatureProbability(TileFeature.BasicTree, 0.1),
              ]
            ),
          ],
        };
        break;
      default:
        this.GenerationParams = new BiomeGenerationParameters();
        break;
    }

    const noise2D = createNoise2D(this.RandomFunction(this.Params.seed)); // Create a seeded 2D noise function - gives values between -1 and 1

    for (let y = -this.Params.radius; y < this.Params.radius; y++) {
      for (let x = -this.Params.radius; x < this.Params.radius; x++) {
        let position = this.TileToPosition(x, y);
        if (position.length() > this.Params.radius - 1) continue; // Skip tiles outside of the island radius

        let noise = (noise2D(x * 0.1, y * 0.1) + 1) / 2; // Normalize noise to 0-1
        noise = Math.pow(noise, this.GenerationParams.height_variance); // Smooth out the noise
        let height = Math.min(
          noise * (this.GenerationParams.max_height - this.GetMinHeight()) +
            this.GetMinHeight(),
          this.GenerationParams.max_height
        );
        let feature: TileFeature = TileFeature.None;
        let item: Item = null;

        let tileLayer: Layer | undefined = this.GenerationParams.layers.find(
          (layer) => {
            return height >= layer.min_height;
          }
        );

        if (tileLayer === undefined) {
          console.log("No layer found for height " + height);
          continue;
        }

        // Pick a feature based on probability
        if (tileLayer.features.length > 0) {
          let featureProbability = Math.random();
          let cumulativeProbability = 0;
          for (let i = 0; i < tileLayer.features.length; i++) {
            cumulativeProbability += tileLayer.features[i].probability;
            if (featureProbability <= cumulativeProbability) {
              feature = tileLayer.features[i].feature;
              break;
            }
          }
        }

        const tileType: TileType =
          tileLayer.tileTypes[
            Math.floor(Math.random() * tileLayer.tileTypes.length)
          ];

        let tiletop: TileTop = TileTop.None;
        if (this.Params.biome === BiomeType.Alpine) {
          tiletop = TileTop.Snow;
        }

        this.tiles.push(
          new Tile(height, position, tileType, feature, item, tiletop)
        );
      }
    }

    this.EnableLights(this.Params.scene);
    this.addToScene(this.Params.scene);
  }

  public Update(t: number): void {
    this.UpdateParticles(t);
    this.UpdateLightOrbits(t);
    this.previousRAF += t;
  }

  private GetMaxHeight(): number {
    return this.GenerationParams.layers.reduce((max, layer) => {
      return Math.max(max, layer.min_height);
    }, 0);
  }

  private GetMinHeight(): number {
    return this.GenerationParams.layers.reduce((min, layer) => {
      return Math.min(min, layer.min_height);
    }, this.GenerationParams.max_height);
  }

  private TileToPosition(tileX, tileY): THREE.Vector2 {
    return new THREE.Vector2((tileX + (tileY % 2) * 0.5) * 1.77, tileY * 1.535);
  }

  private RandomFunction(seed: number): Function {
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

  private GetClouds(): THREE.Mesh<
    THREE.BufferGeometry<THREE.NormalBufferAttributes>,
    THREE.MeshStandardMaterial,
    THREE.Object3DEventMap
  > {
    let geo: THREE.BufferGeometry = new THREE.SphereGeometry(0, 0, 0);
    let min_clouds = 0;
    if (this.GenerationParams.weather !== Weather.Clear) {
      min_clouds = 3;
    }
    let count = Math.max(
      Math.floor(Math.pow(Math.random() * 5, 0.8)),
      min_clouds
    );

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
        Math.random() * this.Params.radius - 5,
        Math.random() * 5 + this.GenerationParams.clouds_min_height,
        Math.random() * this.Params.radius - 5
      );
      cloudGeo.rotateY(Math.random() * Math.PI * 2);

      geo = BufferGeometryUtils.mergeGeometries([geo, cloudGeo]);
    }

    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        flatShading: true,
        transparent: true,
        opacity: 0.9,
      })
    );
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    return mesh;
  }

  private GetSnow(): THREE.Points<THREE.BufferGeometry> {
    let particles;
    let positions: number[] = [];
    let velocities: number[] = [];
    const particleCount = 250;
    const geo = new THREE.BufferGeometry();
    const textureLoader = new THREE.TextureLoader();

    for (let i = 0; i < particleCount; i++) {
      positions.push(
        Math.floor((Math.random() - 0.5) * (this.Params.radius * 1.7)),
        Math.floor(Math.random() * this.GetMaxHeight()),
        Math.floor((Math.random() - 0.5) * (this.Params.radius * 1.7))
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

  private UpdateParticles(t: number): void {
    const min_height = this.GetMinHeight();
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
          Math.abs(x) > this.Params.radius - 1 ||
          Math.abs(z) > this.Params.radius - 1
        ) {
          this.particles.geometry.attributes.position.array[i * 3] = Math.floor(
            (Math.random() - 0.5) * (this.Params.radius * 1.7)
          );
          this.particles.geometry.attributes.position.array[i * 3 + 1] =
            Math.floor(
              Math.random() * 5 + this.GenerationParams.clouds_min_height
            );
          this.particles.geometry.attributes.position.array[i * 3 + 2] =
            Math.floor((Math.random() - 0.5) * (this.Params.radius * 1.7));
          this.particles.geometry.attributes.velocity.array[i * 3] =
            (Math.random() - 0.5) * 0.5;
          this.particles.geometry.attributes.velocity.array[i * 3 + 1] =
            (Math.random() - 0.05) * -5 - 0.5;
          this.particles.geometry.attributes.velocity.array[i * 3 + 2] =
            (Math.random() - 0.5) * 0.5;
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

  public addToScene(scene): void {
    let stoneGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
    let dirtGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
    let dirt2Geo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
    let sandGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
    let grassGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
    let martianSandGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
    let snowGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
    let features: THREE.Group = new THREE.Group();
    let items: THREE.Group = new THREE.Group();

    for (let i = 0; i < this.tiles.length; i++) {
      let tileGeometries = this.tiles[i].getHexTileGeometry();
      stoneGeo = BufferGeometryUtils.mergeGeometries([
        stoneGeo,
        tileGeometries[0],
      ]);
      dirtGeo = BufferGeometryUtils.mergeGeometries([
        dirtGeo,
        tileGeometries[1],
      ]);
      dirt2Geo = BufferGeometryUtils.mergeGeometries([
        dirt2Geo,
        tileGeometries[2],
      ]);
      sandGeo = BufferGeometryUtils.mergeGeometries([
        sandGeo,
        tileGeometries[3],
      ]);
      grassGeo = BufferGeometryUtils.mergeGeometries([
        grassGeo,
        tileGeometries[4],
      ]);
      martianSandGeo = BufferGeometryUtils.mergeGeometries([
        martianSandGeo,
        tileGeometries[5],
      ]);
      snowGeo = BufferGeometryUtils.mergeGeometries([
        snowGeo,
        tileGeometries[6],
      ]);

      features.add(tileGeometries[7]);
      items.add(tileGeometries[8]);
    }

    let stoneMesh = new THREE.Mesh(
      stoneGeo,
      new THREE.MeshStandardMaterial({
        color: 0x888888,
        flatShading: true,
      })
    );
    stoneMesh.castShadow = true;
    stoneMesh.receiveShadow = true;

    let dirtMesh = new THREE.Mesh(
      dirtGeo,
      new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        flatShading: true,
      })
    );
    dirtMesh.castShadow = true;
    dirtMesh.receiveShadow = true;

    let dirt2Mesh = new THREE.Mesh(
      dirt2Geo,
      new THREE.MeshStandardMaterial({
        color: 0x8b4543,
        flatShading: true,
      })
    );
    dirt2Mesh.castShadow = true;
    dirt2Mesh.receiveShadow = true;

    let sandMesh = new THREE.Mesh(
      sandGeo,
      new THREE.MeshStandardMaterial({
        color: 0xfada5e,
        flatShading: true,
      })
    );
    sandMesh.castShadow = true;
    sandMesh.receiveShadow = true;

    let grassMesh = new THREE.Mesh(
      grassGeo,
      new THREE.MeshStandardMaterial({
        color: 0x85bb65,
        flatShading: true,
      })
    );
    grassMesh.castShadow = true;
    grassMesh.receiveShadow = true;

    let martianSandMesh = new THREE.Mesh(
      martianSandGeo,
      new THREE.MeshStandardMaterial({
        color: 0xf4a460,
        flatShading: true,
      })
    );
    martianSandMesh.castShadow = true;
    martianSandMesh.receiveShadow = true;

    let snowMesh = new THREE.Mesh(
      snowGeo,
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        flatShading: true,
      })
    );
    snowMesh.receiveShadow = true;

    let waterMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        this.Params.radius + 1,
        this.Params.radius + 1,
        this.GenerationParams.water_height,
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
    waterMesh.position.set(0, this.GenerationParams.water_height / 2, 0);

    let islandContainerMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        this.Params.radius + 2,
        this.Params.radius + 2,
        this.GenerationParams.max_height * 0.25,
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
      this.GenerationParams.max_height * 0.125,
      0
    );

    let islandFloorMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        this.Params.radius + 2,
        this.Params.radius + 2,
        this.GenerationParams.max_height * 0.1,
        6
      ),
      new THREE.MeshStandardMaterial({
        color: 0x888888,
        flatShading: true,
        side: THREE.DoubleSide,
      })
    );
    islandFloorMesh.position.set(0, this.GenerationParams.max_height * 0.02, 0);

    let island = new THREE.Group();
    island.add(
      stoneMesh,
      dirtMesh,
      dirt2Mesh,
      sandMesh,
      grassMesh,
      martianSandMesh,
      snowMesh,
      islandContainerMesh,
      islandFloorMesh,
      features,
      items
    );

    if (this.GenerationParams.water) {
      island.add(waterMesh);
    }

    if (this.GenerationParams.clouds) {
      island.add(this.GetClouds());
    }

    if (this.GenerationParams.weather === Weather.Snowy) {
      this.particles = this.GetSnow();
      island.add(this.particles);
    }

    scene.add(island);
  }

  public GetTileBelow(x, y): Tile | null {
    // Find the tile with the closest center x,y to the given position
    let closestTile: Tile | null = null;
    let closestDistance = 1000;
    for (let i = 0; i < this.tiles.length; i++) {
      let distance = Math.sqrt(
        Math.pow(this.tiles[i].position.x - x, 2) +
          Math.pow(this.tiles[i].position.y - y, 2)
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTile = this.tiles[i];
      }
    }
    return closestTile;
  }

  public GetCannonBodies(): CANNON.Body[] {
    // return each tile as a cannon body
    let bodies: CANNON.Body[] = [];
    for (let i = 0; i < this.tiles.length; i++) {
      bodies.push(this.tiles[i].getCannonBodies());
    }
    return bodies;
  }

  private EnableLights(scene: THREE.Scene): void {
    const ambientLight = new THREE.AmbientLight(0xffcb8e, 0.1);
    ambientLight.castShadow = false;
    scene.add(ambientLight);

    this.sunAngle = Math.random() * Math.PI * 2;
    this.sun = new THREE.DirectionalLight(0xffcb8e, 4);
    this.SetLightAngle(this.sun, this.sunAngle);
    this.sun.castShadow = true;
    this.sun.shadow.camera.zoom = 0.3;
    this.sun.shadow.camera.near = this.orbitRadius - this.Params.radius * 1.3;
    this.sun.shadow.camera.far = this.orbitRadius + this.Params.radius * 1.3;
    this.sun.target.position.set(0, 0, 0);
    scene.add(this.sun);

    this.moonAngle = this.sunAngle + Math.PI;
    this.moon = new THREE.DirectionalLight(0xffffff, 1);
    this.SetLightAngle(this.moon, this.moonAngle);
    this.moon.castShadow = true;
    this.moon.shadow.camera.zoom = 0.3;
    this.moon.shadow.camera.near = this.orbitRadius - this.Params.radius * 1.3;
    this.moon.shadow.camera.far = this.orbitRadius + this.Params.radius * 1.3;
    this.moon.target.position.set(0, 0, 0);
    scene.add(this.moon);

    this.setShadowMapSize(512, 512);
  }

  public toggleLightDebug(): void {
    this.lightDebug = !this.lightDebug;
    if (this.lightDebug) {
      this.sunHelper = new THREE.DirectionalLightHelper(this.sun, 5);
      this.Params.scene.add(this.sunHelper);
      this.sunShadowHelper = new THREE.CameraHelper(this.sun.shadow.camera);
      this.Params.scene.add(this.sunShadowHelper);
      this.moonHelper = new THREE.DirectionalLightHelper(this.moon, 5);
      this.Params.scene.add(this.moonHelper);
      this.moonShadowHelper = new THREE.CameraHelper(this.moon.shadow.camera);
      this.Params.scene.add(this.moonShadowHelper);
      this.Params.scene.add(this.sunHelper);
      this.Params.scene.add(this.sunShadowHelper);
      this.Params.scene.add(this.moonHelper);
      this.Params.scene.add(this.moonShadowHelper);
    } else {
      this.Params.scene.remove(this.sunHelper);
      this.Params.scene.remove(this.sunShadowHelper);
      this.Params.scene.remove(this.moonHelper);
      this.Params.scene.remove(this.moonShadowHelper);
    }
  }

  private SetLightAngle(light: THREE.DirectionalLight, angle: number): void {
    light.position.set(
      this.orbitRadius * Math.sin(angle),
      this.orbitRadius * Math.cos(angle),
      0
    );
  }

  private UpdateLightOrbits(t: number) {
    this.sunAngle += t * this.orbitSpeed;
    if (this.sunAngle > Math.PI * 2) this.sunAngle -= Math.PI * 2;
    this.SetLightAngle(this.sun, this.sunAngle);

    this.moonAngle += t * this.orbitSpeed;
    if (this.moonAngle > Math.PI * 2) this.moonAngle -= Math.PI * 2;
    this.SetLightAngle(this.moon, this.moonAngle);

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

  public CreateGoal(playerTile: Tile): void {
    let goalTile: Tile | null = null;
    while (goalTile === null || goalTile === playerTile) {
      goalTile = this.tiles[Math.floor(Math.random() * this.tiles.length)];
      goalTile.SetGoal(AnimalType.Penguin);
    }

    this.Params.scene.add(goalTile.GetItem().getMesh());
    this.Params.scene.add(goalTile.GetItem().getLight());
  }
}
