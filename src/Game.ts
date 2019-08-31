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

export default class Game {
  snake: Snake;
  shots: Shot[];
  foes: Foe[];
  wings: Wing[] = [];
  fx: FX[];
  width: number;
  height: number;
  scale = 1;
  fxScale = 0.5;
  ctx: CanvasRenderingContext2D;
  ctb: CanvasRenderingContext2D;
  mouseAt: V2;
  realtime = true;
  time = -0.001;
  beatTime = 0;
  lastLoopTimeStamp: number;
  schedule = new Schedule();
  tweens = new Tweens(0);
  beatLength = 3;
  beat = 0;
  shieldRecharge = [0.2, 1];
  snakeRecoverRate = 0.5;
  maxShield = 100;
  shield: number;
  shieldAnim = 1;
  score = 0;
  over = false;
  snakeMinLength = 20;
  heat = 0;
  complication = 0;
  stage = 8;

  rni: () => number;

  constructor(
    public canvas: HTMLCanvasElement,
    public background: HTMLCanvasElement
  ) {
    this.init();
  }

  sendPhalanx(wingInd: number) {
    new Wing(this, wingInd, false);
  }

  sendSkirmisher(wingInd: number) {
    let skirmishers = Math.ceil(this.rnf() * this.complication / 10)
    for(let i=0;i<skirmishers;i++)
      new Wing(this, wingInd, true);
  }

  rnf() {
    return (this.rni() % 1e9) / 1e9;
  }

  seed(n: number) {
    this.rni = random(n);
  }

  init() {
    this.seed(15);
    this.shield = this.maxShield;

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
  }

  update(timeStamp: number) {    
    if(this.over){
      return;
    }
    
    if (!this.mouseAt) return;

    this.complication =
      (this.time / 60 + this.stage - 3) *
      (0.5 + (0.5 * this.shield) / this.maxShield);

    this.beatLength = 4 * 20 / (20 + this.complication);

    let snakeMove = v2.dist(this.mouseAt, this.snake.head);
    let snakeMoves = snakeMove >= 5;

    if (!this.lastLoopTimeStamp) this.lastLoopTimeStamp = timeStamp - 0.001;

    let dTime = Math.min(0.02, (timeStamp - this.lastLoopTimeStamp) / 1000);

    this.shieldAnim = Math.min(1, this.shieldAnim + dTime);
    this.shield = Math.min(
      this.maxShield,
      this.shield +
        dTime *
          (this.shieldRecharge[0] +
            (this.shieldRecharge[1] - this.shieldRecharge[0]) *
              (1 - this.shield / this.maxShield))
    );

    this.lastLoopTimeStamp = timeStamp;

    if (!this.realtime && !snakeMoves) return;

    if (snakeMove > 20) {
      dTime *= snakeMove / 20;
    }

    let beatChanged =
      Math.floor((this.time + dTime) / this.beatLength) !=
      Math.floor(this.time / this.beatLength);

    this.time += dTime;
    this.beatTime += dTime;
    
    if(this.beatTime > this.beatLength){
      beatChanged = true;
      this.beatTime -= this.beatLength;
    }

    this.seed(this.beat);

    if (beatChanged && this.beat % 9 == 0) this.sendPhalanx(this.beat / 9);

    if (beatChanged && this.beat % 5 == 2)
      this.sendSkirmisher(Math.floor(this.beat / 5));

    //if (beatChanged) this.sendSmallwing(-1 - this.beat);

    this.snake.update(snakeMoves ? this.mouseAt : null, dTime);

    this.tweens.update(this.time);
    this.schedule.update(this.time);

    for (let wing of this.wings) {
      wing.update(dTime);
      if (beatChanged) wing.onBeat();
    }

    this.shots = this.shots.filter(shot => shot.update(dTime));

    this.wings = this.wings.filter(wing => wing.foes.length > 0);
    this.foes = this.foes.filter(foe => !foe.dead);
    this.fx = this.fx.filter(sfx => sfx.update(dTime));

    if (this.shield < 0 || this.snake.length < this.snakeMinLength)
      this.over = true;

    this.draw();

    if (beatChanged) {
      this.beat++;
      if (beatChanged) {
        this.delayed(2, () => volleySfx());
      }
    }
  }

  toggleTime() {
    this.realtime = !this.realtime;
  }

  draw() {
    this.canvas.style.cursor = this.over ? "default" : "none";

    this.ctx.clearRect(0, 0, this.width, this.height);

    /*let filteredBg = canvasCache(
      [this.background.width, this.background.height],
      ctx => {
        ctx.filter = "blur(4px) brightness(98%)";
        ctx.drawImage(this.background, 0, 0);
      }
    );*/
    this.ctb.clearRect(0, 0, this.width, this.height);
    //this.ctb.drawImage(filteredBg, 0, 1);listener

    this.ctx.shadowColor = "white";

    this.ctx.save();

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

    this.ctx.fillStyle = "white";
    this.ctx.font = `12pt "Courier"`;
    this.ctx.fillText("SHIELD " + this.shield.toFixed(0), 20, this.height - 20);
    this.ctx.fillText(
      "TAIL " + (this.snake.length - this.snakeMinLength).toFixed(0),
      150,
      this.height - 20
    );

    this.ctx.textAlign = "right";
    this.ctx.fillText("SCORE " + this.score, this.width - 20, this.height - 20);
    this.ctx.fillText(
      "TIME " + this.time.toFixed(0),
      this.width - 150,
      this.height - 20
    );
    this.ctx.fillText("STAGE " + this.stage, this.width - 240, this.height - 20);

    this.ctx.restore();    

    for (let fx of this.fx) fx.draw();

    for (let foe of this.foes) foe.draw();

    for (let shot of this.shots) shot.draw();

    this.snake.draw();
    
    this.drawOverText();
  }

  drawOverText(){
    if(!this.over)
      return;
    this.ctx.save();
    this.ctx.fillStyle = "white";
    this.ctx.textAlign = "center";
    this.ctx.font = `24pt "Courier"`;
    let reason = null;
    if (this.snake.length < this.snakeMinLength) reason = "Snake is dead";
    else if (this.shield < 0) reason = "Planetary shields depleted";
    
    let title = reason?"GAME OVER":"FLIGHT OF THE SNAKE";
    
    this.ctx.fillText(title, this.width / 2, this.height / 2);

    this.ctx.font = `12pt "Courier"`;
    if(reason)
      this.ctx.fillText(reason, this.width / 2, this.height / 2 + 20);
    
    this.ctx.fillText(`Press S to ${reason?"re":""}start`, this.width / 2, this.height / 2 + 60);
    this.ctx.restore();
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

  complicatedPhalanx(){
    return this.complication >= this.rni()%20;
  }
}
