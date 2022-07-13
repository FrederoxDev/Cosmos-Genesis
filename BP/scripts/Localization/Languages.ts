import { en } from "./en"
import { ru } from "./ru"

export const languages = [en, ru]

export function getLang(index: number) {
    return languages[index];
}

export interface lang {
    name: string,
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