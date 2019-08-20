import Tail from "./Tail";
import Game from "./Game";
import { V2, dist, v2Round, v2Sum, min } from "./Util";

export default class Snake{
  tail: Tail;
  
  constructor(public game:Game){
    this.tail = new Tail({ maxLength: 80, maxDots: 30 })    
  }

  move(mouseAt) {
    this.tail.enlarge(mouseAt);
  }  
  
  draw() {
    this.tail.draw(this.game.ctx, (t, i) => {
      let delta = [0, 1].map(j => t.dots[i][j] - t.dots[i - 1][j]) as V2;
      let dd = dist(delta);
      delta = [delta[0] / dd, delta[1] / dd];
  
      let colors = [0, 1].map(j => Math.floor(150 + Math.floor(100 * delta[j])));
      this.game.ctx.lineWidth = i / 4 + 5;
      this.game.ctx.strokeStyle = `rgb(${colors[0]},${colors[1]},255)`;
    });
  }

  get head(){
    return this.tail.head;
  }
}