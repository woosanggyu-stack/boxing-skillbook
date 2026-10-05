// 직접 그린 SVG 동작 그림. 색은 CSS 변수로 지정해 라이트/다크 모드 모두 대응.
// 위에서 내려다본 그림은 위쪽이 정면(상대). 모두 오소독스 기준.

// ── 공통 조각 ──────────────────────────
const DEFS = `
  <defs>
    <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="var(--fig-accent)"/>
    </marker>
    <marker id="arr-m" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="var(--fig-muted)"/>
    </marker>
  </defs>`;
const svg = (label, body, w = 320, h = 300) =>
  `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">${DEFS}${body}</svg>`;

const t = (x, y, s, cls = "fig-label", anchor = "start") =>
  `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${s}</text>`;
const arrow = (x1, y1, x2, y2, muted = false) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="fig-arrow${muted ? " muted" : ""}" marker-end="url(#arr${muted ? "-m" : ""})"/>`;
const curve = (d, muted = false) =>
  `<path d="${d}" class="fig-arrow${muted ? " muted" : ""}" marker-end="url(#arr${muted ? "-m" : ""})"/>`;
const badge = (x, y, n) =>
  `<circle cx="${x}" cy="${y}" r="10" class="fig-badge"/><text x="${x}" y="${y + 4}" class="fig-badge-t" text-anchor="middle">${n}</text>`;

// 발바닥 (발끝이 위쪽, 원점은 발 중심). ghost = 점선(출발 위치)
const FOOT = "M0,-34 C14,-34 17,-18 15,0 C13,16 11,30 0,32 C-11,30 -13,16 -15,0 C-17,-18 -14,-34 0,-34 Z";
const foot = (x, y, rot = 0, { ghost = false, s = 1, pivot = null } = {}) => {
  const r = pivot ? `rotate(${rot},${pivot[0]},${pivot[1]})` : `rotate(${rot})`;
  return `<path d="${FOOT}" transform="translate(${x},${y}) ${r} scale(${s})" class="${ghost ? "f-ghost" : "f-foot"}" vector-effect="non-scaling-stroke"/>`;
};

// 위에서 본 상체: 어깨, 머리(코 방향 = 정면), 팔, 주먹
const shoulders = (l, r) => `
  <line x1="${l[0]}" y1="${l[1]}" x2="${r[0]}" y2="${r[1]}" class="b-sh-out"/>
  <line x1="${l[0]}" y1="${l[1]}" x2="${r[0]}" y2="${r[1]}" class="b-sh"/>`;
const head = (x = 160, y = 190) => `
  <circle cx="${x}" cy="${y}" r="20" class="b-body"/>
  <path d="M${x - 7},${y - 18} L${x},${y - 28} L${x + 7},${y - 18} Z" class="b-nose"/>`;
const arm = (...pts) => {
  const p = pts.map((q) => q.join(",")).join(" ");
  return `<polyline points="${p}" class="b-arm-out"/><polyline points="${p}" class="b-arm"/>`;
};
const fist = (x, y, label, ghost = false) => ghost
  ? `<circle cx="${x}" cy="${y}" r="12" class="b-ghost"/>`
  : `<circle cx="${x}" cy="${y}" r="12" class="b-body"/><text x="${x}" y="${y + 4}" class="fig-label-in" text-anchor="middle">${label}</text>`;
const target = (x, y, label = "상대 턱", dx = 16) => `
  <circle cx="${x}" cy="${y}" r="9" class="tg"/><line x1="${x - 13}" y1="${y}" x2="${x + 13}" y2="${y}" class="tg"/>
  <line x1="${x}" y1="${y - 13}" x2="${x}" y2="${y + 13}" class="tg"/>
  ${t(x + dx, y + 5, label, "fig-label sub", dx < 0 ? "end" : "start")}`;

const stick = (...pts) => `<polyline points="${pts.map((q) => q.join(",")).join(" ")}" class="stick"/>`;
const ball = (x, y, r = 9) => `<circle cx="${x}" cy="${y}" r="${r}" class="b-body"/>`;

// 거울에 비친 정면 모습의 슬립. dir = -1 왼쪽, 1 오른쪽 (왼쪽 기준 좌표를 좌우 반전)
function slipPanel(cx, dir) {
  const X = (dx) => cx - dir * dx;
  const P = (dx, y) => [X(dx), y];
  return `
    ${t(cx, 30, dir < 0 ? "◀ 왼쪽 슬립" : "오른쪽 슬립 ▶", "fig-label accent", "middle")}
    <circle cx="${cx}" cy="98" r="16" class="b-ghost"/>
    ${target(cx, 98, "", 0)}
    ${stick(P(-30, 268), P(-30, 228), P(-4, 198), P(26, 228), P(30, 268))}
    ${stick(P(-4, 198), P(-24, 128))}
    ${stick(P(-50, 138), P(2, 120))}
    ${stick(P(-50, 138), P(-54, 160), P(-48, 114))}
    ${stick(P(2, 120), P(6, 150), P(-14, 120))}
    ${ball(X(-32), 106, 16)}
    ${ball(X(-48), 114)}${ball(X(-14), 120)}
    ${arrow(X(-4), 72, X(-26), 72)}
    ${t(cx, 290, "머리 한 개만큼", "fig-label sub", "middle")}`;
}

// ── 콤비 연속 동작용 작은 포즈 (위에서 본 상체, 치는 주먹은 강조색) ──
const hit = (x, y) => `<circle cx="${x}" cy="${y}" r="12" class="b-hit"/>`;
const guardBody = () => `
  ${shoulders([118, 178], [200, 208])}${arm([118, 178], [138, 148])}${arm([200, 208], [178, 162])}
  ${head()}${fist(138, 148, "")}${fist(178, 162, "")}`;
const POSES = {
  jab: () => `${shoulders([118, 178], [200, 208])}${arm([200, 208], [178, 162])}${arm([118, 178], [150, 58])}
    ${head()}${fist(178, 162, "")}${hit(150, 58)}`,
  cross: () => `${shoulders([125, 200], [195, 172])}${arm([125, 200], [142, 160])}${arm([195, 172], [156, 58])}
    ${head()}${fist(142, 160, "")}${hit(156, 58)}`,
  leadHook: () => `${shoulders([125, 165], [195, 215])}${arm([195, 215], [180, 163])}${arm([125, 165], [90, 95], [150, 68])}
    ${head()}${fist(180, 163, "")}${hit(150, 68)}`,
  slip: () => `<circle cx="160" cy="190" r="20" class="b-ghost"/>
    <g transform="translate(28,6)">${guardBody()}</g>${arrow(166, 112, 198, 112)}`,
  roll: () => `<circle cx="186" cy="190" r="20" class="b-ghost"/>
    <g transform="translate(-26,6)">${guardBody()}</g>${curve("M196,214 Q160,240 124,216")}`,
  step: () => `${guardBody()}${arrow(196, 226, 120, 226)}`,
  pivot: () => `<g transform="rotate(-45,140,170)">${guardBody()}</g>${curve("M222,226 Q246,170 214,116")}`,
};
const MV = {
  1: { pose: POSES.jab, label: "1 잽" },
  2: { pose: POSES.cross, label: "2 크로스" },
  3: { pose: POSES.leadHook, label: "3 리드훅" },
  slip: { pose: POSES.slip, label: "슬립" },
  roll: { pose: POSES.roll, label: "롤" },
  step: { pose: POSES.step, label: "스텝" },
  pivot: { pose: POSES.pivot, label: "피벗" },
};

// 한 줄짜리 연속 동작. 포즈 원본 영역(약 80~240 × 35~245)을 줄여서 나란히 놓는다.
const PW = 85;
const PS = 0.45;
function strip(y0, title, keys, W = 340) {
  const off = (W - keys.length * PW) / 2;
  const cy = y0 + 28 + 105 * PS;
  let out = t(6, y0 + 16, title, "fig-label accent big");
  keys.forEach((k, i) => {
    const cx = off + (i + 0.5) * PW;
    out += `<g transform="translate(${cx},${cy}) scale(${PS}) translate(-160,-140)">${MV[k].pose()}</g>`;
    out += t(cx, y0 + 28 + 210 * PS + 16, MV[k].label, "fig-label sub", "middle");
    if (i) out += t(off + i * PW, cy + 6, "›", "fig-label accent big", "middle");
  });
  return out;
}
const comboFig = (label, a, b) => svg(label, `
  ${strip(0, a[0], a[1])}
  <line x1="10" y1="150" x2="330" y2="150" class="rail"/>
  ${strip(152, b[0], b[1])}
`, 340, 300);

// 펀치 번호표 한 칸: 큰 번호 + 궤적 아이콘. side = 1 앞손, -1 뒷손 (훅·어퍼 방향 반전)
function numCell(cx, cy, n, kind, side) {
  const X = (dx) => cx + 22 + side * dx;
  const icon = {
    straight: arrow(cx + 22, cy + 18, cx + 22, cy - 16),
    hook: curve(`M${X(-16)},${cy + 16} Q${X(-16)},${cy - 16} ${X(16)},${cy - 14}`),
    upper: curve(`M${X(-10)},${cy + 18} Q${X(4)},${cy + 18} ${X(6)},${cy - 16}`),
  }[kind];
  return `<rect x="${cx - 52}" y="${cy - 28}" width="104" height="56" rx="12" class="fig-cell"/>
    ${t(cx - 22, cy + 11, n, "fig-num", "middle")}${icon}`;
}

// ── 그림 ──────────────────────────────
const FIGURES = {
  "punch-numbers": svg("펀치 번호표: 홀수는 앞손, 짝수는 뒷손", `
    ${t(150, 30, "앞손 (왼손)", "fig-label", "middle")}
    ${t(270, 30, "뒷손 (오른손)", "fig-label", "middle")}
    ${t(10, 85, "스트레이트")}
    ${t(10, 155, "훅")}
    ${t(10, 225, "어퍼컷")}
    ${numCell(150, 80, 1, "straight", 1)}${numCell(270, 80, 2, "straight", -1)}
    ${numCell(150, 150, 3, "hook", 1)}${numCell(270, 150, 4, "hook", -1)}
    ${numCell(150, 220, 5, "upper", 1)}${numCell(270, 220, 6, "upper", -1)}
    ${t(170, 286, "홀수 = 앞손, 짝수 = 뒷손", "fig-label accent big", "middle")}
  `, 340),

  "combo-basic": comboFig("1-2와 1-1-2 연속 동작", ["1-2", [1, 2]], ["1-1-2", [1, 1, 2]]),
  "combo-hook": comboFig("1-2-3과 1-2-3-2 연속 동작", ["1-2-3", [1, 2, 3]], ["1-2-3-2", [1, 2, 3, 2]]),
  "combo-counter": comboFig("슬립-2와 롤-3-2 연속 동작", ["슬립-2", ["slip", 2]], ["롤-3-2", ["roll", 3, 2]]),
  "combo-move": comboFig("1-2-스텝과 1-2-피벗 연속 동작", ["1-2-스텝", [1, 2, "step"]], ["1-2-피벗", [1, 2, "pivot"]]),

  "stance-feet": svg("오소독스 스탠스 발 위치를 위에서 본 그림", `
    ${arrow(160, 44, 160, 14)}
    ${t(172, 30, "정면 (상대)", "fig-label accent")}
    <line x1="125" y1="58" x2="125" y2="270" class="rail"/>
    <line x1="195" y1="58" x2="195" y2="270" class="rail"/>
    ${foot(125, 105)}
    ${t(125, 110, "왼발", "fig-label-in", "middle")}
    ${t(70, 94, "앞발", "fig-label", "end")}
    ${t(70, 114, "발끝 정면", "fig-label sub", "end")}
    ${foot(195, 215, 45)}
    ${t(195, 220, "오른발", "fig-label-in", "middle")}
    ${t(238, 202, "뒷발")}
    ${t(238, 222, "45° 바깥", "fig-label sub")}
    ${t(238, 242, "뒤꿈치 살짝 듦", "fig-label sub")}
    <line x1="88" y1="105" x2="88" y2="215" class="dim" marker-start="url(#arr)" marker-end="url(#arr)"/>
    ${t(80, 165, "한 걸음", "fig-label sub", "end")}
    <line x1="125" y1="285" x2="195" y2="285" class="dim" marker-start="url(#arr)" marker-end="url(#arr)"/>
    ${t(210, 290, "반 걸음", "fig-label sub")}
  `, 340),

  "step-forward-back": svg("전진 스텝과 후진 스텝 발 순서", `
    <line x1="160" y1="20" x2="160" y2="285" class="rail"/>
    ${t(80, 30, "전진 ▲", "fig-label accent", "middle")}
    ${foot(60, 150, 0, { ghost: true, s: 0.75 })}
    ${foot(105, 215, 45, { ghost: true, s: 0.75 })}
    ${foot(60, 108, 0, { s: 0.75 })}
    ${foot(105, 173, 45, { s: 0.75 })}
    ${arrow(28, 158, 28, 104)}${badge(28, 176, 1)}
    ${arrow(140, 222, 140, 170)}${badge(140, 240, 2)}
    ${t(80, 278, "① 앞발 → ② 뒷발", "fig-label sub", "middle")}

    ${t(240, 30, "후진 ▼", "fig-label accent", "middle")}
    ${foot(220, 92, 0, { ghost: true, s: 0.75 })}
    ${foot(265, 157, 45, { ghost: true, s: 0.75 })}
    ${foot(220, 134, 0, { s: 0.75 })}
    ${foot(265, 199, 45, { s: 0.75 })}
    ${arrow(300, 150, 300, 204)}${badge(300, 132, 1)}
    ${arrow(188, 84, 188, 138)}${badge(188, 66, 2)}
    ${t(240, 278, "① 뒷발 → ② 앞발", "fig-label sub", "middle")}
  `),

  "step-side": svg("왼쪽 스텝과 오른쪽 스텝 발 순서", `
    <line x1="160" y1="20" x2="160" y2="285" class="rail"/>
    ${t(80, 30, "◀ 왼쪽으로", "fig-label accent", "middle")}
    ${foot(80, 130, 0, { ghost: true, s: 0.75 })}
    ${foot(120, 195, 45, { ghost: true, s: 0.75 })}
    ${foot(48, 130, 0, { s: 0.75 })}
    ${foot(88, 195, 45, { s: 0.75 })}
    ${arrow(84, 86, 44, 86)}${badge(100, 86, 1)}
    ${arrow(124, 240, 84, 240)}${badge(140, 240, 2)}
    ${t(80, 278, "① 왼발 → ② 오른발", "fig-label sub", "middle")}

    ${t(240, 30, "오른쪽으로 ▶", "fig-label accent", "middle")}
    ${foot(200, 130, 0, { ghost: true, s: 0.75 })}
    ${foot(240, 195, 45, { ghost: true, s: 0.75 })}
    ${foot(232, 130, 0, { s: 0.75 })}
    ${foot(272, 195, 45, { s: 0.75 })}
    ${arrow(236, 240, 276, 240)}${badge(220, 240, 1)}
    ${arrow(196, 86, 236, 86)}${badge(180, 86, 2)}
    ${t(240, 278, "① 오른발 → ② 왼발", "fig-label sub", "middle")}
  `),

  // 앞꿈치(120,152)를 축으로 90° 회전: 뒷발 (175,255) → (223,97)
  pivot: svg("앞발을 축으로 뒷발을 옮기는 피벗", `
    ${arrow(120, 124, 120, 64, true)}
    ${t(128, 76, "처음 정면", "fig-label sub")}
    ${foot(120, 170, 0, { ghost: true, s: 0.8 })}
    ${foot(175, 255, 45, { ghost: true, s: 0.8 })}
    ${curve("M203,258 A135 135 0 0 0 248,110")}
    ${foot(120, 170, -90, { s: 0.8, pivot: [0, -18] })}
    ${foot(223, 97, -45, { s: 0.8 })}
    <circle cx="120" cy="152" r="4" class="fig-dot"/>
    ${arrow(100, 152, 36, 152)}
    ${t(36, 138, "돈 뒤 정면", "fig-label accent")}
    <line x1="116" y1="158" x2="74" y2="200" class="dim"/>
    ${t(70, 216, "앞꿈치가 축", "fig-label", "middle")}
    ${t(70, 234, "(제자리)", "fig-label sub", "middle")}
    ${t(262, 168, "뒷발을")}
    ${t(262, 186, "쓸어 옮기기")}
  `, 340),

  jab: svg("잽: 리드손을 곧게 뻗고 같은 길로 회수", `
    ${target(152, 30)}
    ${fist(138, 148, "", true)}
    ${shoulders([118, 178], [200, 208])}
    ${arm([200, 208], [178, 162])}
    ${arm([118, 178], [150, 58])}
    ${head()}
    ${fist(178, 162, "오")}
    ${fist(150, 58, "왼")}
    ${arrow(108, 140, 127, 72)}
    ${t(102, 112, "곧장 뻗고", "fig-label accent", "end")}
    ${arrow(172, 84, 158, 138, true)}
    ${t(182, 112, "같은 길로 회수", "fig-label sub")}
    ${t(168, 66, "손등이 위로", "fig-label sub")}
    ${t(160, 240, "오른손은 턱 옆에 그대로", "fig-label sub", "middle")}
  `),

  cross: svg("크로스: 뒷발과 골반을 돌리며 뒷손을 곧게", `
    ${target(158, 30)}
    ${fist(178, 162, "", true)}
    ${shoulders([125, 200], [195, 172])}
    ${arm([125, 200], [142, 160])}
    ${arm([195, 172], [156, 58])}
    ${head()}
    ${fist(142, 160, "왼")}
    ${fist(156, 58, "오")}
    ${arrow(210, 150, 182, 78)}
    ${curve("M216,238 A80 80 0 0 0 216,142")}
    ${t(238, 186, "골반·어깨")}
    ${t(238, 204, "회전")}
    ${t(160, 262, "뒷발 뒤꿈치를 바깥으로 돌리며 시작", "fig-label sub", "middle")}
    ${t(160, 282, "왼손은 턱 옆에 그대로", "fig-label sub", "middle")}
  `),

  "lead-hook": svg("리드훅: 팔꿈치 90도로 짧은 호", `
    ${target(160, 40, "상대 턱", 16)}
    ${fist(138, 148, "", true)}
    ${shoulders([125, 165], [195, 215])}
    ${arm([195, 215], [180, 163])}
    ${arm([125, 165], [90, 95], [150, 68])}
    ${head()}
    ${fist(180, 163, "오")}
    ${fist(150, 68, "왼")}
    ${t(104, 116, "90°", "fig-label accent")}
    ${curve("M58,150 Q46,52 128,42")}
    ${t(36, 178, "짧은 호", "fig-label accent")}
    ${curve("M100,240 A80 80 0 0 1 98,140", true)}
    ${t(160, 262, "앞발 앞꿈치를 안쪽으로 돌리며 몸째로", "fig-label sub", "middle")}
    ${t(160, 282, "주먹이 몸 중심선 앞에서 멈춤", "fig-label sub", "middle")}
  `),

  "rear-hook": svg("뒷손훅: 뒷발을 돌리며 팔꿈치 90도로 짧게", `
    ${target(160, 40, "상대 턱", -16)}
    ${fist(178, 162, "", true)}
    ${shoulders([122, 205], [195, 165])}
    ${arm([122, 205], [140, 160])}
    ${arm([195, 165], [230, 95], [170, 68])}
    ${head()}
    ${fist(140, 160, "왼")}
    ${fist(170, 68, "오")}
    ${t(190, 118, "90°", "fig-label accent")}
    ${curve("M262,150 Q274,52 192,42")}
    ${t(250, 178, "짧은 호", "fig-label accent")}
    ${curve("M220,240 A80 80 0 0 0 222,140", true)}
    ${t(160, 262, "뒷발 뒤꿈치를 바깥으로 돌리며 몸째로", "fig-label sub", "middle")}
    ${t(160, 282, "왼손은 턱 옆에 그대로", "fig-label sub", "middle")}
  `),

  // 옆에서 본 모습 (오른쪽이 상대)
  uppercut: svg("어퍼컷: 무릎을 굽혔다 펴며 아래에서 위로 짧게", `
    <line x1="30" y1="262" x2="300" y2="262" class="rail"/>
    ${t(296, 30, "상대 쪽 →", "fig-label accent", "end")}
    ${target(240, 82, "", 0)}
    ${t(240, 62, "턱 높이에서 멈춤", "fig-label sub", "middle")}
    <polyline points="140,168 118,212 100,250 115,260" class="stick"/>
    <polyline points="140,168 172,210 180,258 202,260" class="stick"/>
    <line x1="140" y1="168" x2="152" y2="98" class="stick"/>
    <circle cx="158" cy="74" r="16" class="b-body"/>
    <polyline points="152,98 160,122 172,84" class="stick"/>
    <circle cx="172" cy="84" r="9" class="b-body"/>
    ${fist(184, 124, "", true)}
    <polyline points="152,98 178,132 205,90" class="stick strong"/>
    ${fist(205, 90, "")}
    ${curve("M190,146 Q218,140 222,104")}
    ${t(228, 138, "아래 → 위")}
    ${t(228, 156, "짧게", "fig-label sub")}
    ${arrow(62, 244, 62, 186)}
    ${t(160, 285, "무릎을 살짝 굽혔다가 펴면서 밀어 올리기", "fig-label sub", "middle")}
  `),

  // 왼쪽: 거울에 비친 블록 / 오른쪽: 위에서 본 패리
  "block-parry": svg("블록은 주먹을 머리에 붙여 막고, 패리는 뒷손으로 잽을 옆으로 쳐낸다", `
    <line x1="160" y1="20" x2="160" y2="290" class="rail"/>
    ${t(80, 30, "블록 (거울)", "fig-label accent", "middle")}
    ${stick([68, 198], [62, 250])}${stick([92, 198], [98, 250])}
    <path d="M48,120 L112,120 L100,200 L60,200 Z" class="b-body"/>
    ${arm([50, 122], [54, 152], [62, 94])}
    ${arm([110, 122], [106, 152], [98, 94])}
    ${ball(80, 98, 18)}
    ${ball(62, 92, 12)}${ball(98, 92, 12)}
    ${curve("M154,58 Q152,92 116,93")}
    ${t(148, 50, "훅", "fig-label accent", "middle")}
    ${t(80, 272, "주먹은 머리에,", "fig-label sub", "middle")}
    ${t(80, 290, "팔꿈치는 몸에", "fig-label sub", "middle")}

    ${t(240, 30, "패리 (위에서)", "fig-label accent", "middle")}
    ${arrow(246, 46, 246, 136)}
    ${t(256, 62, "상대 잽", "fig-label sub")}
    ${curve("M240,144 Q226,162 196,168", true)}
    ${fist(258, 196, "", true)}
    ${shoulders([210, 220], [270, 238])}
    ${arm([210, 220], [226, 192])}
    ${arm([270, 238], [248, 160])}
    ${head(240, 230)}
    ${fist(226, 192, "왼")}
    ${fist(248, 160, "오")}
    ${t(240, 272, "오른손바닥으로 툭,", "fig-label sub", "middle")}
    ${t(240, 290, "내 왼쪽으로 흘리기", "fig-label sub", "middle")}
  `),

  slip: svg("슬립: 펀치가 오는 자리에서 머리를 한 개만큼 옆으로", `
    <line x1="160" y1="20" x2="160" y2="290" class="rail"/>
    ${slipPanel(80, -1)}
    ${slipPanel(240, 1)}
  `),

  // 거울에 비친 모습: 시작(점선) → 가장 낮은 순간(실선) → 반대쪽(점선)
  roll: svg("롤: 무릎을 굽혀 U자로 훅 아래를 지나 반대쪽으로", `
    <line x1="24" y1="104" x2="296" y2="104" class="rail"/>
    ${t(160, 98, "훅 높이", "fig-label sub", "middle")}
    <circle cx="80" cy="110" r="16" class="b-ghost"/>
    <circle cx="240" cy="110" r="16" class="b-ghost"/>
    ${t(80, 86, "시작", "fig-label sub", "middle")}
    ${t(240, 86, "올라오기", "fig-label sub", "middle")}
    ${curve("M86,128 Q160,190 228,130")}
    ${stick([115, 270], [108, 238], [160, 222], [212, 238], [205, 270])}
    ${stick([160, 222], [160, 172])}
    ${stick([136, 176], [184, 176])}
    ${stick([136, 176], [140, 200], [147, 154])}
    ${stick([184, 176], [180, 200], [173, 154])}
    ${ball(160, 152, 16)}
    ${ball(147, 154)}${ball(173, 154)}
    ${t(160, 292, "허리는 세우고 무릎으로 낮추기", "fig-label sub", "middle")}
  `),

  // 옆에서 본 모습 (오른쪽이 상대)
  pullback: svg("풀백: 발은 그대로 두고 상체만 뒤로 빼기", `
    <line x1="30" y1="262" x2="300" y2="262" class="rail"/>
    ${t(296, 30, "상대 쪽 →", "fig-label accent", "end")}
    ${arrow(296, 78, 186, 78)}
    ${t(296, 100, "상대 잽", "fig-label sub", "end")}
    ${t(186, 124, "닿지 않는 거리", "fig-label sub")}
    <circle cx="146" cy="76" r="16" class="b-ghost"/>
    ${arrow(146, 46, 112, 46, true)}
    ${t(130, 34, "한 뼘 뒤로", "fig-label sub", "middle")}
    ${stick([128, 172], [104, 212], [94, 256], [114, 260])}
    ${stick([128, 172], [162, 212], [178, 258], [198, 260])}
    ${stick([128, 172], [116, 102])}
    ${stick([116, 102], [128, 126], [134, 90])}
    ${ball(110, 80, 16)}
    ${ball(134, 90)}
    ${t(160, 285, "앞발은 제자리, 체중은 뒷발로", "fig-label sub", "middle")}
  `),
};

export function figure(id) {
  return FIGURES[id] || "";
}
