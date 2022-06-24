![Logo](https://github.com/FrederoxDev/MCBE-Terrain-Generation/blob/master/MCBE-Terrain.png?raw=true)

# MCBE-Terrain-Generation

A project made in the GameTest Framework created for generating minecraft terrain. 


## Usage/Examples

### Planets
```ts
interface Planet {
    identifier: string
    groundHeight: number
    sizeInChunks: number
    biomes: Biome[]
}
```

### Biomes
```ts
interface Biome {
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
```

