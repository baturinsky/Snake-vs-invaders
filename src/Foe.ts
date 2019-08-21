import { V2, dist, v2Round, v2Sum, min } from "./Util";
import Game from "./Game";
import Explosion from "./Explosion";

export default class Foe {
  at: V2;
  speed: V2;
  dying?: number;
  radius = 10;

  constructor(public game:Game, o){
    Object.assign(this,o)
  }

  draw() {
    let ctx = this.game.ctx;

    ctx.strokeStyle = "#ff0000";
    ctx.fillStyle = `rgba(255,0,0,${1 - (this.dying || 0)})`;
    ctx.shadowBlur = 5;

    if (this.dying) {
      ctx.save();
      ctx.translate(
        Math.round(this.at[0]) - this.radius,
        Math.round(this.at[1] - this.radius)
      );
      ctx.rotate(this.dying * Math.PI);
      ctx.scale(1 - this.dying, 1 - this.dying);
      ctx.fillRect(-this.radius, -this.radius, 2 * this.radius, 2 * this.radius);
  
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(this.at[0], this.at[1], this.radius, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fill();
    }

    ctx.shadowBlur = 0;

  }

  move() {
    if (this.dying) {
      this.dying += 0.05;
      if (this.dying > 1) return false;
      else return true;
    }
    let next = v2Sum(this.at, this.speed);
    if (next[0] < 100 || next[0] >= this.game.width - 100) {
      this.speed[0] = -this.speed[0];
      next[1] += 20;
    }
    this.at = next;
    return this.at[1] <= this.game.height - 100;
  }
  
  destroy() {
    this.dying = 0.01;
    new Explosion(this.game, this.at);    
    console.log(this.at);
  }  
  
};