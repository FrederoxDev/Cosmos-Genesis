import { WorldGenerator } from "./WorldGenerator";
import { world } from "mojang-minecraft"
import { ChunkCoord } from "./Chunk";

const worldGenerator = new WorldGenerator(16, 60);

world.events.beforeChat.subscribe((beforeChat) => {
    const playerChunk = worldGenerator.LocationToChunkCoord(beforeChat.sender.location);
    worldGenerator.GeneratePlanet(beforeChat.sender, 9, playerChunk);
})