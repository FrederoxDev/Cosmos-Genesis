export interface Biome {
    identifier: string
    climate: {
        temperature: number
        rainfall: number
    }
    surface_parameters: {
        top_material: string
        mid_material: string
        foundation_material: string
    }
}