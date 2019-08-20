import { dist, v2Round } from "./Util"

type V2 = [number, number];

export default class Tail{
  dots: V2[] = [];
  maxLength: number;
  maxDots: number;
  lineLength = 0;
  speed?: V2;

  constructor(o){
    Object.assign(this,o)
  }

  enlarge(next: V2) {
    let dots = this.dots;
    this.lineLength = this.lineLength || 0;
    if (dots.length > 0) this.lineLength += dist(this.head, next);
    dots.push(next);
  
    while (this.lineLength > this.maxLength || dots.length > 30) {
      this.lineLength -= dist(dots[0], dots[1]);
      dots.shift();
    }
  
    let realLength = dots.reduce(
      (prev, cur, ind) => (ind == 0 ? 0 : prev + dist(dots[ind - 1], cur)),
      0
    );
    console.assert(Math.abs(this.lineLength - realLength) < 1);
  }
  
  compact(t: Tail, d: number) {
    while (t.dots.length >= 3 && dist(t.head, t.dots[t.dots.length - 2]) <= d) {
      t.dots.splice(t.dots.length - 2, 1);
    }
  }
  
  get head() {
    return this.dots[this.dots.length - 1];
  }

  draw(ctx:CanvasRenderingContext2D, style: (t: Tail, i: number) => void) {
    let dots = this.dots;
    for (let i = 1; i < dots.length; i++) {
      let next = dots[i];
      let prev = dots[i - 1];
      ctx.beginPath();
      ctx.moveTo(...v2Round(prev));
      ctx.lineCap = "round";
      style(this, i);
      ctx.lineTo(...v2Round(next));
      ctx.stroke();
    }
  }
  
  
};

