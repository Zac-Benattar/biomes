import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createNoise2D } from "simplex-noise";
import Item from "./items";
import Tile, { TileFeature, TileType } from "./tile";

export enum Biome {
  Jungle,
  Forest,
  Desert,
  Alpine,
  Savana,
  Ocean,
  Mesa,
  Volcano,
  Tundra,
  Swamp,
  Plains,
  Taiga, // Less snowy than Alpine
  Beach,
  Meadow,
}

export enum Weather {
  Sunny,
  Rainy,
  Snowy,
  Stormy,
}

class Layer {
  min_height: number;
  tileTypes: TileType[];
  features: TileFeature[];

  constructor(
    min_height: number,
    tileTypes: TileType[],
    features: TileFeature[]
  ) {
    this.min_height = min_height;
    this.tileTypes = tileTypes;
    this.features = features;
  }
}

class Parameters {
  max_height: number;
  height_variance: number;
  weather: Weather;
  clouds: boolean;
  clouds_min_height: number;
  water: boolean;
  layers: Layer[];
}

export default class Island {
  Biome: Biome;
  Parameters: Parameters;
  seed: number;
  x: number;
  y: number;
  z: number;
  tiles: Array<Tile>;
  items: Array<Item>;

  constructor(biome: Biome, seed: number, x: number, y: number, z: number) {
    this.Biome = biome;
    this.seed = seed;
    this.x = x;
    this.y = y;
    this.z = z;
    this.tiles = [];
    this.items = [];

    switch (biome) {
      case Biome.Alpine:
        this.Parameters = {
          max_height: 14,
          height_variance: 1.5,
          weather: Weather.Snowy,
          clouds: true,
          clouds_min_height: 11,
          water: false,
          layers: [
            new Layer(8, [TileType.Stone], [TileFeature.None]),
            new Layer(
              7,
              [TileType.Dirt],
              [TileFeature.AlpineTree, TileFeature.Rock]
            ),
            new Layer(6, [TileType.Dirt], [TileFeature.None]),
            new Layer(4, [TileType.Grass], [TileFeature.None]),
            new Layer(1, [TileType.Grass], [TileFeature.None]),
          ],
        };
        break;
      default:
        this.Parameters = new Parameters();
        break;
    }

    const noise2D = createNoise2D(this.randomFunction); // Create a seeded 2D noise function - gives values between -1 and 1

    for (let y = -15; y < 15; y++) {
      for (let x = -15; x < 15; x++) {
        let position = this.tileToPosition(x, y);
        if (position.length() > 16) continue;

        let noise = (noise2D(x * 0.1, y * 0.1) + 1) / 2; // Normalize noise to 0-1
        noise = Math.pow(noise, this.Parameters.height_variance); // Smooth out the noise
        let height = Math.min(
          noise * (this.Parameters.max_height - this.getMinHeight()) +
            this.getMinHeight(),
          this.Parameters.max_height
        );
        let feature: TileFeature = TileFeature.None;
        let item: Item = null;

        let tileLayer: Layer | undefined = this.Parameters.layers.find(
          (layer) => {
            return height >= layer.min_height;
          }
        );

        if (tileLayer === undefined) {
          console.log("No layer found for height " + height);
          continue;
        }

        if (Math.random() > 0.7) {
          feature =
            tileLayer.features[
              Math.floor(Math.random() * tileLayer.features.length)
            ];
        }

        let tileType: TileType =
          tileLayer.tileTypes[
            Math.floor(Math.random() * tileLayer.tileTypes.length)
          ];

        this.tiles.push(new Tile(height, position, tileType, feature, item));
      }
    }
  }

  private getMinHeight(): number {
    return this.Parameters.layers.reduce((min, layer) => {
      return Math.min(min, layer.min_height);
    }, this.Parameters.max_height);
  }

  private tileToPosition(tileX, tileY): THREE.Vector2 {
    return new THREE.Vector2((tileX + (tileY % 2) * 0.5) * 1.77, tileY * 1.535);
  }

  private randomFunction(): number {
    return Math.random();
  }

  private getClouds(): THREE.Mesh<
    THREE.BufferGeometry<THREE.NormalBufferAttributes>,
    THREE.MeshStandardMaterial,
    THREE.Object3DEventMap
  > {
    let geo: THREE.BufferGeometry = new THREE.SphereGeometry(0, 0, 0);
    let count = Math.max(Math.floor(Math.pow(Math.random(), 0.45) * 5), 1);

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
        Math.random() * 20 - 10,
        Math.random() * 5 + this.Parameters.clouds_min_height,
        Math.random() * 20 - 10
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

    return mesh;
  }

  public addToScene(scene): void {
    let stoneGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
    let dirtGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
    let dirt2Geo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
    let sandGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
    let grassGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0, 0, 0);
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

      features.add(tileGeometries[5]);
      items.add(tileGeometries[6]);
    }

    let stoneMesh = new THREE.Mesh(
      stoneGeo,
      new THREE.MeshStandardMaterial({
        color: 0x888888,
        flatShading: true,
      })
    );

    let dirtMesh = new THREE.Mesh(
      dirtGeo,
      new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        flatShading: true,
      })
    );

    let dirt2Mesh = new THREE.Mesh(
      dirt2Geo,
      new THREE.MeshStandardMaterial({
        color: 0x8b4543,
        flatShading: true,
      })
    );

    let sandMesh = new THREE.Mesh(
      sandGeo,
      new THREE.MeshStandardMaterial({
        color: 0xf4a460,
        flatShading: true,
      })
    );

    let grassMesh = new THREE.Mesh(
      grassGeo,
      new THREE.MeshStandardMaterial({
        color: 0x85bb65,
        flatShading: true,
      })
    );

    let waterMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(17, 17, this.Parameters.max_height * 0.2, 50),
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
    waterMesh.receiveShadow = true;
    waterMesh.position.set(0, this.Parameters.max_height * 0.11, 0);

    let islandContainerMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        17.1,
        17.1,
        this.Parameters.max_height * 0.25,
        1,
        10,
        true
      ),
      new THREE.MeshPhysicalMaterial({
        color: 0xaaaaff,
        roughness: 1,
        side: THREE.DoubleSide,
      })
    );
    islandContainerMesh.receiveShadow = true;
    islandContainerMesh.position.set(0, this.Parameters.max_height * 0.125, 0);

    let islandFloorMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        17.1,
        17.1,
        this.Parameters.max_height * 0.1,
        50
      ),
      new THREE.MeshBasicMaterial({
        color: 0x888888,
        side: THREE.DoubleSide,
      })
    );
    islandFloorMesh.receiveShadow = true;
    islandFloorMesh.position.set(0, this.Parameters.max_height * 0.02, 0);

    let island = new THREE.Group();
    island.add(
      stoneMesh,
      dirtMesh,
      dirt2Mesh,
      sandMesh,
      grassMesh,
      islandContainerMesh,
      islandFloorMesh,
      features,
      items
    );

    if (this.Parameters.clouds) {
      island.add(this.getClouds());
    }

    if (this.Parameters.water) {
      island.add(waterMesh);
    }

    scene.add(island);
  }

  distanceToPoint(x, y, z): number {
    return Math.sqrt(
      Math.pow(this.x - x, 2) +
        Math.pow(this.y - y, 2) +
        Math.pow(this.z - z, 2)
    );
  }
}
