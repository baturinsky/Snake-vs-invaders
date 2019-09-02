import Game from "./Game";
import * as v2 from "./v2";
import { eachFrame } from "./Util";
let game: Game;
export let mouseAt: [number, number];
let mouseInside = true;
let c: HTMLCanvasElement;
let bg: HTMLCanvasElement;
let ui: HTMLElement;

let scores: number[] = JSON.parse(
  localStorage["snakeScore"] || "[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]"
);
function totalScore() {
  return scores.reduce((a, b) => a + b);
}
function lastUnlock() {
  let score = totalScore()
  return score<6000?-1:Math.sqrt(totalScore() / 2000 - 2);
}

function updateUI(g: Game) {
  game = g;
  if (!game) {
    c.getContext("2d").clearRect(0, 0, 1200, 800);
  }
  let text = overText(game);
  ui.innerHTML = text;
  ui.parentElement.style.display = text.length > 0 ? "flex" : "none";
}

function newGame(i: number) {
  new Game(c, bg, i, updateUI, lastUnlock());
}

window["newGame"] = () => {
  newGame(game ? game.stage : 1);
};

window["playStage"] = (i: number) => {
  newGame(i);
};

window["mainMenu"] = () => {
  updateUI(null);
};

function stagesText() {
  let s = `<span>Stage</span><span>Score</span></br></br>`;
  for (let i = 1; i < Game.stageNames.length; i++) {
    s += `<button ${
      i == 1 || scores[i - 1] ? "" : "disabled"
    } onmousedown="window.playStage(${i})">${
      Game.stageNames[i]
    }</button><span>${scores[i] || ""}</span><br/>`;
  }
  s += `<br/><span>Total Score:</span><span>${totalScore()}</span>`;
  return s;
}

function bonusText() {
  let total = totalScore();
  let s = `<span class="wide">Unlocks</span><span>Score req.</span></br></br>`;
  for (let i = 0; i < Game.bonusNames.length; i++) {
    let score = (2 + (i + 1) ** 2) * 2000;
    s += `<div style="opacity:${score <= total ? 1 : 0.5}"><span class="wide">${
      Game.bonusNames[i]
    }</span><span>${score}</span></div>`;
  }
  return s;
}

function overText(game: Game) {
  let s = "";
  if (!game) {
    s = `
<h1>FLIGHT OF THE SNAKE</h1>
Episode 2: Snake vs Invaders<br/><br/><br/><br/>
<div class="row">
<div>${stagesText()}</div>
<div>${bonusText()}</div>
</div>
`;
    return s;
  }

  if (!game.over) return "";

  let loseReason = null;
  if (game) {
    if (game.snake.length < game.snakeMinLength) loseReason = "Snake is dead";
    else if (game.shield < 0) loseReason = "Planetary shields depleted";
  }

  if (loseReason) s += `<h1>GAME OVER</h1><br/><br/><br/>` + loseReason;
  else {
    s = `<h1>STAGE COMPLETE</h1><br/><br/><br/>Score:${game.score}</br>`;
    if (game.score < scores[game.stage])
      s += `Which is not more than the previous best: ${scores[game.stage]}`;
    else {
      s += `Which is more than the previous best.<br/>Your overall score is increased by +${game.score -
        scores[game.stage]}`;
      scores[game.stage] = game.score;
      localStorage.setItem("snakeScore", JSON.stringify(scores));
    }
  }

  s += `<br/><br/><br/>`;
  if (loseReason)
    s += `<button onmousedown="window.newGame()">Restart</button>`;
  s += `<button onmousedown="window.mainMenu()">Back to Menu</button>`;
  return s;
}

window.onload = function() {
  c = document.getElementById("main") as HTMLCanvasElement;
  bg = document.getElementById("bg") as HTMLCanvasElement;
  ui = document.getElementById("ui");

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

  c.addEventListener(
    "contextmenu",
    function(e) {
      e.preventDefault();
    },
    false
  );

  c.addEventListener("mousedown", e => {
    if (e.button == 2 && game) game.toggleTime();
  });

  c.addEventListener("mouseleave", e => {
    mouseInside = false;
  });

  c.addEventListener("mouseenter", e => {
    mouseInside = true;
  });

  document.addEventListener("keydown", e => {
    console.log(e);
    if (e.code == "KeyS") {
      window["newGame"]();
    }
    if (e.code.substr(0, 5) == "Digit") {
      newGame(Number(e.code.substr(5)));
    }
  });

  eachFrame(time => {
    if (game && mouseInside) game.update(time);
  });

  updateUI(game);
};
