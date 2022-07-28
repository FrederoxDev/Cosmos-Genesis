export class ChunkCoord {
	public readonly x: number;
	public readonly z: number;

	constructor(x: number, z: number) {
		this.x = x;
		this.z = z;
	}

	toString(): string {
		return `(${this.x}, ${this.z})`
	}
}
