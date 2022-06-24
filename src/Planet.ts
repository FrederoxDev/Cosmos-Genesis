import { Biome } from "./Biome";

export interface Planet {
    identifier: string
    groundHeight: number
    sizeInChunks: number
    biomes: Biome[]
}