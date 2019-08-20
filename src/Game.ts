import { V2, dist, v2Round, v2Sum, min } from "./Util";
import Tail from "./Tail";
import Foe from "./Foe"
import Shot from "./Shot";
import Snake from "./Snake";
import Explosion from "./Explosion";

function eachFrame(fun: () => void) {
  fun();
  requestAnimationFrame(e => eachFrame(fun));
}

export default class Game{
  snake: Snake;
  shots: Shot[];
  foes: Foe[];
  sfx: Explosion[]
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
  background: HTMLCanvasElement;
  scale = 2;
  ctx: CanvasRenderingContext2D;
  ctb: CanvasRenderingContext2D;
  mouseAt: V2;
  realtime = true;
  
 
  init() {
    this.canvas = document.getElementById("canvas-main") as HTMLCanvasElement;
    this.background = document.getElementById("canvas-background") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d");
    this.ctb = this.background.getContext("2d");
    this.ctx.strokeStyle = "white";
    this.width = this.canvas.clientWidth / this.scale;
    this.height = this.canvas.clientHeight / this.scale;
    this.canvas.height = this.height;
    this.canvas.width = this.width;

    this.background.height = this.height;
    this.background.width = this.width;
  
    this.snake = new Snake(this);
    this.shots = [];
    this.foes = [];
    this.sfx = [];
    this.startLoop();
    this.spawnFoe();
  }  

  loop() {
    let snakeMoves = this.mouseAt && dist(this.mouseAt, this.snake.head) >= 5;
    
    if (!this.realtime && !snakeMoves)
      return;
  
    if (snakeMoves) {
      this.snake.move(this.mouseAt);
    }

    if (this.foes.length <= 10 && Math.random() < 0.02) {
      this.spawnFoe();
    }

    for (let foe of this.foes) {
      if (Math.random() < 0.02) {
        let shot = new Shot(this, foe.at);
        this.shots.push(shot);
      }
    }
  
    if (this.realtime || snakeMoves) {
      this.shots = this.shots.filter(shot => shot.move());
      this.foes = this.foes.filter(foe => foe.move());
      this.sfx = this.sfx.filter(sfx => sfx.move());
  
      this.draw();
    }
  }    
  
  startLoop(){
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
  
    eachFrame(this.loop.bind(this));
  
    this.canvas.addEventListener("mousedown", e => {
      console.log(this);
      this.realtime = !this.realtime;
    });
  
  }

  spawnFoe() {
    this.foes.push(new Foe(this, {
      at: [this.width * (Math.random() * 0.5 + 0.25), 20],
      speed: [2, 0]
    }));
  }  
  
  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctb.clearRect(0, 0, this.width, this.height);
    this.ctx.shadowColor = "white";      
  
    for (let shot of this.shots)
      shot.draw()
      
    for (let foe of this.foes)
      foe.draw();

    for (let sfx of this.sfx)
      sfx.draw();
      
    this.snake.draw();
  }
  
}