import { Player, world } from "mojang-minecraft";
import { ActionFormData, ModalFormData } from "mojang-minecraft-ui"
import { Planet } from "./Generation/Planet";
import { languages, lang } from "./Localization/Languages";

export class SetupMenu {
    host: Player

    constructor(host: Player) {
        this.host = host;
    }

    public async GetPlayerLanguage(): Promise<lang> {
        const languageSelect = new ActionFormData()
            .title("Choose Language")

        for (var i = 0; i < languages.length; i++) {
            languageSelect.button(languages[i].name, languages[i].flag)
        }

        const e = await languageSelect.show(this.host);

        if (e.isCanceled || (e.isCanceled === undefined && e.selection === undefined))
            return await this.GetPlayerLanguage()

        return languages[e.selection]
    }

    public async GetWorldSettings(lang: lang): Promise<WorldSettings> {
        const seed = lang.worldSettings.seed

        const worldSettings = new ModalFormData()
            .title(lang.worldSettings.title)
            .textField(seed, seed, "")

        const e = await worldSettings.show(this.host)
        if (e.isCanceled || (e.isCanceled === undefined && e.formValues === undefined))
            return await this.GetWorldSettings(lang);


        return {
            seed: e.formValues[0]
        }
    }

    public async GetPlanetSelection(lang: lang, player: Player, planets: Planet[]): Promise<Planet> {
        const planetSelection = new ActionFormData()
            .title("Planet Selection")

        for (var i = 0; i < planets.length; i++) {
            planetSelection.button(planets[i].identifier)
        }

        const e = await planetSelection.show(player);
        if (e.isCanceled || (e.isCanceled === undefined && e.selection === undefined))
            return await this.GetPlanetSelection(lang, player, planets);

        return planets[e.selection]
    }
}

interface WorldSettings {
    seed: string;
}