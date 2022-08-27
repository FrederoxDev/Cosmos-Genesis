import { Planet } from "./Classes/Planet"
import { Player, Location, world } from "mojang-minecraft"
import { ActionFormData } from "mojang-minecraft-ui"
import { Data, Debug } from "./Utility"

// Runs these scripts which subscribe to world events
import "./Utility"
import "./PlayerWatcher"

const Earth = new Planet("Earth", null, null)
const K384 = new Planet("K384", 5000, 50)
const planets = [Earth, K384]

world.events.blockBreak.subscribe(async e => {
    var player = e.player
    var location = e.player.location
    var playerData = JSON.parse(Data.GetKey("playerData"));
    var index = playerData.findIndex(playerData => playerData.name === e.player.name)
    const planet: Planet = await ShowPlanetSelector(e.player)

    // If the player is currently on earth save the location
    // So that it can be used when landing a rocket
    if (playerData[index].planet === "Earth") {
        playerData[index].earthLocation.x = location.x
        playerData[index].earthLocation.z = location.z
    }

    // Save the planet they are travelling too
    playerData[index].planet = planet.name
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

    player.teleport(new Location(targetX, 70, targetZ), world.getDimension("overworld"), 0, 0)
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