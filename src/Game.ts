import * as v2 from "./v2";
type V2 = [number, number];
import Foe from "./Foe";
import Shot from "./Shot";
import Snake from "./Snake";
import Explosion from "./Explosion";
import Schedule, { Action } from "./Schedule";
import Tweens from "./Tweens";
import Wing from "./Wing";
import { volley as volleySfx } from "./Sound";
import { min, random } from "./Util";
import FX from "./FX";

function eachFrame(fun: (time: number) => void) {
  requestAnimationFrame(time => {
    fun(time);
    eachFrame(fun);
  });
}

export default class Game {
  snake: Snake;
  shots: Shot[];
  foes: Foe[];
  wings: Wing[] = [];
  fx: FX[];
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
  background: HTMLCanvasElement;
  scale = 1;
  fxScale = 0.5;
  ctx: CanvasRenderingContext2D;
  ctb: CanvasRenderingContext2D;
  mouseAt: V2;
  realtime = false;
  time = -0.001;
  lastLoopTimeStamp: number;
  schedule = new Schedule();
  tweens = new Tweens(0);
  beatLength = 3;
  beat = 0;
  shield = 100;
  shieldAnim = 1;
  rni: () => number;

  sendWing(wingInd: number) {
    new Wing(this, wingInd);
  }

  sendSmallwing(wingInd: number) {
    new Wing(this, wingInd);
  }

  rnf() {
    return (this.rni() % 1e9) / 1e9;
  }

  init() {
    this.rni = random(15);

    this.canvas = document.getElementById("canvas-main") as HTMLCanvasElement;
    this.background = document.getElementById(
      "canvas-background"
    ) as HTMLCanvasElement;
    this.width = this.canvas.clientWidth / this.scale;
    this.height = this.canvas.clientHeight / this.scale;
    this.canvas.height = this.height;
    this.canvas.width = this.width;

    this.background.height = this.canvas.clientHeight * this.fxScale;
    this.background.width = this.canvas.clientWidth * this.fxScale;

    this.ctx = this.canvas.getContext("2d");
    this.ctx.globalCompositeOperation = "ligher";
    this.ctb = this.background.getContext("2d");
    this.ctx.strokeStyle = "white";

    this.snake = new Snake(this);
    this.shots = [];
    this.foes = [];
    this.fx = [];
    this.startLoop();
  }

  loop(timeStamp: number) {
    if (!this.mouseAt) return;

    let snakeMove = v2.dist(this.mouseAt, this.snake.head);
    let snakeMoves = snakeMove >= 5;

    if (!this.lastLoopTimeStamp) this.lastLoopTimeStamp = timeStamp - 0.001;

    let dTime = Math.min(0.02, (timeStamp - this.lastLoopTimeStamp) / 1000);

    this.shieldAnim = Math.min(1, this.shieldAnim + dTime);
    this.shield = Math.min(100, this.shield + dTime);

    this.lastLoopTimeStamp = timeStamp;

    if (!this.realtime && !snakeMoves) return;

    if (snakeMove > 20) {
      dTime *= snakeMove / 20;
    }

    let beatChanged =
      Math.floor((this.time + dTime) / this.beatLength) !=
      Math.floor(this.time / this.beatLength);

    this.time += dTime;
    if (beatChanged && this.beat % 9 == 0) this.sendWing(this.beat / 9);

    if (beatChanged && this.beat % 4 == 2) this.sendSmallwing(-1-Math.floor(this.beat/4));

    //if (beatChanged) this.sendSmallwing(-1 - this.beat);

    this.snake.update(snakeMoves ? this.mouseAt : null, dTime);

    this.tweens.update(this.time);
    this.schedule.update(this.time);

    for (let wing of this.wings) {
      wing.update(dTime);
      if (beatChanged) wing.onBeat(this.beat);
    }

    this.shots = this.shots.filter(shot => shot.update(dTime));

    this.wings = this.wings.filter(wing => wing.foes.length > 0);
    this.foes = this.foes.filter(foe => !foe.dead);
    this.fx = this.fx.filter(sfx => sfx.update(dTime));

    this.draw();

    if (beatChanged) {
      this.beat++;
      if (beatChanged) {
        this.delayed(2, () => volleySfx());
      }
    }
  }

  startLoop() {
    this.canvas.addEventListener(
      "mousemove",
      e => {
        this.mouseAt = [
          (e.pageX - this.canvas.offsetLeft) / this.scale,
          (e.pageY - this.canvas.offsetTop) / this.scale
        ];
      },
      false
    );

    this.canvas.addEventListener("mousedown", e => {
      console.log(this);
      this.realtime = !this.realtime;
    });

    requestAnimationFrame(startTime => {
      eachFrame(time => this.loop(time));
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    /*let filteredBg = canvasCache(
      [this.background.width, this.background.height],
      ctx => {
        ctx.filter = "blur(4px) brightness(98%)";
        ctx.drawImage(this.background, 0, 0);
      }
    );*/
    this.ctb.clearRect(0, 0, this.width, this.height);
    //this.ctb.drawImage(filteredBg, 0, 1);

    this.ctx.shadowColor = "white";

    let gradient = this.ctx.createLinearGradient(
      0,
      this.height,
      0,
      this.height - 50
    );

    gradient.addColorStop(
      0,
      `rgba(255, 255, 255, ${0.002 * this.shield * this.shieldAnim})`
    );
    gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, this.height - 50, this.width, 50);

    for (let fx of this.fx) fx.draw();

    for (let foe of this.foes) foe.draw();

    for (let shot of this.shots) shot.draw();

    this.snake.draw();
  }

  foeHit(at: V2): Foe {
    let list = this.foes.filter(
      foe => !foe.dying && !foe.phantom && foe.hitTest(at)
    );

    if (list.length > 0) {
      let foe = min(list, f => v2.dist(at, f.at)).item;
      return foe;
    }
  }

  delayed(delay: number, f: Action) {
    this.schedule.add(this.time + delay, f);
  }

  shieldHit() {
    if (this.shield > 0) this.shield -= 1;
    this.shieldAnim = 0;
  }
}
