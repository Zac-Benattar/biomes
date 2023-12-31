import { TileType } from "./Tile";
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

export class BiomeGenerationParams {
  public maxHeight: number;
  public heightVariance: number;
  public weather: WeatherParams;
  public water: WaterParams;
  public layers: Layer[];
}

class CloudParams {
  count: number;
  minHeight: number;
  maxHeight: number;
  colour: string;
}

class PrecipitationParams {
  snowBias: number;
  rainBias: number;
  chance: number;
  variance: number;
}

class WeatherParams {
  precipitation: PrecipitationParams;
  clouds: CloudParams;
}

class WaterParams {
  height: number;
  colour: string;
}

class TileFeatureProbability {
  feature: TileFeature;
  probability: number;
}

class Layer {
  minHeight: number;
  tileTypes: TileType[];
  features: TileFeatureProbability[];
}

class BiomeHelper {
  public static parseBiomeData(biomeType: BiomeType): BiomeData {
    const biomeData = biomes.find(
      (x) => (x.biomeName = biomeType)
    ).generationParams;
    if (biomeData === undefined) {
      console.log("No biome data found for biome " + biomeType);
      return;
    }

    // Do the parsing
    this.params.biomeParams = new BiomeGenerationParams();
    this.params.biomeParams.layers = biomeData.layers; // Fix this urgently
    this.params.biomeParams.maxHeight = biomeData.maxHeight;
    this.params.biomeParams.water = biomeData.water;
  }
}
