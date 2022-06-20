import { WorldGenerator } from "./WorldGenerator";
import { Planet } from "./Planet"
import { Biome } from "./Biome";

const desert: Biome = {
    identifier: "desert",
    climate: {
        rainfall: -1,
        temperature: 1
    },
    surface_parameters: {
        top_material: "minecraft:sand",
        mid_material: "minecraft:sand",
        foundation_material: "minecraft:sandstone"
    }
}

const mars: Planet = {
    identifier: "mars",
    biomes: [desert],
    groundHeight: 20
}

const worldGenerator = new WorldGenerator(16, 60, 3, 5, [mars])