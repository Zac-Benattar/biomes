/*
 	Slightly modified version of JumpWalkingts byswift502.
	https://github.com/swift502/Sketchbook/blob/master/src/ts/characters/character_states/JumpWalking.ts
	Licensed under MIT License.
*/

import { CharacterStateBase, Falling } from "./_stateLibrary";
import { Character } from "../Character";
import * as THREE from "three";

export class JumpWalking extends CharacterStateBase {
  private alreadyJumped: boolean;

  constructor(character: Character) {
    super(character);

    this.character.velocitySimulator.mass = 100;
    this.playAnimation("run_fwd", 0.03);
    this.alreadyJumped = false;
  }

  public update(timeStep: number): void {
    super.update(timeStep);

    // Move in air
    if (this.alreadyJumped) {
      this.character.setVelocityTarget(
        this.anyDirection()
          ? new THREE.Vector3(0, 0, 0.8)
          : new THREE.Vector3(0, 0, 0)
      );
    }
    
    // Physically jump
    if (this.timer > 0.13 && !this.alreadyJumped) {
      this.character.jump(4);
      this.alreadyJumped = true;

      this.character.rotationSimulator.damping = 0.3;
      this.character.velocityIsAdditive = true;
      this.character.setVelocityInfluence(0.05, 0, 0.05);
    } else if (this.timer > 0.24 && this.character.rayHitTarget) {
      this.setAppropriateDropState();
    } else if (this.animationEnded(timeStep)) {
      this.character.setState(new Falling(this.character));
    }
  }
}
