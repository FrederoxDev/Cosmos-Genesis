import { Player } from "mojang-minecraft";
import { ActionFormData, ModalFormData } from "mojang-minecraft-ui"
import { languages, getLang, lang } from "../Localization/Languages";

export class SetupMenu {
    private player: Player;
    private language: lang;

    public async start(player: Player) {
        this.player = player;
        await this.languageSelect();
        await this.worldSettings();
    }

    /*
    Returns the index of the language
    */
    // @ts-ignore 
    private async languageSelect(): Promise<number> {
        const languageSelect = new ActionFormData()
            .title("Choose Language")

        for (var i = 0; i < languages.length; i++) {
            languageSelect.button(languages[i].name, languages[i].flag)
        }

        await languageSelect.show(this.player).then(async (res) => {
            if (res.isCanceled) return this.languageSelect();
            this.language = getLang(res.selection);
        })
    }

    private async worldSettings() {
        var worldSettings = new ModalFormData()
            .title(this.language.worldSettings.title)
            .textField(this.language.worldSettings.seed, this.language.worldSettings.seed)

        await worldSettings.show(this.player).then(async (res) => {
            if (res.isCanceled) return this.worldSettings();
            console.warn(res.formValues.toString())
        })
    }
}