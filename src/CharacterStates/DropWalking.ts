import {
  CharacterStateBase,
  EndWalk,
  JumpWalking,
  Walk,
} from "./_stateLibrary";
import { Character } from "../Character";
import * as THREE from "three";

export class DropWalking extends CharacterStateBase {
  constructor(character: Character) {
    super(character);

    this.character.setVelocityTarget(new THREE.Vector3(1, 0, 0));
    // this.playAnimation("drop_walking", 0.1);
    this.playAnimation("Walk", 0.1);
  }

  public update(timeStep: number): void {
    super.update(timeStep);

    

    if (this.animationEnded(timeStep)) {
      this.character.setState(new Walk(this.character));
    }
  }

  public onInputChange(): void {
    super.onInputChange();

    if (this.noDirection()) {
      this.character.setState(new EndWalk(this.character));
    }

    if (this.character.actions.jump.justPressed) {
      this.character.setState(new JumpWalking(this.character));
    }
  }
}
