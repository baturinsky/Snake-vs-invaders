export type V2 = [number, number];

export function v2Round(v:V2):V2{
  return [Math.round(v[0]), Math.round(v[1])];
}

export function v2Length(d: V2) {
  return Math.sqrt(d[0] * d[0] + d[1] * d[1]);
}

export function v2Sum(v1: V2, v2: V2, m = 1): V2 {
  return [v1[0] + v2[0] * m, v1[1] + v2[1] * m];
}

export function dist(a: V2, b?: V2) {
  if (b) return v2Length([a[0] - b[0], a[1] - b[1]]);
  else return v2Length(a);
}

export function min<T>(list: T[], fn: (T) => number) {
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