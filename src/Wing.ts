import Foe from "./Foe";
import Game from "./Game";
import { V2 } from "./v2";
import { randomElement } from "./Util";

type wingConf = {
  rows: number;
  cols: number;
  kind: number;
  complication?: number;

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
  let gap = Math.min(40, (wing.game.width - 200) / conf.cols);
  let base = wing.ind % 2 ? wing.game.width - 100 - conf.cols * gap : 100;
  let kind = conf.kind;
  let lastRow = row == conf.rows - 1;
  if (conf.complication == Wing.WALL && lastRow) kind = Foe.WALL;

  let foeConf = {
    at: [col * gap + base, 20 - 40 * conf.rows + row * 40] as V2,
    vel: [wing.ind % 2 ? -10 : 10, 30] as V2,
    shields: 0,
    kind: kind
  };

  if (conf.complication == Wing.SHIELD) foeConf.shields = 1;

  return foeConf;
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
  let b = beat % (conf.rows + 1);
  let allFiring = b == conf.rows;
  let rowFiring = conf.rows - b;
  let myRow = Math.floor(foe.order / conf.cols);
  //console.log(beat, foe.order, myRow, rowFiring);
  if (myRow == rowFiring || allFiring) {
    foe.shoot();
  }
}

function randomFire(beat: number, foe: Foe) {
  if (foe.game.rni() % 4) {
    foe.game.delayed(foe.game.beatLength * foe.game.rnf(), () => foe.shoot());
  }
}

function continuousFire(beat: number, foe: Foe) {
  if (beat % 4) {
    foe.game.delayed(
      (foe.game.beatLength * 2 * foe.order) / foe.wing.size,
      () => foe.shoot()
    );
  }
}

function doNothing(beat: number, foe: Foe) {}

function beat2Fire(beat: number, foe: Foe) {
  if (beat % 2 == 0) foe.shoot();
}

function forwardAndBack(foe: Foe) {
  if (
    (foe.at[0] < 100 && foe.vel[0] < 0) ||
    (foe.at[0] >= foe.wing.game.width - 100 && foe.vel[0] > 0)
  ) {
    foe.vel[0] = -foe.vel[0];
  }
  if (
    !foe.game.flight &&
    foe.at[1] >= foe.wing.game.height - 300 &&
    foe.vel[1] > 0
  ) {
    foe.vel[1] = -foe.vel[1];
  }
}

function allRetreat(foe: Foe) {
  foe.vel = [0, -100];
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

  static readonly W2X = 1;
  static readonly H2X = 2;
  static readonly PHALANX = 3;
  static readonly MIRAGE = 4;
  static readonly WALL = 5;
  static readonly SHIELD = 6;
  static readonly CONTINUOUS = 7;
  static readonly RIGGED = 8;
  static readonly RANDOM = 9;

  static readonly phalanxUnlocks = [
    0,
    0,
    Wing.H2X,
    Wing.WALL,
    Wing.MIRAGE,
    Wing.SHIELD,
    Wing.W2X,
    Wing.RANDOM,
    Wing.RIGGED,
    Wing.CONTINUOUS
  ];

  static readonly skirmishUnlocks = [
    0,
    Foe.SNIPE,
    Foe.FAN,
    Foe.WALL,
    Foe.STEALTH,
    Foe.SHIELD,
    Foe.SPAWN,
    Foe.CHASE,
    Foe.BOMB,
    Foe.COMM
  ];

  get size() {
    return this.conf.cols * this.conf.rows;
  }

  constructor(
    public game: Game,
    public ind: number,
    public skirmisher: boolean
  ) {
    if (skirmisher) {
      this.conf = {
        cols: 1,
        rows: 1,
        kind:
          game.time < 20 && Wing.skirmishUnlocks[game.stage]
            ? Wing.skirmishUnlocks[game.stage]
            : randomElement(
                Wing.skirmishUnlocks.slice(1, game.stage + 1),
                game.rni
              ),
        init: centered,
        foeBeat: beat2Fire,
        foeThink: forwardAndBack
      };
      if (this.conf.kind == Foe.CHASE) this.conf.foeThink = stopAtBorder;
    } else {
      this.conf = {
        cols: 4 + Math.floor(game.complication / 4),
        rows: 3,
        kind: Foe.PAWN,
        init: formation,
        foeBeat: formationFire,
        foeThink: forwardAndBack
      };
      if (
        (game.time < 20 && Wing.phalanxUnlocks[game.stage]) ||
        game.complicatedPhalanx()
      ) {
        this.conf.complication =
          game.time < 20
            ? Wing.phalanxUnlocks[game.stage]
            : randomElement(
                Wing.phalanxUnlocks.slice(1, game.stage + 1),
                game.rni
              );

        switch (this.conf.complication) {
          case Wing.MIRAGE:
            this.conf.kind = Foe.MIRAGE;
            break;
          case Wing.RIGGED:
            this.conf.kind = Foe.RIGGED;
            break;
          case Wing.H2X:
            this.conf.rows *= 2;
            break;
          case Wing.W2X:
            this.conf.rows *= 2;
            break;
          case Wing.RANDOM:
            this.conf.foeBeat = randomFire;
            break;
          case Wing.CONTINUOUS:
            this.conf.foeBeat = continuousFire;
            break;
          case Wing.PHALANX:
            this.conf.cols *= this.conf.rows;
            this.conf.rows = 1;
            break;
        }
      }
    }

    this.init(this.size, this.conf.init);

    if (this.conf.kind == Foe.MIRAGE)
      randomElement(this.foes, game.rni).special = 1;
  }

  init(n: number, f: (wing, number) => any) {
    this.game.wings.push(this);
    for (let i = 0; i < n; i++) {
      new Foe(this, f(this, i));
    }
  }

  onBeat() {
    this.foes.forEach(foe => this.conf.foeBeat(this.beat, foe));
    this.beat++;
  }

  update(dTime: number) {
    this.foes.forEach(foe => this.conf.foeThink(foe));
    this.foes.forEach(foe => foe.update(dTime));
    this.foes = this.foes.filter(foe => !foe.dead);
  }

  retreat() {
    this.conf.foeThink = allRetreat;
    this.conf.foeBeat = doNothing;
  }
}
