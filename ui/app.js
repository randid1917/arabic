/* ===================================================================
   UI
   =================================================================== */

import { conjugationDrill, sentenceDrill } from "../engine/generator.js";
import { judge } from "../engine/judge.js";

const LEN = 15;
let mode = "conj", queue = [], idx = 0, marks = [], leaks = [], retry = null;

function build(){
  queue = Array.from({length:LEN}, () => mode==="conj" ? conjugationDrill() : sentenceDrill());
  idx = 0; marks = []; leaks = []; retry = null;
  render();
}

function rail(){
  const r = document.getElementById("rail");
  r.innerHTML = "";
  for(let i=0;i<LEN;i++){
    const d = document.createElement("div");
    d.className = "tick" + (marks[i] ? " "+({correct:"hit",tax:"tax",wrong:"miss"})[marks[i]] : (i===idx?" now":""));
    r.appendChild(d);
  }
  document.getElementById("count").textContent = idx<LEN ? `${idx+1} / ${LEN}` : `${LEN} / ${LEN}`;
}

function render(){
  rail();
  const stage = document.getElementById("stage");
  if(idx >= LEN) return score();
  const q = queue[idx];
  stage.innerHTML = `
    <div class="eyebrow">${q.eyebrow}</div>
    <p class="prompt">${q.prompt}</p>
    <input class="field" id="ans" placeholder="type it in Arabizi"
      autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" inputmode="latin">
    <button class="go" id="go">Check</button>
    <div class="hint">3 = ع &nbsp; 7 = ح &nbsp; no apostrophes</div>
    <div id="fb"></div>`;
  const input = document.getElementById("ans");
  input.focus();
  const submit = () => check(input.value);
  document.getElementById("go").onclick = submit;
  input.onkeydown = e => { if(e.key === "Enter") submit(); };
}

function check(val){
  if(!val.trim()) return;
  const q = queue[idx];
  const r = judge(val, q.accept);
  marks[idx] = r.state;
  if(r.state === "wrong") leaks.push(`${q.accept[0]}  —  ${q.prompt}`);
  rail();

  const sym = {correct:"✅", tax:"⌫", wrong:"❌"}[r.state];
  const cls = {correct:"good", tax:"taxc", wrong:"bad"}[r.state];
  const fb = document.getElementById("fb");
  fb.className = "fb " + r.state;

  if(r.state === "correct"){
    fb.innerHTML = `
      <div class="q">${q.prompt}</div>
      <div class="row"><span class="sym">✅</span><span class="val good">${r.target}</span></div>`;
    document.getElementById("ans").disabled = true;
    const go = document.getElementById("go");
    go.textContent = "Next"; go.onclick = next;
    document.onkeydown = e => { if(e.key === "Enter") next(); };
    return;
  }

  const taxLine = r.state === "tax"
    ? `<div class="why">Typing tax — letters transposed, not a grammar miss. Not counted against you.</div>`
    : `<div class="why">${q.note}</div>`;

  fb.innerHTML = `
    <div class="q">${q.prompt}</div>
    <div class="row"><span class="sym">${sym}</span><span class="val ${cls}">${val}</span></div>
    <div class="row"><span class="sym">✅</span><span class="val good">${r.target}</span></div>
    <div class="row"><span class="sym">💡</span><span>${taxLine}</span></div>
    <div class="row"><span class="sym">🔁</span><span class="val" style="color:var(--muted)">retype it once to continue</span></div>`;

  retry = r.target;
  const input = document.getElementById("ans");
  input.value = ""; input.focus();
  const go = document.getElementById("go");
  go.textContent = "Confirm";
  const confirm = () => {
    if(judge(input.value, [retry]).state === "wrong") { input.focus(); return; }
    next();
  };
  go.onclick = confirm;
  input.onkeydown = e => { if(e.key === "Enter") confirm(); };
}

function next(){ document.onkeydown = null; idx++; render(); }

function score(){
  document.onkeydown = null;
  const n = s => marks.filter(m => m===s).length;
  const real = LEN - n("tax");
  const pct = real ? Math.round(n("correct")/real*100) : 100;
  document.getElementById("stage").innerHTML = `
    <div class="score">
      <div class="eyebrow">Session done</div>
      <h2>${pct}%</h2>
      <div class="sub">${n("correct")} of ${real} scored items. Typing tax excluded.</div>
      <div class="bd"><span>Correct</span><span class="n">${n("correct")}</span></div>
      <div class="bd"><span>Missed</span><span class="n">${n("wrong")}</span></div>
      <div class="bd"><span>Typing tax</span><span class="n">${n("tax")}</span></div>
      ${leaks.length ? `<div class="leak"><h3>Drill these again</h3><ul>${
        leaks.map(l=>`<li>${l}</li>`).join("")}</ul></div>` : ""}
      <button class="go" id="again" style="margin-top:28px">Run another ${LEN}</button>
    </div>`;
  document.getElementById("again").onclick = build;
}

document.getElementById("tab-conj").onclick = () => setMode("conj");
document.getElementById("tab-sent").onclick = () => setMode("sent");
function setMode(m){
  mode = m;
  document.getElementById("tab-conj").setAttribute("aria-selected", m==="conj");
  document.getElementById("tab-sent").setAttribute("aria-selected", m==="sent");
  build();
}
build();
