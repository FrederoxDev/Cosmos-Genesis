import { Planet } from "./Classes/Planet"
import { Player, Location, world, EntityRideableComponent, Vector, EntityInventoryComponent } from "mojang-minecraft"
import { ActionFormData } from "mojang-minecraft-ui"
import { Data, Debug, OffsetLocation } from "./Utility"
import { PlayerData } from "./Classes/PlayerData"

// Runs these scripts which subscribe to world events
import "./Utility"
import "./PlayerWatcher"
import "./Rocket"

const timeBetweenChecks = 1
var counter = 0

world.events.tick.subscribe(e => {
    counter += e.deltaTime
    if (counter < timeBetweenChecks) return;
    else counter = 0

    const playerData: PlayerData[] = JSON.parse(Data.GetKey("playerData"))
    const players = Array.from(world.getPlayers());

    for (var i = 0; i < players.length; i++) {
        const player = players[i]
        const index = playerData.findIndex(playerData => playerData.name == player.name)

        if (playerData[index].planet === "Earth") return

        const inventory = (<EntityInventoryComponent>player.getComponent("inventory")).container
        var hasOxygen = false;

        var maxOxygen = 0
        var currentOxygen = 0

        for (var i = 0; i < inventory.size; i++) {
            const item = inventory.getItem(i)
            if (item == null || item.id != "cosmos:oxygen_tank") continue

            maxOxygen += 15;

            if (item.getLore()[0] == undefined) {
                item.setLore([`Oxygen: 0 / 15`])
                inventory.setItem(i, item)
                continue
            }

            var durability = parseInt(item.getLore()[0].replace("Oxygen: ", "").split(" / ")[0])
            if (durability == 0) continue;

            currentOxygen += durability
            if (hasOxygen) continue;

            hasOxygen = true
            item.setLore([`Oxygen: ${durability - 1} / 15`])
            currentOxygen -= 1
            inventory.setItem(i, item)
        }

        if (hasOxygen) {
            player.onScreenDisplay.setActionBar(`Oxygen: ${currentOxygen} / ${maxOxygen}`)
            continue
        }
        player.onScreenDisplay.setActionBar("No Oxygen!")
        player.runCommand("damage @s 2")
    }
})