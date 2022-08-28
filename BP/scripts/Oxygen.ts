import { Player, world, EntityInventoryComponent, Location } from "mojang-minecraft"
import { Data, Debug } from "./Utility"
import { PlayerData } from "./Classes/PlayerData"
import { BaseBlocks } from "./Classes/BaseBlocks";

world.events.beforeItemUseOn.subscribe(e => {
    const location = e.blockLocation;
    const overworld = world.getDimension("overworld");

    if (overworld.getBlock(location).id != "cosmos:oxygen_charger") return;
    if (e.item == undefined || e.item.id != "cosmos:oxygen_tank") return;

    const item = e.item
    item.setLore(["Oxygen: 15 / 15"])

    const player = <Player>e.source;
    const inventory = (<EntityInventoryComponent>player.getComponent("inventory")).container

    inventory.setItem(player.selectedSlot, item)
})

world.events.blockPlace.subscribe(e => {
    if (e.block.id != "cosmos:base_controller") return;
    const location = e.block.location;
    var baseBlocks: BaseBlocks[] = JSON.parse(Data.GetKey("baseBlocks") || "[]")

    var index = baseBlocks.findIndex(block => block.x == location.x && block.y == location.y && block.z == location.z)

    if (index == -1) {
        baseBlocks.push({ x: location.x, y: location.y, z: location.z })
    }
    else baseBlocks[index] = { x: location.x, y: location.y, z: location.z }

    Data.SetKey("baseBlocks", JSON.stringify(baseBlocks))
})

world.events.blockBreak.subscribe(e => {
    if (e.brokenBlockPermutation.type.id != "cosmos:base_controller") return;
    const location = e.block.location;

    var baseBlocks: BaseBlocks[] = JSON.parse(Data.GetKey("baseBlocks") || "[]")
    var index = baseBlocks.findIndex(block => block.x == location.x && block.y == location.y && block.z == location.z)

    if (baseBlocks.length == 1) baseBlocks = []
    else baseBlocks = baseBlocks.slice(index)

    Data.SetKey("baseBlocks", JSON.stringify(baseBlocks))
})

const timeBetweenChecks = 1
var counter = 0

world.events.tick.subscribe(e => {
    counter += e.deltaTime
    if (counter < timeBetweenChecks) return;
    else counter = 0

    const playerData: PlayerData[] = JSON.parse(Data.GetKey("playerData"))
    const players = Array.from(world.getPlayers());
    const baseBlocks = JSON.parse(Data.GetKey("baseBlocks"))

    for (var i = 0; i < players.length; i++) {
        const player = players[i]
        const index = playerData.findIndex(playerData => playerData.name == player.name)

        if (playerData[index].planet === "Earth") return

        var inBase = false

        for (var b = 0; b < baseBlocks.length; b++) {
            const location = new Location(baseBlocks[b].x, baseBlocks[b].y, baseBlocks[b].z)
            if (location.isNear(player.location, 5)) {
                player.onScreenDisplay.setActionBar("In Base")
                inBase = true
                break
            }
        }

        if (inBase) continue;

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