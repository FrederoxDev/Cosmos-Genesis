import { BlockLocation, BlockType, Dimension, Player, world } from "mojang-minecraft";
import { Planet } from "./Planet";
import { PlayerData, WorldGenerator } from "./WorldGenerator"

export class Chunk {
    readonly chunkCoord: ChunkCoord;
    readonly worldGenerator: WorldGenerator;
    readonly planet: Planet;
    overworld: Dimension;

    constructor(worldGenerator: WorldGenerator, chunkCoord: ChunkCoord, planet: Planet) {
        this.worldGenerator = worldGenerator;
        this.chunkCoord = chunkCoord;
        this.planet = planet;
        this.overworld = world.getDimension("overworld");
    }

    /**
     * Returns a 3D Array, containing the ID of blocks
     */
    private GenerateChunkData(): string[][][] {
        var xOffset = this.chunkCoord.x * this.worldGenerator.chunkWidth;
        var zOffset = this.chunkCoord.z * this.worldGenerator.chunkWidth

        /* INITIALISE A 3D ARRAY */
        let data = this.Create3DArray(this.worldGenerator.chunkWidth, this.worldGenerator.chunkHeight, this.worldGenerator.chunkWidth);

        /* POPULATE DATA */
        for (var x = 0; x < this.worldGenerator.chunkWidth; x++) {
            for (var y = 0; y < this.worldGenerator.chunkHeight; y++) {
                for (var z = 0; z < this.worldGenerator.chunkWidth; z++) {
                    data[x][y][z] = this.worldGenerator.GetBlock(x + xOffset, y, z + zOffset, this.planet);
                }
            }
        }

        return data;
    }

    /**
     * Returns a generic 3D array
     */
    private Create3DArray(xSize: number, ySize: number, zSize: number, defaultVal: any = null) {
        let data = new Array(xSize);

        for (var i = 0; i < data.length; i++) {
            data[i] = new Array(ySize)

            for (var j = 0; j < data[i].length; j++) {
                data[i][j] = new Array(zSize)

                for (var k = 0; k < data[i][j].length; k++) {
                    data[i][j][k] = defaultVal
                }
            }
        }

        return data;
    }

    /**
     * Builds the chunk in the world
     * @todo Implement a quicker fill algorithm
     */
    public async GenerateChunk() {
        var data = this.GenerateChunkData();
        var placed = this.Create3DArray(this.worldGenerator.chunkWidth + 1, this.worldGenerator.chunkHeight + 1, this.worldGenerator.chunkWidth + 1, false);

        var xOffset = this.chunkCoord.x * this.worldGenerator.chunkWidth;
        var zOffset = this.chunkCoord.z * this.worldGenerator.chunkWidth;

        var overworld = world.getDimension("overworld");
        var commands = [];
        var maxCmdsAtOnce = 24;

        for (var localX = 0; localX < this.worldGenerator.chunkWidth; localX++) {
            for (var localY = 0; localY < this.worldGenerator.chunkHeight; localY++) {
                for (var localZ = 0; localZ < this.worldGenerator.chunkWidth; localZ++) {
                    // Return from this loop because the block is already covered by another command
                    if (placed[localX][localY][localZ] == true) continue;
                    var blockId = data[localX][localY][localZ];

                    if (blockId === "minecraft:air") continue;

                    var tryMoveX = true;
                    var tryMoveY = true;
                    var tryMoveZ = true;

                    var distX = 0;
                    var distY = 0;
                    var distZ = 0;

                    while (tryMoveX || tryMoveY || tryMoveZ) {
                        if (tryMoveY) {
                            var shouldMove = this.AreBlocksAllSame(data, placed, blockId, localX, localX + distX, localY, localY + distY + 1, localZ, localZ + distZ)

                            if (shouldMove) {
                                distY++;
                            }
                            else {
                                tryMoveY = false;
                            }

                            if (localY + distY >= this.worldGenerator.chunkHeight) tryMoveY = false;
                        }

                        if (tryMoveX) {
                            var shouldMove = this.AreBlocksAllSame(data, placed, blockId, localX, localX + distX + 1, localY, localY + distY, localZ, localZ + distZ)

                            if (shouldMove) {
                                distX++;
                            }
                            else {
                                tryMoveX = false;
                            }

                            if (localX + distX >= this.worldGenerator.chunkWidth) tryMoveX = false;
                        }

                        if (tryMoveZ) {
                            var shouldMove = this.AreBlocksAllSame(data, placed, blockId, localX, localX + distX, localY, localY + distY, localZ, localZ + distZ + 1)

                            if (shouldMove) {
                                distZ++;
                            }
                            else {
                                tryMoveZ = false;
                            }

                            if (localZ + distZ >= this.worldGenerator.chunkWidth) tryMoveZ = false;
                        }
                    }

                    var posX1 = xOffset + localX + 1;
                    var posX2 = xOffset + localX + distX;

                    var posY1 = localY + 1;
                    var posY2 = localY + distY;

                    var posZ1 = zOffset + localZ + 1;
                    var posZ2 = zOffset + localZ + distZ;

                    commands.push(`fill ${posX1} ${posY1} ${posZ1} ${posX2} ${posY2} ${posZ2} ${blockId} 0`)

                    for (var placedX = localX; placedX < localX + distX; placedX++) {
                        for (var placedY = localY; placedY < localY + distY; placedY++) {
                            for (var placedZ = localZ; placedZ < localZ + distZ; placedZ++) {
                                placed[placedX][placedY][placedZ] = true;
                            }
                        }
                    }
                }
            }
        }

        console.warn(`Executing ${commands.length} commands`)

        while (commands.length > 0) {
            var promises = [];

            for (var i = 0; i < Math.min(commands.length, maxCmdsAtOnce); i++) {
                promises.push(overworld.runCommandAsync(commands.shift()))
            }

            await Promise.allSettled(promises)
        }
    }

    private AreBlocksAllSame(data: String[][][], placed, block: String, x1, x2, y1, y2, z1, z2) {
        for (var x = x1; x < x2; x++) {
            for (var y = y1; y < y2; y++) {
                for (var z = z1; z < z2; z++) {
                    if (placed[x][y][z] == true) return false;
                    if (data[x][y][z] != block) return false;
                }
            }
        }

        return true;
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