/*
 	Slightly modified version of IdleRotateRight.ts byswift502.
	https://github.com/swift502/Sketchbook/blob/master/src/ts/characters/character_states/IdleRotateRight.ts
	Licensed under MIT License.
*/

import { CharacterStateBase, Idle, JumpIdle, Walk } from "./_stateLibrary";
import { Character } from "../Character";
import * as THREE from "three";

export class IdleRotateRight extends CharacterStateBase {
  constructor(character: Character) {
    super(character);

    this.character.rotationSimulator.mass = 30;
    this.character.rotationSimulator.damping = 0.6;

    this.character.velocitySimulator.damping = 0.6;
    this.character.velocitySimulator.mass = 10;

    this.character.setVelocityTarget(new THREE.Vector3(0, 0, 0));
    this.playAnimation("idle", 0.1);
  }

  public update(timeStep: number): void {
    super.update(timeStep);

    if (this.animationEnded(timeStep)) {
      this.character.setState(new Idle(this.character));
    }

    this.fallInAir();
  }

  public onInputChange(): void {
    super.onInputChange();

    if (this.character.actions.jump.justPressed) {
      this.character.setState(new JumpIdle(this.character));
    }

    if (this.anyDirection()) {
      if (this.character.velocity.length() > 0.5) {
        this.character.setState(new Walk(this.character));
      } else {
        this.setAppropriateStartWalkState();
      }
    }
  }
}
