import Game from "./Game";

let APP: Game;

window.addEventListener("DOMContentLoaded", () => {
  try {
    var canvas = document.createElement("canvas");
    if (
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    ) {
      APP = new Game();
    }
  } catch (e) {
    console.log(e);
  }
});
