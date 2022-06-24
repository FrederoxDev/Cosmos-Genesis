import { perlin2D } from "./Noise"
import { Location, Dimension, Player, PlayerJoinEvent, PlayerLeaveEvent, TickEvent, world } from "mojang-minecraft";
import { Chunk, ChunkCoord } from "./Chunk";
import { Planet } from "./Planet";
import { Biome } from "./Biome";

export class WorldGenerator {
    readonly chunkWidth: number;
    readonly chunkHeight: number;
    readonly planets: Planet[];

    constructor(chunkWidth: number, chunkHeight: number) {
        this.chunkWidth = chunkWidth;
        this.chunkHeight = chunkHeight;
    }

    /**
     * Loops through each planet, and pre-generates it
     */
    public async GeneratePlanet(planet: Planet, player: Player, xOffset: number, zOffset: number) {
        var planetSize = planet.sizeInChunks;
        var totalChunks = planetSize * planetSize;
        var chunksGenerated = 0;

        var startTime = new Date().getTime();

        for (var x = 0; x < planetSize; x += 2) {
            for (var z = 0; z < planetSize; z += 2) {
                var xChunk = x + xOffset;
                var zChunk = z + zOffset;

                await player.runCommand(`tp @s ${xChunk * 16} 80 ${zChunk * 16} 90 90 false`)

                await Promise.allSettled([
                    new Chunk(this, new ChunkCoord(xChunk, zChunk), planet).GenerateChunk(),
                    new Chunk(this, new ChunkCoord(xChunk + 1, zChunk), planet).GenerateChunk(),
                    new Chunk(this, new ChunkCoord(xChunk, zChunk + 1), planet).GenerateChunk(),
                    new Chunk(this, new ChunkCoord(xChunk + 1, zChunk + 1), planet).GenerateChunk()
                ])

                chunksGenerated += 4;

                var timePassed = new Date().getTime() - startTime;
                var estimatedTime = (totalChunks - chunksGenerated) * (timePassed / chunksGenerated);
                player.runCommand(`title @s actionbar ${Math.floor(estimatedTime / 1000)}s left!`)
                player.runCommand(`title @s title ${chunksGenerated} / ${totalChunks}`)
            }
        }

        console.warn(`Generated ${totalChunks} chunks in ${new Date().getTime() - startTime}ms`)
    }

    /**
     * Returns the block at a given position
    */
    public GetBlock(x: number, y: number, z: number, planet: Planet): string {
        if (y == 0) return "minecraft:bedrock";

        const temperature = this.Get2DPerlin(x, z, 34214, 0.5)
        const rainfall = this.Get2DPerlin(x, z, 432, 0.25)
        const biome: Biome = this.GetBiome(planet, temperature, rainfall);

        const groundHeight = planet.groundHeight;

        var octave1 = this.Get2DPerlin(x, z, 0, 0.25)
        var octave2 = this.Get2DPerlin(x, z, 53552, 1) / 2
        var terrainHeight = groundHeight + Math.floor(groundHeight + (this.chunkHeight - groundHeight) * ((octave1 + octave2) / 2))

        var blockID = "minecraft:air"

        if (y === terrainHeight) blockID = biome.surface_parameters.top_material;
        else if (y > terrainHeight - 3 && y < terrainHeight) blockID = biome.surface_parameters.mid_material;
        else if (y < terrainHeight) blockID = biome.surface_parameters.foundation_material;

        return blockID;
    }

    /**
     * Returns a biome
     */
    public GetBiome(planet: Planet, temperature: number, rainfall: number): Biome {
        return planet.biomes.sort((a, b) => {
            var aTemp = Math.max(a.climate.temperature, temperature) - Math.min(a.climate.temperature, temperature);
            var bTemp = Math.max(b.climate.temperature, temperature) - Math.min(b.climate.temperature, temperature);

            var aRain = Math.max(a.climate.rainfall, rainfall) - Math.min(a.climate.rainfall, rainfall);
            var bRain = Math.max(b.climate.rainfall, rainfall) - Math.min(b.climate.rainfall, rainfall);

            return (aTemp + aRain) - (bTemp + bRain)
        })[0]
    }

    /**
     * Returns a value between -1 and 1
     */
    private Get2DPerlin(x: number, z: number, offset: number, scale: number): number {
        return perlin2D(
            (x + 0.1) / 16 * scale + offset,
            (z + 0.1) / 16 * scale + offset
        )
    }
}

export class PlayerData {
    public player: Player;
    public lastChunkCoord: ChunkCoord;
    public chunkWidth: number;

    constructor(player: Player, chunkWidth) {
        this.player = player;
        this.chunkWidth = chunkWidth;
    }

    public UpdateChunkCoord(): void {
        var location = this.player.location;
        var chunkX = Math.floor(location.x / this.chunkWidth);
        var chunkZ = Math.floor(location.z / this.chunkWidth);

        this.lastChunkCoord = new ChunkCoord(chunkX, chunkZ);
    }

    public GetChunkCoord(): ChunkCoord {
        var location = this.player.location;
        var chunkX = Math.floor(location.x / this.chunkWidth);
        var chunkZ = Math.floor(location.z / this.chunkWidth);

        return new ChunkCoord(chunkX, chunkZ);
    }
}