import { TileFeature, TileType } from "./Tile";
import { biomes } from "./biomes.json";

export enum BiomeType {
  Jungle = "Jungle",
  Forest = "Forest",
  Desert = "Desert",
  Alpine = "Alpine",
  Savanna = "Savanna",
  Ocean = "Ocean",
  Mesa = "Mesa",
  Tundra = "Tundra",
  Swamp = "Swamp",
  Plains = "Plains",
  Taiga = "Taiga", // Less snowy than Alpine
  Beach = "Beach",
  Meadow = "Meadow",
  //   MartianDesert = "MartianDesert",
}

export class BiomeData {
  public maxHeight: number;
  public heightVariance: number;
  public weather: WeatherParams;
  public water: WaterParams;
  public layers: Layer[];
}

export class CloudParams {
  count: number;
  minHeight: number;
  maxHeight: number;
  colour: string;
}

export class PrecipitationParams {
  snowBias: number;
  rainBias: number;
  chance: number;
  variance: number;
}

export class WeatherParams {
  precipitation: PrecipitationParams;
  clouds: CloudParams;
}

export class WaterParams {
  height: number;
  colour: string;
}

export class TileFeatureProbability {
  featureType: TileFeature;
  probability: number;
}

export class Layer {
  minHeight: number;
  tileTypes: TileType[];
  features: TileFeatureProbability[];
}

export class BiomeHelper {
  public static parseBiomeData(biomeType: BiomeType): BiomeData {
    const biomeData = biomes.find(
      (x) => (x.biomeName = biomeType)
    ).generationParams;
    if (biomeData === undefined) {
      console.log("No biome data found for biome " + biomeType);
      return;
    }

    // Do the parsing
    let biomeParams = new BiomeData();

    // Parse the layers
    let layers = new Array<Layer>();
    for (let layer of biomeData.layers) {
      let newLayer = new Layer();

      newLayer.minHeight = layer.minHeight;

      let tileTypes = new Array<TileType>();
      for (let tileType of layer.tileTypes) {
        tileTypes.push(TileType[tileType as keyof typeof TileType]);
      }
      newLayer.tileTypes = tileTypes;

      let features = new Array<TileFeatureProbability>();
      for (let feature of layer.features) {
        let newFeature = new TileFeatureProbability();
        newFeature.featureType =
          TileFeature[feature.featureType as keyof typeof TileFeature];
        newFeature.probability = feature.probability;
        features.push(newFeature);
      }
      newLayer.features = features;
      layers.push(newLayer);
    }

    // Set the biome params
    biomeParams.maxHeight = biomeData.maxHeight;
    biomeParams.heightVariance = biomeData.heightVariance;
    biomeParams.weather = biomeData.weather;
    biomeParams.water = biomeData.water;
    biomeParams.layers = layers;

    return biomeParams;
  }
}
