import Game from "./Game";

import { V2 } from "./v2";

export default class FX {
  constructor(public game: Game) {
    game.fx.push(this);
  }
  update(dTime: number): boolean {
    return false;
  }
  draw(): void {}
}
