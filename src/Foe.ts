import * as v2 from "./v2";
type V2 = [number, number];
import Game from "./Game";
import Explosion from "./Explosion";
import Shot from "./Shot";
import Wing from "./Wing";
import CirclePop from "./CirclePop";

let dyingDuration = 0.5;

let chargeTimes = { 4: 3, 8: 4 };

export default class Foe {
  at: V2;
  vel: V2;
  dying?: number;
  radius = 20;
  charge = 0;
  chargeTime = 2;
  game: Game;
  order: number;
  angle = 0;
  kind = 1;
  special = 0;
  shields = 0;

  static readonly PAWN = 1;
  static readonly WALL = 2;
  static readonly SPAWN = 3;
  static readonly COMM = 4;
  static readonly FAN = 5;
  static readonly MIRAGE = 6;
  static readonly SHIELD = 7;
  static readonly BOMB = 8;
  static readonly CHASE = 9;
  static readonly SNIPE = 10;
  static readonly STEALTH = 11;
  static readonly SNAKE = 12;

  constructor(public wing: Wing, o) {
    Object.assign(this, o);

    this.game = wing.game;
    this.order = wing.foes.length;
    this.game.foes.push(this);
    wing.foes.push(this);

    this.chargeTime = this.game.beatLength * (chargeTimes[this.kind] || 0.5);
  }

  draw() {
    let ctx = this.game.ctx;
    ctx.save();

    ctx.strokeStyle = "#ffffff";
    ctx.translate(this.at[0], this.at[1]);
    ctx.scale(this.radius, this.radius);
    ctx.rotate(this.angle);

    if (!this.dying) {
      ctx.fillStyle = `rgba(255,255,255,${Math.max(this.charge / 2, 0)})`;
      ctx.shadowColor = `white`;
      ctx.shadowBlur = 5;
      ctx.lineWidth = 0.1;

      if (![Foe.MIRAGE, Foe.STEALTH].includes(this.kind)) {
        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();
      }

      for (let i = 0; i < this.shields; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, 1 + (i + 1) * 0.3, 0, 2 * Math.PI);
        ctx.stroke();
      }

      ctx.save();
      ctx.beginPath();
      this.drawSignature(ctx);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    ctx.save();
    if (this.kind == Foe.COMM && this.charge > 0.9) {
      ctx.setLineDash([5, 15]);
      for (let f of this.game.foes) {
        if (f.kind == Foe.COMM) continue;
        ctx.strokeStyle = "white";
        ctx.lineWidth = 10 * (this.charge - 0.9);
        ctx.beginPath();
        ctx.moveTo(...this.at);
        ctx.lineTo(...f.at);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawSignature(ctx: CanvasRenderingContext2D) {
    switch (this.kind) {
      case Foe.PAWN:
        ctx.moveTo(0, 1);
        ctx.lineTo(0, 0.5);
        return;
      case Foe.WALL:
        ctx.lineWidth = 0.2;
        ctx.arc(0, 0, 0.85, Math.PI * 0.25, Math.PI * 0.75);
        return;
      case Foe.SPAWN:
        if (this.special) return;
        ctx.lineWidth = 0.05;
        for (let i = 0; i < 3; i++) {
          ctx.strokeStyle = "black";
          ctx.shadowColor = "black";
          ctx.beginPath();
          ctx.arc(0, 0.5, 0.3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.rotate((Math.PI * 2) / 3);
        }
        return;
      case Foe.COMM:
        ctx.lineWidth = 0.05;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(0, 0, 0.35 + i * 0.2, Math.PI, Math.PI * 2);
          ctx.stroke();
        }
        return;
      case Foe.FAN:
        for (let i = -2; i <= 2; i++) {
          let a = i * 0.3;
          ctx.moveTo(-Math.sin(a), Math.cos(a));
          ctx.lineTo(-Math.sin(a) * 0.7, Math.cos(a) * 0.7);
        }
        return;
      case Foe.MIRAGE:
        if (this.phantom && Math.random() < 0.005) {
          ctx.strokeStyle = "rgba(255,255,255,0.5)";
        }
        ctx.moveTo(0, 1);
        ctx.lineTo(0, 0.5);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, 2 * Math.PI);
        ctx.fill();
        return;
      case Foe.SHIELD:
        ctx.lineWidth = 0.05;
        ctx.beginPath();
        ctx.arc(0, 0, 0.8, 0, Math.PI * 2);
        ctx.stroke();
        return;
      case Foe.BOMB:
        for (let i = 0; i <= 16; i++) {
          ctx.moveTo(0, 1 + this.charge * 0.3);
          ctx.lineTo(0, 0.7 + this.charge * 0.3);
          ctx.rotate(Math.PI / 8);
        }
        return;
      case Foe.CHASE:
        ctx.moveTo(-0.9, -0.4);
        ctx.lineTo(0, 0.45);
        ctx.lineTo(0.9, -0.4);
        return;
      case Foe.SNIPE:
        ctx.moveTo(0, -0.8);
        ctx.lineTo(0, 1);
        ctx.moveTo(0.2, -0.8);
        ctx.lineTo(0.2, 1);
        ctx.moveTo(-0.2, -0.8);
        ctx.lineTo(-0.2, 1);
        return;
    }
  }

  actuallyShoot() {
    switch (this.kind) {
      case Foe.SPAWN:
        if (this.special) {
          new Shot(this.game, this.at, this.angle);
        } else {
          this.vel[0] = this.vel[0] * (this.game.rni() % 2 ? 1 : -1);
          new Foe(this.wing, {
            kind: 3,
            at: this.at,
            vel: [-this.vel[0], this.vel[1]],
            special: true
          });
        }
        break;
      case Foe.COMM:
        for (let f of this.game.foes) {
          if (f.kind != 4) f.shoot();
        }
        break;
      case Foe.FAN:
        for (let i = -2; i <= 2; i++) {
          let a = i * 0.3;
          new Shot(this.game, this.at, a);
        }
        break;
      case Foe.MIRAGE:
        let shot = new Shot(this.game, this.at, this.angle);
        if (this.phantom) shot.phantom = true;
        break;
      case Foe.BOMB:
        for (let i = 0; i < 16; i++) {
          new Shot(this.game, this.at, (Math.PI / 8) * i, 500);
          this.explode();
        }
        break;
      case Foe.SNIPE:
        for (let i = -1; i <= 1; i++) {
          new Shot(
            this.game,
            v2.sum(this.at, v2.fromAngle(this.angle), i * 5),
            this.angle,
            500
          );
        }
        break;
      case Foe.CHASE:
        this.vel = v2.scale(v2.fromAngle(this.angle + Math.PI / 2), 200);
        break;
      default:
        new Shot(this.game, this.at, this.angle);
        break;
    }
    this.charge = 0;
  }

  update(dTime: number) {
    if (this.kind == Foe.CHASE) {
      let delta = v2.delta(this.at, this.game.snake.head);
      this.angle = Math.atan2(delta[1], delta[0]) - Math.PI / 2;
    }

    if (this.dying) {
      this.dying += dTime / dyingDuration;
    }

    if (this.charge > 0) {
      this.charge += dTime / this.chargeTime;
      if (this.charge >= 1) {
        this.actuallyShoot();
      }
    }

    let next = v2.sum(this.at, this.vel, dTime);
    this.at = next;

    if (this.at[1] < -400) this.remove();
  }

  get dead() {
    return this.dying >= 1;
  }

  shoot() {
    if (this.charge > 0 || this.kind == 2) return;

    if ([1, 6, 10, 11, 12].includes(this.kind))
      this.game.tweens.add(
        this,
        "angle",
        0.5 * (this.game.rnf() - 0.5),
        this.chargeTime - 0.1
      );

    this.charge = 0.01;
  }

  remove() {
    this.dying = 0.01;
    if (this.kind == Foe.MIRAGE && !this.phantom) {
      for (let f of this.wing.foes) if (f.phantom) f.remove();
    }
  }

  explode() {
    if (this.dying) return;
    this.remove();
    new Explosion(this.game, this.at);
  }

  hitTest(a: V2): V2 {
    return v2.dist(a, this.at) <= this.outerRadius ? a : null;
  }

  get phantom() {
    return this.kind == Foe.MIRAGE && !this.special;
  }

  damage() {
    if (this.shields > 0) {
      new CirclePop(this.game, this, this.outerRadius);
      this.shields--;
    } else {
      this.explode();
    }
  }

  get outerRadius() {
    return this.radius * (1 + this.shields * 0.3);
  }
}
