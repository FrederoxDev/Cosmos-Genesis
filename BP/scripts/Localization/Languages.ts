import { en } from "./en"
import { de } from "./de"
import { ru } from "./ru"
import { fr } from "./fr"
import { it } from "./it"

export const languages = [en, de, ru, fr, it]

export function GetLangFromShort(short: any): lang {
    const lang = languages.find(language => language.shortName === short);
    if (lang != undefined) return lang;

    console.warn("Unable to load language " + short);
    return languages[0];
}

export interface lang {
    name: string,
    shortName: string,
    flag: string,

    general: {
        yes: string,
        no: string,
        okay: string,
        confirm: string,
        cancel: string,
    },

    worldSettings: {
        title: string,
        seed: string
    }
}