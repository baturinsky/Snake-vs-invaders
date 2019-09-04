import * as v2 from "./v2";
type V2 = [number, number];

export default class Tail {
  dots: V2[] = [];
  maxLength: number;
  maxDots: number;
  length = 0;
  vel?: V2;

  constructor(o) {
    Object.assign(this, o);
  }

  updateLength(){
    this.length = this.dots.reduce(
      (prev, cur, ind) => (ind == 0 ? 0 : prev + v2.dist(this.dots[ind - 1], cur)),
      0
    ) || 0;

  }

  translate(delta:V2){
    for(let i in this.dots){
      this.dots[i] = v2.sum(this.dots[i],delta)
    }
  }

  enlarge(next: V2) {
    let dots = this.dots;
    dots.push(next);

    this.updateLength();

    while (this.length > this.maxLength || dots.length > 30) {
      dots.shift();
      this.updateLength();
    }

  }

  compact(t: Tail, d: number) {
    while (
      t.dots.length >= 3 &&
      v2.dist(t.head, t.dots[t.dots.length - 2]) <= d
    ) {
      t.dots.splice(t.dots.length - 2, 1);
    }
  }

  get head() {
    return this.dots[this.dots.length - 1];
  }

  draw(ctx: CanvasRenderingContext2D, style?: (t: Tail, i: number) => void) {
    let dots = this.dots;
    ctx.save();
    ctx.lineCap = "round";
    for (let i = 1; i < dots.length; i++) {
      let next = dots[i];
      let prev = dots[i - 1];
      ctx.beginPath();
      ctx.moveTo(...v2.round(prev));
      if (style) style(this, i);
      ctx.lineTo(...v2.round(next));
      ctx.stroke();
    }
    ctx.restore();
  }

  drawSmooth(ctx: CanvasRenderingContext2D) {
    if (this.dots.length < 2) return;
    let dots = this.dots;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(...dots[0]);
    ctx.lineCap = "round";

    for (let i = 1; i < dots.length - 1; i++) {
      let next = dots[i];
      let prev = dots[i - 1];
      let avg = v2.scale(v2.sum(prev, next), 0.5);

      ctx.quadraticCurveTo(prev[0], prev[1], avg[0], avg[1]);
    }
    ctx.quadraticCurveTo(
      dots[dots.length - 2][0],
      dots[dots.length - 2][1],
      dots[dots.length - 1][0],
      dots[dots.length - 1][1]
    );
    ctx.stroke();
    ctx.restore();
  }

  width(i: number) {
    return 4;
  }

  hitTest(a: V2): V2 {
    let dots = this.dots;
    for (let i = 1; i < dots.length; i++) {
      let next = dots[i];
      let prev = dots[i - 1];
      let inside = v2.hitTestPipe(a, prev, next, this.width(4));
      if (inside) {
        return v2.norm(v2.delta(prev, next));
      }
    }
    return null;
  }

  loseHead() {
    if(this.dots.length >= 3){
      this.dots.pop();
      this.updateLength();
    }
  }
}
