import { StartWalkBase } from "./_stateLibrary";
import { Character } from "../Character";

export class StartWalkRight extends StartWalkBase {
  constructor(character: Character) {
    super(character);
    this.animationLength = character.setAnimation("run_fwd", 0.1);
  }
}
