import { Planet } from "./Classes/Planet"
import { Player, Location, world, EntityRideableComponent, Vector, MinecraftBlockTypes } from "mojang-minecraft"
import { ActionFormData } from "mojang-minecraft-ui"
import { Data, Debug, OffsetLocation } from "./Utility"

const Earth = new Planet("Earth", null, null)
const K384 = new Planet("K384", 5000, 50)
const planets = [Earth, K384]

const transitionHeight = 100

world.events.dataDrivenEntityTriggerEvent.subscribe(async (e) => {
    if (e.id != "cosmos:on_rider_detected") return;
    var rocket = e.entity;
    const players = Array.from(world.getDimension("overworld").getPlayers())

    const pos = OffsetLocation(
        (<EntityRideableComponent>rocket.getComponent("minecraft:rideable")).seats[0].position,
        rocket.location
    );

    const player: Player = players.find(player => player.location.isNear(pos, 0.5))
    var playerData = JSON.parse(Data.GetKey("playerData"));
    var index = playerData.findIndex(playerData => playerData.name === player.name)

    if (playerData[index].isTravelling) return

    const location = player.location
    const planet: Planet = await ShowPlanetSelector(player)

    if (planet == null) {
        player.runCommand("ride @s stop_riding")
        return;
    }

    // If the player is currently on earth save the location
    // So that it can be used when landing a rocket
    if (playerData[index].planet === "Earth") {
        playerData[index].earthLocation.x = location.x
        playerData[index].earthLocation.z = location.z
    }

    playerData[index].isTravelling = true
    Data.SetKey("playerData", JSON.stringify(playerData))

    // Find the target position
    var targetX
    var targetZ

    if (planet.name === "Earth") {
        targetX = playerData[index].earthLocation.x
        targetZ = playerData[index].earthLocation.z
    }

    else {
        var target = planet.GetRandomPos()
        targetX = target.x
        targetZ = target.z
    }

    var lastTimestamp = new Date().getTime()
    var frameIndex = 0;
    var playing = true;

    while (playing) {
        var timeSinceLastFrame = (new Date().getTime() - lastTimestamp) / 1000;

        if (frameIndex == 0) {
            lastTimestamp = new Date().getTime()
            frameIndex++

            player.onScreenDisplay.setTitle("3")
            continue
        }

        if (frameIndex == 1 && timeSinceLastFrame >= 1) {
            lastTimestamp = new Date().getTime()
            frameIndex++

            player.onScreenDisplay.setTitle("2")
            continue
        }

        if (frameIndex == 2 && timeSinceLastFrame >= 1) {
            lastTimestamp = new Date().getTime()
            frameIndex++

            player.onScreenDisplay.setTitle("1")
            continue
        }

        if (frameIndex == 3 && timeSinceLastFrame >= 1) {
            lastTimestamp = new Date().getTime()
            frameIndex++

            player.onScreenDisplay.setTitle("0")
            rocket.setVelocity(new Vector(0, 3, 0))
            continue
        }

        if (frameIndex == 4 && rocket.location.y > transitionHeight) {
            lastTimestamp = new Date().getTime()
            frameIndex++

            rocket.setVelocity(new Vector(0, 0, 0))
            continue
        }

        if (frameIndex == 5) {
            lastTimestamp = new Date().getTime()
            frameIndex++

            rocket.kill()
            player.runCommand("gamemode spectator")
            player.teleport(new Location(targetX, transitionHeight, targetZ), world.getDimension("overworld"), 0, 0);
            continue
        }

        if (frameIndex == 6 && timeSinceLastFrame >= 1) {
            lastTimestamp = new Date().getTime()
            frameIndex++

            try {
                player.runCommand("ride @s summon_ride cosmos:rocket")
                player.runCommand("gamemode survival")
            } catch (e) {
                frameIndex = 6
                Debug.log("Failed to summon rocket, it is likely chunks are still loading. Retrying")
                continue
            }
            continue
        }

        if (frameIndex == 7 && timeSinceLastFrame >= 0.2) {
            lastTimestamp = new Date().getTime()
            frameIndex++

            //@ts-ignore
            rocket = Array.from(world.getDimension("overworld").getEntities({
                location: player.location,
                maxDistance: 10,
                type: "cosmos:rocket"
            }))[0];

            rocket.setVelocity(new Vector(0, -3, 0))
            playing = false
            continue
        }

        await null
    }

    playerData[index].planet = planet.name
    playerData[index].isTravelling = false
    Data.SetKey("playerData", JSON.stringify(playerData))
})

async function ShowPlanetSelector(player: Player) {
    var playerData = JSON.parse(Data.GetKey("playerData"));
    var index = playerData.findIndex(playerData => playerData.name === player.name)
    var currentPlanet = playerData[index].planet
    var avaliablePlanets: Planet[] = []

    const form = new ActionFormData()
        .title("Planet Select")

    form.button("Cancel")

    planets.forEach(planet => {
        if (planet.name === currentPlanet) return;

        form.button(planet.name)
        avaliablePlanets.push(planet)
    })

    const res = await form.show(player)
    if (res.isCanceled || (res.isCanceled === undefined && res.selection === undefined))
        return await ShowPlanetSelector(player);

    if (res.selection == 0) return null

    return avaliablePlanets[res.selection - 1]
}

world.events.beforeItemUseOn.subscribe((e) => {
    const location = e.blockLocation;
    const overworld = world.getDimension("overworld");

    if (overworld.getBlock(location).id != "cosmos:rocket_controller") return;

    //@ts-ignore Bridge doesnt have property value
    const rotation: 2 | 3 | 4 | 5 = overworld.getBlock(location).permutation.getProperty("bridge:block_rotation").value;

    const rocketStructure = [
        {
            "id": "cosmos:thruster",
            "offset": [1, -1, 1]
        },
        {
            "id": "cosmos:thruster",
            "offset": [0, -1, 2]
        },
        {
            "id": "cosmos:thruster",
            "offset": [-1, -1, 1]
        },
        {
            "id": "cosmos:thruster",
            "offset": [0, -1, 0]
        },
        {
            "id": "cosmos:rocket_plating",
            "offset": [1, 0, 1]
        },
        {
            "id": "cosmos:rocket_plating",
            "offset": [0, 0, 2]
        },
        {
            "id": "cosmos:rocket_plating",
            "offset": [-1, 0, 1]
        },
        {
            "id": "cosmos:rocket_plating",
            "offset": [1, 1, 1]
        },
        {
            "id": "cosmos:rocket_plating",
            "offset": [0, 0, 1]
        },
        {
            "id": "cosmos:rocket_plating",
            "offset": [0, 1, 2]
        },
        {
            "id": "cosmos:rocket_plating",
            "offset": [-1, 1, 1]
        },
        {
            "id": "cosmos:rocket_plating",
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
            overworld.spawnEntity(`cosmos:hologram_${block.id.split(":")[1]}`, offsetLocation)
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

        Debug.print(output)
    }
    else {
        Debug.print("Rocket Constructed!")

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

        var rocket = overworld.spawnEntity("cosmos:rocket", rocketLocation)
    }
})