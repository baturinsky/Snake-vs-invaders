type V2 = [number, number];

type Tail = {
  dots: V2[];
  maxLength: number;
  maxDots: number;
  lineLength?: number;
  speed?: V2;
};

function v2Length(d: V2) {
  return Math.sqrt(d[0] * d[0] + d[1] * d[1]);
}

function dist(a: V2, b?: V2) {
  if (b) return v2Length([a[0] - b[0], a[1] - b[1]]);
  else return v2Length(a);
}

function enlarge(t: Tail, next: V2) {
  let dots = t.dots;
  if (dots.length > 1)
    t.lineLength = (t.lineLength || 0) + dist(dots[dots.length - 1], next);
  dots.push(next);

  while (t.lineLength > t.maxLength || dots.length > 30) {
    t.lineLength -= dist(dots[0], dots[1]);
    dots.shift();
  }
}

function drawTail(
  t: Tail,
  ctx: CanvasRenderingContext2D,
  style: (t: Tail, ctx: CanvasRenderingContext2D, i: number) => void
) {
  let dots = t.dots;
  for (let i = 1; i < dots.length; i++) {
    let next = dots[i];
    let prev = dots[i - 1];
    ctx.beginPath();
    ctx.moveTo(...prev);
    ctx.lineCap = "round";
    style(t, ctx, i);
    ctx.lineTo(...next);
    ctx.stroke();
  }
}

window.onload = function() {
  let canvas = document.getElementById("canvas") as HTMLCanvasElement;
  let ctx = canvas.getContext("2d");
  ctx.strokeStyle = "white";
  let width = canvas.clientWidth / 2;
  let height = canvas.clientHeight / 2;
  canvas.height = height;
  canvas.width = width;
  let shotSpeed = 4;

  let snake = { dots: [], maxLength: 150, maxDots: 30 };
  let shots: Tail[] = [];

  canvas.addEventListener(
    "mousemove",
    e => {
      let mouseAt: V2 = [e.pageX / 2, e.pageY / 2];
      if (
        snake.dots.length == 0 ||
        dist(mouseAt, snake.dots[snake.dots.length - 1]) >= 5
      ) {
        enlarge(snake, mouseAt);
        if (Math.random() < 0.1) {
          let shot = {
            dots: [[Math.round(Math.random() * width), 0] as V2],
            maxLength: 150,
            maxDots: 30,
            speed: [0, shotSpeed] as V2
          };
          shots.push(shot);
        }
        shots = shots.filter(shot => {
          let end = shot.dots[shot.dots.length - 1];
          if (end[1] > height || end[0] < 1) return false;
          let next: V2 = [end[0] + shot.speed[0], end[1] + shot.speed[1]];

          let capture = ctx.getImageData(next[0], next[1], 1, 1);
          if (capture.data[2] == 255) {
            if (shot.speed[0] != 0) return false;
            let vec = [capture.data[0], capture.data[1]].map(
              a => a / 100 - 1.5
            );
            let normal = [vec[1], vec[0]];
            if (normal[1] < 0) normal = normal.map(a => -a);
            let normalAngle = Math.atan2(normal[1], normal[0]);
            let returnAngle = normalAngle * 2 - Math.PI / 2;
            shot.speed = [Math.cos(returnAngle), -Math.sin(returnAngle)].map(
              a => a * shotSpeed
            ) as V2;
          }
          enlarge(shot, next);
          return true;
        });
        draw();
      }
    },
    false
  );

  canvas.addEventListener("mousedown", e => {
    console.log(snake);
  });

  function draw() {
    ctx.clearRect(0, 0, width, height);

    for (let shot of shots) {
      drawTail(shot, ctx, (t, ctx, i) => {
        ctx.lineWidth = 2;
        let brightnes = Math.min(254, i * 10);
        ctx.strokeStyle = `rgb(${brightnes},${brightnes},${brightnes})`;
      });
    }
    drawTail(snake, ctx, (t, ctx, i) => {
      let delta = [0, 1].map(j => t.dots[i][j] - t.dots[i - 1][j]) as V2;
      let dd = dist(delta);
      delta = [delta[0] / dd, delta[1] / dd];

      let colors = [0, 1].map(j =>
        Math.floor(150 + Math.floor(100 * delta[j]))
      );
      ctx.lineWidth = i / 4 + 5;
      ctx.strokeStyle = `rgb(${colors[0]},${colors[1]},255)`;
    });
  }
};
