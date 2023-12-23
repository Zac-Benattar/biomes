import World from "./World";

let APP: World;

window.addEventListener("DOMContentLoaded", () => {
  try {
    var canvas = document.createElement("canvas");
    if (
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    ) {
      APP = new World();
    }
  } catch (e) {
    console.log(e);
  }
});
