/* ============================================================
   5도권 회전판 웹앱 — app.js
   M1 정적렌더 · M2 표시판 · M3 회전 · M4 인덱스/패널
   M5 드래그물리 · M6 룰렛스핀 · M7 카드 · M8 고급 · M9 사운드/a11y
   좌표계: 위(12시)=0°, 시계방향 +.  중심 (130,130), 원판 반지름 115.
   ============================================================ */
"use strict";
const SVG_NS = "http://www.w3.org/2000/svg";
const CX = 130, CY = 130;

/* ---------- 기하 헬퍼 ---------- */
function polar(r, deg){ const a = (deg - 90) * Math.PI / 180; return { x: CX + r*Math.cos(a), y: CY + r*Math.sin(a) }; }
function S(tag, attrs){ const e = document.createElementNS(SVG_NS, tag); if(attrs) for(const k in attrs) e.setAttribute(k, attrs[k]); return e; }
function txt(x, y, s, attrs){ const t = S("text", Object.assign({x, y, "text-anchor":"middle", "dominant-baseline":"central"}, attrs)); t.textContent = s; return t; }
function ringSegment(rO, rI, startDeg, endDeg){
  const a = polar(rO, startDeg), b = polar(rO, endDeg), c = polar(rI, endDeg), d = polar(rI, startDeg);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${rO} ${rO} 0 ${large} 1 ${b.x} ${b.y} L ${c.x} ${c.y} A ${rI} ${rI} 0 ${large} 0 ${d.x} ${d.y} Z`;
}

/* ---------- DOM 핸들 ---------- */
const svg = document.querySelector("#wheel-svg");
const boardG = document.querySelector("#board");
const disc = document.querySelector("#disc");
const overlay = document.querySelector("#overlay");
const pointerG = document.querySelector("#pointer");
const indicator = document.querySelector("#indicator");
[overlay, indicator, pointerG].forEach(g => g.setAttribute("pointer-events", "none"));

/* ===================== M1: 정적 회전 원판 ===================== */
function buildBoard(){
  boardG.appendChild(S("circle", { cx:CX, cy:CY, r:119, fill:"#ffffff", "fill-opacity":"0.55", stroke:"#ffd6e7", "stroke-width":"1" }));
  // 드래그 히트 영역(투명) — 어디를 잡아도 회전
  boardG.appendChild(S("circle", { cx:CX, cy:CY, r:118, fill:"#ffffff", "fill-opacity":"0.001" }));
}

function buildDisc(){
  while(disc.firstChild) disc.removeChild(disc.firstChild);
  for(let i = 0; i < 12; i++){
    const start = i*30 - 15, end = i*30 + 15;
    const color = SEGMENT_COLORS[i];
    const cell = S("g", { class:"seg-cell", "data-seg": String(i) });

    // 색 채움 3링 (바깥/중간/안쪽)
    cell.appendChild(S("path", { d: ringSegment(111.5, 84, start, end), fill: color, stroke:"#fffefa", "stroke-width":"1.05" }));
    cell.appendChild(S("path", { d: ringSegment(84, 56, start, end), fill: color, "fill-opacity":"0.82", stroke:"#fffefa", "stroke-width":"1.05" }));
    cell.appendChild(S("path", { d: ringSegment(56, 28, start, end), fill: color, "fill-opacity":"0.64", stroke:"#fffefa", "stroke-width":"1.05" }));
    // 하이라이트용 외곽(전체 쐐기) — 항상 마지막 자식 직전, .seg-bg
    cell.appendChild(S("path", { class:"seg-bg", d: ringSegment(111.5, 28, start, end), fill:"none", stroke:"transparent", "stroke-width":"0.5" }));

    const k = KEYS[i];
    // 바깥 링: 장조
    const pMaj = polar(99, i*30);
    cell.appendChild(txt(pMaj.x, pMaj.y - 3.5, k.major, { class:"seg-major", "font-size": k.major.length>2?"7":"9", "font-weight":"900", fill:"#293241", "font-family":"var(--font)" }));
    cell.appendChild(txt(pMaj.x, pMaj.y + 6.5, k.majorKo, { "font-size":"3.1", "font-weight":"600", fill:"#5b6375", "font-family":"var(--font)" }));
    // 중간 링: 관계단조
    const pMin = polar(70, i*30);
    cell.appendChild(txt(pMin.x, pMin.y, k.minor, { "font-size":"6", "font-weight":"800", fill:"#374151", "font-family":"var(--font)" }));
    // 안쪽 링: 조표
    const pSig = polar(46, i*30);
    cell.appendChild(txt(pSig.x, pSig.y, k.accCount, { "font-size":"4.4", "font-weight":"800", fill:"#66545e", "font-family":"var(--font)" }));
    const pSig2 = polar(37, i*30);
    cell.appendChild(txt(pSig2.x, pSig2.y, k.acc === "조표 없음" ? "—" : k.acc, { "font-size":"2.5", "font-weight":"600", fill:"#8a7680", "font-family":"var(--font)" }));

    disc.appendChild(cell);
  }
  // 중앙 허브
  disc.appendChild(S("circle", { cx:CX, cy:CY, r:27, fill:"#ffffff", stroke:"#ffc2d1", "stroke-width":"1.1" }));
  disc.appendChild(S("circle", { cx:CX, cy:CY, r:22.4, fill:"#fff7fb", stroke:"#bde0fe", "stroke-width":"0.45", "stroke-dasharray":"1.6 1.1" }));
  disc.appendChild(txt(CX, CY-6, "5도권", { "font-size":"7", "font-weight":"900", fill:"#293241", "font-family":"var(--font)" }));
  disc.appendChild(txt(CX, CY+3, "회전 원판", { "font-size":"3.4", "font-weight":"700", fill:"#5b6375", "font-family":"var(--font)" }));
  disc.appendChild(S("circle", { cx:CX, cy:CY, r:2.5, fill:"#ffffff", stroke:"#ff5d8f", "stroke-width":"0.4" }));
}

/* ===================== M2: 표시판(정적) + 기준선 ===================== */
const FN_TAGS = [
  { deg:0,    t:"I"   }, { deg:-30, t:"IV"  }, { deg:30,  t:"V" },
  { deg:60,   t:"ii"  }, { deg:90,  t:"vi"  }, { deg:120, t:"iii" },
  { deg:150,  t:"vii°"}, { deg:-90, t:"동단조" },
];
function buildOverlay(){
  // 상단 '기준 읽기 창' 쐐기(3링을 가로지름)
  overlay.appendChild(S("path", { d: ringSegment(112, 28, -15, 15), fill:"none", stroke:"#ff5d8f", "stroke-width":"1.1", "stroke-dasharray":"2 1.2" }));
  // 기능 태그(디스크 바깥 림에)
  for(const f of FN_TAGS){
    const p = polar(122, f.deg);
    const w = f.t.length > 2 ? 13 : 8;
    overlay.appendChild(S("rect", { x:p.x-w/2, y:p.y-4, width:w, height:8, rx:4, fill:"#ffffff", "fill-opacity":"0.92", stroke:"#9b7ede", "stroke-width":"0.4" }));
    overlay.appendChild(txt(p.x, p.y, f.t, { "font-size":"3.4", "font-weight":"900", fill:"#6b4fae", "font-family":"var(--font)" }));
  }
}
function buildIndicator(){
  // 12시 기준선 마커: 라벨(상단) + 아래로 향하는 삼각형 + 짧은 가이드선
  indicator.appendChild(S("rect", { x:CX-13, y:0.5, width:26, height:7.5, rx:3.5, fill:"#fff0f6", stroke:"#ff8fab", "stroke-width":"0.5" }));
  indicator.appendChild(txt(CX, 4.3, "기준선", { "font-size":"3.4", "font-weight":"900", fill:"#d6336c", "font-family":"var(--font)" }));
  indicator.appendChild(S("path", { d:`M ${CX} 18 L ${CX-5} 10 L ${CX+5} 10 Z`, fill:"#ff5d8f" }));   // 아래로 향함
  indicator.appendChild(S("line", { x1:CX, y1:18, x2:CX, y2:26, stroke:"#ff5d8f", "stroke-width":"1.1" }));
}

/* ===================== M3: 회전 상태 + 렌더 ===================== */
const wheel = { angle: 0, omega: 0, mode: "idle" }; // mode: idle|dragging|spinning|settling|tweening
function render(){ disc.setAttribute("transform", `rotate(${wheel.angle} ${CX} ${CY})`); }
function toSvgCoords(ev){
  const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
  return p.matrixTransform(svg.getScreenCTM().inverse());
}

/* ===================== M4: 인덱스 매핑 ===================== */
function selectedIndex(angle){ const raw = Math.round(-angle / 30); return ((raw % 12) + 12) % 12; }
function nearestDetent(angle){ return Math.round(angle / 30) * 30; }

/* ===================== M5: 물리 (점성+쿨롱 마찰) ===================== */
const VISCOUS = 1.2, COULOMB = 140, MAX_OMEGA = 1800, SETTLE_OMEGA = 90, SETTLE_MS = 420, MAX_DT = 0.032;
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let _last = null, _settle = null, _running = false;
// 물리 루프는 '움직일 때만' 구동(idle이면 rAF 중단 → CPU 절약 + 페이지 유휴).
function ensureLoop(){ if(!_running){ _running = true; _last = null; requestAnimationFrame(loop); } }
function loop(now){
  if(_last == null) _last = now;
  let dt = (now - _last) / 1000; _last = now;
  if(dt > MAX_DT) dt = MAX_DT;

  if(wheel.mode === "spinning"){
    integrate(dt);
    if(Math.abs(wheel.omega) < SETTLE_OMEGA) startSettle();
  } else if(wheel.mode === "settling"){
    stepSettle(now);
  }
  render();
  if(wheel.mode === "spinning" || wheel.mode === "settling") requestAnimationFrame(loop);
  else _running = false;            // idle/dragging/tweening → 루프 종료
}
function integrate(dt){
  const STEP = 1/240; let t = dt;
  while(t > 0){
    const h = Math.min(STEP, t);
    const s = Math.sign(wheel.omega) || 0;
    let next = wheel.omega - (VISCOUS*wheel.omega + COULOMB*s) * h;
    if(Math.sign(next) !== s) next = 0;
    wheel.omega = next;
    wheel.angle += wheel.omega * h;
    t -= h;
  }
}
function startSettle(){
  _settle = { from: wheel.angle, to: nearestDetent(wheel.angle), start: null, dur: SETTLE_MS };
  wheel.mode = "settling"; wheel.omega = 0;
}
function stepSettle(now){
  if(_settle.start == null) _settle.start = now;
  const p = Math.min(1, (now - _settle.start) / _settle.dur);
  const e = easeOutBack(p);
  wheel.angle = _settle.from + (_settle.to - _settle.from) * e;
  if(p >= 1){ wheel.angle = _settle.to; wheel.mode = "idle"; onStop(selectedIndex(wheel.angle)); }
}
function easeOutBack(t){ const b = 1.1; return 1 + (b+1)*Math.pow(t-1,3) + b*Math.pow(t-1,2); }
function easeOutCubic(t){ return 1 - Math.pow(1-t, 3); }
function easeOutQuart(t){ return 1 - Math.pow(1-t, 4); }

/* ===================== M6: 룰렛/최단 트윈 ===================== */
function tweenAngle(from, to, dur, ease, done){
  wheel.mode = "tweening"; wheel.omega = 0;
  let start = null;
  function frame(now){
    if(wheel.mode !== "tweening") return;          // 드래그 인터럽트 시 양보
    if(start == null) start = now;
    const p = Math.min(1, (now - start) / dur);
    wheel.angle = from + (to - from) * ease(p);
    render();
    if(p < 1) requestAnimationFrame(frame);
    else { wheel.mode = "idle"; done && done(); }
  }
  requestAnimationFrame(frame);
}
function spinTo(targetIndex, opts){
  opts = opts || {};
  const turns = REDUCED ? 0 : (opts.turns != null ? opts.turns : 4 + Math.floor(Math.random()*3));
  const dur = REDUCED ? 380 : (opts.dur || 3800);
  const idx = (targetIndex == null) ? Math.floor(Math.random()*12) : targetIndex;
  const base = wheel.angle;
  const targetMod = ((-idx*30) % 360 + 360) % 360;
  const curMod = ((base % 360) + 360) % 360;
  let forward = targetMod - curMod; if(forward < 0) forward += 360;
  const to = base + turns*360 + forward;
  tweenAngle(base, to, dur, easeOutQuart, () => onStop(idx));
}
function stepTo(targetIndex, dur){
  dur = dur || (REDUCED ? 160 : 420);
  const base = wheel.angle;
  const targetBase = -targetIndex * 30;
  const delta = (((targetBase - base) % 360) + 540) % 360 - 180;
  tweenAngle(base, base + delta, dur, easeOutCubic, () => onStop(targetIndex));
}

/* ===================== 드래그 입력 ===================== */
let drag = null;
function angleOfPointer(ev){ const p = toSvgCoords(ev); return Math.atan2(p.x - CX, -(p.y - CY)) * 180 / Math.PI; }
svg.addEventListener("pointerdown", (ev) => {
  const p = toSvgCoords(ev);
  if(Math.hypot(p.x - CX, p.y - CY) > 118) return;   // 디스크 밖이면 무시
  ev.preventDefault();
  svg.setPointerCapture(ev.pointerId);
  wheel.mode = "dragging"; wheel.omega = 0;
  const a = angleOfPointer(ev);
  drag = { lastAngle: a, cum: a, samples: [{ a, t: ev.timeStamp }] };
});
svg.addEventListener("pointermove", (ev) => {
  if(wheel.mode !== "dragging" || !drag) return;
  const a = angleOfPointer(ev);
  let d = a - drag.lastAngle; if(d > 180) d -= 360; else if(d < -180) d += 360;
  wheel.angle += d; drag.lastAngle = a; drag.cum += d;
  drag.samples.push({ a: drag.cum, t: ev.timeStamp });
  const cutoff = ev.timeStamp - 80;
  while(drag.samples.length > 2 && drag.samples[0].t < cutoff) drag.samples.shift();
  render();
});
function endDrag(){
  if(wheel.mode !== "dragging") return;
  const s = drag.samples, first = s[0], last = s[s.length-1];
  const dt = (last.t - first.t) / 1000;
  let w = dt > 0 ? (last.a - first.a) / dt : 0;
  w = Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, w));
  wheel.omega = w; drag = null;
  if(Math.abs(w) < SETTLE_OMEGA) startSettle();
  else wheel.mode = "spinning";
  ensureLoop();
}
svg.addEventListener("pointerup", endDrag);
svg.addEventListener("pointercancel", endDrag);

/* ===================== 읽기(창 → 데이터) ===================== */
function readWindows(i){
  const at = (off) => KEYS[((i + off) % 12 + 12) % 12];
  const k = KEYS[i];
  return {
    key: k,
    I: k.major, IV: at(-1).major, V: at(1).major,
    relativeMinor: at(0).minor,
    parallelMinor: at(-3).minor,
    signature: { count: k.accCount, notes: k.acc },
    diatonic: DIATONIC[k.major],
  };
}

/* ===================== 정지 콜백 + 하이라이트 ===================== */
let currentIndex = 0;
let currentTarget = null; // 세컨더리 도미넌트 대상(다이어토닉 인덱스 0..6)
function onStop(i){
  currentIndex = i;
  updateHighlights(i);
  updatePanel(i);
  updateChips(i);
  updatePointer();
  announce(i);
}
function updateHighlights(i){
  disc.querySelectorAll("[data-seg]").forEach(el => el.classList.remove("hl","hl-root"));
  [-1,0,1,2,3,4,5].forEach(off => {
    const seg = ((i + off) % 12 + 12) % 12;
    const el = disc.querySelector(`[data-seg="${seg}"]`);
    if(el) el.classList.add("hl");
  });
  const root = disc.querySelector(`[data-seg="${i}"]`);
  if(root){ root.classList.remove("hl"); root.classList.add("hl-root"); }
}

/* ===================== 정보 패널 (레벨 게이트) ===================== */
let level = "beginner";
const elMajor = document.querySelector("#now-major");
const elMajorKo = document.querySelector("#now-majorko");
const elRows = document.querySelector("#info-rows");
const diatonicBox = document.querySelector("#diatonic-box");
const diatonicChips = document.querySelector("#diatonic-chips");
const sdResult = document.querySelector("#sd-result");

function row(k, v, sub){ return `<div class="k">${k}</div><div class="v">${v}${sub?` <small>${sub}</small>`:""}</div>`; }
function updatePanel(i){
  const w = readWindows(i), k = w.key;
  elMajor.textContent = k.major;
  elMajorKo.textContent = k.majorKo + (k.enharmonic ? ` · 이명동음 ${k.enharmonic.major}` : "");
  let html = "";
  html += row("관계단조", w.relativeMinor, k.minorKo);
  html += row("조표", w.signature.count, w.signature.notes === "조표 없음" ? "없음" : w.signature.notes);
  if(level !== "beginner"){
    html += row("딸림조 V", w.V);
    html += row("버금딸림조 IV", w.IV);
    html += row("같은 으뜸음 단조", w.parallelMinor);
  }
  elRows.innerHTML = html;

  if(level === "advanced"){
    diatonicBox.hidden = false;
    diatonicChips.innerHTML = "";
    w.diatonic.forEach((chord, idx) => {
      const b = document.createElement("button");
      b.innerHTML = `<span class="deg">${DEGREE_LABELS[idx]}</span><span>${chord}</span>`;
      b.addEventListener("click", () => { selectTarget(idx); playChordName(chord); });
      diatonicChips.appendChild(b);
    });
    if(currentTarget != null) renderSD(i); else sdResult.hidden = true;
  } else {
    diatonicBox.hidden = true;
    currentTarget = null;
  }
}

/* ===================== M8: 세컨더리 도미넌트 ===================== */
function rootOf(chord){ return chord.replace(/(maj|m|dim|°|7).*$/, ""); }
function secondaryDominant(targetChord){
  const idx = ROOT_TO_INDEX[rootOf(targetChord)];
  if(idx == null) return null;
  return KEYS[(idx + 1) % 12].major + "7";
}
function selectTarget(degIdx){ currentTarget = degIdx; renderSD(currentIndex); updatePointer(); }
function renderSD(i){
  const w = readWindows(i);
  const target = w.diatonic[currentTarget];
  const dom = secondaryDominant(target);
  sdResult.hidden = false;
  sdResult.innerHTML = dom
    ? `세컨더리 도미넌트 <b>V/${DEGREE_LABELS[currentTarget]}</b> = <b>${dom}</b> → 해결 <b>${target}</b>`
    : `${target} 의 세컨더리 도미넌트는 표에 없습니다.`;
}

/* 포인터(고급 토글) */
function updatePointer(){
  const on = document.querySelector("#sd-toggle").checked;
  pointerG.style.display = on ? "" : "none";
  if(!on || currentTarget == null) return;
  const w = readWindows(currentIndex);
  const targetChord = w.diatonic[currentTarget];
  const tIdx = ROOT_TO_INDEX[rootOf(targetChord)];
  if(tIdx == null) return;
  // 대상 칸이 현재 화면에서 놓인 각도 = tIdx*30 + wheel.angle
  pointerG.setAttribute("transform", `rotate(${tIdx*30 + wheel.angle} ${CX} ${CY})`);
}
function buildPointer(){
  const mk = (deg, label, code, color) => {
    const p = polar(99, deg);
    const g = S("g");
    g.appendChild(S("rect", { x:p.x-19, y:p.y-8, width:38, height:16, rx:4, fill:"#ffffff", "fill-opacity":"0.55", stroke:color, "stroke-width":"1" }));
    g.appendChild(txt(p.x, p.y-3.5, label, { "font-size":"3", "font-weight":"800", fill:color, "font-family":"var(--font)" }));
    g.appendChild(txt(p.x, p.y+3.5, code, { "font-size":"4", "font-weight":"900", fill:color, "font-family":"var(--font)" }));
    return g;
  };
  pointerG.appendChild(mk(0, "대상 코드", "대상", "#0f766e"));
  pointerG.appendChild(mk(30, "세컨더리", "V/대상", "#d6336c"));
  const a = polar(99,0), b = polar(99,30);
  pointerG.appendChild(S("line", { x1:a.x, y1:a.y, x2:b.x, y2:b.y, stroke:"#d6336c", "stroke-width":"0.7", "stroke-dasharray":"2 1" }));
  pointerG.style.display = "none";
}

/* ===================== 조성 칩 ===================== */
const keyChips = document.querySelector("#key-chips");
function buildChips(){
  KEYS.forEach(k => {
    const b = document.createElement("button");
    b.textContent = k.major; b.dataset.idx = k.i;
    b.addEventListener("click", () => stepTo(k.i));
    keyChips.appendChild(b);
  });
}
function updateChips(i){
  keyChips.querySelectorAll("button").forEach(b => b.classList.toggle("sel", +b.dataset.idx === i));
}

/* ===================== M9: 사운드 (Web Audio) ===================== */
let actx = null;
function audio(){ if(!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); return actx; }
function soundOn(){ return document.querySelector("#sound-toggle").checked; }
function midiToFreq(m){ return 440 * Math.pow(2, (m - 69) / 12); }
function triadMidi(root, quality){
  const third = quality === "maj" ? 4 : 3;
  const fifth = quality === "dim" ? 6 : 7;
  const r = 60 + (PITCH_CLASS[root] ?? 0);
  return [r, r+third, r+fifth];
}
function parseChord(chord){
  const root = rootOf(chord);
  let quality = "maj";
  if(/dim|°/.test(chord)) quality = "dim"; else if(/m(?!aj)/.test(chord)) quality = "min";
  return { root, quality };
}
function playChordName(chord){
  if(!soundOn()) return;
  const { root, quality } = parseChord(chord);
  playMidi(triadMidi(root, quality));
}
function playKeyChord(i){ if(soundOn()) playChordName(KEYS[i].major); }
function playMidi(notes){
  const ctx = audio(); const t0 = ctx.currentTime; const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.1);
  g.connect(ctx.destination);
  notes.forEach(m => { const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = midiToFreq(m); o.connect(g); o.start(t0); o.stop(t0 + 1.15); });
}

/* ===================== 접근성 ===================== */
const live = document.querySelector("#aria-live");
function announce(i){
  const w = readWindows(i), k = w.key;
  live.textContent = `현재 ${k.major} ${k.majorKo}, 관계단조 ${w.relativeMinor}, 조표 ${w.signature.count}${w.signature.notes==="조표 없음"?"":" "+w.signature.notes}`;
}

/* ===================== M7: 미션 카드 ===================== */
let score = 0;
let deck = [];
let activeCard = null;
const elCardId = document.querySelector("#card-id");
const elCardIdBack = document.querySelector("#card-id-back");
const elCardQ = document.querySelector("#card-q");
const elCardA = document.querySelector("#card-a");
const cardFront = document.querySelector(".card-front");
const cardBack = document.querySelector(".card-back");
const missionCard = document.querySelector("#mission-card");
const revealBtn = document.querySelector("#reveal-btn");
const scoreAdd = document.querySelector("#score-add");
const deckInfo = document.querySelector("#deck-info");

function shuffle(a){ for(let k=a.length-1;k>0;k--){ const j=Math.floor(Math.random()*(k+1)); [a[k],a[j]]=[a[j],a[k]]; } return a; }
function newDeck(){ deck = shuffle([...CARDS[level]]); updateDeckInfo(); }
function updateDeckInfo(){ deckInfo.textContent = `${level==="beginner"?"초급":level==="intermediate"?"중급":"고급"} 남은 카드 ${deck.length}/${CARDS[level].length}`; }
function drawCard(){
  if(deck.length === 0){ newDeck(); }
  activeCard = deck.pop(); updateDeckInfo();
  elCardId.textContent = activeCard.id;
  elCardQ.textContent = activeCard.q;
  cardFront.hidden = false; cardBack.hidden = true;
  missionCard.dataset.face = "front";
  revealBtn.disabled = false; scoreAdd.hidden = true;
}
function revealCard(){
  if(!activeCard) return;
  elCardIdBack.textContent = activeCard.id + " 정답";
  elCardA.textContent = activeCard.a;
  cardFront.hidden = true; cardBack.hidden = false;
  missionCard.dataset.face = "back";
  revealBtn.disabled = true; scoreAdd.hidden = false;
}

/* ===================== 와이어링 ===================== */
function setLevel(lv){
  level = lv;
  document.querySelectorAll("#level-toggle button").forEach(b => b.classList.toggle("active", b.dataset.level === lv));
  document.querySelector("#sd-switch").hidden = (lv !== "advanced");
  if(lv !== "advanced"){ document.querySelector("#sd-toggle").checked = false; pointerG.style.display = "none"; }
  newDeck();
  updatePanel(currentIndex);
}
document.querySelectorAll("#level-toggle button").forEach(b => b.addEventListener("click", () => setLevel(b.dataset.level)));
document.querySelector("#spin-btn").addEventListener("click", () => { audio(); spinTo(null); });
document.querySelector("#draw-btn").addEventListener("click", drawCard);
revealBtn.addEventListener("click", revealCard);
scoreAdd.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
  score += +b.dataset.pt; document.querySelector("#score").textContent = score; scoreAdd.hidden = true;
}));
document.querySelector("#sd-toggle").addEventListener("change", updatePointer);
document.querySelector("#sound-toggle").addEventListener("change", () => audio());

window.addEventListener("keydown", (ev) => {
  if(ev.target.matches("input,button")) return;
  if(ev.key === "ArrowRight"){ ev.preventDefault(); stepTo(((currentIndex+1)%12)); }
  else if(ev.key === "ArrowLeft"){ ev.preventDefault(); stepTo(((currentIndex+11)%12)); }
  else if(ev.key === " "){ ev.preventDefault(); audio(); spinTo(null); }
});

/* ===================== 부팅 ===================== */
buildBoard(); buildDisc(); buildOverlay(); buildIndicator(); buildPointer(); buildChips();
render();
onStop(0);
newDeck();
// 물리 루프는 사용자가 돌릴 때(ensureLoop) 자동 시작. 부팅 시 상시 구동하지 않음.

/* ===================== 개발용 self-test (콘솔) ===================== */
(function tests(){
  const eq = (a,b,m) => console.assert(a===b, `FAIL ${m}: ${a} !== ${b}`);
  eq(selectedIndex(0),0,"sel(0)=C");
  eq(selectedIndex(-30),1,"sel(-30)=G");
  eq(selectedIndex(30),11,"sel(30)=F");
  eq(selectedIndex(-90),3,"sel(-90)=A");
  eq(selectedIndex(330),1,"sel(330)=G");
  // 기하 vi(=관계단조) 루트의 음높이 == 표 관계단조 루트의 음높이 (이명동음 허용)
  for(let i=0;i<12;i++){
    const geoRoot = KEYS[(i+3)%12].major;
    const relRoot = rootOf(KEYS[i].minor);
    eq(PITCH_CLASS[geoRoot], PITCH_CLASS[relRoot], `vi pitch i=${i}`);
  }
  // spinTo 착지: 임의 시작각에서 목표 인덱스가 기준선에 오는지(수학 검증)
  for(let k=0;k<12;k++){
    const base=137.4, targetMod=((-k*30)%360+360)%360, curMod=((base%360)+360)%360;
    let f=targetMod-curMod; if(f<0)f+=360; const to=base+5*360+f;
    eq(selectedIndex(to), k, `spinTo land k=${k}`);
  }
  console.log("[self-test] selectedIndex/geometry/spin OK");
})();
