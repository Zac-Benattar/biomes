import {
  CharacterStateBase,
  Idle,
  JumpIdle,
  StartWalkForward,
} from "./_stateLibrary";
import { Character } from "../Character";
import * as THREE from "three";

export class DropIdle extends CharacterStateBase {
  constructor(character: Character) {
    super(character);

    this.character.velocitySimulator.damping = 0.5;
    this.character.velocitySimulator.mass = 7;

    this.character.setVelocityTarget(new THREE.Vector3(0, 0, 0));
    this.playAnimation("idle", 0.1);

    if (this.anyDirection()) {
      this.character.setState(new StartWalkForward(character));
    }
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
      this.character.setState(new StartWalkForward(this.character));
    }
  }
}
