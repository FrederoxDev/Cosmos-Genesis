import { WorldGenerator } from "./Generation/WorldGenerator";
import { world } from "mojang-minecraft"

const worldGenerator = new WorldGenerator(16, 60, "seed");

world.events.beforeChat.subscribe((beforeChat) => {
    const playerChunk = worldGenerator.LocationToChunkCoord(beforeChat.sender.location);
    worldGenerator.GeneratePlanet(beforeChat.sender, 3, playerChunk);
})