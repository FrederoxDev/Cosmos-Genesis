import { en } from "./en"
import { ru } from "./ru"

export const languages = [en, ru]

export function GetLangFromIndex(index: number) {
    return languages[index];
}

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