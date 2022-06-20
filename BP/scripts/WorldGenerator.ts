import { perlin2D } from "./Noise"
import { BlockLocation, Dimension, Player, PlayerJoinEvent, PlayerLeaveEvent, TickEvent, world } from "mojang-minecraft";
import { Chunk, ChunkCoord } from "./Chunk";
import { Planet } from "./Planet";
import { Biome } from "./Biome";

export class WorldGenerator {
    readonly chunkWidth: number;
    readonly chunkHeight: number;
    generateDistance: number;
    chunksPerTick: number;

    private overworld: Dimension;
    private chunksToGenerate: Chunk[]
    private generatedChunks: ChunkCoord[]
    private players: PlayerData[];

    public planets: Planet[];

    constructor(chunkWidth: number, chunkHeight: number, generateDistance: number, chunksPerTick: number, planets: Planet[]) {
        this.chunkWidth = chunkWidth;
        this.chunkHeight = chunkHeight;
        this.generateDistance = generateDistance;
        this.chunksPerTick = chunksPerTick;
        this.planets = planets;

        this.chunksToGenerate = [];
        this.generatedChunks = [];
        this.players = [];
        this.overworld = world.getDimension("overworld");

        world.events.tick.subscribe(tickEvent => this.Tick(tickEvent));
        world.events.playerJoin.subscribe(playerJoin => this.PlayerJoined(playerJoin));
        world.events.playerLeave.subscribe(playerLeave => this.PlayerLeft(playerLeave));
    }

    private Tick(tickEvent: TickEvent): void {
        for (var i = 0; i <= this.chunksPerTick; i++) {
            if (this.chunksToGenerate.length > 0) {
                this.chunksToGenerate.sort((a: Chunk, b: Chunk) => {
                    return a.chunkCoord.distance(a.player.GetChunkCoord()) - b.chunkCoord.distance(b.player.GetChunkCoord())
                })

                this.GenerateChunks();
            }
        }

        this.players.forEach((playerData: PlayerData) => {
            // Update Surrounding Chunks
            if (playerData.GetChunkCoord().equals(playerData.lastChunkCoord)) return;

            playerData.UpdateChunkCoord();
            this.QueueNewChunks(playerData.lastChunkCoord, playerData)
        })
    }

    private QueueNewChunks(chunkCoord: ChunkCoord, playerData: PlayerData): void {
        for (var x = chunkCoord.x - this.generateDistance; x <= chunkCoord.x + this.generateDistance; x++) {
            for (var z = chunkCoord.z - this.generateDistance; z <= chunkCoord.z + this.generateDistance; z++) {

                var testLocation = new BlockLocation(x * this.chunkWidth, 0, z * this.chunkWidth);
                var chunkIsInGeneratedList = this.generatedChunks.some(chunk => chunk.x === x && chunk.z === z)
                var chunkDetected = this.overworld.getBlock(testLocation).id === "minecraft:bedrock"

                if (!chunkDetected && chunkIsInGeneratedList) {
                    var index = this.generatedChunks.findIndex(chunk => chunk.x === x && chunk.z === z)
                    this.generatedChunks.splice(index)
                }

                if (!chunkIsInGeneratedList && chunkDetected) {
                    this.generatedChunks.push(new ChunkCoord(x, z))
                }

                else if (!chunkIsInGeneratedList) this.chunksToGenerate.push(new Chunk(this, new ChunkCoord(x, z), playerData))
            }
        }
    }

    private GenerateChunks() {
        var chunk: Chunk = this.chunksToGenerate.shift();

        if (chunk.player.GetChunkCoord().distance(chunk.chunkCoord) > this.generateDistance) return;

        chunk.GenerateChunk();

        this.generatedChunks.push(chunk.chunkCoord);
    }

    private PlayerJoined(joinEvent: PlayerJoinEvent): void {
        this.players.push(new PlayerData(joinEvent.player, this.chunkWidth));
    }

    private PlayerLeft(leaveEvent: PlayerLeaveEvent): void {
        var index = this.players.findIndex(player => player.player.name === leaveEvent.playerName);
        this.players.splice(index);
    }

    /**
     * Returns the block at a given position
    */
    public GetBlock(x: number, y: number, z: number): string {
        if (y == 0) return "minecraft:bedrock";

        const temperature = this.Get2DPerlin(x, z, 34214, 0.05)
        const rainfall = this.Get2DPerlin(x, z, 432, 0.05)
        const planet = this.planets[0];
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