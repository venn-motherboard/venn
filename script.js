/* Car loading sequence and interactions.
   You do not need to edit this file. Edit your info in index.html. */
const $ = id => document.getElementById(id);

/* Education timeline: click a school to show or hide its achievements */
document.querySelectorAll(".tl button").forEach(b => b.addEventListener("click", () => {
  const t = b.parentElement, o = t.classList.toggle("open");
  b.setAttribute("aria-expanded", o);
}));

/* =========================================================
   2) CAR LOADING SEQUENCE
   ========================================================= */
const intro=$("intro"), loader=$("loader"), site=$("site"), car=$("car");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const DURATION = reduce ? 1500 : 4400;           // total ms, never longer
const MESSAGES = [
  [0,"STARTING ENGINE..."],[.25,"LOADING DEVELOPER DATA..."],[.5,"INITIALIZING PROFILE..."],
  [.75,"ESTABLISHING CONNECTION..."],[.97,"SYSTEM READY."]
];
let running=false, raf=0, timers=[], soundOn=false, ac=null, engine=null;

// reflection = copy of the car svg
$("reflect").innerHTML = car.querySelector("svg").outerHTML.replace(/id="/g,'id="r_').replace(/url\(#/g,'url(#r_');

// neon tunnel strips
(function(){
  const t=$("tunnel"), n=14;
  for(let i=0;i<n;i++){
    const s=document.createElement("div"); s.className="strip";
    const a=(i/n)*360;
    s.style.transform=`rotate(${a}deg) rotateX(68deg) translateY(4vmin)`;
    s.style.opacity=(i%2?.5:.9);
    t.appendChild(s);
  }
})();

// sparks / particles
const cv=$("sparks"), cx=cv.getContext("2d"); let parts=[];
function size(){cv.width=innerWidth;cv.height=innerHeight}
addEventListener("resize",size); size();
function spawn(){
  const r=car.getBoundingClientRect();
  parts.push({x:r.left+r.width*.05,y:r.bottom-r.height*.12,vx:-(3+Math.random()*5),vy:-1-Math.random()*3,l:1});
  parts.push({x:Math.random()*cv.width,y:Math.random()*cv.height,vx:-.2,vy:-.3-Math.random()*.4,l:.6,d:1});
}
function drawParts(){
  cx.clearRect(0,0,cv.width,cv.height);
  parts=parts.filter(p=>p.l>0);
  for(const p of parts){
    p.x+=p.vx;p.y+=p.vy;p.l-=p.d?.008:.03;
    cx.fillStyle=`rgba(255,${p.d?60:140},40,${Math.max(p.l,0)})`;
    cx.shadowColor="#ff2a2a";cx.shadowBlur=8;
    cx.fillRect(p.x,p.y,p.d?2:3,p.d?2:3);
  }
}

// optional synthesized engine sound (muted by default)
function startEngine(){
  if(!soundOn) return;
  try{
    ac=ac||new (window.AudioContext||window.webkitAudioContext)();
    const o=ac.createOscillator(), o2=ac.createOscillator(), g=ac.createGain(), f=ac.createBiquadFilter();
    o.type="sawtooth"; o2.type="square"; f.type="lowpass"; f.frequency.value=700;
    const t=ac.currentTime, d=DURATION/1000;
    o.frequency.setValueAtTime(45,t); o.frequency.exponentialRampToValueAtTime(110,t+.9);
    o.frequency.exponentialRampToValueAtTime(70,t+1.6); o.frequency.exponentialRampToValueAtTime(320,t+d-.3);
    o2.frequency.setValueAtTime(22,t); o2.frequency.exponentialRampToValueAtTime(160,t+d-.3);
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.12,t+.3); g.gain.linearRampToValueAtTime(.16,t+d-.4); g.gain.linearRampToValueAtTime(0,t+d);
    o.connect(f);o2.connect(f);f.connect(g);g.connect(ac.destination);
    o.start(t);o2.start(t);o.stop(t+d);o2.stop(t+d); engine=[o,o2];
  }catch(e){}
}
function stopEngine(){ try{engine&&engine.forEach(o=>o.stop())}catch(e){} engine=null }

$("soundBtn").addEventListener("click",e=>{
  soundOn=!soundOn; e.target.textContent="Sound: "+(soundOn?"On":"Off"); e.target.setAttribute("aria-pressed",soundOn);
  if(soundOn&&running) startEngine(); else if(!soundOn) stopEngine();
});

function typeText(el,txt,speed){
  el.textContent=""; let i=0;
  const iv=setInterval(()=>{ el.textContent=txt.slice(0,++i); if(i>=txt.length) clearInterval(iv); },speed);
  timers.push(iv);
}
const later=(fn,ms)=>timers.push(setTimeout(fn,ms));
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;

function startSequence(){
  if(running) return;                       // ignore repeated clicks
  running=true;
  const btn=$("startBtn"); btn.classList.add("pressed"); btn.disabled=true;
  later(()=>{ intro.classList.add("out"); loader.className="on"; begin(); }, reduce?0:380);
}

function begin(){
  const t0=performance.now();
  $("ign2").classList.remove("show"); typeText($("ign1"),"IGNITION STARTED...",reduce?0:45);
  later(()=>$("ign2").classList.add("show"), reduce?200:1100);
  if(!reduce){
    car.classList.add("shake");
    later(()=>car.classList.add("lit"),900);                       // headlights on
    later(()=>{car.classList.remove("shake");loader.classList.add("drive")},1500); // start driving
    later(()=>loader.classList.add("leave"),DURATION-900);          // streak + flash
    later(()=>car.classList.add("go"),DURATION-1200);               // accelerate away
  } else { car.classList.add("lit"); }
  startEngine();

  let lastMsg=-1;
  (function tick(now){
    const p=Math.min((now-t0)/DURATION,1), v=ease(p);
    const pct=Math.round(v*100);
    $("fill").style.width=pct+"%"; $("pct").textContent=pct+"%"; $("bar").setAttribute("aria-valuenow",pct);
    MESSAGES.forEach((m,i)=>{ if(p>=m[0]&&i>lastMsg){lastMsg=i;$("msg").textContent=m[1]} });
    if(!reduce && p>.3 && Math.random()<.6) spawn();
    drawParts();
    if(p<1) raf=requestAnimationFrame(tick); else finish();
  })(t0);
}

function finish(){
  cancelAnimationFrame(raf); timers.forEach(t=>{clearTimeout(t);clearInterval(t)}); timers=[];
  $("fill").style.width="100%"; $("pct").textContent="100%"; $("msg").textContent="SYSTEM READY.";
  loader.classList.add("off");
  site.classList.add("show");
  document.body.classList.remove("locked");   // profile usable immediately
  window.scrollTo(0,0);
  setTimeout(()=>{ loader.className=""; running=false; stopEngine(); },900);
}

function skip(){
  if(!running||site.classList.contains("show")) return;
  cancelAnimationFrame(raf); stopEngine(); finish();
}

$("startBtn").addEventListener("click",startSequence);
$("skipBtn").addEventListener("click",skip);
addEventListener("keydown",e=>{ if(e.key==="Escape") skip(); });

// replay: returns to the intro so START runs the full sequence again
$("replayBtn").addEventListener("click",()=>{
  site.classList.remove("show"); site.style.opacity=0; site.style.visibility="hidden";
  car.className=""; loader.className=""; parts=[];
  $("fill").style.width="0"; $("pct").textContent="0%"; $("msg").textContent="STARTING ENGINE...";
  const btn=$("startBtn"); btn.classList.remove("pressed"); btn.disabled=false;
  intro.classList.remove("out"); document.body.classList.add("locked"); window.scrollTo(0,0);
  setTimeout(()=>{site.style.opacity="";site.style.visibility=""},50);
});
