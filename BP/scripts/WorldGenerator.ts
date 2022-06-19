import { perlin2D } from "./Noise"
import { BlockLocation, Dimension, Player, PlayerJoinEvent, PlayerLeaveEvent, TickEvent, world } from "mojang-minecraft";
import { Chunk, ChunkCoord } from "./Chunk";

export class WorldGenerator {
    readonly chunkWidth: number;
    readonly chunkHeight: number;
    readonly generateDistance: number;

    private overworld: Dimension;
    private chunksToGenerate: Chunk[]
    private generatedChunks: ChunkCoord[]
    private players: PlayerData[];

    constructor(chunkWidth: number, chunkHeight: number, generateDistance: number) {
        this.chunkWidth = chunkWidth;
        this.chunkHeight = chunkHeight;
        this.generateDistance = generateDistance;

        this.chunksToGenerate = [];
        this.generatedChunks = [];
        this.players = [];
        this.overworld = world.getDimension("overworld");

        world.events.tick.subscribe(tickEvent => this.Tick(tickEvent));
        world.events.playerJoin.subscribe(playerJoin => this.PlayerJoined(playerJoin));
        world.events.playerLeave.subscribe(playerLeave => this.PlayerLeft(playerLeave));
    }

    private Tick(tickEvent: TickEvent): void {
        while (this.chunksToGenerate.length > 0) {
            this.chunksToGenerate.sort((a: Chunk, b: Chunk) => {
                return a.chunkCoord.distance(a.player.GetChunkCoord()) - b.chunkCoord.distance(b.player.GetChunkCoord())
            })
            this.GenerateChunks();
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
        if (this.chunksToGenerate.length == 0) return;

        var chunk: Chunk = this.chunksToGenerate.shift();
        chunk.GenerateChunk();

        this.generatedChunks.push(chunk.chunkCoord);
    }

    private PlayerJoined(joinEvent: PlayerJoinEvent): void {
        this.players.push(new PlayerData(joinEvent.player));
    }

    private PlayerLeft(leaveEvent: PlayerLeaveEvent): void {
        var index = this.players.findIndex(player => player.player.name === leaveEvent.playerName);
        this.players.splice(index);
    }

    /**
     * Returns the block at a given position
    */
    public GetBlock(x: number, y: number, z: number): string {
        x = Math.floor(x);
        z = Math.floor(z);

        const groundHeight = 20;
        const waterLevel = 25;

        var temperature = this.Get2DPerlin(x, z, 34214, 0.12)
        var rainfall = this.Get2DPerlin(x, z, 432, 0.12)

        var octave1 = this.Get2DPerlin(x, z, 0, 0.25)
        var octave2 = this.Get2DPerlin(x, z, 53552, 0.5) / 2
        var terrainHeight = groundHeight + Math.floor(groundHeight + (this.chunkHeight - groundHeight) * ((octave1 + octave2) / 2))

        let blockID = "minecraft:air"


        if (y < terrainHeight) blockID = "tg:regolith"
        if (y == terrainHeight) {
            if (rainfall < 0 && temperature > 0) blockID = "tg:lava_stone" // Desert
            else if (rainfall < 0 && temperature < 0) blockID = "tg:regolith" // Tundra
            else blockID = "tg:regolith"
        }
        if (y == 0) blockID = "minecraft:bedrock"

        return blockID
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

    constructor(player: Player) {
        this.player = player;
    }

    public UpdateChunkCoord(): void {
        var location = this.player.location;
        var chunkX = Math.floor(location.x / 16);
        var chunkZ = Math.floor(location.z / 16);

        this.lastChunkCoord = new ChunkCoord(chunkX, chunkZ);
    }

    public GetChunkCoord(): ChunkCoord {
        var location = this.player.location;
        var chunkX = Math.floor(location.x / 16);
        var chunkZ = Math.floor(location.z / 16);

        return new ChunkCoord(chunkX, chunkZ);
    }
}