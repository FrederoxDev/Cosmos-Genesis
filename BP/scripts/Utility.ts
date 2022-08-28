import { DynamicPropertiesDefinition, EntityInventoryComponent, Location, world } from "mojang-minecraft"

world.events.worldInitialize.subscribe((e) => {
    const def = new DynamicPropertiesDefinition()

    try { world.getDynamicProperty("data") }
    catch { def.defineString("data", 2000) }

    e.propertyRegistry.registerWorldDynamicProperties(def);
})

world.events.beforeChat.subscribe(e => {
    if (e.message.toLowerCase() == "!playerdata") {
        var playerData = JSON.parse(Data.GetKey("playerData"))
        var index = playerData.findIndex(playerData => playerData.name == e.sender.name)

        e.message = "\n" + JSON.stringify(playerData[index], null, 4)
    }

    else if (e.message.toLowerCase() == "!basedata") {
        var baseBlocks = JSON.parse(Data.GetKey("baseBlocks"))
        e.message = "\n" + JSON.stringify(baseBlocks, null, 4)
    }

    else if (e.message.toLowerCase() == "!basedata reset") {
        Data.SetKey("baseBlocks", JSON.stringify([]))
    }

    else if (e.message.toLowerCase() == "!rawdata") {
        var data = Data.Raw()
        e.message = "\n" + JSON.stringify(data, null, 4)
    }

    else if (e.message.toLowerCase() == "!playerdata reset") {
        var playerData = JSON.parse(Data.GetKey("playerData"))
        var index = playerData.findIndex(playerData => playerData.name == e.sender.name)

        playerData[index] = { name: e.sender.name, earthLocation: { x: 0, z: 0 }, planet: "Earth", isTravelling: false }
        Data.SetKey("playerData", JSON.stringify(playerData))
    }

    else if (e.message.toLowerCase() == "!oxygen") {
        const inventory = (<EntityInventoryComponent>e.sender.getComponent("inventory")).container

        for (var i = 0; i < inventory.size; i++) {
            const item = inventory.getItem(i)
            if (item == null || item.id != "cosmos:oxygen_tank") continue

            item.setLore([`Oxygen: 15 / 15`])
            inventory.setItem(i, item)
        }
    }
})

export const Debug = {
    log: (msg): void => {
        console.warn(msg)
    },

    print: (msg): void => {
        world.getDimension("overworld").runCommand(`tellraw @a {"rawtext":[{"text":"${msg}"}]}`)
    }
}

export const Data = {
    GetKey: (key): any => {
        var data = <string>world.getDynamicProperty("data");
        if (data == undefined) return null
        data = JSON.parse(data)

        return data[key]
    },

    SetKey: (key, value): void => {
        var data: any = world.getDynamicProperty("data");
        if (data == undefined) data = {}
        else data = JSON.parse(data)

        data[key] = value
        world.setDynamicProperty("data", JSON.stringify(data))
    },

    Raw: (): any => {
        var data: any = world.getDynamicProperty("data");
        if (data == undefined) data = {}
        else data = JSON.parse(data)

        return data
    }
}

export function RandInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
}

export function OffsetLocation(a: Location, b: Location): Location {
    return new Location(a.x + b.x, a.y + b.y, a.z + b.z)
}