import { Player, Location, world, TickEvent } from "mojang-minecraft";
import { Chunk, ChunkCoord } from "./Chunk";

export class WorldGenerator {
    public readonly chunkWidth: number;
    public readonly chunkHeight: number;

    private isBuildingChunks: boolean;
    private chunksToBuild: Chunk[];
    private simDistance: number;
    private player: Player;
    private planetSize: number;
    private planetOrigin: ChunkCoord;

    private xIndex;
    private zIndex;
    totalChunksBuilt: number;

    constructor(chunkWidth: number, chunkHeight: number) {
        this.chunkWidth = chunkWidth;
        this.chunkHeight = chunkHeight;
        this.isBuildingChunks = false;
        this.chunksToBuild = [];
        this.simDistance = 3;
        this.totalChunksBuilt = 0;

        this.xIndex = 0;
        this.zIndex = 0;
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

    public async GeneratePlanet(player: Player, size: number, origin: ChunkCoord) {
        this.player = player;
        this.planetSize = size;
        this.planetOrigin = origin;

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

        world.events.tick.subscribe(this.GenTick)

        // Await for all chunks to be generated 
        // Await null to prevent it from hanging
        while (this.isBuildingChunks) {
            await null;
        }

        // Unsubscribe again from the tick event
        world.events.tick.unsubscribe(this.GenTick)

        // Print timing information
        const endTime = new Date().getTime();
        console.warn(`Generated ${this.planetSize * this.planetSize} chunks in ${endTime - startTime}ms`)
        console.warn(`Chunk Average Time ${(endTime - startTime) / (this.planetSize * this.planetSize)}ms`)
    }

    public GenTick = (tickEvent: TickEvent) => {
        this.DisplayProgressBar();

        // Do not continue until all chunks have been built
        if (this.chunksToBuild.length > 0) {
            if (this.chunksToBuild[0].HasFinished()) this.chunksToBuild.shift();

            else if (this.chunksToBuild[0].HasFailed()) {
                this.TeleportPlayerToChunk();
                this.chunksToBuild[0].GenerateChunk();
                return;
            }

            else return;
        }

        this.StepToNextChunk();
        this.QueueNewChunks();
    }

    public DisplayProgressBar() {
        var total = this.planetSize * this.planetSize;
        var percentage = (this.totalChunksBuilt / total) * 100;
        this.player.runCommand(`title @s title §5${Math.floor(percentage)}%`)
        this.player.runCommand(`title @s subtitle ${this.totalChunksBuilt} / ${total} Chunks Generated`)
    }

    public StepToNextChunk() {
        this.xIndex += this.simDistance;

        if (this.xIndex >= this.planetSize) {
            this.zIndex += this.simDistance;
            this.xIndex = 0;
        }

        if (this.zIndex >= this.planetSize) {
            this.isBuildingChunks = false;
            this.player.teleport(this.ChunkCoordToLocation(this.planetOrigin, 90), world.getDimension("overworld"), 0, 90, false)
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

        this.player.teleport(this.ChunkCoordToLocation(coord, 90), world.getDimension("overworld"), 90, 90, false);
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
}