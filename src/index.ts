import Game from "./Game";
import * as v2 from "./v2";
import { eachFrame } from "./Util";
let game: Game;
export let mouseAt: [number, number];
let mouseInside = true;
let c: HTMLCanvasElement;
let bg: HTMLCanvasElement;

function newGame() {
  game = new Game(c, bg);
}

window.onload = function() {
  c = document.getElementById("canvas-main") as HTMLCanvasElement;
  bg = document.getElementById("canvas-background") as HTMLCanvasElement;

  newGame();
  game.over = true;
  game.drawOverText();

  c.addEventListener(
    "mousemove",
    e => {
      mouseAt = [e.pageX - c.offsetLeft, e.pageY - c.offsetTop];
      if (game) {
        game.mouseAt = v2.scale(mouseAt, 1 / game.scale);
      }
    },
    false
  );

  c.addEventListener("mousedown", e => {
    if (game) game.toggleTime();
  });

  c.addEventListener("mouseleave", e => {
    mouseInside = false;
  });

  c.addEventListener("mouseenter", e => {
    mouseInside = true;
  });

  document.addEventListener("keydown", e => {
    if (e.code == "KeyS") {
      newGame();
    }
  });

  eachFrame(time => {
    if (game && mouseInside) game.update(time);    
  });
};
