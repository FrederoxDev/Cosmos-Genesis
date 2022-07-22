import { Biome } from "../Generation/Biome";
import { Planet } from "../Generation/Planet";

export const test: Planet = {
    identifier: "test",
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