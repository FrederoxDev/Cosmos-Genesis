import { Player, world, EntityInventoryComponent, Location } from "mojang-minecraft"
import { Data, Debug } from "./Utility"
import { PlayerData } from "./Classes/PlayerData"
import { BaseBlocks } from "./Classes/BaseBlocks";

const tankCapacity = 120

world.events.beforeItemUseOn.subscribe(e => {
    const location = e.blockLocation;
    const overworld = world.getDimension("overworld");

    if (overworld.getBlock(location).id != "cosmos:oxygen_charger") return;
    if (e.item == undefined || e.item.id != "cosmos:oxygen_tank") return;

    const item = e.item
    item.setLore([`Oxygen: ${tankCapacity} / ${tankCapacity}`])
    item.getComponent("durability").damage = 1

    const player = <Player>e.source;
    const inventory = (<EntityInventoryComponent>player.getComponent("inventory")).container

    inventory.setItem(player.selectedSlot, item)
    player.playSound("air_fill")
})

var baseCooldown = new Date().getTime()

world.events.beforeItemUseOn.subscribe(e => {
    const location = e.blockLocation;
    const overworld = world.getDimension("overworld");

    if (overworld.getBlock(location).id != "cosmos:base_controller") return;
    if (new Date().getTime() - baseCooldown < 5) return;

    //@ts-ignore
    (<Player>e.source).playSound("fall.amethyst_block", { volume: 12 })

    //@ts-ignore
    const baseEntity = Array.from(world.getDimension("overworld").getEntities({
        location: e.source.location,
        type: "cosmos:base_bounds",
        closest: 1
    }))[0]

    if (baseEntity != undefined) {
        baseEntity.teleport(new Location(0, 320, 0), world.getDimension("overworld"), 0, 0)
        baseEntity.kill()
        return;
    }

    baseCooldown = new Date().getTime()
    world.getDimension("overworld").spawnEntity("cosmos:base_bounds", location)
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

    e.player.runCommand("tellraw @s {\"rawtext\":[{\"translate\":\"block.tips:base_controller\"}]}")

    Data.SetKey("baseBlocks", JSON.stringify(baseBlocks))
})

world.events.blockBreak.subscribe(e => {
    if (e.brokenBlockPermutation.type.id != "cosmos:base_controller") return;
    const location = e.block.location;

    var baseBlocks: BaseBlocks[] = JSON.parse(Data.GetKey("baseBlocks") || "[]")
    var index = baseBlocks.findIndex(block => block.x == location.x && block.y == location.y && block.z == location.z)

    if (baseBlocks.length == 1) baseBlocks = []
    else baseBlocks = baseBlocks.slice(index)

    const baseEntity = Array.from(world.getDimension("overworld").getEntities({
        //@ts-ignore
        location: e.block.location,
        type: "cosmos:base_bounds",
        closest: 1
    }))[0]

    if (baseEntity != undefined) {
        baseEntity.teleport(new Location(0, 320, 0), world.getDimension("overworld"), 0, 0)
        baseEntity.kill()
        return;
    }

    Data.SetKey("baseBlocks", JSON.stringify(baseBlocks))
})

const timeBetweenChecks = 1
var counter = 0

world.events.tick.subscribe(e => {
    counter += e.deltaTime
    if (counter < timeBetweenChecks) return;
    else counter = 0

    const playerData: PlayerData[] = JSON.parse(Data.GetKey("playerData") || "[]")
    const players = Array.from(world.getPlayers());
    const baseBlocks = JSON.parse(Data.GetKey("baseBlocks") || "[]")

    for (var i = 0; i < players.length; i++) {
        const player = players[i]
        const index = playerData.findIndex(playerData => playerData.name == player.name)

        if (index == -1) continue;

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

            maxOxygen += tankCapacity;

            if (item.getLore()[0] == undefined) {
                item.setLore([`Oxygen: 0 / ${tankCapacity}`])
                inventory.setItem(i, item)
                continue
            }

            var durability = parseInt(item.getLore()[0].replace("Oxygen: ", "").split(" / ")[0])
            if (durability == 0) continue;

            currentOxygen += durability
            if (hasOxygen) continue;

            hasOxygen = true
            item.setLore([`Oxygen: ${durability - 1} / ${tankCapacity}`])
            item.getComponent("durability").damage = tankCapacity + 1 - durability

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