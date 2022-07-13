import { WorldGenerator } from "./Generation/WorldGenerator";
import { Player, world } from "mojang-minecraft"
import { SetupMenu } from "./Menu/SetupMenu";

console.warn("§6Cosmos Genesis Loaded! " + new Date().toTimeString())
const worldGenerator = new WorldGenerator(16, 60, "seeds");
const setupMenu = new SetupMenu()

var host: null | Player = null;

world.events.playerJoin.subscribe((playerJoinEvent) => {
    if (host === null) host = playerJoinEvent.player;
})

world.events.beforeChat.subscribe((beforeChat) => {
    // const playerChunk = worldGenerator.LocationToChunkCoord(beforeChat.sender.location);
    // try {
    //     worldGenerator.GeneratePlanet(beforeChat.sender, 1, playerChunk);
    // }

    // catch (e) {console.warn(e)}

    setupMenu.start(beforeChat.sender)
})  