import { EntityHealthComponent, world } from "mojang-minecraft"
import { Data } from "./Utility"

// If the player has not joined before, setup default playerData
world.events.playerJoin.subscribe(e => {
    var playerData = JSON.parse(Data.GetKey("playerData"))
    var index = playerData.findIndex(playerData => playerData.name == e.player.name)
    if (index == -1) playerData.push(
        { name: e.player.name, earthLocation: { x: 0, z: 0 }, planet: "Earth" }
    )

    Data.SetKey("playerData", JSON.stringify(playerData))
})

// If the player dies reset their planet
world.events.tick.subscribe(e => {
    Array.from(world.getPlayers()).forEach(player => {
        if ((<EntityHealthComponent>player.getComponent("health")).current == 0) {
            var playerData = JSON.parse(Data.GetKey("playerData"))
            var index = playerData.findIndex(playerData => playerData.name == player.name)
            playerData[index].planet = "Earth"

            Data.SetKey("playerData", JSON.stringify(playerData))
        }
    })
})