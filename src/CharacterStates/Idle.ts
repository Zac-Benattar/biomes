import { CharacterStateBase, JumpIdle, Walk } from "./_stateLibrary";
import { Character } from "../Character";
import * as THREE from "three";

export class Idle extends CharacterStateBase {
  constructor(character: Character) {
    super(character);

    this.character.velocitySimulator.damping = 0.6;
    this.character.velocitySimulator.mass = 10;

    this.character.setVelocityTarget(new THREE.Vector3(0, 0, 0));
    this.playAnimation("Idle", 0.1);
  }

  public update(timeStep: number): void {
    super.update(timeStep);

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
