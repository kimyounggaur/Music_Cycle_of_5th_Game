const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, "제품_이미지");
const HTML_DIR = path.join(ROOT, "PRINT_HTML");

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(HTML_DIR, { recursive: true });

const svgPath = (name) => "../SVG/" + name;

const browserCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const browser = browserCandidates.find((candidate) => fs.existsSync(candidate));
if (!browser) {
  throw new Error("Chrome or Edge was not found; cannot render PNG mockups.");
}

const commonCss = `
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    width: 100%;
    height: 100%;
    background: #fffaf3;
    font-family: "Malgun Gothic", "Noto Sans KR", Arial, sans-serif;
    color: #293241;
    -webkit-font-smoothing: antialiased;
  }
  .scene {
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(circle at 10% 9%, rgba(255, 214, 231, 0.65), transparent 17%),
      radial-gradient(circle at 91% 16%, rgba(205, 231, 240, 0.78), transparent 18%),
      radial-gradient(circle at 82% 88%, rgba(216, 243, 220, 0.82), transparent 20%),
      linear-gradient(135deg, #fff7fb 0%, #fffdf4 48%, #eef8ff 100%);
  }
  .scene::before {
    content: "";
    position: absolute;
    inset: 38px;
    border: 2px solid rgba(255, 143, 171, 0.38);
    border-radius: 42px;
    pointer-events: none;
  }
  .title {
    position: absolute;
    left: 70px;
    top: 58px;
    z-index: 20;
  }
  .title h1 {
    margin: 0 0 12px;
    font-size: 58px;
    line-height: 1.02;
    letter-spacing: 0;
  }
  .title p {
    margin: 0;
    font-size: 22px;
    color: #5b6375;
    font-weight: 700;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 34px;
    padding: 0 18px;
    margin-bottom: 14px;
    border-radius: 999px;
    background: #fff;
    border: 2px solid #ff8fab;
    color: #d6336c;
    font-weight: 900;
    font-size: 18px;
  }
  .shadow {
    filter: drop-shadow(0 20px 26px rgba(41, 50, 65, 0.18));
  }
  .assembled-board {
    position: absolute;
    width: 650px;
    height: 650px;
    transform-style: preserve-3d;
  }
  .assembled-board .board-layer {
    position: absolute;
    inset: 0;
    width: 650px;
    height: 650px;
  }
  .assembled-board .wheel-layer {
    position: absolute;
    width: 575px;
    height: 575px;
    left: 37.5px;
    top: 37.5px;
  }
  .assembled-board .overlay-layer {
    position: absolute;
    inset: 0;
    width: 650px;
    height: 650px;
  }
  .assembled-board::after {
    content: "";
    position: absolute;
    left: 315px;
    top: 315px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #ffffff 0 16%, #c8ccd4 17% 45%, #747b88 46% 75%, #ffffff 76% 100%);
    border: 2px solid rgba(41, 50, 65, 0.42);
    box-shadow: 0 3px 5px rgba(41, 50, 65, 0.22);
  }
  .edge-thickness {
    position: absolute;
    left: 18px;
    right: 18px;
    bottom: -12px;
    height: 26px;
    border-radius: 0 0 26px 26px;
    background: linear-gradient(90deg, #dfc8bd, #f1e0d7, #d8c1b6);
    opacity: 0.82;
    filter: blur(0.1px);
  }
  .pointer {
    position: absolute;
    width: 330px;
    height: 330px;
    border-radius: 50%;
  }
  .pointer img {
    width: 100%;
    height: 100%;
  }
  .pointer::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: linear-gradient(140deg, rgba(255,255,255,0.52), rgba(255,255,255,0.08) 40%, rgba(141, 202, 230, 0.16));
    pointer-events: none;
  }
  .card-stack {
    position: absolute;
    width: 162px;
    height: 226px;
  }
  .card-stack .card {
    position: absolute;
    width: 150px;
    height: 210px;
    left: 0;
    top: 0;
    border-radius: 16px;
    border: 2px solid #293241;
    box-shadow: 0 16px 22px rgba(41, 50, 65, 0.16);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 18px 14px;
    overflow: hidden;
  }
  .card-stack .card:nth-child(1) { transform: translate(12px, 12px) rotate(3deg); opacity: 0.74; }
  .card-stack .card:nth-child(2) { transform: translate(6px, 6px) rotate(1.5deg); opacity: 0.86; }
  .card-stack .card:nth-child(3) { transform: translate(0, 0) rotate(-1deg); }
  .card .level {
    align-self: flex-start;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(255,255,255,0.76);
    font-weight: 900;
    font-size: 18px;
  }
  .card .mission {
    font-size: 26px;
    line-height: 1.18;
    font-weight: 900;
    text-align: center;
  }
  .card .foot {
    border-radius: 999px;
    background: rgba(255,255,255,0.78);
    padding: 7px 8px;
    text-align: center;
    font-size: 15px;
    font-weight: 800;
  }
  .mint .card { background: #dff8ee; }
  .mint .level, .mint .foot { color: #0f766e; border: 1px solid #72d6bf; }
  .blue .card { background: #e5f2ff; }
  .blue .level, .blue .foot { color: #2f80ed; border: 1px solid #8ecae6; }
  .honey .card { background: #fff0d6; }
  .honey .level, .honey .foot { color: #b45309; border: 1px solid #f6c36b; }
  .booklet {
    position: absolute;
    width: 270px;
    height: 382px;
    border-radius: 18px;
    background:
      radial-gradient(circle at 28% 23%, #ffe5ec 0 18%, transparent 19%),
      radial-gradient(circle at 82% 24%, #d8f3dc 0 14%, transparent 15%),
      linear-gradient(145deg, #fff7fb, #fffdf4 50%, #eaf8ff);
    border: 2px solid #ffd6e7;
    box-shadow: 0 20px 26px rgba(41, 50, 65, 0.16);
    padding: 26px 24px;
  }
  .booklet::before {
    content: "";
    position: absolute;
    left: -8px;
    top: 18px;
    bottom: 18px;
    width: 12px;
    border-radius: 10px 0 0 10px;
    background: linear-gradient(#e9d5ca, #f6e6dd);
    border: 1px solid rgba(41, 50, 65, 0.14);
  }
  .booklet .small-badge {
    display: inline-block;
    border-radius: 999px;
    background: #fff;
    border: 1.5px solid #ff8fab;
    color: #d6336c;
    font-weight: 900;
    padding: 6px 12px;
    font-size: 13px;
  }
  .booklet h2 {
    margin: 18px 0 0;
    font-size: 42px;
    line-height: 1.05;
  }
  .booklet p {
    margin-top: 15px;
    color: #5b6375;
    font-weight: 700;
    line-height: 1.48;
    font-size: 17px;
  }
  .booklet .mini-wheel {
    position: absolute;
    width: 122px;
    height: 122px;
    right: 20px;
    bottom: 18px;
  }
  .hardware {
    position: absolute;
    width: 220px;
    height: 108px;
    border-radius: 22px;
    background: rgba(255,255,255,0.62);
    border: 2px solid rgba(255, 214, 231, 0.9);
    box-shadow: 0 16px 24px rgba(41, 50, 65, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
  }
  .screw, .washer {
    border-radius: 50%;
    background: radial-gradient(circle at 35% 28%, #fff 0 14%, #d7dbe3 15% 42%, #858c99 43% 74%, #f7f9fb 75% 100%);
    border: 2px solid #747b88;
    box-shadow: 0 7px 10px rgba(41, 50, 65, 0.18);
  }
  .screw { width: 54px; height: 54px; }
  .washer {
    width: 62px;
    height: 62px;
    background:
      radial-gradient(circle, transparent 0 28%, #f8fafc 29% 38%, #c8ccd4 39% 66%, #8a929e 67% 100%);
  }
  .label {
    position: absolute;
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    padding: 0 16px;
    border-radius: 999px;
    background: rgba(255,255,255,0.84);
    border: 2px solid #ffd6e7;
    font-size: 17px;
    font-weight: 900;
    color: #293241;
    box-shadow: 0 10px 14px rgba(41, 50, 65, 0.08);
    z-index: 15;
  }
  .spec-list {
    position: absolute;
    right: 72px;
    bottom: 62px;
    width: 472px;
    border-radius: 28px;
    padding: 26px 30px;
    background: rgba(255,255,255,0.78);
    border: 2px solid rgba(255, 214, 231, 0.92);
    box-shadow: 0 18px 28px rgba(41, 50, 65, 0.10);
  }
  .spec-list h3 {
    margin: 0 0 13px;
    font-size: 25px;
  }
  .spec-list ul {
    margin: 0;
    padding-left: 22px;
    color: #5b6375;
    font-weight: 700;
    font-size: 18px;
    line-height: 1.52;
  }
`;

function htmlDocument(title, width, height, body) {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>${commonCss}</style>
</head>
<body>
${body}
</body>
</html>`;
}

function assembledBoard(style = "") {
  return `<div class="assembled-board shadow" style="${style}">
  <div class="edge-thickness"></div>
  <img class="board-layer" src="${svgPath("03_하판_260mm.svg")}" alt="260mm 하판">
  <img class="wheel-layer" src="${svgPath("01_회전원판_230mm.svg")}" alt="230mm 회전 원판">
  <img class="overlay-layer" src="${svgPath("02_투명표시판_260mm.svg")}" alt="260mm 투명 표시판">
</div>`;
}

function cardStack(level, mission, className) {
  return `<div class="card-stack ${className}">
  <div class="card"><div class="level">${level}</div><div class="mission">${mission}</div><div class="foot">9장</div></div>
  <div class="card"><div class="level">${level}</div><div class="mission">${mission}</div><div class="foot">9장</div></div>
  <div class="card"><div class="level">${level}</div><div class="mission">${mission}</div><div class="foot">미션 카드</div></div>
</div>`;
}

const flatlayHtml = htmlDocument(
  "5도권 회전판 실물 제품 구성품 이미지",
  2000,
  1400,
  `<main class="scene" style="width:2000px;height:1400px;">
  <div class="title">
    <div class="badge">제조 사양 기반 제품 렌더</div>
    <h1>5도권 회전판<br>완제품 구성</h1>
    <p>실제 도안 SVG를 사용한 구성품 플랫레이</p>
  </div>

  ${assembledBoard("left:118px;top:300px;transform:rotate(-5deg);")}
  <div class="label" style="left:146px;top:960px;">조립 본체 260 x 260mm</div>

  <div class="pointer shadow" style="left:820px;top:246px;transform:rotate(9deg);">
    <img src="${svgPath("04_세컨더리도미넌트_포인터_230mm.svg")}" alt="세컨더리 도미넌트 포인터">
  </div>
  <div class="label" style="left:850px;top:594px;">투명 포인터 지름 230mm</div>

  <div class="booklet" style="left:1255px;top:184px;transform:rotate(3deg);">
    <span class="small-badge">중철 소책자</span>
    <h2>5도권<br>회전판</h2>
    <p>마스터 룰북<br>A5 세로 · 16쪽</p>
    <img class="mini-wheel" src="${svgPath("01_회전원판_230mm.svg")}" alt="미니 원판">
  </div>
  <div class="label" style="left:1286px;top:595px;">마스터 룰북 A5 중철</div>

  <div style="position:absolute;left:804px;top:760px;">${cardStack("초급", "조표와<br>조 이름", "mint")}</div>
  <div style="position:absolute;left:996px;top:790px;">${cardStack("중급", "관계조와<br>조옮김", "blue")}</div>
  <div style="position:absolute;left:1188px;top:760px;">${cardStack("고급", "코드 기능<br>V/대상", "honey")}</div>
  <div class="label" style="left:932px;top:1024px;">미션 카드 27장 · 63 x 88mm</div>

  <div class="hardware" style="left:1515px;top:773px;">
    <div class="washer"></div>
    <div class="screw"></div>
    <div class="washer"></div>
  </div>
  <div class="label" style="left:1526px;top:900px;">5mm 시카고 나사 + 와셔</div>

  <section class="spec-list">
    <h3>제조 핵심 사양</h3>
    <ul>
      <li>하판 260 x 260mm, 모서리 R6mm</li>
      <li>회전 원판 지름 230mm, 중앙 타공 5mm</li>
      <li>투명 표시판 PET 0.5-0.7mm</li>
      <li>본체는 표시판 고정, 원판만 회전</li>
      <li>카드 27장과 중철 룰북 1부 동봉</li>
    </ul>
  </section>
</main>`
);

const closeupHtml = htmlDocument(
  "5도권 회전판 조립 본체 클로즈업",
  1600,
  1600,
  `<main class="scene" style="width:1600px;height:1600px;">
  <div class="title" style="left:86px;top:72px;">
    <div class="badge">조립 본체 클로즈업</div>
    <h1>투명 표시판 고정<br>회전 원판 구조</h1>
    <p>기준선, 관계조 창, 코드 기능 창이 실제 도안대로 보입니다.</p>
  </div>
  ${assembledBoard("left:394px;top:430px;width:812px;height:812px;transform:rotate(-2deg);")}
  <style>
    .assembled-board[style*="812px"] .board-layer,
    .assembled-board[style*="812px"] .overlay-layer { width:812px;height:812px; }
    .assembled-board[style*="812px"] .wheel-layer { width:718.75px;height:718.75px;left:46.875px;top:46.875px; }
    .assembled-board[style*="812px"]::after { left:393px;top:393px;width:26px;height:26px; }
  </style>
  <div class="label" style="left:175px;top:785px;">하판 260 x 260mm</div>
  <div class="label" style="left:990px;top:370px;">회전 원판 지름 230mm</div>
  <div class="label" style="left:983px;top:1240px;">투명 PET 표시판 고정</div>
  <div class="label" style="left:623px;top:1296px;">중앙 타공 5mm</div>
  <svg style="position:absolute;left:0;top:0;width:1600px;height:1600px;pointer-events:none;" viewBox="0 0 1600 1600">
    <path d="M 352 804 C 430 814 469 833 523 876" fill="none" stroke="#ff8fab" stroke-width="5" stroke-linecap="round"/>
    <path d="M 1114 404 C 1077 472 1050 515 1006 566" fill="none" stroke="#8ecae6" stroke-width="5" stroke-linecap="round"/>
    <path d="M 1048 1228 C 1014 1170 990 1138 954 1089" fill="none" stroke="#72d6bf" stroke-width="5" stroke-linecap="round"/>
    <path d="M 734 1280 C 747 1215 762 1173 797 1130" fill="none" stroke="#f6c36b" stroke-width="5" stroke-linecap="round"/>
  </svg>
</main>`
);

const files = [
  {
    html: path.join(HTML_DIR, "5도권_회전판_제품_이미지_구성품_플랫레이.html"),
    png: path.join(OUT_DIR, "5도권_회전판_제품_이미지_구성품_플랫레이.png"),
    width: 2000,
    height: 1400,
    contents: flatlayHtml,
  },
  {
    html: path.join(HTML_DIR, "5도권_회전판_제품_이미지_본체_클로즈업.html"),
    png: path.join(OUT_DIR, "5도권_회전판_제품_이미지_본체_클로즈업.png"),
    width: 1600,
    height: 1600,
    contents: closeupHtml,
  },
];

for (const item of files) {
  fs.writeFileSync(item.html, item.contents, "utf8");
  execFileSync(browser, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--allow-file-access-from-files",
    `--window-size=${item.width},${item.height}`,
    `--screenshot=${item.png}`,
    new URL("file:///" + item.html.replace(/\\/g, "/")).href,
  ], { stdio: "inherit" });
  console.log(`HTML written: ${item.html}`);
  console.log(`PNG written: ${item.png}`);
}
