import  GameController from "./GameController";
import WebGL from "three/addons/capabilities/WebGL.js";

let APP: GameController;

window.addEventListener("DOMContentLoaded", () => {
  if (!WebGL.isWebGLAvailable()) {
    const warning = WebGL.getWebGLErrorMessage();
    document.getElementById("container").appendChild(warning);
  } else {
    try {
      var canvas = document.createElement("canvas");
      if (
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      ) {
        APP = new GameController();
      }
    } catch (e) {
      console.log(e);
    }
  }
});
