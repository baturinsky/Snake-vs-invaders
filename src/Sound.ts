import jsfxr from "jsfxr";

export function fx(code: number[]) {
  try {
    var soundURL = jsfxr(code);
    var player = new Audio();
    player.src = soundURL;
    player.play();
  } catch (e) {
    console.error(e);
  }
}

export function fxRnd(code: number[], spread: number = 0.01) {
  //let oced = code.map(n => n * (Math.random() * spread * 2 - spread + 1));
  //console.log(oced);
  let oced = code.slice()
  oced[23] *= Math.random() * 0.2 + 0.8;
  oced[5] *= Math.random() + 0.5;
  fx(oced);
}

let actx = new AudioContext();

export function bounce(at: [number, number]) {
  bounceFxr();
}

function bounceNative(at: [number, number]) {
  let peep = actx.createOscillator();
  peep.type = "square";
  peep.frequency.value = 100 + at[0];
  let gain = actx.createGain();
  gain.gain.value = 0.05;
  gain.gain.exponentialRampToValueAtTime(0.00001, actx.currentTime + 0.1);
  peep.connect(gain).connect(actx.destination);

  peep.start();
  setTimeout(t => {
    peep.stop();
  }, 20);
}

export function explosion(){
  fxRnd([3,,0.1238,0.3385,0.3229,0.0203,,0.0284,,,,,,,,,0.4758,-0.0269,1,,,,,0.5])
  //fxRnd([3,,0.25,0.7,0.43,0.24,,-0.54,0.2199,0.31,0.41,0.26,0.79,,,,0.1599,0.24,1,,,,,0.5])
}

function bounceFxr(){
  //fx([0,,0.0605,,0.136,0.2184,,-0.4742,,,,,,0.3823,,,,,1,,,0.2458,,0.5])
  fxRnd([3,,0.0315,,0.1484,0.496,,-0.5938,,,,,,,,,,,1,,,0.2325,,0.5])  
  //fxRnd([2,,0.24,,0.0695,0.28,0.0717,-0.6419,,,,,,0.3096,0.0063,,0.0946,-0.1103,1,,,,,0.5])
}

export function volley(){
  //fx([2,0.0309,0.1827,,0.0918,0.18,0.0191,-0.0024,0.0386,0.0482,0.0387,0.0163,0.0277,,0.0085,0.0135,0.0397,0.052,1,,,0.0357,0.0141,0.5])
}
export function bubble(){
  //fxRnd([3,,0.0442,,0.1357,0.06,,-0.02,-0.02,,,-0.82,,,,,,,1,,,0.1,,0.39]);
  //fxRnd([2,,0.0476,,0.1323,0.23,,-0.3599,,,,,,0.0555,,,,,1,,,0.0152,,0.5]);
}