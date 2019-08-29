import Foe from "./Foe";
import Game from "./Game";
import { V2 } from "./v2";
import { randomElement } from "./Util";

type wingConf = {
  rows: number;
  cols: number;
  kind: number;
  special?: string;

  init: (
    wing,
    number
  ) => {
    at: V2;
    vel: V2;
  };
  foeBeat: (beat: number, foe: Foe) => void;
  foeThink: (foe: Foe) => void;
};

function formation(wing: Wing, i: number) {
  let conf = wing.conf;
  let col = i % conf.cols;
  let row = Math.floor(i / conf.cols);
  let gap = Math.min(40, (wing.game.width - 200) / conf.cols )
  let base =
    wing.ind % 2 ? wing.game.width - 100 - conf.cols * gap : 100;
  let kind = conf.kind;
  if (
    conf.special == "walled" &&
    kind == 1 &&
    row == conf.rows - 1
  )
    kind = Foe.WALL;
  return {
    at: [
      col * gap + base,
      20 - 40 * conf.rows + row * 40
    ] as V2,
    vel: [wing.ind % 2 ? -10 : 10, 30] as V2,
    shields: 0,
    kind: kind
  };
}

function centered(wing: Wing, i: number) {
  let conf = wing.conf;
  return {
    at: [
      wing.game.width / 2 - 20 * conf.cols,
      -80 + Math.floor(i / conf.rows) * 40
    ] as V2,
    vel: [wing.game.rnf() * 40 - 20, 30] as V2,
    kind: conf.kind
  };
}

function formationFire(beat: number, foe: Foe) {
  let conf = foe.wing.conf;
  if (
    beat % (conf.rows + 1) == conf.rows ||
    Math.floor(foe.order / conf.cols) ==
      conf.rows - (beat % (conf.rows + 1))
  ) {
    foe.shoot();
  }
}

function forwardAndBack(foe: Foe) {
  if (
    (foe.at[0] < 100 && foe.vel[0] < 0) ||
    (foe.at[0] >= foe.wing.game.width - 100 && foe.vel[0] > 0)
  ) {
    foe.vel[0] = -foe.vel[0];
  }
  if (foe.at[1] >= foe.wing.game.height - 300 && foe.vel[1] > 0) {
    foe.vel[1] = -foe.vel[1];
  }
}

function stopAtBorder(foe: Foe) {
  if (
    (foe.at[0] < 100 && foe.vel[0] < 0) ||
    (foe.at[0] >= foe.wing.game.width - 100 && foe.vel[0] > 0)
  ) {
    foe.vel = [0, 0];
  }
  if (
    (foe.at[1] >= foe.wing.game.height - 100 && foe.vel[1] > 0) ||
    (foe.at[1] <= 100 && foe.vel[1] < 0)
  ) {
    foe.vel = [0, 0];
  }
}

export default class Wing {
  foes: Foe[] = [];
  conf: wingConf;
  beat = 0;

  get size() {
    return this.conf.cols * this.conf.rows;
  }

  constructor(public game: Game, public ind: number) {
    if (ind >= 0) {
      this.conf = {
        cols: 6,
        rows: 3,
        kind: 1,
        init: formation,
        foeBeat: formationFire,
        foeThink: forwardAndBack
      };
      if (ind % 5 == 5) {
        this.conf.special = "armored";
      }
      if (this.conf.kind == Foe.MIRAGE)
        this.foes[Math.floor(Math.random() * this.size)].special = 1;
    } else {
      this.conf = {
        cols: 1,
        rows: 1,
        kind:
          randomElement([Foe.SPAWN, Foe.FAN, Foe.SNIPE, Foe.BOMB, Foe.CHASE], game.rni),
        init: centered,
        foeBeat: formationFire,
        foeThink: forwardAndBack
      };
      if (this.conf.kind == Foe.CHASE) this.conf.foeThink = stopAtBorder;
    }

    this.init(this.size, this.conf.init);
  }

  init(n: number, f: (wing, number) => any) {
    this.game.wings.push(this);
    for (let i = 0; i < n; i++) {
      new Foe(this, f(this, i));
    }
    console.log(this);
  }

  onBeat(beat: number) {
    this.foes.forEach(foe => this.conf.foeBeat(this.beat, foe));
    this.beat++;
  }

  update(dTime: number) {
    this.foes.forEach(foe => this.conf.foeThink(foe));
    this.foes.forEach(foe => foe.update(dTime));
    this.foes = this.foes.filter(foe => !foe.dead);
  }
}
