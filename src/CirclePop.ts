import Game from "./Game";
import FX from "./FX";
import Foe from "./Foe";
type V2 = [number, number];

export default class CirclePop extends FX {
  time = 0;

  constructor(game: Game, public foe: Foe, public radius:number) {
    super(game);
  }

  update(dTime: number) {
    this.time += dTime;
    return this.time < 1;
  }

  draw() {
    let ctx = this.game.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 2 * (1 - this.time);
    ctx.strokeStyle = "white";
    ctx.arc(
      this.foe.at[0],
      this.foe.at[1],
      this.radius * (1 + this.time),
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.restore();
  }
}
