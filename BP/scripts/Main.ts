import { WorldGenerator } from "./Generation/WorldGenerator";
import { DynamicPropertiesDefinition, Player, world } from "mojang-minecraft"
import { SetupMenu } from "./Menu/SetupMenu";
import { GetLangFromShort, lang } from "./Localization/Languages";

console.warn("§6Cosmos Genesis Loaded! " + new Date().toTimeString())

const setupMenu = new SetupMenu()

var host: null | Player = null;
var language: null | lang = null;

world.events.playerJoin.subscribe(async (playerJoinEvent) => {
    if (host === null) host = playerJoinEvent.player;
    else return;

    if (world.getDynamicProperty("setupCompleted") === true) {
        language = GetLangFromShort(world.getDynamicProperty("language"));
        return
    }

    await setupMenu.start(playerJoinEvent.player)
    language = GetLangFromShort(world.getDynamicProperty("language"))
    world.setDynamicProperty("setupCompleted", true)
})

//#region Initialization 
world.events.worldInitialize.subscribe((event) => {
    const def = new DynamicPropertiesDefinition()

    try {world.getDynamicProperty("setupCompleted")}
    catch {def.defineBoolean("setupCompleted")}

    try {world.getDynamicProperty("seed")} 
    catch {def.defineString("seed", 32)}

    try {world.getDynamicProperty("language")} 
    catch {def.defineString("language", 2)}
    
    event.propertyRegistry.registerWorldDynamicProperties(def);
})
//#endregion

world.events.beforeChat.subscribe(async (beforeChat) => {
    const worldGenerator = new WorldGenerator(16, 60);
    const playerChunk = worldGenerator.LocationToChunkCoord(beforeChat.sender.location);
    
    worldGenerator.GeneratePlanet(beforeChat.sender, 15, playerChunk);
})