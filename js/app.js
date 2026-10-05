import { CHAPTERS, CARDS } from "./data.js";
import { figure } from "./figures.js";
import { renderTimer } from "./timer.js";
import { render as renderInstall } from "./install.js";

const app = document.getElementById("app");
const titleEl = document.getElementById("title");
const backEl = document.getElementById("back");
const APP_TITLE = "혼자 하는 섀도복싱";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function renderHome() {
  titleEl.textContent = APP_TITLE;
  backEl.hidden = true;
  app.innerHTML = `
    <a class="timer-link" href="#/timer">
      <span class="timer-icon">⏱</span>
      <span><strong>라운드 타이머</strong><small>종소리 · 콤비 콜아웃 · 8주 프로그램</small></span>
    </a>
    <div id="install-slot"></div>` + CHAPTERS.map((ch) => {
    const cards = CARDS.filter((c) => c.chapter === ch.id);
    const list = cards.length
      ? cards.map((c) => `
          <a class="card-link" href="#/card/${c.id}">
            <strong>${esc(c.title)}</strong>
            <span>${esc(c.summary)}</span>
          </a>`).join("")
      : `<p class="empty">준비 중</p>`;
    return `
      <section class="chapter">
        <h2><span class="ch-no">${ch.no}장</span> ${esc(ch.name)} <small>${esc(ch.desc)}</small></h2>
        ${list}
      </section>`;
  }).join("");
  renderInstall();
}

function renderCard(id) {
  const c = CARDS.find((x) => x.id === id);
  if (!c) return renderHome();
  const ch = CHAPTERS.find((x) => x.id === c.chapter);
  titleEl.textContent = `${ch.no}장 · ${ch.name}`;
  // 카드별로 섹션 제목을 바꿀 수 있다 (예: 0장은 '연습 드릴' 대신 '1회 세션 순서')
  const L = { steps: "요령", mistakes: "흔한 실수", selfcheck: "셀프체크 <small>거울 또는 폰 촬영</small>", drills: "연습 드릴", ...c.labels };
  backEl.hidden = false;

  app.innerHTML = `
    <article class="skill">
      <header class="skill-head">
        <h2 class="skill-title">${esc(c.title)}</h2>
        <p class="skill-summary">${esc(c.summary)}</p>
        <ul class="chips">
          ${c.chips.map((x) => `<li><span>${esc(x.k)}</span><b>${esc(x.v)}</b></li>`).join("")}
        </ul>
      </header>

      ${c.figure ? `
      <figure class="fig">
        ${figure(c.figure)}
        <figcaption>${esc(c.figureCaption || "")}</figcaption>
      </figure>` : ""}

      <section class="block">
        <h3>${L.steps}</h3>
        <ol class="steps">
          ${c.steps.map((s) => `<li><b>${esc(s.head)}</b><p>${esc(s.text)}</p></li>`).join("")}
        </ol>
      </section>

      <section class="block warn">
        <h3>${L.mistakes}</h3>
        <ul class="mistakes">
          ${c.mistakes.map((m) => `<li><b>${esc(m.bad)}</b><p>${esc(m.why)}</p></li>`).join("")}
        </ul>
      </section>

      <section class="block">
        <h3>${L.selfcheck}</h3>
        <ul class="checks">
          ${c.selfcheck.map((s, i) => `
            <li><label><input type="checkbox" id="chk-${i}">
              <span><em>${esc(s.how)}</em>${esc(s.check)}</span></label></li>`).join("")}
        </ul>
      </section>

      <section class="block">
        <h3>${L.drills}</h3>
        <ul class="drills">
          ${c.drills.map((d) => `
            <li><div class="drill-top"><b>${esc(d.name)}</b><span class="amount">${esc(d.amount)}</span></div>
            <p>${esc(d.how)}</p></li>`).join("")}
        </ul>
      </section>

      ${c.southpaw ? `<p class="note">🥊 ${esc(c.southpaw)}</p>` : ""}
    </article>`;
  window.scrollTo(0, 0);
}

function showTimer() {
  titleEl.textContent = "라운드 타이머";
  backEl.hidden = false;
  renderTimer(app);
  window.scrollTo(0, 0);
}

function route() {
  const m = location.hash.match(/^#\/card\/([\w-]+)/);
  if (m) renderCard(m[1]);
  else if (location.hash === "#/timer") showTimer();
  else renderHome();
}

window.addEventListener("hashchange", route);
route();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
