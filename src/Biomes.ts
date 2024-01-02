import { TileFeature, TileTop, TileType } from "./Tile";
import { biomes } from "./biomes.json";

export enum BiomeType {
  Jungle,
  Forest,
  Desert,
  Alpine,
  Savanna,
  Ocean,
  Tundra,
  Swamp,
  Plains,
  // Taiga, // Less snowy than Alpine
  // Beach,
  Meadow,
  // MartianDesert,
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
  topTypes: TileTop[];
  features: TileFeatureProbability[];
}

export class BiomeHelper {
  public static getBiomeTypeString(biomeType: BiomeType): string {
    return BiomeType[biomeType];
  }

  public static parseBiomeData(biomeType: BiomeType): BiomeData {
    const biomeData = biomes.find(
      (x) => x.biomeName == this.getBiomeTypeString(biomeType)
    );
    if (biomeData === undefined) {
      console.log(
        "No biome data found for biome " + this.getBiomeTypeString(biomeType)
      );
      return;
    }

    // Do the parsing
    let biomeParams = new BiomeData();

    // Parse the layers
    let layers = new Array<Layer>();
    for (let layer of biomeData.generationParams.layers) {
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

      let topTypes = new Array<TileTop>();
      for (let topType of layer.topTypes) {
        topTypes.push(TileTop[topType as keyof typeof TileTop]);
      }
      newLayer.topTypes = topTypes;

      layers.push(newLayer);
    }

    // Set the biome params
    biomeParams.maxHeight = biomeData.generationParams.maxHeight;
    biomeParams.heightVariance = biomeData.generationParams.heightVariance;
    biomeParams.weather = biomeData.generationParams.weather;
    biomeParams.water = biomeData.generationParams.water;
    biomeParams.layers = layers;

    return biomeParams;
  }
}
