import * as v2 from "./v2";
type V2 = [number, number];
import Foe from "./Foe";
import Shot from "./Shot";
import Snake from "./Snake";
import Schedule, { Action } from "./Schedule";
import Tweens from "./Tweens";
import Wing from "./Wing";
import { min, random } from "./Util";
import FX from "./FX";
import { talkAll } from "./lang";

function parseTalk(stage) {
  let lines = talkAll.split("\n\n")[stage].split("\n");
  let side = lines[0].search("[s|S]ir") >= 0 ? 2 : 1;
  let talk: [number, string][] = [];
  for (let line of lines) {
    if (line.charAt(0) == "*") {
      talk.push([0, line.substr(1)]);
    } else {
      talk.push([side, line]);
      side = 3 - side;
    }
  }
  return talk;
}

class MovingText {
  time = 0;
  constructor(
    public game: Game,
    public text: string,
    public color,
    public lifeTime: number,
    public at: V2,
    public vel: V2 = [0, 0]
  ) {}

  update(dTime: number) {
    this.time += dTime;
    this.at = v2.sum(this.at, this.vel, dTime);
    return this.time < this.lifeTime;
  }

  draw() {
    let ctx = this.game.ctx;
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = `black`;
    ctx.shadowBlur = 3;
    ctx.font = `12pt "Courier"`;
    ctx.textAlign = "center";
    let y = 0;
    let l = 0;
    for (let line of this.text.split("|")) {
      ctx.fillText(
        line.trim().substr(0, Math.floor(this.time * 70) - l),
        this.at[0],
        this.at[1] + y
      );
      l += line.length;
      y += 20;
    }
    ctx.restore();
  }
}

export default class Game {
  snake: Snake;
  shots: Shot[];
  foes: Foe[];
  wings: Wing[] = [];
  fx: FX[];
  width: number;
  height: number;
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
  shieldRecharge = [0.3, 2];
  snakeRecoverRate = 0.5;
  maxShield = 100;
  shield: number;
  shieldAnim = 1;
  score = 0;
  over = false;
  snakeMinLength = 20;
  heat = 0;
  complication = 0;
  artIn = 10000;
  talk: [number, string][];
  currentLine = -1;
  text: MovingText;
  flight = 0;
  ship: V2;
  fancy = true;

  static readonly stageNames = [
    "",
    "In Medias Res",
    "Rainy",
    "Wall",
    "Mirage",
    "Shield",
    "More",
    "Chaos",
    "Fireworks",
    "Curtain",
    "Taking Flight"
  ];

  static readonly bonusNames = [
    "+50 shields",
    "+50% snake length",
    "+50% shield recharge",
    "piercing shots",
    "+100% snake regen",
    "artillery",
    "chain reaction",
    "+100% artillery",
    "! escape ship !",
    "longer stages",
    "more enemies"
  ];

  static readonly U_SHIELD = 0;
  static readonly U_LENGTH = 1;
  static readonly U_CHARGE = 2;
  static readonly U_PIERCE = 3;
  static readonly U_SREGEN = 4;
  static readonly U_ARTILL = 5;
  static readonly U_CHAINR = 6;
  static readonly U_MORART = 7;
  static readonly U_ROCKET = 8;
  static readonly U_LNGSTG = 9;
  static readonly U_ENEMIS = 10;

  rni: () => number;

  constructor(
    public canvas: HTMLCanvasElement,
    public background: HTMLCanvasElement,
    public stage: number,
    public updateUI: Function,
    public lastUnlock: number
  ) {

    this.fancy = localStorage["snakeVsInvadersFancy"]=="true";

    if (lastUnlock >= Game.U_SHIELD) this.maxShield += 50;

    if (lastUnlock >= Game.U_ARTILL) this.artIn = 40;

    if (lastUnlock >= Game.U_MORART) this.artIn = 20;

    if (this.stage == 10) this.flight = 0.01;

    this.talk = parseTalk(this.stage - 1);

    this.init();
  }

  sendPhalanx(wingInd: number) {
    new Wing(this, wingInd, false);
  }

  sendSkirmisher(wingInd: number) {
    let skirmishers = Math.ceil((this.rnf() * this.complication) / 10);
    for (let i = 0; i < skirmishers; i++) new Wing(this, wingInd, true);
  }

  rnf() {
    return (this.rni() %1e9) / 1e9;
  }

  seed(n: number) {
    this.rni = random(n);
  }

  nextLine() {
    this.currentLine++;
    let line = this.talk[this.currentLine];
    if (line) {
      let at;
      if (line[0] == 1)
        at = [
          Math.min(this.width - 300, Math.max(300, this.snake.head[0])),
          Math.min(this.height - 200, this.snake.head[1] + 100)
        ];
      else at = [this.width / 2, this.height - 70];

      this.text = new MovingText(
        this,
        line[1],
        [`#88ff88`, `#cccccc`, `#8888ff`][line[0]],
        (line[0]?2:this.stage==1?1000:10) + line[1].length / 12,
        at,
        [[0, 0], [0, 10], [0, -10]][line[0]] as V2
      );
    } else {
      this.text = null;
    }
  }

  init() {
    this.seed(15);

    this.shield = this.maxShield;

    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
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

    this.updateUI(this);

    this.delayed(2, () => this.nextLine());
  }

  update(timeStamp: number) {
    if (this.over) {
      return;
    }

    if (!this.mouseAt) return;

    this.complication =
      1.5 *
      (this.time / 30 + this.stage) *
      (0.3 + (0.7 * this.shield) / this.maxShield);

    this.beatLength = (4 * 10) / (10 + this.complication);

    let snakeMove = v2.dist(this.mouseAt, this.snake.head);
    let snakeMoves = snakeMove >= 5;

    if (!this.lastLoopTimeStamp) this.lastLoopTimeStamp = timeStamp - 0.001;

    let dTime = Math.min(0.02, (timeStamp - this.lastLoopTimeStamp) / 1000);

    this.shieldAnim = Math.min(1, this.shieldAnim + dTime);
    this.shield = Math.min(
      this.maxShield,
      this.shield +
        dTime *
          (this.lastUnlock >= Game.U_CHARGE ? 0.666 : 1) *
          (this.shieldRecharge[0] +
            (this.shieldRecharge[1] - this.shieldRecharge[0]) *
              (1 - this.shield / this.maxShield))
    );

    this.lastLoopTimeStamp = timeStamp;

    if (!this.realtime && !snakeMoves) return;

    if (snakeMove > 20) {
      dTime *= snakeMove / 20;
    }

    let beatChanged = false;

    this.time += dTime;
    this.beatTime += dTime;

    if (this.beatTime > this.beatLength) {
      beatChanged = true;
      this.beatTime -= this.beatLength;
    }

    this.seed(this.beat);

    let wingBeats = this.lastUnlock>=Game.U_ENEMIS?[5,2]:[7,3]

    if (this.time <= this.timeLimit) {
      if (beatChanged && this.beat % wingBeats[0] == 0) this.sendPhalanx(this.beat / 9);

      if (beatChanged && this.beat % wingBeats[1] == 2)
        this.sendSkirmisher(Math.floor(this.beat / 5));
    } else {
      this.wings.forEach(w => w.retreat());
    }

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

    if (
      (this.shield < 0 ||
        this.snake.length < this.snakeMinLength ||
        (this.time >= this.timeLimit &&
          this.wings.length == 0 &&
          this.shots.length == 0)) &&
      !this.over
    ) {
      this.over = true;
      this.updateUI(this);
    }

    let art = this.artIn - (this.time % this.artIn);
    if (art <= 1 && art + dTime > 1) {
      for (let i = 0; i < 20; i++) {
        let shot = new Shot(
          this,
          [((this.width - 200) / 20) * i + 100, this.height - 1],
          Math.PI,
          null,
          300
        );
        shot.bounces = 1;
      }
    }

    if (this.text) {
      if (!this.text.update(dTime)) this.nextLine();
    }

    if (this.flight > 0) {
      this.flight = Math.min(100, this.flight + dTime * 5);
      this.ship = [
        this.width / 2 + Math.sin(this.time*1.2),
        this.height * (1 - (0.5 * this.flight) / 100) + Math.sin(this.time*2.3) * 2,
      ];
      let delta: V2 = [0, this.flight * dTime];
      this.snake.tail.translate(delta);
      this.foes.forEach(foe => (foe.at = v2.sum(foe.at, delta)));
      this.shots.forEach(shot => shot.tail.translate(delta));
    }

    this.draw();

    if (beatChanged) this.beat++;
  }

  toggleTime() {
    this.realtime = !this.realtime;
    console.log(this);
  }

  draw() {
    let ctx = this.ctx;
    this.canvas.style.cursor = this.over ? "default" : "none";

    ctx.clearRect(0, 0, this.width, this.height);

    /*let filteredBg = canvasCache(
      [this.background.width, this.background.height],
      ctx => {
        ctx.filter = "blur(4px) brightness(98%)";
        ctx.drawImage(this.background, 0, 0);
      }
    );*/
    
    //this.ctb.drawImage(filteredBg, 0, 1);listener

    if(this.flight){
      this.ctb.fillStyle = `rgba(0,0,${48 * this.flight/100})`;
      this.ctb.fillRect(0, 0, this.width, this.height);
      this.seed(20);
      this.ctb.fillStyle = `rgba(${this.rni()%255},${this.rni()%255},${this.rni()%255},${this.flight/100})`;
      for (let i = 0; i < 300; i++) {
        let x = this.rni() % this.width;
        let y = (this.rnf() * this.time * 10 + this.rni()) % this.height;
        this.ctb.fillRect(x,y,1,1);
      }
    } else {
      //if(this.potato){
        this.ctb.clearRect(0, 0, this.width, this.height);
      /*} else {
        this.ctb.fillStyle=`rgba(0,0,0,0.2)`;
        this.ctb.fillRect(0, 0, this.width, this.height);
      }*/
    }

    //ctx.shadowColor = `white`;

    ctx.save();

    ctx.translate(0, this.flight * 5);

    let gradient = ctx.createLinearGradient(
      0,
      this.height,
      0,
      this.height - 50
    );

    let shieldColor = `255, ${this.shield/this.maxShield*255}, ${(2 * this.shield/this.maxShield-1)*255}`;

    gradient.addColorStop(
      0,
      `rgba(${shieldColor}, ${0.5*this.shieldAnim})`
    );
    gradient.addColorStop(1, `rgba(${shieldColor}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, this.height - 50, this.width, 51);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "white";
    ctx.font = `12pt "Courier"`;
    ctx.fillText("SHIELD " + this.shield.toFixed(0), 20, this.height - 20);
    ctx.fillText(
      "TAIL " + (this.snake.length - this.snakeMinLength).toFixed(0),
      150,
      this.height - 20
    );

    ctx.textAlign = "right";
    ctx.fillText("SCORE " + this.score, this.width - 20, this.height - 20);
    ctx.fillText(
      "TIME " + (this.timeLimit - this.time).toFixed(0),
      this.width - 150,
      this.height - 20
    );
    ctx.fillText("STAGE " + this.stage, this.width - 240, this.height - 20);

    ctx.font = `24pt "Courier"`;
    ctx.textAlign = "center";
    let art = this.artIn - (this.time % this.artIn);
    if (art > 1 && art < 3) {
      ctx.fillStyle = `rgba(255, 0, 0, ${Math.sin(art * 10) * 0.5 + 0.5})`;
      for (let i = 0; i < 20; i++) {
        ctx.fillText(
          "!",
          ((this.width - 200) / 20) * i + 100,
          this.height - 100
        );
      }
    }

    if (this.flight) {
      ctx.save()
      ctx.translate(...this.ship);
      ctx.scale(50, 50);

      var grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 2);
      grd.addColorStop(0.799, `rgba(255,255,255,0)`);
      grd.addColorStop(0.8, "white");
      grd.addColorStop(1, `rgba(255,255,255,0)`);
      ctx.fillStyle = grd;
      ctx.fillRect(-2, -2, 4, 4);

      ctx.lineWidth = 0.05;
      ctx.beginPath();
      ctx.moveTo(0, 0.9);
      ctx.quadraticCurveTo(1, 0.5, 0, -1.2);
      ctx.quadraticCurveTo(-1, 0.5, 0, 0.9);
      ctx.moveTo(-0.7, 1);
      ctx.quadraticCurveTo(0, 0, 0.7, 1);
      ctx.quadraticCurveTo(0, 0.5, -0.7, 1);
      ctx.stroke();
      
      ctx.beginPath()
      ctx.moveTo(0,1);
      ctx.fillStyle = `rgba(255,255,255,${0.6 + 0.1 * Math.sin(this.time*30)})`
      let bottom = this.flight/100 * 3 + 0.05 * Math.sin(this.time*21);
      ctx.quadraticCurveTo(0.5, 1.2, 0, 1 + bottom);
      ctx.quadraticCurveTo(-0.5, 1.2, 0, 1);
      ctx.fill();

      ctx.scale(0.3, 0.3);
      ctx.translate(0, -0.1);
      ctx.beginPath();
      ctx.moveTo(1, 0);
      ctx.quadraticCurveTo(1, 1, 0, 1);
      ctx.quadraticCurveTo(-1, 1, -1, 0);
      ctx.quadraticCurveTo(-0.8, -1.5, 0, -1.5);
      ctx.quadraticCurveTo(0.8, -1.5, 1, 0);
      ctx.stroke();
      ctx.restore();
    }

    if (this.text) this.text.draw();

    ctx.restore();

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

  complicatedPhalanx() {
    return this.complication >= this.rni() % 20;
  }

  get timeLimit() {
    return (60 + this.stage * 20) * (this.lastUnlock >= Game.U_LNGSTG?1.5:1);
  }
}

/*
  static readonly timeLimits = [
    90,
    90,
    120,
    150,
    180,
    210,
    240,
    270,
    300
  ]
*/
