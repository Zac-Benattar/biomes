/*
	SimulationFrameVector.ts byswift502.
	https://github.com/swift502/Sketchbook/blob/master/src/ts/physics/spring_simulation/SimulationFrameVector.ts
	Licensed under MIT License.
*/

export class SimulationFrameVector {
	public position: THREE.Vector3;
	public velocity: THREE.Vector3;

	constructor(position: THREE.Vector3, velocity: THREE.Vector3)
	{
		this.position = position;
		this.velocity = velocity;
	}
}