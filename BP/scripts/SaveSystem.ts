import { Player, world, Location } from "mojang-minecraft";
import { SetupMenu } from "./SetupMenu";
const currentSaveFormat = 1;

export interface GameData {
    format: number;
    language: string;
    seed: string;
    hasGeneratedWorld: boolean;
    playerData: PlayerData[];
}

// Used to get the keys on the interface
// Values can be anything
const emptyGameData: GameData = {
    format: 0,
    language: "",
    seed: "",
    hasGeneratedWorld: false,
    playerData: []
}

export interface PlayerData {
    name: string;
    planet: string;
    earthLocation: {
        x: number;
        y: number;
        z: number;
    }
}

export class SaveSystem {
    public data: GameData;
    private host: Player;

    constructor(host: Player) {
        this.host = host;
    }

    public async LoadData() {
        const data = <string>world.getDynamicProperty("data");
        if (data != undefined && data != "") {
            this.data = JSON.parse(data)

            if (this.data.format != currentSaveFormat) {
                console.warn(`Migrating save data from format ${this.data.format} to ${currentSaveFormat}`)

                Object.keys(emptyGameData).forEach((key) => {
                    if (!(key in this.data)) {
                        // Example updater
                        // if (key === "playerData") this.data.playerData = [];
                    }
                })

                this.data.format = currentSaveFormat;
                this.SaveData()
            }

            return;
        }

        const setupMenu = new SetupMenu(this.host);
        const language = await setupMenu.GetPlayerLanguage();
        const worldSettings = await setupMenu.GetWorldSettings(language);

        this.data = {
            format: currentSaveFormat,
            language: language.shortName,
            seed: worldSettings.seed,
            hasGeneratedWorld: false,
            playerData: []
        }

        this.SaveData()
    }

    public SaveData() {
        const data = JSON.stringify(this.data)

        world.setDynamicProperty("data", data)
    }
}