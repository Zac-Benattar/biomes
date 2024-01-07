/*
 	Slightly modified version of Falling.ts byswift502.
	https://github.com/swift502/Sketchbook/blob/master/src/ts/characters/character_states/Falling.ts
	Licensed under MIT License.
*/

import { CharacterStateBase } from "./_stateLibrary";
import { Character } from "../Character";
import * as THREE from "three";

export class Falling extends CharacterStateBase {
  constructor(character: Character) {
    super(character);

    this.character.velocitySimulator.mass = 100;
    this.character.rotationSimulator.damping = 0.3;

    this.character.velocityIsAdditive = true;
    this.character.setVelocityInfluence(0.05, 0, 0.05);

    this.playAnimation("idle", 0.3);
  }

  public update(timeStep: number): void {
    super.update(timeStep);

    
    this.character.setVelocityTarget(
      this.anyDirection()
        ? new THREE.Vector3(0, 0, 0.8)
        : new THREE.Vector3(0, 0, 0)
    );

    if (this.character.rayHitTarget) {
      this.setAppropriateDropState();
    }
  }
}
