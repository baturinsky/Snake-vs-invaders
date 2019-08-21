import { V2, dist, v2Round, v2Sum, min } from "./Util";
import Tail from "./Tail";
import Game from "./Game";
import {bounce} from "./Sound"

const shotLength = 30;
const shotDots = 5;
let shotSpeed = 2;

export default class Shot{
  tail: Tail;
  bounces = 0;

  constructor(public game:Game, at:V2){
    this.tail = new Tail({
      dots: [v2Sum(at, [0, 20])],
      speed: [0, shotSpeed] as V2,
      maxLength: shotLength,
      maxDots: shotDots
    })
  }

  move() {
    let tail = this.tail;
    let end = tail.head;
  
    if (end[0] < 0 || end[1] < 0 || end[0] > this.game.width || end[1] > this.game.height) {
      return false;
    }
  
    let next = v2Sum(end, tail.speed);
  
    let nearestFoe = min(this.game.foes, foe => dist(foe.at, end));
    let nearestSection = min(this.game.snake.tail.dots, dot => dist(dot, end));
  
    let bounces = false;
  
    if (nearestFoe.val > 20 && nearestSection.val > 20) {
      tail.enlarge(next);
    } else {
      let capture = this.game.ctx.getImageData(next[0], next[1], 1, 1);
      if (capture.data[3] == 255) {
        if (
          capture.data[0] == 255 &&
          capture.data[1] == 0 &&
          capture.data[2] == 0 &&
          this.bounces > 0
        ) {
          nearestFoe.item.destroy();
          return false;
        }
  
        if (capture.data[2] == 255) {
          bounces = true;
  
          let vec = [capture.data[0], capture.data[1]].map(a => a / 100 - 1.5);
  
          bounce(this.tail.head);
  
          let surfaceAngle = Math.atan2(vec[1], vec[0]);
          let dropAngle = Math.atan2(tail.speed[1], tail.speed[0]);
          let returnAngle = surfaceAngle * 2 + dropAngle + Math.PI;
          tail.speed = [Math.cos(returnAngle), Math.sin(returnAngle)].map(
            a => a * shotSpeed
          ) as V2;
        }
      }
  
      tail.enlarge(next);
  
      if (bounces) {
        tail.enlarge(v2Sum(next, tail.speed, 1.5));
        this.bounces++;
      }
    }
  
    return true;
  }

  draw(){
    let ctx = this.game.ctx;
    this.tail.draw(ctx, (t, i) => {
      ctx.lineWidth = 2;
      let brightnes = Math.min(230, (i / this.tail.dots.length) * 200);
      ctx.strokeStyle = `rgb(${brightnes},${brightnes},${brightnes})`;
    });
    let end = this.tail.head;
    ctx.strokeStyle = "#fdfdfd";
    ctx.fillStyle = "#fdfdfd";
    ctx.fillRect(end[0] - 1, end[1], 2, 2);
  }
};
