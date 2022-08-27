import { DynamicPropertiesDefinition, world } from "mojang-minecraft"

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

    else if (e.message.toLowerCase() == "!rawdata") {
        var data = Data.Raw()
        e.message = "\n" + JSON.stringify(data, null, 4)
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