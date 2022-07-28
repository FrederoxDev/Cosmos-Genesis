import { WorldGenerator } from "./Generation/WorldGenerator";
import { DynamicPropertiesDefinition, Player, world, MinecraftBlockTypes } from "mojang-minecraft"
import { SetupMenu } from "./Menu/SetupMenu";
import { GetLangFromShort, lang } from "./Localization/Languages";
import { test } from "./Planets/test";
import { ChunkCoord } from "./Generation/ChunkCoord";

console.warn("§6Cosmos Genesis Loaded! " + new Date().toTimeString())

const setupMenu = new SetupMenu()

var host: null | Player = null;
var language: null | lang = null;

const skipSetup = true;

//#region Cosmos Setup
world.events.playerJoin.subscribe(async (playerJoinEvent) => {
    if (host === null) host = playerJoinEvent.player;
    else return;

    if (skipSetup) return;

    /* Ran when the world has already been setup */
    if (world.getDynamicProperty("setupCompleted") === true) {
        language = GetLangFromShort(world.getDynamicProperty("language"));
        return
    }

    /* Ran if the world has not been setup */
    const startPos = host.location;

    await setupMenu.start(playerJoinEvent.player)
    language = GetLangFromShort(world.getDynamicProperty("language"))
    world.setDynamicProperty("setupCompleted", true)

    const worldGenerator = new WorldGenerator(16, 60);
    const playerChunk = new ChunkCoord(400, 400)

    await worldGenerator.GeneratePlanet(host, 12, playerChunk, test);
    host.teleport(startPos, world.getDimension("overworld"), 0, 0, false)
})
//#endregion

//#region Initialization 
world.events.worldInitialize.subscribe((event) => {
    const def = new DynamicPropertiesDefinition()

    try { world.getDynamicProperty("setupCompleted") }
    catch { def.defineBoolean("setupCompleted") }

    try { world.getDynamicProperty("seed") }
    catch { def.defineString("seed", 32) }

    try { world.getDynamicProperty("language") }
    catch { def.defineString("language", 2) }

    event.propertyRegistry.registerWorldDynamicProperties(def);
})
//#endregion

world.events.beforeItemUseOn.subscribe((e) => {
    const location = e.blockLocation;
    const overworld = world.getDimension("overworld");

    if (overworld.getBlock(location).id != "bridge:rocket_controller") return;

    //@ts-ignore
    const rotation: 2 | 3 | 4 | 5 = overworld.getBlock(location).permutation.getProperty("bridge:block_rotation").value;
    console.warn(rotation)


    const rocketStructure = [
        {
            "id": "bridge:thruster",
            "offset": [1, -1, 1]
        },
        {
            "id": "bridge:thruster",
            "offset": [0, -1, 2]
        },
        {
            "id": "bridge:thruster",
            "offset": [-1, -1, 1]
        },
        {
            "id": "bridge:thruster",
            "offset": [0, -1, 0]
        },
        {
            "id": "minecraft:iron_block",
            "offset": [1, 0, 1]
        },
        {
            "id": "minecraft:iron_block",
            "offset": [0, 0, 2]
        },
        {
            "id": "minecraft:iron_block",
            "offset": [-1, 0, 1]
        },
        {
            "id": "minecraft:iron_block",
            "offset": [1, 1, 1]
        },
        {
            "id": "minecraft:iron_block",
            "offset": [0, 1, 2]
        },
        {
            "id": "minecraft:iron_block",
            "offset": [-1, 1, 1]
        },
        {
            "id": "minecraft:iron_block",
            "offset": [0, 1, 0]
        },
        {
            "id": "minecraft:stained_glass",
            "offset": [1, 2, 1]
        },
        {
            "id": "minecraft:stained_glass",
            "offset": [0, 2, 2]
        },
        {
            "id": "minecraft:stained_glass",
            "offset": [-1, 2, 1]
        },
        {
            "id": "minecraft:stained_glass",
            "offset": [0, 2, 0]
        },
        {
            "id": "minecraft:stained_glass",
            "offset": [1, 3, 1]
        },
        {
            "id": "minecraft:stained_glass",
            "offset": [0, 3, 2]
        },
        {
            "id": "minecraft:stained_glass",
            "offset": [-1, 3, 1]
        },
        {
            "id": "minecraft:stained_glass",
            "offset": [0, 3, 0]
        },
        {
            "id": "minecraft:stained_glass",
            "offset": [0, 4, 1]
        },
    ]

    var failed = false;
    var missingBlocks = []

    rocketStructure.forEach((block) => {
        var offsetLocation;

        if (rotation == 2) {
            offsetLocation = location.offset(block.offset[0], block.offset[1], -block.offset[2])
        }

        else if (rotation == 3) {
            offsetLocation = location.offset(block.offset[0], block.offset[1], block.offset[2])
        }

        else if (rotation == 4) {
            offsetLocation = location.offset(-block.offset[2], block.offset[1], block.offset[0])
        }

        else if (rotation == 5) {
            offsetLocation = location.offset(block.offset[2], block.offset[1], block.offset[0])
        }

        if (overworld.getBlock(offsetLocation).id != block.id) {
            overworld.spawnEntity(`bridge:hologram_${block.id.split(":")[1]}`, offsetLocation)
            missingBlocks.push(block.id);
            failed = true;
        }
    })

    if (failed) {
        var count = {}

        for (const id of missingBlocks) {
            if (count[id]) count[id] += 1;
            else count[id] = 1;
        }

        var output = "[COSMOS] Could not build Rocket, Missing:"
        for (var block of Object.entries(count)) {
            output += `\n- ${block[1]}x ${block[0]}`
        }

        e.source.runCommand(`tellraw @s {"rawtext":[{"text":"${output}"}]}`)
    }
    else {
        e.source.runCommand(`tellraw @s {"rawtext":[{"text":"Rocket Constructed!"}]}`);

        rocketStructure.forEach((block) => {
            var offsetLocation = location.offset(block.offset[0], block.offset[1], block.offset[2])

            overworld.getBlock(offsetLocation).setType(MinecraftBlockTypes.air)
        })

        overworld.getBlock(location).setType(MinecraftBlockTypes.air)
        overworld.spawnEntity("bridge:rocket", location.offset(0, -1, 1))
    }
}) 