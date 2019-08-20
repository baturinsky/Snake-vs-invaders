import Game from "./Game";

let game:Game;

window.onload = function() {
  game = new Game()  
  game.init();
};
