import { DynamicPropertiesDefinition, EntityRideableComponent, IEntityComponent, Player, world, Location, Vector, MinecraftBlockTypes } from "mojang-minecraft"
import { ChunkCoord } from "./Generation/ChunkCoord";
import { test } from "./Planets/test"
import { WorldGenerator } from "./Generation/WorldGenerator";
import { lang, languages, GetLangFromShort } from "./Localization/Languages";
import { SaveSystem } from "./SaveSystem"

var saveSystem: null | SaveSystem = null;
var host: null | Player = null;
var language: lang = languages[0];
var travellingPlayers = []

//#region Property Initialization
world.events.worldInitialize.subscribe((e) => {
    const def = new DynamicPropertiesDefinition()

    try { world.getDynamicProperty("data") }
    catch { def.defineString("data", 2000) }

    e.propertyRegistry.registerWorldDynamicProperties(def);
})
//#endregion

//#region Loading Game Data
world.events.blockBreak.subscribe(async (e) => {
    if (host != null) return;
    host = e.player

    saveSystem = new SaveSystem(e.player);
    await saveSystem.LoadData()

    language = GetLangFromShort(saveSystem.data.language)

    const hasGeneratedWorld = saveSystem.data.hasGeneratedWorld;

    if (!hasGeneratedWorld) {
        const worldGenerator = new WorldGenerator(16, 60, saveSystem.data.seed);
        await worldGenerator.GeneratePlanet(host, 9, new ChunkCoord(1000, 1000), test)

        saveSystem.data.hasGeneratedWorld = true;
        saveSystem.SaveData()
    }
})
//#endregion 

world.events.beforeChat.subscribe((e) => {
    if (e.message == "!data") e.message = JSON.stringify(saveSystem.data)
})

//#region Detect Players In Rockets
world.events.dataDrivenEntityTriggerEvent.subscribe(async (e) => {
    if (e.id != "bridge:on_rider_detected") return;

    var rocket = e.entity;
    const players = Array.from(world.getDimension("overworld").getPlayers())

    //@ts-ignore getComponent returns EntityRideableComponent 
    const pos = OffsetLocation(rocket.getComponent("minecraft:rideable").seats[0].position, rocket.location);
    const player = players.find((player) => player.location.isNear(pos, 0.5))

    if (travellingPlayers.find((trackedPlayer) => trackedPlayer.name == player.name)) return;
    travellingPlayers.push(player)

    const startTime = new Date().getTime()
    var playingTransition = true;
    var animationIndex = 0;

    while (playingTransition) {
        var timePassed = (new Date().getTime() - startTime) / 1000;

        if (timePassed > 0 && animationIndex == 0) {
            player.runCommand("title @s title 3")
            animationIndex++;
        }

        if (timePassed > 1 && animationIndex == 1) {
            player.runCommand("title @s title 2")
            animationIndex++;
        }

        if (timePassed > 2 && animationIndex == 2) {
            player.runCommand("title @s title 1")
            animationIndex++;
        }

        if (timePassed > 3 && animationIndex == 3) {
            animationIndex++;
            rocket.setVelocity(new Vector(0, 3, 0))
        }

        if (timePassed > 5 && animationIndex == 4) {
            animationIndex++;
            rocket.setVelocity(new Vector(0, 4, 0));
            player.runCommand("effect @s darkness 35 0 true")
        }

        if (timePassed > 10 && animationIndex == 5) {
            animationIndex++;
            rocket.setVelocity(new Vector(0, 0, 0))
            player.runCommand("particle bridge:stars ~ ~ ~")
        }

        if (timePassed > 11 && animationIndex == 6) {
            animationIndex++;
            rocket.kill()
            player.runCommand("gamemode spectator")
        }

        if (timePassed > 11.2 && animationIndex == 7) {
            animationIndex++;
            player.teleport(new Location(16076, 500, 16059), world.getDimension("overworld"), 0, 0);
        }

        if (timePassed > 12 && animationIndex == 8) {
            animationIndex++;
            player.runCommand("gamemode survival")
            player.runCommand("particle bridge:stars ~ ~ ~")
            player.runCommand("ride @s summon_ride bridge:rocket")
        }

        if (timePassed > 12.2 && animationIndex == 9) {
            animationIndex++;

            //@ts-ignore
            rocket = Array.from(world.getDimension("overworld").getEntities({
                location: player.location,
                maxDistance: 10,
                type: "bridge:rocket"
            }))[0];

            rocket.setVelocity(new Vector(0, -1.3, 0))
        }

        if (rocket.location.y < 90 && animationIndex == 10) {
            animationIndex++;
            rocket.setVelocity(new Vector(0, -0.4, 0))
            player.runCommand("effect @s clear")
        }

        if (rocket.location.y < 70 && animationIndex == 11) {
            animationIndex++;
            rocket.setVelocity(new Vector(0, -0.2, 0))

            playingTransition = false;
        }

        await null;
    }
})
//#endregion

//#region Rocket Construction
world.events.beforeItemUseOn.subscribe((e) => {
    const location = e.blockLocation;
    const overworld = world.getDimension("overworld");

    if (overworld.getBlock(location).id != "bridge:rocket_controller") return;

    //@ts-ignore Bridge doesnt have property value
    const rotation: 2 | 3 | 4 | 5 = overworld.getBlock(location).permutation.getProperty("bridge:block_rotation").value;

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
            "id": "bridge:rocket_plating",
            "offset": [1, 0, 1]
        },
        {
            "id": "bridge:rocket_plating",
            "offset": [0, 0, 2]
        },
        {
            "id": "bridge:rocket_plating",
            "offset": [-1, 0, 1]
        },
        {
            "id": "bridge:rocket_plating",
            "offset": [1, 1, 1]
        },
        {
            "id": "bridge:rocket_plating",
            "offset": [0, 0, 1]
        },
        {
            "id": "bridge:rocket_plating",
            "offset": [0, 1, 2]
        },
        {
            "id": "bridge:rocket_plating",
            "offset": [-1, 1, 1]
        },
        {
            "id": "bridge:rocket_plating",
            "offset": [0, 1, 0]
        },
        {
            "id": "minecraft:glass",
            "offset": [1, 2, 1]
        },
        {
            "id": "minecraft:glass",
            "offset": [0, 2, 2]
        },
        {
            "id": "minecraft:glass",
            "offset": [-1, 2, 1]
        },
        {
            "id": "minecraft:glass",
            "offset": [0, 2, 0]
        },
        {
            "id": "minecraft:glass",
            "offset": [1, 3, 1]
        },
        {
            "id": "minecraft:glass",
            "offset": [0, 3, 2]
        },
        {
            "id": "minecraft:glass",
            "offset": [-1, 3, 1]
        },
        {
            "id": "minecraft:glass",
            "offset": [0, 3, 0]
        },
        {
            "id": "minecraft:glass",
            "offset": [0, 4, 1]
        },
    ]

    var failed = false;
    var missingBlocks = []

    rocketStructure.forEach((block) => {
        var offsetLocation;

        if (rotation == 2) offsetLocation = location.offset(block.offset[0], block.offset[1], -block.offset[2])
        else if (rotation == 3) offsetLocation = location.offset(block.offset[0], block.offset[1], block.offset[2])
        else if (rotation == 4) offsetLocation = location.offset(-block.offset[2], block.offset[1], block.offset[0])
        else if (rotation == 5) offsetLocation = location.offset(block.offset[2], block.offset[1], block.offset[0])

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
            var offsetLocation;

            if (rotation == 2) offsetLocation = location.offset(block.offset[0], block.offset[1], -block.offset[2])
            else if (rotation == 3) offsetLocation = location.offset(block.offset[0], block.offset[1], block.offset[2])
            else if (rotation == 4) offsetLocation = location.offset(-block.offset[2], block.offset[1], block.offset[0])
            else if (rotation == 5) offsetLocation = location.offset(block.offset[2], block.offset[1], block.offset[0])

            overworld.getBlock(offsetLocation).setType(MinecraftBlockTypes.air)
        })

        overworld.getBlock(location).setType(MinecraftBlockTypes.air)

        var rocketLocation;

        if (rotation == 2) rocketLocation = location.offset(0, -1, -1)
        else if (rotation == 3) rocketLocation = location.offset(0, -1, 1)
        else if (rotation == 4) rocketLocation = location.offset(-1, -1, 0)
        else if (rotation == 5) rocketLocation = location.offset(1, -1, 0)

        var rocket = overworld.spawnEntity("bridge:rocket", rocketLocation)
    }
})
//#endregion

function OffsetLocation(a, b) {
    return new Location(a.x + b.x, a.y + b.y, a.z + b.z)
}