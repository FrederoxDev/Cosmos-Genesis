import { Player, Location, world, TickEvent, EffectType, MinecraftEffectTypes } from "mojang-minecraft";
import { Biome } from "./Biome";
import { Chunk } from "./Chunk";
import { ChunkCoord } from "./ChunkCoord";
import { Planet } from "./Planet";
import { SimplexNoise } from "./SimplexNoise"

export class WorldGenerator {
    public readonly chunkWidth: number;
    public readonly chunkHeight: number;

    private isBuildingChunks: boolean;
    private chunksToBuild: Chunk[];
    private simDistance: number;
    private player: Player;
    private planetSize: number;
    private planetOrigin: ChunkCoord;
    private failedChunks: Chunk[];

    private xIndex;
    private zIndex;
    private totalChunksBuilt: number;

    private planet: Planet;

    private SimplexNoise: SimplexNoise;

    constructor(chunkWidth: number, chunkHeight: number) {
        this.chunkWidth = chunkWidth;
        this.chunkHeight = chunkHeight;
        this.isBuildingChunks = false;
        this.chunksToBuild = [];
        this.failedChunks = [];
        this.simDistance = 3;
        this.totalChunksBuilt = 0;

        this.xIndex = 0;
        this.zIndex = 0;

        this.SimplexNoise = new SimplexNoise(
            <string> world.getDynamicProperty("seed")
        )
    }

    public LocationToChunkCoord(location: Location): ChunkCoord {
        return new ChunkCoord(
            Math.floor(location.x / this.chunkWidth),
            Math.floor(location.z / this.chunkWidth)
        )
    }

    public ChunkCoordToLocation(chunkCoord: ChunkCoord, y: number): Location {
        return new Location(chunkCoord.x * this.chunkWidth, y, chunkCoord.z * this.chunkWidth);
    }

    public async GeneratePlanet(player: Player, size: number, origin: ChunkCoord, planet: Planet) {
        this.player = player;
        this.planetSize = size;
        this.planetOrigin = origin;
        this.planet = planet;

        this.StartTerrainGeneration();
    }

    public async StartTerrainGeneration() {
        const startTime = new Date().getTime();

        // Subscribe to the ticking event
        this.isBuildingChunks = true;
        this.xIndex = 0;
        this.zIndex = 0;
        this.totalChunksBuilt = 0;
        this.QueueNewChunks();

        // this.player.addEffect(MinecraftEffectTypes.blindness, 1000000000, 255, false);

        world.events.tick.subscribe(this.GenTick)

        // Await for all chunks to be generated 
        // Await null to prevent it from hanging
        while (this.isBuildingChunks) {
            await null;
        }

        // Unsubscribe again from the tick event
        world.events.tick.unsubscribe(this.GenTick)

        // this.player.runCommand("effect @s clear")

        // Print timing information
        const endTime = new Date().getTime();
        console.warn(`Generated ${this.planetSize * this.planetSize} chunks in ${endTime - startTime}ms`)
        console.warn(`Chunk Average Time ${(endTime - startTime) / (this.planetSize * this.planetSize)}ms`)
    }

    public GenTick = (tickEvent: TickEvent) => {
        this.DisplayProgressBar();
        let finished = true;

        for (var i = 0; i < this.chunksToBuild.length; i++) {
            const chunk = this.chunksToBuild[i];

            if (!chunk.HasFinished()) {
                chunk.GenTick();
                finished = false;
            }
        }

        if (!finished) return;

        this.chunksToBuild = [];
        this.StepToNextChunk();
        this.QueueNewChunks();
    }

    public DisplayProgressBar() {
        var total = this.planetSize * this.planetSize;
        var percentage = (this.totalChunksBuilt / total) * 100;
        
        var barLength = 16;
        var bar = "";

        var complete = Math.floor(barLength * (this.totalChunksBuilt / total))
        
        bar += "█".repeat(complete)
        bar += "▒".repeat(barLength - complete)

        this.player.runCommand(`title @s title ${this.totalChunksBuilt} / ${total}`)

        this.player.runCommand(`title @s subtitle ${Math.round(percentage)}% [${bar}]`)

    }

    public StepToNextChunk() {
        this.xIndex += this.simDistance;

        if (this.xIndex >= this.planetSize) {
            this.zIndex += this.simDistance;
            this.xIndex = 0;
        }

        if (this.zIndex >= this.planetSize) {
            this.isBuildingChunks = false;
            this.player.teleport(this.ChunkCoordToLocation(this.planetOrigin, 90), world.getDimension("overworld"), 90, 90, false)
            return;
        }

        this.TeleportPlayerToChunk();
    }

    public TeleportPlayerToChunk() {
        // Teleport the player to the new location
        const coord = new ChunkCoord(
            this.planetOrigin.x + this.xIndex,
            this.planetOrigin.z + this.zIndex
        )

        this.player.teleport(this.ChunkCoordToLocation(coord, this.chunkHeight + 2), world.getDimension("overworld"), 90, 90, false);
    }

    public QueueNewChunks() {
        for (var x = 0; x < this.simDistance; x++) {
            for (var z = 0; z < this.simDistance; z++) {
                const coord = new ChunkCoord(
                    this.planetOrigin.x + this.xIndex + x,
                    this.planetOrigin.z + this.zIndex + z
                )

                if (
                    coord.x > this.planetOrigin.x + this.planetSize ||
                    coord.z > this.planetOrigin.z + this.planetSize
                ) continue;

                else {
                    this.chunksToBuild.push(new Chunk(this, coord));
                    this.totalChunksBuilt++;
                }
            }
        }
    }

    public GetBlock(octave1: number, biome: Biome, y: number): string {
        const terrainHeight = 30 + Math.floor(octave1 * 20)
        var blockID = "air"
        
        if (y === terrainHeight) blockID = biome.surface_parameters.top_material;
        else if (y > terrainHeight - 3 && y < terrainHeight) blockID = biome.surface_parameters.mid_material;
        else if (y < terrainHeight) blockID = biome.surface_parameters.foundation_material;

        return blockID;
    }

    public Get2DNoise(x: number, z: number, offset: number, scale: number): number {
        return this.SimplexNoise.noise2D(
            (x + 0.1) / 16 * scale + offset,
            (z + 0.1) / 16 * scale + offset
        )
    }

    public GetBiome(temperature: number, rainfall: number): Biome {
        return this.planet.biomes.sort((a, b) => {
            var aTemp = Math.max(a.climate.temperature, temperature) - Math.min(a.climate.temperature, temperature);
            var bTemp = Math.max(b.climate.temperature, temperature) - Math.min(b.climate.temperature, temperature);

            var aRain = Math.max(a.climate.rainfall, rainfall) - Math.min(a.climate.rainfall, rainfall);
            var bRain = Math.max(b.climate.rainfall, rainfall) - Math.min(b.climate.rainfall, rainfall);

            return (aTemp + aRain) - (bTemp + bRain)
        })[0]
    }

    public ChunkFailed(chunk: Chunk) {
        this.failedChunks.push(chunk);
    }
}