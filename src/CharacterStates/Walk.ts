/*
 	Slightly modified version of Walk.ts byswift502.
	https://github.com/swift502/Sketchbook/blob/master/src/ts/characters/character_states/Walk.ts
	Licensed under MIT License.
*/

import {
  CharacterStateBase,
  EndWalk,
  Idle,
  JumpWalking,
} from "./_stateLibrary";
import { Character } from "../Character";
import * as THREE from "three";

export class Walk extends CharacterStateBase {
  constructor(character: Character) {
    super(character);

    this.character.setVelocityTarget(new THREE.Vector3(0, 0, 0.8));
    this.playAnimation("run_fwd", 0.1);
  }

  public update(timeStep: number): void {
    super.update(timeStep);

    this.fallInAir();
  }

  public onInputChange(): void {
    super.onInputChange();

    if (this.noDirection()) {
      this.character.setState(new EndWalk(this.character));
    }

    if (this.character.actions.jump.justPressed) {
      this.character.setState(new JumpWalking(this.character));
    }

    if (this.noDirection()) {
      if (this.character.velocity.length() > 1) {
        this.character.setState(new EndWalk(this.character));
      } else {
        this.character.setState(new Idle(this.character));
      }
    }
  }
}
