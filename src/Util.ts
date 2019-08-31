export function min<T>(list: T[], fn: (T) => number) {
  let res = list.reduce(
    (prev, item, i) => {
      let d = fn(item);
      if (d < prev[1]) return [i, d];
      else return prev;
    },
    [-1, Number.MAX_VALUE] as [number, number]
  );
  if (res[0] < 0) return { ind: -1, item: null, val: null };
  return { ind: res[0], item: list[res[0]], val: fn(list[res[0]]) };
}

export function canvasCache(
  size: [number, number],
  draw: (ctx: CanvasRenderingContext2D) => void
) {
  let canvas = document.createElement("canvas");
  canvas.width = size[0];
  canvas.height = size[1];
  let ctx = canvas.getContext("2d");
  draw(ctx);
  return canvas;
}

export function randomElement<T>(list:T[], rni:() => number){
  return list[rni() % list.length]
}

export function weightedRandom(a: number[], rni: () => number) {
  let roll = (rni() % a.reduce((x, y) => x + y)) - a[0];
  let i = 0;
  while (roll >= 0) roll -= a[++i];
  return i;
}

export function random(seed) {
  seed = seed % 2147483647;
  if (seed <= 0) 
    seed += 2147483646;
  return () =>{
    return seed = seed * 16807 % 2147483647;
  };  
}

export function eachFrame(fun: (time: number) => void) {
  requestAnimationFrame(time => {
    fun(time);
    eachFrame(fun);
  });
}

