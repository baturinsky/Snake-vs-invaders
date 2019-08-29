import * as v2 from "./v2";
type V2 = [number, number];
import Game from "./Game";
import { explosion as explosionSfx } from "./Sound";
import FX from "./FX";

class Particle {
  vel: V2;
  at: V2;
}

export default class Explosion extends FX {
  life = 0;
  particles: Particle[] = [];
  color: number[] = [255, 255, 255];
  arc = Math.PI * 2;
  direction: number;
  lifeTime = 1;
  pnum = 30;
  pvel = 200;

  constructor(game: Game, public at: V2, options?: any) {
    super(game);
    if (options) Object.assign(this, options);
    let scale = game.fxScale;
    for (let i = 0; i < this.pnum; i++) {
      let p = new Particle();
      this.particles.push(p);
      p.at = v2.scale(at, scale);
      let angle = (i / this.pnum) * Math.PI * 2 + Math.random() * 0.1;
      let vel = Math.random() * this.pvel;
      p.vel = v2.scale(v2.fromAngle(angle), vel * scale);
    }

    explosionSfx();
  }

  update(dTime: number) {
    for (let p of this.particles) {
      p.at = v2.sum(p.at, p.vel, dTime);
    }
    this.life += dTime / this.lifeTime;
    return this.life <= 1;
  }

  draw() {

    let ctx = this.game.ctx;
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(${this.color.join()}, 1)`;
    ctx.fillStyle = `rgba(${this.color.join()}, ${0.5 - 0.5*(this.life || 0)})`;
    ctx.beginPath();
    ctx.arc(this.at[0], this.at[1], 20 * (1 + this.life*2), 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();
    ctx.restore();

    let ctb = this.game.ctb;
    let scale = this.game.fxScale;
    ctb.save();    
    //ctx.lineWidth = (1 - this.life / this.lifeTime) * 10;
    ctb.lineWidth = 2 * scale;
    ctb.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${
      this.color[2]
    }, ${1 - this.life})`;
    for (let p of this.particles) {
      ctb.fillRect(p.at[0], p.at[1], 4 * scale, 4 * scale);
      /*ctx.beginPath();
      ctx.moveTo(...p.at);
      ctx.lineTo(...v2.sum(p.at, p.vel));
      ctx.stroke();*/
    }
    ctb.restore();
  }
}
