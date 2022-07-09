import { WorldGenerator } from "./WorldGenerator";
import { world, Location, BlockLocation } from "mojang-minecraft"

export class Chunk {
    public readonly worldGenerator: WorldGenerator;
    public readonly coord: ChunkCoord;
    public hasFailed: boolean;

    constructor(worldGenerator: WorldGenerator, coord: ChunkCoord) {
        this.worldGenerator = worldGenerator;
        this.coord = coord;
        this.hasFailed = false;

        this.GenerateChunk(); 
    }

    public GenerateChunk() {
        this.hasFailed = false;
        const x = this.coord.x * 16;
        const maxX = x + this.worldGenerator.chunkWidth;

        const maxY = this.worldGenerator.chunkHeight;

        const z = this.coord.z * 16;
        const maxZ = z + this.worldGenerator.chunkWidth;

        try {
            world.getDimension("Overworld").runCommand(`fill ${x} 1 ${z} ${maxX} ${maxY} ${maxZ} stone 0 replace`)
            world.getDimension("Overworld").runCommand(`fill ${x} 0 ${z} ${maxX} 0 ${maxZ} bedrock 0 replace`)
        }

        catch {
            this.hasFailed = true;
        }
    }

    public HasFailed() {    
        return this.hasFailed;
    }

    public HasFinished() {
        const location = this.worldGenerator.ChunkCoordToLocation(this.coord, 0)
        const blockLocation = new BlockLocation(location.x, location.y, location.z)
        let blockId = "";
        
        try {
            blockId = world.getDimension("overworld").getBlock(blockLocation).id;
            return blockId === "minecraft:bedrock"
        }

        catch (e) {
            console.warn(e)
        }
    }
}

export class ChunkCoord {
    public readonly x: number;
    public readonly z: number;

    constructor(x: number, z: number) {
        this.x = x;
        this.z = z;
    }
}