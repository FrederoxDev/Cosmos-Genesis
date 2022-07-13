import { WorldGenerator } from "./WorldGenerator";
import { world, Location, BlockLocation } from "mojang-minecraft";

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
		this.commandsToExecute = this.GenerateCommands();
	}

	//#region Chunk Status 
	public RegenerateChunk() {
		this.hasFailed = false;
		this.commandsToExecute = [];

		this.GenerateChunk()
	}

	public HasFailed() {
		if (this.HasFinished()) return false;
		return this.hasFailed;
	}

	public HasFinished() {
		if (this.commandsToExecute.length > 0) return false;

		const location = this.worldGenerator.ChunkCoordToLocation(this.coord, 0);
		const blockLocation = new BlockLocation(location.x, location.y, location.z);
		let blockId = "";

		blockId = world.getDimension("overworld").getBlock(blockLocation).id;
		return blockId === "minecraft:bedrock";
	}
	//#endregion

	//#region Chunk Generation
	private GenerateChunkData() {
		console.warn("GenerateChunkData()")
		var xOffset = this.coord.x * this.worldGenerator.chunkWidth;
		var zOffset = this.coord.z * this.worldGenerator.chunkWidth;

		/* INITIALISE A 3D ARRAY */
		let data = this.Create3DArray(this.worldGenerator.chunkWidth, this.worldGenerator.chunkHeight, this.worldGenerator.chunkWidth, null);

		/* POPULATE DATA */
		for (var x = 0; x < this.worldGenerator.chunkWidth; x++) {
			for (var y = 0; y < this.worldGenerator.chunkHeight; y++) {
				for (var z = 0; z < this.worldGenerator.chunkWidth; z++) {
					data[x][y][z] = this.worldGenerator.GetBlock(x + xOffset, y, z + zOffset);
				}
			}
		}

		this.data = data;
	}

	private GenerateCommands() {
		console.warn("GenerateCommands()")

		/* Constants */
		const chunkWidth = this.worldGenerator.chunkWidth;
		const chunkHeight = this.worldGenerator.chunkHeight;
		var commands: string[] = []

		for (this.x = 0; this.x < chunkWidth; this.x++) {
			for (this.y = 0; this.y < chunkHeight; this.y++) {
				for (this.z = 0; this.z < chunkWidth; this.z++) {
					// Skip the block if its already included
					if (this.placed[this.x][this.y][this.z] === true) continue;
					this.blockID = this.data[this.x][this.y][this.z];
					if (this.blockID === "air") continue;

					var tryX = true;
					var tryY = true;
					var tryZ = false;

					while (tryY) {
						if (this.CanMoveY()) this.distY++;
						else tryY = false;
						
						if (this.distY + this.y + 1 >= this.worldGenerator.chunkHeight) tryY = false;
					}
 
					while (tryX) {
						if (this.CanMoveX()) this.distX++;
						else tryX = false;

						if (this.x + this.distX + 1 >= this.worldGenerator.chunkWidth) tryX = false;
					}

					while (tryZ) {
						if (this.CanMoveZ()) this.distZ++;
						else tryZ = false;

						if (this.distZ + this.z + 1 >= this.worldGenerator.chunkWidth) tryZ = false;
					}

					try {
						this.UpdatePlaced();
						commands.push(this.GenerateCommand());
					} catch (e) { console.warn(e) }

					this.distX = 0;
					this.distY = 0;
					this.distZ = 0;
				}
			}
		}

		console.warn(`Generated Chunk in ${commands.length} commands!`)
		return commands
	}

	private CanMoveX(): boolean {
		for (var y = this.y; y <= this.y + this.distY; y++) {
			for (var z = this.z; z <= this.z + this.distZ; z++) {
				try {
					if (this.x >= this.worldGenerator.chunkWidth) return false;
					if (this.placed[this.x + 1][y][z] === true) return false;
					if (this.data[this.x + 1][y][z] != this.blockID) return false;
				} catch (e) { 
					console.warn(e + " X") 
					console.warn(`${this.x + 1} ${y} ${z}`)
				}
			}
		}

		return true;
	}

	private CanMoveY(): boolean {
		for (var x = this.x; x <= this.x + this.distX; x++) {
			for (var z = this.z; z <= this.z + this.distZ; z++) {
				try {
					if (this.y >= this.worldGenerator.chunkHeight) return false;
					if (this.placed[x][this.y + 1][z] === true) return false;
					if (this.data[x][this.y + 1][z] != this.blockID) return false;
				} catch (e) { console.warn(e + " Y") }
			}
		}

		return true;
	}

	private CanMoveZ(): boolean {
		for (var y = this.y; y <= this.y + this.distY; y++) {
			for (var x = this.x; x <= this.x + this.distX; x++) {
				if (this.z >= this.worldGenerator.chunkWidth) return false;
				if (this.placed[x][y][this.z + 1] === true) return false;
				if (this.data[x][y][this.z + 1] != this.blockID) return false;
			}
		}

		return true;
	}

	private UpdatePlaced(): void {
		for (var x = this.x; x <= this.distX + this.x; x++) {
			for (var y = this.y; y <= this.distY + this.y; y++) {
				for (var z = this.z; z <= this.distZ + this.z; z++) {
					try {
						if (y >= this.worldGenerator.chunkHeight) continue;
						if (x >= this.worldGenerator.chunkWidth) continue;
						if (z >= this.worldGenerator.chunkWidth) continue;

						this.placed[x][y][z] = true;
					} catch (e) {
						console.warn(e + " Placed!")
						console.warn(`${x} ${y} ${z}`)
						return;
					}
				}
			}
		}
	}

	private GenerateCommand(): string {
		var xOffset = this.coord.x * this.worldGenerator.chunkWidth;
		var zOffset = this.coord.z * this.worldGenerator.chunkWidth;
		return `fill ${this.x + xOffset} ${this.y} ${this.z + zOffset} ${this.distX + this.x + xOffset} ${this.distY + this.y} ${this.distZ + this.z + zOffset} ${this.blockID} 0 replace`
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

			catch {
				this.hasFailed = true;
			}
		}
	}

	//#endregion

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

export class ChunkCoord {
	public readonly x: number;
	public readonly z: number;

	constructor(x: number, z: number) {
		this.x = x;
		this.z = z;
	}
}
