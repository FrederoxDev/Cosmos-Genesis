import { Player, world } from "mojang-minecraft";
import { ActionFormData, ModalFormData } from "mojang-minecraft-ui"
import { languages, lang } from "./Localization/Languages";

export class SetupMenu {
    host: Player

    constructor(host: Player) {
        this.host = host;
    }

    public async GetPlayerLanguage() {
        const languageSelect = new ActionFormData()
            .title("Choose Language")

        for (var i = 0; i < languages.length; i++) {
            languageSelect.button(languages[i].name, languages[i].flag)
        }

        // default language
        var lang = null

        await languageSelect.show(this.host).then(async (e) => {
            if (e.isCanceled) {
                lang = await this.GetPlayerLanguage()
                return lang;
            }

            lang = languages[e.selection]
        })

        return lang
    }

    public async GetWorldSettings(lang: lang): Promise<WorldSettings> {
        const seed = lang.worldSettings.seed

        const worldSettings = new ModalFormData()
            .title(lang.worldSettings.title)
            .textField(seed, seed, "")

        // default language
        var settings = null;

        await worldSettings.show(this.host).then(async (e) => {
            if (e.isCanceled) {
                settings = await this.GetWorldSettings(lang)
                return settings;
            }

            settings = {
                seed: e.formValues[0]
            }
        })

        return settings
    }
}

interface WorldSettings {
    seed: string;
}