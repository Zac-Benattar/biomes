import { CharacterStateBase, Falling } from "./_stateLibrary";
import { Character } from "../Character";
import * as THREE from "three";

export class JumpIdle extends CharacterStateBase {
  private alreadyJumped: boolean;

  constructor(character: Character) {
    super(character);

    this.character.velocitySimulator.mass = 50;

    this.character.setVelocityTarget(new THREE.Vector3(0, 0, 0));
    // this.playAnimation("jump_idle", 0.1);
    this.playAnimation("Idle", 0.1);
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
    if (this.timer > 0.2 && !this.alreadyJumped) {
      this.character.jump();
      this.alreadyJumped = true;

      this.character.velocitySimulator.mass = 100;
      this.character.rotationSimulator.damping = 0.3;

      if (this.character.rayResult.body.velocity.length() > 0) {
        this.character.setVelocityInfluence(0, 0, 0);
      } else {
        this.character.setVelocityInfluence(0.3, 0, 0.3);
      }
    } else if (this.timer > 0.3 && this.character.rayHitTarget) {
      this.setAppropriateDropState();
    } else if (this.animationEnded(timeStep)) {
      this.character.setState(new Falling(this.character));
    }
  }
}
