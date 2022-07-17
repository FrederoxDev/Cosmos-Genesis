import { WorldGenerator } from "./WorldGenerator";
import { world, Location, BlockLocation, BlockType, BlockPermutation, MinecraftBlockTypes } from "mojang-minecraft";
import { ChunkCoord } from "./ChunkCoord";

export class Chunk {
	public readonly worldGenerator: WorldGenerator;
	public readonly coord: ChunkCoord;
	public hasFailed: boolean;

	private data: string[][][];
	private placed: boolean[][][];
	private commandsToExecute: string[];
	private blockID: string;

	private x;
	private y;
	private z;

	private distX: number
	private distY: number
	private distZ: number

	constructor(worldGenerator: WorldGenerator, coord: ChunkCoord) {
		this.worldGenerator = worldGenerator;
		this.coord = coord;
		this.hasFailed = false;
		this.commandsToExecute = [];

		this.placed = this.Create3DArray(worldGenerator.chunkWidth, worldGenerator.chunkHeight, worldGenerator.chunkWidth, false)

		this.distX = 0;
		this.distY = 0;
		this.distZ = 0;

		this.x = 0;
		this.y = 0;
		this.z = 0;

		this.blockID = ""

		this.GenerateChunk()
	}

	public GenerateChunk() {
		this.GenerateChunkData();
		this.GenerateCommands();
	}

	public HasFinished() {
		if (this.commandsToExecute.length > 0) return false;

		const x = this.worldGenerator.chunkWidth * this.coord.x;
		const z = this.worldGenerator.chunkWidth * this.coord.z;

		if (world.getDimension("overworld").getBlock(new BlockLocation(x, 0, z)).id === "minecraft:bedrock")
			return true;

		else return false;
	}

	private GenerateChunkData() {
		var xOffset = this.coord.x * this.worldGenerator.chunkWidth;
		var zOffset = this.coord.z * this.worldGenerator.chunkWidth;

		/* INITIALISE A 3D ARRAY */
		this.data = this.Create3DArray(this.worldGenerator.chunkWidth, this.worldGenerator.chunkHeight, this.worldGenerator.chunkWidth, null);

		/* POPULATE DATA */
		for (var x = 0; x < this.worldGenerator.chunkWidth; x++) {
			for (var y = 0; y < this.worldGenerator.chunkHeight; y++) {
				for (var z = 0; z < this.worldGenerator.chunkWidth; z++) {
					this.data[x][y][z] = this.worldGenerator.GetBlock(x + xOffset, y, z + zOffset);
				}
			}
		}
	}

	private GenerateCommands(): void {
		const chunkWidth = this.worldGenerator.chunkWidth;
		const chunkHeight = this.worldGenerator.chunkHeight;

		for (var x = 0; x < chunkWidth; x++) {
			for (var y = 1; y < chunkHeight; y++) {
				for (var z = 0; z < chunkWidth; z++) {
					this.x = x;
					this.y = y;
					this.z = z;

					// The block is already included in a command
					// So skip the block so it is not placed twice
					if (this.placed[this.x][this.y][this.z] === true) continue;
					this.blockID = this.data[this.x][this.y][this.z];

					// Do not fill air
					if (this.blockID === "air") {
						this.placed[this.x][this.y][this.z] = true;
						continue
					}

					// Move in the order X, Z, Y 
					while (this.CanMoveX()) this.distX++;
					while (this.CanMoveZ()) this.distZ++;
					while (this.CanMoveY()) this.distY++;

					this.commandsToExecute.push(this.GenerateCommand());
					this.UpdatePlaced();

					this.distX = 0;
					this.distY = 0;
					this.distZ = 0;
				}
			}
		}

		const xOffset = this.worldGenerator.chunkWidth * this.coord.x;
		const zOffset = this.worldGenerator.chunkWidth * this.coord.z;

		this.commandsToExecute.push(`fill ${xOffset} 0 ${zOffset} ${xOffset + 15} 0 ${zOffset + 15} bedrock 0 replace`)

		console.warn(this.commandsToExecute.length + " Commands!")
	}

	private UpdatePlaced(): void {
		for (var x = this.x; x <= this.x + this.distX; x++) {
			for (var y = this.y; y <= this.y + this.distY; y++) {
				for (var z = this.z; z <= this.z + this.distZ; z++) {
					this.placed[x][y][z] = true;
				}
			}
		}
	}

	private GenerateCommand(): string {
		var xOffset = this.coord.x * this.worldGenerator.chunkWidth;
		var zOffset = this.coord.z * this.worldGenerator.chunkWidth;

		return `fill ${this.x + xOffset} ${this.y} ${this.z + zOffset} ${this.x + this.distX + xOffset} ${this.y + this.distY} ${this.z + this.distZ + zOffset} ${this.blockID} 0 replace`
	}

	public CanMoveX(): boolean {
		if (this.x + this.distX + 1 >= this.worldGenerator.chunkWidth) return false;

		for (var y = this.y; y <= this.y + this.distY; y++) {
			for (var z = this.z; z <= this.z + this.distZ; z++) {
				if (this.placed[this.x + this.distX + 1][y][z] === true) return false;
				if (this.data[this.x + this.distX + 1][y][z] != this.blockID) return false;
			}
		}

		return true;
	}

	public CanMoveY(): boolean {
		if (this.y + this.distY + 1 >= this.worldGenerator.chunkHeight) return false;

		for (var x = this.x; x <= this.x + this.distX; x++) {
			for (var z = this.z; z <= this.z + this.distZ; z++) {
				if (this.placed[x][this.y + this.distY + 1][z] === true) return false;
				if (this.data[x][this.y + this.distY + 1][z] != this.blockID) return false;
			}
		}

		return true;
	}

	public CanMoveZ(): boolean {
		if (this.z + this.distZ + 1 >= this.worldGenerator.chunkWidth) return false;

		for (var x = this.x; x <= this.x + this.distX; x++) {
			for (var y = this.y; y <= this.y + this.distY; y++) {
				if (this.placed[x][y][this.z + this.distZ + 1] === true) return false;
				if (this.data[x][y][this.z + this.distZ + 1] != this.blockID) return false;
			}
		}

		return true;
	}

	public GenTick() {
		const cmdsToRun = 256;
		const overworld = world.getDimension("overworld");

		var amount = Math.min(this.commandsToExecute.length, cmdsToRun);

		for (var i = 0; i < amount; i++) {
			const command = this.commandsToExecute.shift();
			if (command == undefined) continue;

			try {
				overworld.runCommand(command);
			}

			catch (e) {
				this.commandsToExecute.push(command)
				console.warn(command)
			}
		}
	}

	public Create3DArray(xSize, ySize, zSize, defaultValue: any): any[][][] {
		let data = new Array(xSize);

		for (var i = 0; i < data.length; i++) {
			data[i] = new Array(ySize);

			for (var j = 0; j < data[i].length; j++) {
				data[i][j] = new Array(zSize);

				for (var k = 0; k < data[i][j].length; k++) {
					data[i][j][k] = defaultValue;
				}
			}
		}

		return data;
	}
}