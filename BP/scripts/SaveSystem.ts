	import { Player, world } from "mojang-minecraft";
import { SetupMenu } from "./SetupMenu";

export interface GameData {
    language: string;
    seed: string;
    hasGeneratedWorld: boolean;
}

export class SaveSystem {
    public data: GameData;
    private host: Player;

    constructor(host: Player) {
        this.host = host;
    }

    public async LoadData() {
        const data = <string>world.getDynamicProperty("data");
        if (data != undefined) {
            this.data = JSON.parse(data)
            return
        }

        const setupMenu = new SetupMenu(this.host)
        const language = await setupMenu.GetPlayerLanguage()
        const worldSettings = await setupMenu.GetWorldSettings(language)

        this.data = {
            language: language.shortName,
            seed: worldSettings.seed,
            hasGeneratedWorld: false
        }

        this.SaveData()
    }

    public SaveData() {
        const data = JSON.stringify(this.data)

        world.setDynamicProperty("data", data)
    }
}