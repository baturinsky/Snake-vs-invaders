import jsfxr from "jsfxr";

export function fx(code:number[]){
  var soundURL = jsfxr(code); 
  var player = new Audio();
  player.src = soundURL;
  player.play();

}

export function explosion(){
  fx([3,,0.1238,0.3385,0.3229,0.0203,,0.0284,,,,,,,,,0.4758,-0.0269,1,,,,,0.5])
}

let actx = new AudioContext();

export function bounce(at: [number, number]){
  bounceFxr();
}

function bounceFxr(){
  //fx([0,,0.0605,,0.136,0.2184,,-0.4742,,,,,,0.3823,,,,,1,,,0.2458,,0.5])
  fx([3,,0.0315,,0.1484,0.496,,-0.5938,,,,,,,,,,,1,,,0.2325,,0.5])
  
}

function bounceNative(at:[number,number]){
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