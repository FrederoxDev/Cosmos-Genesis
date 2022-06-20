import { Biome } from "./Biome";

export interface Planet {
    identifier: string
    groundHeight: number
    biomes: Biome[]
}