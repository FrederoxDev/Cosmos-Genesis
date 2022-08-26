import { RandInt } from "../Utility"
import { Location } from "mojang-minecraft"

export class Planet {
    name: string
    origin: number
    size: number

    constructor(name, origin, size) {
        this.name = name
        this.origin = origin
        this.size = size
    }

    GetRandomPos(): Location {
        const pos = (this.origin * 16) + ((this.size / 2) * 16)
        return new Location(pos + RandInt(-100, 100), 70, pos + RandInt(-100, 100))
    }
}