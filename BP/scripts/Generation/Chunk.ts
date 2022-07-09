import { WorldGenerator } from "./WorldGenerator";
import { world, Location, BlockLocation } from "mojang-minecraft";

export class Chunk {
	public readonly worldGenerator: WorldGenerator;
	public readonly coord: ChunkCoord;
	public hasFailed: boolean;

	private commandsToExecute: string[];

	constructor(worldGenerator: WorldGenerator, coord: ChunkCoord) {
		this.worldGenerator = worldGenerator;
		this.coord = coord;
		this.hasFailed = false;
		this.commandsToExecute = [];

		this.GenerateChunk();
	}

	public GenerateChunk() {
		this.hasFailed = false;
		const data = this.GenerateChunkData();
		this.commandsToExecute = this.GenerateCommands(data);

		console.warn(this.commandsToExecute.length + " Commands!");
	}

	public HasFailed() {
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

	private GenerateChunkData(): string[][][] {
		var xOffset = this.coord.x * this.worldGenerator.chunkWidth;
		var zOffset = this.coord.z * this.worldGenerator.chunkWidth;

		/* INITIALISE A 3D ARRAY */
		let data = this.Create3DArray(
			this.worldGenerator.chunkWidth,
			this.worldGenerator.chunkHeight,
			this.worldGenerator.chunkWidth
		);


		/* POPULATE DATA */
		for (var x = 0; x < this.worldGenerator.chunkWidth; x++) {
			for (var y = 0; y < this.worldGenerator.chunkHeight; y++) {
				for (var z = 0; z < this.worldGenerator.chunkWidth; z++) {
					data[x][y][z] = this.worldGenerator.GetBlock(
						x + xOffset,
						y,
						z + zOffset
					);
				}
			}
		}


		return data;
	}

	public GenTick() {
		const cmdsToRun = 256;
		const overworld = world.getDimension("overworld");

		for (var i = 0; i < Math.min(cmdsToRun, this.commandsToExecute.length); i++) {
			var command = this.commandsToExecute.shift();
			if (command == undefined) continue;

			try {
				overworld.runCommand(command);
			}

			catch {
				this.hasFailed = true;
			}
		}
	}

	private GenerateCommands(data: string[][][]): string[] {
		var placed = this.Create3DArray(
			this.worldGenerator.chunkWidth + 1,
			this.worldGenerator.chunkHeight + 1,
			this.worldGenerator.chunkWidth + 1,
			false
		);
		var commands: string[] = [];

		var xOffset = this.coord.x * this.worldGenerator.chunkWidth;
		var zOffset = this.coord.z * this.worldGenerator.chunkWidth;


			for (var localX = 0; localX < this.worldGenerator.chunkWidth; localX++) {
				for (var localY = 1; localY < this.worldGenerator.chunkHeight; localY++) {
					for (
						var localZ = 0;
						localZ < this.worldGenerator.chunkWidth;
						localZ++
					) {
						if (placed[localX][localY][localZ] === true) continue;

						var blockID = data[localX][localY][localZ];
						if (blockID === "air") continue;

						// Try and expand the region as large as possible
						var tryMoveX = false;
						var tryMoveY = true;
						var tryMoveZ = false;
 
						var distX = 0;
						var distY = 0;
						var distZ = 0;

						while (tryMoveX || tryMoveY || tryMoveZ) {
							if (tryMoveY) {
								tryMoveY = this.CanMoveY(localX, localX + distX, localY + distY + 1, localZ, localZ + distZ, data, placed, blockID);

								if (tryMoveY) distY++;

								if (localY + distY >= this.worldGenerator.chunkHeight)
									tryMoveY = false;
							}

							if (tryMoveX) {
								
								tryMoveX = this.CanMoveX(localX + distX + 1, localY, localY + distY, localZ, localZ + distZ, data, placed, blockID);
								if (tryMoveX) distX++;

								if (localX + distX >= this.worldGenerator.chunkWidth)
									tryMoveX = false;
							}

							if (tryMoveZ) {
								tryMoveZ = this.CanMoveZ(localX, localX + distX, localY, localY + distY, localZ + distZ + 1, data, placed, blockID);

								if (tryMoveZ) distZ++;

								if (localZ + distX >= this.worldGenerator.chunkWidth)
									tryMoveZ = false;
							}
						}

						var posX1 = xOffset + localX;
						var posX2 = xOffset + localX + distX + 1;

						var posY1 = localY;
						var posY2 = localY + distY;

						var posZ1 = zOffset + localZ;
						var posZ2 = zOffset + localZ + distZ + 1;

						commands.push(
							`fill ${posX1} ${posY1} ${posZ1} ${posX2} ${posY2} ${posZ2} ${blockID} 0`
						);

						for (var placedY = localY; placedY <= localY + distY; placedY++) {
							for (var placedX = localX; placedX <= localX + distX; placedX++) {
								for (var placedZ = localZ; placedZ <= localZ + distZ; placedZ++) {
									placed[placedX][placedY][placedZ] = true;
								}
							}
						}
					}
				}
			}

		commands.push(`fill ${xOffset} 0 ${zOffset} ${xOffset + 16} 0 ${zOffset + 16} bedrock 0`)

		return commands;
	}

	private CanMoveX(x, y1, y2, z1, z2, data, placed, blockID): boolean {
		for (var localY = y1; localY <= y2; localY++) {
			for (var localZ = z1; localZ <= z2; localZ++) {
				if (data[x][localY][localZ] != blockID) return false;
				if (placed[x][localY][localZ] === true) return false;
			}
		}

		return true;
	}

	private CanMoveY(x1, x2, y, z1, z2, data, placed, blockID): boolean {
			for (var localX = x1; localX <= x2; localX++) {
				for (var localZ = z1; localZ <= z2; localZ++) {
					if (data[localX][y][localZ] != blockID) return false;
					if (placed[localX][y][localZ] === true) return false;
				}
			}

		return true;
	}

	private CanMoveZ(x1, x2, y1, y2, z, data, placed, blockID): boolean {
			for (var localX = x1; localX < x2; localX++) {
				for (var localY = y1; localY < y2; localY++) {
					if (data[localX][localY][z] != blockID) return false;
					if (placed[localX][localY][z] === true) return false;
				}
			}


		return true;
	}

	private Create3DArray(
		xSize: number,
		ySize: number,
		zSize: number,
		defaultVal: any = null
	) {
		let data = new Array(xSize);

		for (var i = 0; i < data.length; i++) {
			data[i] = new Array(ySize);

			for (var j = 0; j < data[i].length; j++) {
				data[i][j] = new Array(zSize);

				for (var k = 0; k < data[i][j].length; k++) {
					data[i][j][k] = defaultVal;
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
