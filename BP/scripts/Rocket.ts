import { Planet } from "./Classes/Planet"
import { Player, Location, world, EntityRideableComponent, Vector } from "mojang-minecraft"
import { ActionFormData } from "mojang-minecraft-ui"
import { Data, Debug, OffsetLocation } from "./Utility"

const Earth = new Planet("Earth", null, null)
const K384 = new Planet("K384", 5000, 50)
const planets = [Earth, K384]

const transitionHeight = 100
const speedHeight = 70

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

    // If the player is currently on earth save the location
    // So that it can be used when landing a rocket
    if (playerData[index].planet === "Earth") {
        playerData[index].earthLocation.x = location.x
        playerData[index].earthLocation.z = location.z
    }

    // Save the planet they are travelling too
    playerData[index].planet = planet.name
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

            player.runCommand("ride @s summon_ride cosmos:rocket")
            player.runCommand("gamemode creative")
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
            continue
        }

        if (frameIndex == 8 && rocket.location.y < speedHeight) {
            lastTimestamp = new Date().getTime()
            frameIndex++

            rocket.setVelocity(new Vector(0, -1, 0))
            playing = false
            continue
        }

        await null
    }

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

    planets.forEach(planet => {
        if (planet.name === currentPlanet) return;

        form.button(planet.name)
        avaliablePlanets.push(planet)
    })

    const res = await form.show(player)
    if (res.isCanceled || (res.isCanceled === undefined && res.selection === undefined))
        return await ShowPlanetSelector(player);

    return avaliablePlanets[res.selection]
}