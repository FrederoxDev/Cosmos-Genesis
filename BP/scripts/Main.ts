import { DynamicPropertiesDefinition, Player, world } from "mojang-minecraft"
import { lang, languages, GetLangFromShort } from "./Localization/Languages";
import { SaveSystem } from "./SaveSystem"

var saveSystem: null | SaveSystem = null;
var host: null | Player = null;
var language: lang = languages[0];

//#region Property Initialization
world.events.worldInitialize.subscribe((e) => {
    const def = new DynamicPropertiesDefinition()

    try { world.getDynamicProperty("data") }
    catch { def.defineString("data", 2000) }

    e.propertyRegistry.registerWorldDynamicProperties(def);
})
//#endregion

//#region Loading Game Data
world.events.blockBreak.subscribe(async (e) => {
    if (host != null) return;
    host = e.player;

    saveSystem = new SaveSystem(e.player);
    await saveSystem.LoadData()

    language = GetLangFromShort(saveSystem.data.language)
})
//#endregion 