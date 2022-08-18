import { Biome } from "../Generation/Biome";
import { Planet } from "../Generation/Planet";
import { ChunkCoord } from "../Generation/ChunkCoord"

export const none: Planet = {
    identifier: "none",
    location: undefined,
    size: 0,
    biomes: []
}

export const test: Planet = {
    identifier: "test",
    location: new ChunkCoord(1000, 1000),
    size: 9,
    biomes: [
        {
            identifier: "snow",
            climate: {
                rainfall: -1,
                temperature: -1
            },
            surface_parameters: {
                top_material: "snow",
                mid_material: "snow",
                foundation_material: "stone"
            }
        },
        {
            identifier: "plains",
            climate: {
                rainfall: 1,
                temperature: 1
            },
            surface_parameters: {
                top_material: "grass",
                mid_material: "dirt",
                foundation_material: "stone"
            }
        }
    ]
}