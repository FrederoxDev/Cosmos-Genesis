import { world, Player, BlockLocation, BlockType } from "mojang-minecraft"
import { perlin2D } from "./noise"

const chunkHeight = 60;
const chunkWidth = 8;

let host: Player = null;
let prevChunkX;
let prevChunkZ;

const generateDistance = 10;
const chunksPerTick = 4;

var generatedChunks = [];
var chunksToGenerate = [];

var overworld = world.getDimension("overworld")

world.events.playerJoin.subscribe((playerJoinEvent) => {
    if (host == null) host = playerJoinEvent.player;
})

world.events.tick.subscribe(() => {
    if (host == null) return;

    let chunkX = Math.floor(host.location.x / chunkWidth);
    let chunkZ = Math.floor(host.location.z / chunkWidth);

    for (var i = 0; i < chunksPerTick; i++) {
        if (chunksToGenerate.length > 0) {
            chunksToGenerate.sort((a: Coord, b: Coord) => {
                return a.distance(new Coord(chunkX, chunkZ)) - b.distance(new Coord(chunkX, chunkZ))
            })

            while (chunksToGenerate.length > (generateDistance * generateDistance)) {
                chunksToGenerate.pop();
            }

            var coord: Coord = chunksToGenerate.shift();

            if (coord.distance(new Coord(chunkX, chunkZ)) < generateDistance)
                GenerateChunk(coord.x, coord.z);
        }
    }

    if (chunkX == prevChunkX && chunkZ == prevChunkZ) return;

    prevChunkX = chunkX;
    prevChunkZ = chunkZ;

    for (var x = chunkX - generateDistance; x <= chunkX + generateDistance; x++) {
        for (var z = chunkZ - generateDistance; z <= chunkZ + generateDistance; z++) {
            // We need to check if blocks already exist at the position
            // If blocks exist add it to the generated chunks list so it is not re-generated
            var testLocation = new BlockLocation(x * chunkWidth, 0, z * chunkWidth);
            var chunkIsInGeneratedList = generatedChunks.some(chunk => chunk.x === x && chunk.z === z)
            var chunkDetected = overworld.getBlock(testLocation).id === "minecraft:stone"

            if (!chunkDetected && chunkIsInGeneratedList) {
                var index = generatedChunks.findIndex(chunk => chunk.x === x && chunk.z === z)
                generatedChunks.splice(index)
            }

            if (!chunkIsInGeneratedList && chunkDetected) {
                generatedChunks.push(new Coord(x, z))
            }

            else if (!chunkIsInGeneratedList) chunksToGenerate.push(new Coord(x, z))
        }
    }
})

function GenerateChunk(chunkX: number, chunkZ: number) {
    var data = GenerateChunkData(chunkX, chunkZ);

    var xOffset = chunkX * chunkWidth;
    var zOffset = chunkZ * chunkWidth;

    // VERTICAL Chunks
    for (var x = 0; x < chunkWidth; x++) {
        for (var z = 0; z < chunkWidth; z++) {
            var block = data[x][0][z];

            var posX = x + xOffset;
            var posZ = z + zOffset;
            var posY = 0;

            for (var y = 1; y < chunkHeight; y++) {
                if (data[x][y][z] == block) continue;

                try {
                    if (block === "minecraft:air") break;
                    overworld.runCommand(`fill ${posX} ${posY} ${posZ} ${posX} ${y - 1} ${posZ} ${block} 0`)
                } catch { }

                posY = y;
                block = data[x][y][z]
            }
        }
    }

    generatedChunks.push(new Coord(chunkX, chunkZ));
}

function GenerateChunkData(chunkX: number, chunkZ: number) {
    var xOffset = chunkX * chunkWidth;
    var zOffset = chunkZ * chunkWidth

    /* INITIALISE A 3D ARRAY */
    let data = new Array(chunkWidth);
    for (var i = 0; i < data.length; i++) {
        data[i] = new Array(chunkHeight)

        for (var j = 0; j < data[i].length; j++) {
            data[i][j] = new Array(chunkWidth)
        }
    }

    /* POPULATE DATA */
    for (var x = 0; x < chunkWidth; x++) {
        for (var y = 0; y < chunkHeight; y++) {
            for (var z = 0; z < chunkWidth; z++) {
                data[x][y][z] = GetVoxel(x + xOffset, y, z + zOffset);
            }
        }
    }

    return data;
}

function GetVoxel(x: number, y: number, z: number) {
    x = Math.floor(x);
    z = Math.floor(z);

    const groundHeight = 20;
    const waterLevel = 25;

    var temperature = Get2DPerlin(x, z, 34214, 0.12)
    var rainfall = Get2DPerlin(x, z, 432, 0.12)

    var continentalness = Get2DPerlin(x, z, 0, 0.25)
    var continentalness2 = Get2DPerlin(x, z, 0, 0.5) / 2
    var terrainHeight = groundHeight + Math.floor(groundHeight + (chunkHeight - groundHeight) * ((continentalness + continentalness2) / 2))

    let blockID = "minecraft:air"


    if (y < terrainHeight) blockID = "tg:regolith"
    if (y == terrainHeight) {
        if (rainfall < 0 && temperature > 0) blockID = "tg:lava_stone" // Desert
        else if (rainfall < 0 && temperature < 0) blockID = "tg:regolith" // Tundra
        else blockID = "tg:regolith"
    }

    return blockID
}

function Get2DPerlin(x: number, z: number, offset: number, scale: number) {
    return perlin2D(
        (x + 0.1) / 16 * scale + offset,
        (z + 0.1) / 16 * scale + offset
    )
}

class Coord {
    x: number;
    z: number;

    constructor(x: number, z: number) {
        this.x = x;
        this.z = z;
    }

    equals(coord: Coord) {
        return coord.x === this.x && coord.z === this.z;
    }

    distance(coord: Coord) {
        return Math.sqrt(
            Math.pow(this.x - coord.x, 2) +
            Math.pow(this.z - coord.z, 2)
        )
    }
}