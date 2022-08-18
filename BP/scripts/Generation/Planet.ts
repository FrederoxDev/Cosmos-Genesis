import { ChunkCoord } from "../Generation/ChunkCoord";
import { Biome } from "./Biome";

export interface Planet {
    identifier: string,
    location: ChunkCoord
    size: number
    biomes: Biome[]
}