<<<<<<< HEAD
import { WorldGenerator } from "./Generation/WorldGenerator";
import { world } from "mojang-minecraft"

const worldGenerator = new WorldGenerator(16, 60, "seed");

world.events.beforeChat.subscribe((beforeChat) => {
    const playerChunk = worldGenerator.LocationToChunkCoord(beforeChat.sender.location);
    worldGenerator.GeneratePlanet(beforeChat.sender, 3, playerChunk);
=======
import { WorldGenerator } from "./WorldGenerator";
import { world } from "mojang-minecraft"
import { ChunkCoord } from "./Chunk";

const worldGenerator = new WorldGenerator(16, 60);

world.events.beforeChat.subscribe((beforeChat) => {
    const playerChunk = worldGenerator.LocationToChunkCoord(beforeChat.sender.location);
    worldGenerator.GeneratePlanet(beforeChat.sender, 9, playerChunk);
>>>>>>> 0d6534ca49f2295589fc352fb69f8e08c0422053
})