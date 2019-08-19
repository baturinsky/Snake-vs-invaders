type V2 = [number, number];

var actx = new AudioContext();

let shotSpeed = 2;
let snake: Tail;
let shots: Shot[];
let foes: Foe[];
let width, height: number;
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

const shotLength = 30;
const shotDots = 5;

type Tail = {
  dots: V2[];
  maxLength: number;
  maxDots: number;
  lineLength?: number;
  speed?: V2;
};

type Shot = {
  tail: Tail;
  bounces: number;
};

type Foe = {
  at: V2;
  speed: V2;
};

function head(tail: Tail) {
  return tail.dots[tail.dots.length - 1];
}

function min<T>(list: T[], fn: (T) => number) {
  let res = list.reduce(
    (prev, item, i) => {
      let d = fn(item);
      if (d < prev[1]) return [i, d];
      else return prev;
    },
    [-1, 1e9] as [number, number]
  );
  if(res[0] < 0)
    return { ind: -1, item: null, val: null };  
  return { ind: res[0], item: list[res[0]], val: fn(list[res[0]]) };
}

function v2Length(d: V2) {
  return Math.sqrt(d[0] * d[0] + d[1] * d[1]);
}

function v2Sum(v1: V2, v2: V2, m = 1): V2 {
  return [v1[0] + v2[0] * m, v1[1] + v2[1] * m];
}

function dist(a: V2, b?: V2) {
  if (b) return v2Length([a[0] - b[0], a[1] - b[1]]);
  else return v2Length(a);
}

function enlarge(t: Tail, next: V2) {
  let dots = t.dots;
  t.lineLength = t.lineLength || 0;
  if (dots.length > 0) t.lineLength += dist(head(t), next);
  dots.push(next);

  while (t.lineLength > t.maxLength || dots.length > 30) {
    t.lineLength -= dist(dots[0], dots[1]);
    dots.shift();
  }

  let realLength = dots.reduce(
    (prev, cur, ind) => (ind == 0 ? 0 : prev + dist(dots[ind - 1], cur)),
    0
  );
  console.assert(Math.abs(t.lineLength - realLength) < 1);
}

function compact(t: Tail, d: number) {
  while (t.dots.length >= 3 && dist(head(t), t.dots[t.dots.length - 2]) <= d) {
    t.dots.splice(t.dots.length - 2, 1);
  }
}

function drawTail(t: Tail, style: (t: Tail, i: number) => void) {
  let dots = t.dots;
  for (let i = 1; i < dots.length; i++) {
    let next = dots[i];
    let prev = dots[i - 1];
    ctx.beginPath();
    ctx.moveTo(...prev);
    ctx.lineCap = "round";
    style(t, i);
    ctx.lineTo(...next);
    ctx.stroke();
  }
}

function moveSnake(mouseAt) {
  enlarge(snake, mouseAt);
  if (foes.length <= 10 && Math.random() < 0.02) {
    spawnFoe();
  }
  for (let foe of foes) {
    if (Math.random() < 0.02) {
      let shot = {
        tail: {
          //dots: [[Math.round((Math.random() * 0.8 + 0.1) * width), 0] as V2],
          dots: [v2Sum(foe.at, [0, 20])],
          maxLength: shotLength,
          maxDots: shotDots,
          speed: [0, shotSpeed] as V2
        },
        bounces: 0
      };
      shots.push(shot);
    }
  }
}

function moveFoe(foe: Foe) {
  let next = v2Sum(foe.at, foe.speed);
  if (next[0] < 100 || next[0] >= width - 100) foe.speed[0] = -foe.speed[0];
  foe.at = next;
  return foe.at[1] <= height - 100;
}

function moveShot(shot: Shot) {
  let tail = shot.tail;
  let end = head(tail);

  if (end[0] < 0 || end[1] < 0 || end[0] > width || end[1] > height) {
    //console.log(end);
    return false;
  }

  let next = v2Sum(end, tail.speed);

  let nearestFoe = min(foes, foe => dist(foe.at, end));
  let nearestSection = min(snake.dots, dot => dist(dot, end));
  
  /*console.log(nearestSection);
  console.log(snake.dots)
  console.log(end)*/
  let bounces = false;

  if (nearestFoe.val > 20 && nearestSection.val > 40) {
    enlarge(tail, next);
  } else {
    let capture = ctx.getImageData(next[0], next[1], 1, 1);
    if (capture.data[3] == 255) {
      if (
        capture.data[0] == 255 &&
        capture.data[1] == 0 &&
        capture.data[2] == 0 &&
        shot.bounces > 0
      ) {
        /*console.log("kill");
        console.log(end);
        console.log(capture.data);*/
        foes.splice(nearestFoe.ind, 1);
        return false;
      }

      if (capture.data[2] == 255) {
        /*console.log("bounce");
        console.log(end);
        console.log(capture.data);*/

        bounces = true;

        let vec = [capture.data[0], capture.data[1]].map(a => a / 100 - 1.5);

        let peep = actx.createOscillator();
        peep.type = "sawtooth";
        peep.frequency.value = 200;
        let gain = actx.createGain();
        gain.gain.value = 0.1;
        gain.gain.exponentialRampToValueAtTime(0.00001, actx.currentTime + 0.1);
        peep.connect(gain).connect(actx.destination);

        peep.start();
        setTimeout(t => {
          peep.stop();
        }, 50);

        let surfaceAngle = Math.atan2(vec[1], vec[0]);
        let dropAngle = Math.atan2(tail.speed[1], tail.speed[0]);
        let returnAngle = surfaceAngle * 2 + dropAngle + Math.PI;
        tail.speed = [Math.cos(returnAngle), Math.sin(returnAngle)].map(
          a => a * shotSpeed
        ) as V2;
      }
    }

    enlarge(tail, next);

    if (bounces) {
      enlarge(tail, v2Sum(next, tail.speed, 1.5));
      shot.bounces++;
    }
  }

  return true;
}

function draw() {
  ctx.clearRect(0, 0, width, height);

  for (let shot of shots) {
    drawTail(shot.tail, (t, i) => {
      ctx.lineWidth = 2;
      let brightnes = Math.min(230, i / shot.tail.dots.length * 300);
      ctx.strokeStyle = `rgb(${brightnes},${brightnes},${brightnes})`;
    });
  }

  let r = 10;
  for (let foe of foes) {
    ctx.strokeStyle = "#ff0000";
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(foe.at[0] - r, foe.at[1] - r, 2 * r, 2 * r);
  }

  drawTail(snake, (t, i) => {
    let delta = [0, 1].map(j => t.dots[i][j] - t.dots[i - 1][j]) as V2;
    let dd = dist(delta);
    delta = [delta[0] / dd, delta[1] / dd];

    let colors = [0, 1].map(j => Math.floor(150 + Math.floor(100 * delta[j])));
    ctx.lineWidth = i / 4 + 5;
    ctx.strokeStyle = `rgb(${colors[0]},${colors[1]},255)`;
  });
}

function spawnFoe() {
  foes.push({
    at: [width * (Math.random() * 0.5 + 0.25), 20],
    speed: [2, 0.2]
  });
}

window.onload = function() {
  canvas = document.getElementById("canvas") as HTMLCanvasElement;
  ctx = canvas.getContext("2d");
  ctx.strokeStyle = "white";
  let scale = 2;
  width = canvas.clientWidth / scale;
  height = canvas.clientHeight / scale;
  canvas.height = height;
  canvas.width = width;

  snake = { dots: [], maxLength: 80, maxDots: 30 };
  shots = [];
  foes = [];
  spawnFoe();

  canvas.addEventListener(
    "mousemove",
    e => {
      let mouseAt: V2 = [
        (e.pageX - canvas.offsetLeft) / scale,
        (e.pageY - canvas.offsetTop) / scale
      ];

      if (snake.dots.length == 0 || dist(mouseAt, head(snake)) >= 5) {
        moveSnake(mouseAt);
        shots = shots.filter(moveShot);
        foes = foes.filter(moveFoe);

        draw();
      }
    },
    false
  );

  canvas.addEventListener("mousedown", e => {
    console.log(shots);
  });
};
