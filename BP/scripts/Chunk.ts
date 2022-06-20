import { Dimension, Player, world } from "mojang-minecraft";
import { PlayerData, WorldGenerator } from "./WorldGenerator"

export class Chunk {
    readonly chunkCoord: ChunkCoord;
    readonly worldGenerator: WorldGenerator;
    overworld: Dimension;
    player: PlayerData;

    constructor(worldGenerator: WorldGenerator, chunkCoord: ChunkCoord, player: PlayerData) {
        this.worldGenerator = worldGenerator;
        this.chunkCoord = chunkCoord;
        this.overworld = world.getDimension("overworld");
        this.player = player;
    }

    /**
     * Returns a 3D Array, containing the ID of blocks
     */
    private GenerateChunkData(): string[][][] {
        var xOffset = this.chunkCoord.x * this.worldGenerator.chunkWidth;
        var zOffset = this.chunkCoord.z * this.worldGenerator.chunkWidth

        /* INITIALISE A 3D ARRAY */
        let data = new Array(this.worldGenerator.chunkWidth);
        for (var i = 0; i < data.length; i++) {
            data[i] = new Array(this.worldGenerator.chunkHeight)

            for (var j = 0; j < data[i].length; j++) {
                data[i][j] = new Array(this.worldGenerator.chunkWidth)
            }
        }

        /* POPULATE DATA */
        for (var x = 0; x < this.worldGenerator.chunkWidth; x++) {
            for (var y = 0; y < this.worldGenerator.chunkHeight; y++) {
                for (var z = 0; z < this.worldGenerator.chunkWidth; z++) {
                    data[x][y][z] = this.worldGenerator.GetBlock(x + xOffset, y, z + zOffset);
                }
            }
        }

        return data;
    }

    /**
     * Builds the chunk in the world
     * @todo Implement a quicker fill algorithm
     */
    public GenerateChunk(): void {
        var data = this.GenerateChunkData();

        var xOffset = this.chunkCoord.x * this.worldGenerator.chunkWidth;
        var zOffset = this.chunkCoord.z * this.worldGenerator.chunkWidth;

        // Generating the world in vertical chunks to reduce time
        // TODO: Implement 3D Chunks
        for (var x = 0; x < this.worldGenerator.chunkWidth; x++) {
            for (var z = 0; z < this.worldGenerator.chunkWidth; z++) {
                var block = data[x][0][z];

                var posX = x + xOffset;
                var posZ = z + zOffset;
                var posY = 0;

                for (var y = 1; y < this.worldGenerator.chunkHeight; y++) {
                    if (data[x][y][z] == block) continue;

                    try {
                        if (block === "minecraft:air") break;
                        this.overworld.runCommand(`fill ${posX} ${posY} ${posZ} ${posX} ${y - 1} ${posZ} ${block} 0`)
                    }
                    catch {

                    }

                    posY = y;
                    block = data[x][y][z]
                }
            }
        }
    }
}

export class ChunkCoord {
    x: number;
    z: number;

    constructor(x: number, z: number) {
        this.x = x;
        this.z = z;
    }

    equals(coord: ChunkCoord): boolean {
        if (coord == null) return false;
        return coord.x === this.x && coord.z === this.z;
    }

    distance(coord: ChunkCoord) {
        return Math.sqrt(
            Math.pow(this.x - coord.x, 2) +
            Math.pow(this.z - coord.z, 2)
        )
    }
}