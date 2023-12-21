import { CharacterStateBase, EndWalk, Walk } from "./_stateLibrary";
import { Character } from "../Character";
import * as THREE from "three";

export class DropRolling extends CharacterStateBase {
  constructor(character: Character) {
    super(character);

    this.character.velocitySimulator.mass = 1;
    this.character.velocitySimulator.damping = 0.6;

    this.character.setVelocityTarget(new THREE.Vector3(1, 0, 0));
    this.playAnimation("drop_running_roll", 0.03);
  }

  public update(timeStep: number): void {
    super.update(timeStep);

    

    if (this.animationEnded(timeStep)) {
      if (this.anyDirection()) {
        this.character.setState(new Walk(this.character));
      } else {
        this.character.setState(new EndWalk(this.character));
      }
    }
  }
}
