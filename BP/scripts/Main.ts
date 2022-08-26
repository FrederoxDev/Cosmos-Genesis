import { Planet } from "./Classes/Planet"
import { PlayerData } from "./Classes/PlayerData"
import { DynamicPropertiesDefinition, EntityHealthComponent, Location, Player, world } from "mojang-minecraft"
import { ActionFormData } from "mojang-minecraft-ui"
import { RandInt, Debug, Data } from "./Utility"
import "./Utility"

var playerData: PlayerData[] = []
var players: Player[] = []

const Earth = new Planet("Earth", null, null)
const K384 = new Planet("K384", 5000, 50)
const planets = [Earth, K384]

world.events.playerJoin.subscribe(e => {
    players.push(e.player)
    playerData = JSON.parse(Data.GetKey("playerData"))
    var index = playerData.findIndex(playerData => playerData.name == e.player.name)
    if (index == -1) playerData.push(
        { name: e.player.name, earthLocation: { x: 0, z: 0 }, planet: "Earth" })

    Data.SetKey("playerData", JSON.stringify(playerData))
})

world.events.playerLeave.subscribe(e => {
    players.slice(players.findIndex(player => player.name == e.playerName))
})

world.events.tick.subscribe(e => {
    CheckForDeadPlayers()
})

function CheckForDeadPlayers() {
    players.forEach(player => {
        if ((<EntityHealthComponent>player.getComponent("health")).current == 0) {
            playerData = JSON.parse(Data.GetKey("playerData"))
            var index = playerData.findIndex(playerData => playerData.name == player.name)
            playerData[index].planet = "Earth"

            Data.SetKey("playerData", JSON.stringify(playerData))
        }
    })
}

world.events.blockBreak.subscribe(async e => {
    playerData = JSON.parse(Data.GetKey("playerData"))
    var index = playerData.findIndex(playerData => playerData.name == e.player.name)
    var currentPlanet = playerData[index].planet
    var avaliablePlanets: Planet[] = []

    Debug.log("hi")

    const form = new ActionFormData()
        .title("Planet Select")

    planets.forEach(planet => {
        if (planet.name == currentPlanet) return
        form.button(planet.name)
        avaliablePlanets.push(planet)
    })

    var res = await form.show(e.player)

    try {
        playerData[index].planet = avaliablePlanets[res.selection].name
        Debug.log(`F`)
        Data.SetKey("playerData", JSON.stringify(playerData))
    } catch (e) { Debug.log(e) }
})

world.events.beforeChat.subscribe(e => {
    if (e.message.toLowerCase() == "!playerdata") {
        playerData = JSON.parse(Data.GetKey("playerData"))
        var index = playerData.findIndex(playerData => playerData.name == e.sender.name)

        e.message = "\n" + JSON.stringify(playerData[index], null, 4)
    }
})