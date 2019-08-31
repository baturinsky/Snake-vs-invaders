import Tail from "./Tail";
import Game from "./Game";
import Foe from "./Foe";
type V2 = [number, number];

export default class Snake {
  tail: Tail;
  hurt = 0;
  maxLength = 150

  get length(){
    return this.tail.maxLength
  }

  constructor(public game: Game) {
    this.tail = new Tail({ maxLength: this.maxLength, maxDots: 30 });
  }

  update(mouseAt:V2, dTime:number) {
    if(mouseAt)
      this.tail.enlarge(mouseAt);

    let foeHit:Foe;

    for(let segment of this.tail.dots){
      foeHit = this.game.foeHit(segment);
      if(foeHit)
        break;
    }
    
    if(foeHit){
      foeHit.damage();
      this.tail.loseHead();
      this.tail.maxLength = Math.max(10, this.tail.maxLength - 10);

      this.hurt = 1;
      this.game.delayed(0.2, ()=>{this.hurt = 0})
    }

    if(this.tail.maxLength <= this.maxLength){
      this.tail.maxLength += dTime * this.game.snakeRecoverRate;
    }
  }

  draw() {
    if(this.tail.dots.length<2)
      return;
      
    let ctx = this.game.ctx;
    ctx.save();
    if(this.hurt && Math.floor(this.game.time * 20)%2){
      ctx.strokeStyle = "red";
      ctx.shadowColor = "red";  
    } else {
      ctx.strokeStyle = "white";
      ctx.shadowColor = "white";  
    }
    ctx.shadowBlur = 6;
    ctx.lineWidth = 10;

    this.tail.drawSmooth(this.game.ctx);

    let head = this.head;
    ctx.lineWidth = 0;
    ctx.fillStyle = `rgba(255,255,255, ${0.2 * (1.2 + Math.sin(this.game.time * 2))})`;
    ctx.beginPath();
    ctx.arc(head[0], head[1], 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  get head() {
    return this.tail.head;
  }
}


/*this.tail.draw(this.game.ctx, (t, i) => {
  let delta = [0, 1].map(j => t.dots[i][j] - t.dots[i - 1][j]) as V2;
  let dd = v2.dist(delta);
  delta = [delta[0] / dd, delta[1] / dd];

  //let colors = [0, 1].map(j => Math.floor(150 + Math.floor(100 * delta[j])));
  //this.game.ctx.strokeStyle = `rgb(${colors[0]},${colors[1]},255)`;
  ctx.lineWidth = i / 2 + 4;
});*/
