// 라운드 타이머: 준비 10초 → 라운드 → 휴식 → … → 끝.
// 화면을 떠나도 타이머는 계속 돈다(카드 보면서 휴식 가능). 화면은 돌아오면 다시 그린다.
import { PROGRAM, COMBOS, MOVES } from "./data.js";

const PREP_SEC = 10;
const WARN_SEC = 10;
const SPEEDS = { slow: [6, 9], normal: [4, 6], fast: [2.5, 4] };
const SPEED_LABELS = { slow: "느리게", normal: "보통", fast: "빠르게" };
const STORE_KEY = "boxing.timer.v1";
const DEFAULTS = {
  week: 1, roundSec: 120, restSec: 60, rounds: 3, speed: "normal",
  bell: true, warn: true, callout: true, voice: true, wakeLock: true,
};
const TOGGLES = [
  { k: "bell", name: "종소리", sub: "라운드 시작 1번, 끝 3번" },
  { k: "warn", name: "10초 전 알림", sub: "라운드·휴식 끝나기 10초 전 딱딱딱" },
  { k: "callout", name: "콤비 콜아웃", sub: "라운드 중 칠 콤비를 무작위로 지시" },
  { k: "voice", name: "음성으로 읽기", sub: "콤비를 소리 내서 불러줌 (원 투!)" },
  { k: "wakeLock", name: "화면 꺼짐 방지", sub: "타이머가 도는 동안 화면 유지" },
];
const PHASE_LABELS = { idle: "대기", prep: "준비", round: "라운드", rest: "휴식", done: "끝" };

const S = loadSettings();
const T = { phase: "idle", round: 0, endAt: 0, remaining: 0, total: 0, running: false, warned: false, nextCallAt: 0, combo: null };
let loopId = null;
let audio = null;
let wakeLock = null;

function loadSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") }; }
  catch { return { ...DEFAULTS }; }
}
function saveSettings() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch {}
}

// ── 소리 ──────────────────────────────
function ctx() {
  if (!audio) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (C) audio = new C();
  }
  if (audio && audio.state === "suspended") audio.resume();
  return audio;
}
function ding(a, t) {
  const out = a.createGain();
  out.connect(a.destination);
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(0.5, t + 0.01);
  out.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
  // 금속 종 느낌을 내는 비정수배 배음
  for (const [mul, gain] of [[1, 1], [2.76, 0.4], [5.4, 0.2]]) {
    const o = a.createOscillator();
    const g = a.createGain();
    o.frequency.value = 740 * mul;
    g.gain.value = gain;
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 1.7);
  }
}
function bell(times) {
  const a = S.bell && ctx();
  if (!a) return;
  for (let i = 0; i < times; i++) ding(a, a.currentTime + i * 0.45);
}
function clap() {
  const a = S.warn && ctx();
  if (!a) return;
  for (let i = 0; i < 3; i++) {
    const t = a.currentTime + i * 0.16;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = "square";
    o.frequency.value = 1300;
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + 0.07);
  }
}
function say(text) {
  if (!S.voice || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  u.rate = 1.15;
  speechSynthesis.speak(u);
}
function hush() {
  if ("speechSynthesis" in window) speechSynthesis.cancel();
}

// ── 화면 꺼짐 방지 ──────────────────────
async function acquireWake() {
  if (!S.wakeLock || wakeLock || !("wakeLock" in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => { wakeLock = null; });
  } catch {}
}
function releaseWake() {
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && T.running) acquireWake();
});

// ── 콤비 ──────────────────────────────
function pickCombo() {
  const pool = COMBOS.filter((c) => c.from <= S.week);
  let c;
  do { c = pool[Math.floor(Math.random() * pool.length)]; }
  while (pool.length > 1 && c === T.combo);
  return c;
}
function scheduleCall(now, combo) {
  const [lo, hi] = SPEEDS[S.speed];
  const extra = combo ? combo.seq.length * 0.4 : 0; // 긴 콤비 뒤엔 조금 더 여유
  T.nextCallAt = now + (lo + Math.random() * (hi - lo) + extra) * 1000;
}

// ── 진행 ──────────────────────────────
function enter(phase, now) {
  T.phase = phase;
  T.warned = false;
  T.combo = null;
  T.total = { prep: PREP_SEC, round: S.roundSec, rest: S.restSec }[phase] || 0;
  T.endAt = now + T.total * 1000;
  T.remaining = T.total * 1000;
  if (phase === "round") { bell(1); T.nextCallAt = now + 2500; }
  if (phase === "rest") bell(3);
  if (phase === "done") { bell(3); T.running = false; stopLoop(); releaseWake(); }
}
function advance(now) {
  if (T.phase === "prep") { T.round = 1; enter("round", now); }
  else if (T.phase === "round") enter(T.round >= S.rounds ? "done" : "rest", now);
  else if (T.phase === "rest") { T.round++; enter("round", now); }
}
function tick() {
  if (!T.running) return;
  const now = Date.now();
  const rem = T.endAt - now;
  if (rem <= 0) { advance(now); render(); return; }
  if (!T.warned && rem <= WARN_SEC * 1000 && T.total > WARN_SEC + 5 && (T.phase === "round" || T.phase === "rest")) {
    T.warned = true;
    clap();
  }
  if (T.phase === "round" && S.callout && now >= T.nextCallAt && rem > 3000) {
    const c = pickCombo();
    T.combo = c;
    say(c.seq.map((m) => MOVES[m]?.say || m).join(" "));
    scheduleCall(now, c);
  }
  render();
}
function startLoop() { if (!loopId) loopId = setInterval(tick, 200); }
function stopLoop() { clearInterval(loopId); loopId = null; }

function start() {
  ctx(); // 모바일은 터치 순간에 오디오를 깨워야 한다
  const now = Date.now();
  T.running = true;
  if (T.phase === "idle" || T.phase === "done") {
    T.round = 0;
    enter("prep", now);
    say("준비");
  } else {
    T.endAt = now + T.remaining;
    T.nextCallAt = now + 1500;
  }
  startLoop();
  acquireWake();
  render();
}
function pause() {
  T.remaining = T.endAt - Date.now();
  T.running = false;
  stopLoop();
  hush();
  releaseWake();
  render();
}
function reset() {
  T.running = false;
  T.phase = "idle";
  T.round = 0;
  T.combo = null;
  stopLoop();
  hush();
  releaseWake();
  render();
}
function skip() {
  if (T.phase === "idle" || T.phase === "done") return;
  const now = Date.now();
  advance(now);
  render();
}

// ── 화면 ──────────────────────────────
const fmt = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
const editable = () => T.phase === "idle" || T.phase === "done";

export function renderTimer(app) {
  app.innerHTML = `
    <section class="timer">
      <div class="t-face" id="t-face">
        <div class="t-top"><span id="t-phase"></span><span id="t-round"></span></div>
        <div class="t-time" id="t-time"></div>
        <div class="t-bar"><div id="t-bar"></div></div>
        <div class="t-combo" id="t-combo" aria-live="polite"></div>
      </div>

      <div class="t-controls">
        <button type="button" class="t-btn ghost" id="t-reset">리셋</button>
        <button type="button" class="t-btn main" id="t-main"></button>
        <button type="button" class="t-btn ghost" id="t-skip">건너뛰기</button>
      </div>

      <section class="block">
        <h3>켜고 끄기 <small>운동 중에도 바로 바뀜</small></h3>
        <ul class="toggles">
          ${TOGGLES.map((t) => `
            <li><label>
              <span><b>${t.name}</b><small>${t.sub}</small></span>
              <input type="checkbox" role="switch" class="switch" data-toggle="${t.k}">
            </label></li>`).join("")}
        </ul>
      </section>

      <section class="block">
        <h3>라운드 설정 <small>리셋한 상태에서만 바뀜</small></h3>
        <p class="t-label">주차 프로그램</p>
        <div class="weeks">
          ${PROGRAM.map((p) => `<button type="button" data-week="${p.week}">${p.week}주</button>`).join("")}
        </div>
        <p class="t-focus" id="t-focus"></p>
        <div class="steppers">
          ${stepper("roundSec", "라운드 시간")}
          ${stepper("restSec", "휴식 시간")}
          ${stepper("rounds", "라운드 수")}
        </div>
        <p class="t-label">콜아웃 속도</p>
        <div class="seg">
          ${Object.entries(SPEED_LABELS).map(([k, v]) => `<button type="button" data-speed="${k}">${v}</button>`).join("")}
        </div>
      </section>
    </section>`;

  const $ = (sel) => app.querySelector(sel);
  $("#t-main").onclick = () => (T.running ? pause() : start());
  $("#t-reset").onclick = reset;
  $("#t-skip").onclick = skip;

  app.querySelectorAll("[data-toggle]").forEach((el) => {
    el.onchange = () => {
      S[el.dataset.toggle] = el.checked;
      saveSettings();
      if (el.dataset.toggle === "wakeLock") (el.checked && T.running ? acquireWake() : releaseWake());
      if ((el.dataset.toggle === "voice" || el.dataset.toggle === "callout") && !el.checked) hush();
      if (el.dataset.toggle === "callout") T.combo = null;
      render();
    };
  });
  app.querySelectorAll("[data-week]").forEach((el) => {
    el.onclick = () => {
      if (!editable()) return;
      const p = PROGRAM.find((x) => x.week === Number(el.dataset.week));
      Object.assign(S, { week: p.week, roundSec: p.roundSec, restSec: p.restSec, rounds: p.rounds });
      saveSettings();
      render();
    };
  });
  app.querySelectorAll("[data-step]").forEach((el) => {
    el.onclick = () => {
      if (!editable()) return;
      const [k, dir] = el.dataset.step.split(":");
      const r = RANGES[k];
      S[k] = Math.min(r.max, Math.max(r.min, S[k] + r.step * Number(dir)));
      saveSettings();
      render();
    };
  });
  app.querySelectorAll("[data-speed]").forEach((el) => {
    el.onclick = () => { S.speed = el.dataset.speed; saveSettings(); render(); };
  });

  render();
}

const RANGES = {
  roundSec: { min: 30, max: 300, step: 30, fmt },
  restSec: { min: 15, max: 120, step: 15, fmt },
  rounds: { min: 1, max: 12, step: 1, fmt: (n) => `${n}R` },
};
function stepper(k, label) {
  return `
    <div class="stepper">
      <span class="t-label">${label}</span>
      <div>
        <button type="button" data-step="${k}:-1" aria-label="${label} 줄이기">−</button>
        <b data-val="${k}"></b>
        <button type="button" data-step="${k}:1" aria-label="${label} 늘리기">+</button>
      </div>
    </div>`;
}

function render() {
  const face = document.getElementById("t-face");
  if (!face) return; // 다른 화면에 있을 때
  const app = face.closest(".timer");
  const $ = (sel) => app.querySelector(sel);

  const remMs = T.phase === "idle" ? S.roundSec * 1000
    : T.phase === "done" ? 0
    : T.running ? Math.max(0, T.endAt - Date.now()) : T.remaining;
  const remSec = Math.ceil(remMs / 1000);

  app.dataset.phase = T.phase;
  app.dataset.running = T.running;
  $("#t-phase").textContent = PHASE_LABELS[T.phase] + (!T.running && !editable() ? " · 일시정지" : "");
  $("#t-round").textContent = T.round ? `${T.round} / ${S.rounds}R` : `${S.rounds}R`;
  $("#t-time").textContent = fmt(remSec);
  $("#t-bar").style.width = T.total && !editable() ? `${(1 - remMs / (T.total * 1000)) * 100}%` : T.phase === "done" ? "100%" : "0%";

  let combo;
  if (T.phase === "round" && S.callout && T.combo) {
    combo = `<b>${T.combo.seq.join(" - ")}</b><span>${T.combo.seq.map((m) => MOVES[m]?.name || m).join(" · ")}</span>`;
  } else if (T.phase === "round") {
    combo = `<span>${S.callout ? "가드 올리고 움직이기" : "자유 섀도"}</span>`;
  } else if (T.phase === "rest") {
    combo = `<span>숨 고르기 · 어깨 털기</span>`;
  } else if (T.phase === "prep") {
    combo = `<span>스탠스 잡고 가드 올리기</span>`;
  } else if (T.phase === "done") {
    combo = `<span>수고했어요! 스트레칭으로 마무리</span>`;
  } else {
    combo = `<span>${S.week}주차 · 쉬는 시간 ${fmt(S.restSec)}</span>`;
  }
  $("#t-combo").innerHTML = combo;

  $("#t-main").textContent = T.running ? "일시정지" : editable() ? "시작" : "계속";
  $("#t-skip").disabled = editable();
  $("#t-reset").disabled = T.phase === "idle";

  app.querySelectorAll("[data-toggle]").forEach((el) => { el.checked = !!S[el.dataset.toggle]; });
  const voice = app.querySelector('[data-toggle="voice"]');
  voice.disabled = !S.callout;
  voice.closest("li").classList.toggle("off", !S.callout);

  const lock = !editable();
  app.querySelectorAll("[data-week], [data-step]").forEach((el) => { el.disabled = lock; });
  app.querySelectorAll("[data-week]").forEach((el) => {
    el.classList.toggle("on", Number(el.dataset.week) === S.week);
  });
  app.querySelectorAll("[data-val]").forEach((el) => { el.textContent = RANGES[el.dataset.val].fmt(S[el.dataset.val]); });
  app.querySelectorAll("[data-speed]").forEach((el) => { el.classList.toggle("on", el.dataset.speed === S.speed); });
  const p = PROGRAM.find((x) => x.week === S.week);
  $("#t-focus").textContent = `${p.week}주차: ${p.focus} — 콤비는 이 주까지 배운 동작만 나와요`;
}
