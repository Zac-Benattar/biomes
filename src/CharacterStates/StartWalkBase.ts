import * as Utils from '../Utils';
import {
  CharacterStateBase,
  Idle,
  IdleRotateLeft,
  IdleRotateRight,
  JumpWalking,
  Walk,
} from "./_stateLibrary";
import { Character } from "../Character";
import * as THREE from "three";

export class StartWalkBase extends CharacterStateBase {
  constructor(character: Character) {
    super(character);

    this.canEnterVehicles = true;
    this.character.rotationSimulator.mass = 20;
    this.character.rotationSimulator.damping = 0.7;

    this.character.setVelocityTarget(new THREE.Vector3(1, 0, 0));
    // this.character.velocitySimulator.damping = 0.5;
    // this.character.velocitySimulator.mass = 1;
  }

  public update(timeStep: number): void {
    super.update(timeStep);

    if (this.animationEnded(timeStep)) {
      this.character.setState(new Walk(this.character));
    }

    this.fallInAir();
  }

  public onInputChange(): void {
    super.onInputChange();

    if (this.character.actions.jump.justPressed) {
      this.character.setState(new JumpWalking(this.character));
    }

    if (this.noDirection()) {
      if (this.timer < 0.1) {
        let angle = Utils.getSignedAngleBetweenVectors(
          this.character.orientation,
          this.character.orientationTarget
        );

        if (angle > Math.PI * 0.4) {
          this.character.setState(new IdleRotateLeft(this.character));
        } else if (angle < -Math.PI * 0.4) {
          this.character.setState(new IdleRotateRight(this.character));
        } else {
          this.character.setState(new Idle(this.character));
        }
      } else {
        this.character.setState(new Idle(this.character));
      }
    }
  }
}
