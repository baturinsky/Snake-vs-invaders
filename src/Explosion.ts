import Game from "./Game";
import { V2, v2Sum } from "./Util";
import {explosion} from "./Sound"

class Particle {
  speed: V2;
  at: V2;
}

const lifeTime = 100;

export default class Explosion {
  life = 0;  
  particles:Particle[] = []
  
  constructor(public game: Game, at: V2) {
    let pnum = 30;
    for (let i = 0; i < pnum; i++) {
      let p = new Particle();
      this.particles.push(p);
      p.at = [at[0], at[1]];
      let angle = i/pnum*Math.PI*2 + Math.random() * 0.1;
      let speed = Math.random();
      p.speed = [Math.cos(angle) * speed, Math.sin(angle) * speed]
    }

    explosion()

    game.sfx.push(this);

  }

  move(){
    for(let p of this.particles){
      p.at = v2Sum(p.at, p.speed)
    }
    this.life++;
    return this.life <= lifeTime;
  }

  draw(){
    let ctx = this.game.ctb;
    ctx.lineWidth = 2;
    ctx.fillStyle = `rgba(255, 0, 0, ${1 - this.life/lifeTime})`;
    for(let p of this.particles){
      ctx.fillRect(p.at[0], p.at[1], 4, 4)
    }
  }

}
