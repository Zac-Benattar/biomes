/*
	SimulationFrame.ts byswift502.
	https://github.com/swift502/Sketchbook/blob/master/src/ts/physics/spring_simulation/SimulationFrame.ts
	Licensed under MIT License.
*/

export class SimulationFrame {
	public position: number;
	public velocity: number;

	constructor(position: number, velocity: number)
	{
		this.position = position;
		this.velocity = velocity;
	}
}