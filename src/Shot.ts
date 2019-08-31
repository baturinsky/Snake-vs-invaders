import * as v2 from "./v2";
type V2 = [number, number];
import Tail from "./Tail";
import Game from "./Game";
import { bounce as bounceFx } from "./Sound";
import { canvasCache, min } from "./Util";
import Explosion from "./Explosion";

const shotLength = 30;
const shotDots = 6;

let glow = canvasCache([20, 20], ctx => {
  ctx.filter = "blur(2px)";

  ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
  ctx.beginPath();
  ctx.arc(10, 10, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(128, 128, 128, 0.6)`;
  ctx.beginPath();
  ctx.arc(10, 10, 3, 0, Math.PI * 2);
  ctx.fill();
});

export default class Shot {
  tail: Tail;
  bounces = 0;
  phantom?: boolean;

  constructor(public game: Game, at: V2, angle: number, shotVel = 180) {
    game.shots.push(this);
    let dir = [-Math.sin(angle), Math.cos(angle)] as V2;
    this.tail = new Tail({
      dots: [v2.sum(at, dir, 10)],
      vel: v2.scale(dir, shotVel),
      maxLength: shotLength,
      maxDots: shotDots
    });
  }

  update(dTime: number) {
    /*if(this.bounces>=13)
      return false;*/

    let tail = this.tail;
    let head = tail.head;

    if (head[1] > this.game.height){
      if(this.phantom){
        return false;
      }
      new Explosion(this.game, head, {color:[255,0,0]});
      this.game.shieldHit()
    }

    if (
      head[0] < 0 ||
      head[1] < 0 ||
      head[0] > this.game.width ||
      head[1] > this.game.height
    ) {
      return false;
    }

    let next = v2.sum(head, tail.vel, dTime);
    let bounceNormal: V2;

    if (this.bounces > 0 && !this.phantom) {
      let foeHit = this.game.foeHit(next);
      if (foeHit) {
        if (foeHit.kind == 2) {
          let impactPoint: V2;
          for (impactPoint of v2.along(head, next))
            if (foeHit.hitTest(impactPoint)) break;
          impactPoint = impactPoint || next;
          let delta = v2.delta(foeHit.at, impactPoint);
          let angle = Math.atan2(delta[1], delta[0]);
          if (!(angle > Math.PI * 0.25 && angle < Math.PI * 0.75)) {
            foeHit.damage();
          }
        } else {
          foeHit.damage();
        }
        return false;
      }
    }

    let snakeTail = this.game.snake.tail;

    let impactPoint: V2;
    for (impactPoint of v2.along(head, next, 3))
      if ((bounceNormal = snakeTail.hitTest(impactPoint))) break;

    if (bounceNormal) {
      bounceFx(this.tail.head);

      tail.vel = v2.scale(
        v2.bounce(tail.vel, bounceNormal),
        v2.length(tail.vel)
      );

      tail.enlarge(v2.sum(impactPoint, tail.vel, 3 * dTime));
      this.bounces++;

      return true;
    }

    tail.enlarge(next);
    return true;
  }

  draw() {
    let ctx = this.game.ctx;
    ctx.save();

    let head = v2.round(this.tail.head);

    if(!this.phantom){
      ctx.drawImage(glow, head[0] - 10, head[1] - 10);
      if (this.bounces > 0) ctx.drawImage(glow, head[0] - 10, head[1] - 10);
    }

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#ffdddd";

    this.tail.draw(ctx, (t, i) => {
      let brightnes = Math.min(i / this.tail.dots.length);
      ctx.strokeStyle = `rgb(255, 255, 255, ${brightnes})`;
      //ctx.shadowColor = `rgba(${brightnes*2},${brightnes},${brightnes})`;
    });

    //this.tail.draw(ctx);
    /*
    ctx.fillStyle = "#ffdddd";
    ctx.fillRect(end[0] - 2, end[1] - 2, 4, 4);*/
    ctx.restore();
  }
}

/*
        let normal = v2.norm(v2.delta(foe.at, head))
        
        let d = v2.dist(head, foe.at);
        if(d < foe.radius + 5)
          head = v2.sum(foe.at, v2.scale(normal, foe.radius + 5));

        let bounce = v2.bounce(tail.vel, normal);
        let oldVel = v2.length(tail.vel);
        //tail.vel = v2.sum(v2.scale(bounce, oldVel), foe.vel);
        tail.vel = v2.scale(bounce, oldVel)
        tail.enlarge(v2.sum(head, tail.vel, dTime*2))
        //tail.vel = v2.scale(tail.vel, oldVel/v2.length(tail.vel))
        this.bounces++;
*/
