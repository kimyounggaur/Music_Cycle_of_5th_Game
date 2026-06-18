const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SVG_DIR = path.join(ROOT, "SVG");
const PDF_DIR = path.join(ROOT, "PDF");
const PRINT_DIR = path.join(ROOT, "PRINT_HTML");

for (const dir of [SVG_DIR, PDF_DIR, PRINT_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

const font = `"Malgun Gothic", "Noto Sans KR", Arial, sans-serif`;
const fontAttr = "Malgun Gothic, Noto Sans KR, Arial, sans-serif";
const theme = {
  ink: "#293241",
  softInk: "#5b6375",
  guide: "#9aa4b2",
  cut: "#ff5d8f",
  blush: "#fff7fb",
  cream: "#fffdf4",
  mint: "#65c3ad",
  coral: "#ff7b7b",
  blue: "#5ba7e1",
  lavender: "#9b7ede",
  honey: "#f5a742",
};

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function polar(cx, cy, radius, angleFromTop) {
  const rad = ((angleFromTop - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

function fmt(num) {
  return Number(num).toFixed(3).replace(/\.?0+$/, "");
}

function ringSegment(cx, cy, rOuter, rInner, startDeg, endDeg) {
  const a = polar(cx, cy, rOuter, startDeg);
  const b = polar(cx, cy, rOuter, endDeg);
  const c = polar(cx, cy, rInner, endDeg);
  const d = polar(cx, cy, rInner, startDeg);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return [
    `M ${fmt(a.x)} ${fmt(a.y)}`,
    `A ${fmt(rOuter)} ${fmt(rOuter)} 0 ${largeArc} 1 ${fmt(b.x)} ${fmt(b.y)}`,
    `L ${fmt(c.x)} ${fmt(c.y)}`,
    `A ${fmt(rInner)} ${fmt(rInner)} 0 ${largeArc} 0 ${fmt(d.x)} ${fmt(d.y)}`,
    "Z",
  ].join(" ");
}

function line(x1, y1, x2, y2, stroke = "#171717", width = 0.3, extra = "") {
  return `<line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
}

function circle(cx, cy, r, attrs = "") {
  return `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(r)}" ${attrs}/>`;
}

function rect(x, y, w, h, attrs = "") {
  return `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}" ${attrs}/>`;
}

function pathEl(d, attrs = "") {
  return `<path d="${d}" ${attrs}/>`;
}

function roundedLabel(x, y, w, h, label, opts = {}) {
  const {
    fill = "#ffffff",
    stroke = theme.mint,
    textFill = theme.ink,
    size = 3,
    weight = 800,
    opacity = 1,
  } = opts;
  return `<g>
    ${rect(x - w / 2, y - h / 2, w, h, `rx="${fmt(h / 2)}" fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" stroke-width="0.35"`)}
    ${textBlock(x, y + 0.15, [label], { size, fill: textFill, weights: [weight] })}
  </g>`;
}

function sparkle(x, y, s = 3, color = "#ffc2d1", opacity = 1) {
  return `<path d="M ${fmt(x)} ${fmt(y - s)} L ${fmt(x + s * 0.38)} ${fmt(y - s * 0.38)} L ${fmt(x + s)} ${fmt(y)} L ${fmt(x + s * 0.38)} ${fmt(y + s * 0.38)} L ${fmt(x)} ${fmt(y + s)} L ${fmt(x - s * 0.38)} ${fmt(y + s * 0.38)} L ${fmt(x - s)} ${fmt(y)} L ${fmt(x - s * 0.38)} ${fmt(y - s * 0.38)} Z" fill="${color}" fill-opacity="${opacity}"/>`;
}

function noteMark(x, y, text = "♪", size = 5, color = theme.lavender, rotate = 0, opacity = 1) {
  return `<text x="${fmt(x)}" y="${fmt(y)}" text-anchor="middle" dominant-baseline="middle" font-family="${fontAttr}" font-size="${fmt(size)}" font-weight="800" fill="${color}" fill-opacity="${opacity}" transform="rotate(${fmt(rotate)} ${fmt(x)} ${fmt(y)})">${esc(text)}</text>`;
}

function cuteConfetti(cx, cy, radius, count, colors, opts = {}) {
  const parts = [];
  const { start = 0, end = 360, size = 2.2, opacity = 0.9 } = opts;
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    const angle = start + (end - start) * t;
    const p = polar(cx, cy, radius + (i % 3) * 2.2, angle);
    const color = colors[i % colors.length];
    if (i % 2 === 0) {
      parts.push(sparkle(p.x, p.y, size + (i % 3) * 0.35, color, opacity));
    } else {
      parts.push(noteMark(p.x, p.y, i % 4 === 1 ? "♪" : "♬", size + 1.8, color, angle / 3, opacity));
    }
  }
  return parts.join("\n");
}

function textBlock(x, y, lines, opts = {}) {
  const {
    size = 4,
    sizes = [],
    weights = [],
    fill = "#171717",
    anchor = "middle",
    lineGap,
    extra = "",
  } = opts;
  const gap = lineGap ?? size * 1.25;
  const firstY = y - ((lines.length - 1) * gap) / 2;
  const tspans = lines
    .map((lineText, idx) => {
      const s = sizes[idx] ?? size;
      const w = weights[idx] ?? 400;
      return `<tspan x="${fmt(x)}" y="${fmt(firstY + idx * gap)}" font-size="${fmt(s)}" font-weight="${w}">${esc(lineText)}</tspan>`;
    })
    .join("");
  return `<text text-anchor="${anchor}" dominant-baseline="middle" fill="${fill}" font-family="${fontAttr}" ${extra}>${tspans}</text>`;
}

function svg(width, height, body, opts = {}) {
  const title = opts.title ? `<title>${esc(opts.title)}</title>` : "";
  const desc = opts.desc ? `<desc>${esc(opts.desc)}</desc>` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}">
${title}
${desc}
<defs>
  <style>
    .cut { fill: none; stroke: ${theme.cut}; stroke-width: 0.35; stroke-dasharray: 2 1.5; }
    .score { fill: none; stroke: ${theme.guide}; stroke-width: 0.25; stroke-dasharray: 1 1; }
    .guide { fill: none; stroke: ${theme.ink}; stroke-width: 0.35; }
    .tiny { font-size: 2.8px; fill: ${theme.softInk}; font-family: ${font}; }
  </style>
</defs>
${body}
</svg>`;
}

const keys = [
  { major: ["C", "다장조"], minor: ["Am", "가단조"], sig: ["조표 없음", "0"] },
  { major: ["G", "사장조"], minor: ["Em", "마단조"], sig: ["1♯", "F♯"] },
  { major: ["D", "라장조"], minor: ["Bm", "나단조"], sig: ["2♯", "F♯ C♯"] },
  { major: ["A", "가장조"], minor: ["F♯m", "올림바단조"], sig: ["3♯", "F♯ C♯ G♯"] },
  { major: ["E", "마장조"], minor: ["C♯m", "올림다단조"], sig: ["4♯", "F♯ C♯ G♯ D♯"] },
  { major: ["B / C♭", "나장조 / 내림다장조"], minor: ["G♯m / A♭m", "올림사단조 / 내림가단조"], sig: ["5♯ / 7♭", "F♯ C♯ G♯ D♯ A♯"] },
  { major: ["F♯ / G♭", "올림바장조 / 내림사장조"], minor: ["D♯m / E♭m", "올림라단조 / 내림마단조"], sig: ["6♯ / 6♭", "F♯ C♯ G♯ D♯ A♯ E♯"] },
  { major: ["C♯ / D♭", "올림다장조 / 내림라장조"], minor: ["A♯m / B♭m", "올림가단조 / 내림나단조"], sig: ["7♯ / 5♭", "B♭ E♭ A♭ D♭ G♭"] },
  { major: ["A♭", "내림가장조"], minor: ["Fm", "바단조"], sig: ["4♭", "B♭ E♭ A♭ D♭"] },
  { major: ["E♭", "내림마장조"], minor: ["Cm", "다단조"], sig: ["3♭", "B♭ E♭ A♭"] },
  { major: ["B♭", "내림나장조"], minor: ["Gm", "사단조"], sig: ["2♭", "B♭ E♭"] },
  { major: ["F", "바장조"], minor: ["Dm", "라단조"], sig: ["1♭", "B♭"] },
];

const segmentColors = [
  "#ffe5ec",
  "#d8f3dc",
  "#cde7f0",
  "#fff1c1",
  "#eadcf8",
  "#c8f7f2",
  "#ffd6a5",
  "#cdb4db",
  "#bde0fe",
  "#fad2e1",
  "#d0f4de",
  "#ffcad4",
];

function createWheel() {
  const cx = 115;
  const cy = 115;
  const parts = [];
  parts.push(rect(0.2, 0.2, 229.6, 229.6, `rx="6" fill="${theme.blush}" stroke="#ffd6e7" stroke-width="0.2"`));
  parts.push(circle(cx, cy, 114, `fill="#fffef9" stroke="#ffd1dc" stroke-width="1.2"`));
  parts.push(cuteConfetti(cx, cy, 105.5, 18, ["#ff8fab", "#65c3ad", "#8ecae6", "#f5a742", "#9b7ede"], { start: -8, end: 352, size: 1.2, opacity: 0.72 }));
  parts.push(circle(cx, cy, 115, `class="cut"`));

  for (let i = 0; i < 12; i++) {
    const start = i * 30 - 15;
    const end = i * 30 + 15;
    const fill = segmentColors[i];
    parts.push(`<path d="${ringSegment(cx, cy, 111.5, 84, start, end)}" fill="${fill}" stroke="#fffefa" stroke-width="1.05"/>`);
    parts.push(`<path d="${ringSegment(cx, cy, 84, 56, start, end)}" fill="${fill}" fill-opacity="0.82" stroke="#fffefa" stroke-width="1.05"/>`);
    parts.push(`<path d="${ringSegment(cx, cy, 56, 28, start, end)}" fill="${fill}" fill-opacity="0.64" stroke="#fffefa" stroke-width="1.05"/>`);
    const dot = polar(cx, cy, 109, i * 30);
    parts.push(circle(dot.x, dot.y, 1.2, `fill="#ffffff" fill-opacity="0.85"`));
  }

  [112, 84, 56, 28].forEach((r) => {
    parts.push(circle(cx, cy, r, `fill="none" stroke="#7b8798" stroke-width="0.28"`));
  });

  for (let i = 0; i < 12; i++) {
    const p1 = polar(cx, cy, 28, i * 30 - 15);
    const p2 = polar(cx, cy, 112, i * 30 - 15);
    parts.push(line(p1.x, p1.y, p2.x, p2.y, "#ffffff", 0.75));
    parts.push(line(p1.x, p1.y, p2.x, p2.y, "#adb5bd", 0.16));
  }

  for (let i = 0; i < 12; i++) {
    const angle = i * 30;
    const majorPoint = polar(cx, cy, 99, angle);
    const minorPoint = polar(cx, cy, 70, angle);
    const sigPoint = polar(cx, cy, 42, angle);
    const data = keys[i];

    const mainSize = data.major[0].length > 6 ? 5.8 : 8.2;
    const minorSize = data.minor[0].length > 7 ? 4.4 : 6.2;
    const sigSize = data.sig[1].length > 12 ? 2.6 : 3.25;

    parts.push(textBlock(majorPoint.x, majorPoint.y, data.major, {
      sizes: [mainSize, 2.8],
      weights: [800, 500],
      fill: theme.ink,
      lineGap: 5.2,
    }));
    parts.push(textBlock(minorPoint.x, minorPoint.y, data.minor, {
      sizes: [minorSize, 2.35],
      weights: [750, 500],
      fill: "#374151",
      lineGap: 4.7,
    }));
    parts.push(textBlock(sigPoint.x, sigPoint.y, data.sig, {
      sizes: [4.5, sigSize],
      weights: [800, 500],
      fill: "#66545e",
      lineGap: 4.1,
    }));
  }

  parts.push(circle(cx, cy, 27.2, `fill="#ffffff" stroke="#ffc2d1" stroke-width="1.1"`));
  parts.push(circle(cx, cy, 22.4, `fill="#fff7fb" stroke="#bde0fe" stroke-width="0.45" stroke-dasharray="1.6 1.1"`));
  parts.push(sparkle(cx - 17.2, cy - 18.2, 2.1, "#ff8fab", 0.9));
  parts.push(noteMark(cx + 17.4, cy - 17.5, "♪", 5.2, "#65c3ad", 14, 0.95));
  parts.push(textBlock(cx, cy - 10.2, ["5도권", "회전 원판"], {
    sizes: [7.2, 3.7],
    weights: [850, 650],
    fill: theme.ink,
    lineGap: 6.2,
  }));
  parts.push(textBlock(cx, cy + 5.2, ["시계방향 ♯ 증가", "반시계방향 ♭ 증가"], {
    sizes: [3.15, 3.15],
    weights: [600, 600],
    fill: theme.softInk,
    lineGap: 4.4,
  }));
  parts.push(circle(cx, cy, 2.5, `fill="#ffffff" stroke="${theme.cut}" stroke-width="0.4"`));
  parts.push(textBlock(cx, cy + 18.2, ["중앙 타공 5mm"], { size: 2.8, fill: "#d6336c", weights: [650] }));

  parts.push(roundedLabel(115, 6.2, 72, 6.8, "재단선: 지름 230mm / 원판 외곽", {
    fill: "#ffffff",
    stroke: "#ff8fab",
    textFill: "#d6336c",
    size: 2.8,
  }));
  return svg(230, 230, parts.join("\n"), {
    title: "5도권 회전 원판 230mm",
    desc: "바깥 원은 장조, 중간 원은 관계단조, 안쪽 원은 조표 정보를 표시한다.",
  });
}

function windowBox(x, y, w, h, label, code, color) {
  return `<g>
    ${rect(x - w / 2, y - h / 2, w, h, `rx="4" fill="#ffffff" fill-opacity="0.64" stroke="${color}" stroke-width="0.8"`)}
    ${rect(x - w / 2 + 1.1, y - h / 2 + 1.1, w - 2.2, h - 2.2, `rx="3.2" fill="none" stroke="#ffffff" stroke-width="0.45"`)}
    ${textBlock(x, y - h / 2 - 3.8, [label], { size: 2.75, fill: color, weights: [800] })}
    ${code ? textBlock(x, y + h / 2 + 3.7, [code], { size: 3.2, fill: color, weights: [900] }) : ""}
  </g>`;
}

function createOverlay() {
  const cx = 130;
  const cy = 130;
  const parts = [];
  parts.push(rect(0.2, 0.2, 259.6, 259.6, `rx="7" fill="#ffffff" fill-opacity="0.04" stroke="${theme.cut}" stroke-width="0.35" stroke-dasharray="2 1.5"`));
  parts.push(rect(7, 7, 246, 246, `rx="8" fill="none" stroke="#ffd6e7" stroke-width="0.55"`));
  parts.push(cuteConfetti(cx, cy, 121.5, 20, ["#ff8fab", "#65c3ad", "#8ecae6", "#f5a742", "#9b7ede"], { start: 10, end: 350, size: 1.35, opacity: 0.72 }));
  parts.push(circle(cx, cy, 115, `fill="none" stroke="${theme.ink}" stroke-width="0.32"`));
  parts.push(circle(cx, cy, 84, `fill="none" stroke="${theme.guide}" stroke-width="0.25" stroke-dasharray="1.2 1.2"`));
  parts.push(circle(cx, cy, 56, `fill="none" stroke="${theme.guide}" stroke-width="0.25" stroke-dasharray="1.2 1.2"`));
  parts.push(circle(cx, cy, 28, `fill="none" stroke="${theme.guide}" stroke-width="0.25" stroke-dasharray="1.2 1.2"`));

  const topOuter = polar(cx, cy, 115, 0);
  const topInner = polar(cx, cy, 21, 0);
  parts.push(line(topInner.x, topInner.y, topOuter.x, topOuter.y, "#ff5d8f", 0.85));
  parts.push(roundedLabel(cx, 10.7, 26, 7, "기준선", { fill: "#fff0f6", stroke: "#ff8fab", textFill: "#d6336c", size: 3.4, weight: 900 }));

  const pMajor = polar(cx, cy, 99, 0);
  const pMinor = polar(cx, cy, 70, 0);
  const pSig = polar(cx, cy, 42, 0);
  parts.push(windowBox(pMajor.x, pMajor.y, 44, 17, "현재 장조", "I", "#0f766e"));
  parts.push(windowBox(pMinor.x, pMinor.y, 40, 15, "관계단조", "vi", "#7c3aed"));
  parts.push(windowBox(pSig.x, pSig.y, 38, 14, "조표", "", "#c05621"));

  const relations = [
    { angle: -30, radius: 99, code: "IV", label: "버금딸림조", color: "#2f80ed", w: 34 },
    { angle: 30, radius: 99, code: "V", label: "딸림조", color: "#d6336c", w: 32 },
    { angle: 60, radius: 99, code: "ii", label: "2도 단화음", color: "#8b5cf6", w: 32 },
    { angle: 90, radius: 99, code: "vi", label: "6도 단화음", color: "#129575", w: 32 },
    { angle: 120, radius: 99, code: "iii", label: "3도 단화음", color: "#b45309", w: 32 },
    { angle: 150, radius: 99, code: "vii°", label: "이끔감화음", color: "#52616b", w: 33 },
    { angle: -90, radius: 70, code: "동단조", label: "같은 으뜸음 단조", color: "#d97706", w: 41 },
  ];

  for (const item of relations) {
    const p = polar(cx, cy, item.radius, item.angle);
    parts.push(windowBox(p.x, p.y, item.w, 13.5, item.label, item.code, item.color));
  }

  for (let i = 0; i < 12; i++) {
    const p1 = polar(cx, cy, 113.5, i * 30 - 15);
    const p2 = polar(cx, cy, 119, i * 30 - 15);
    parts.push(line(p1.x, p1.y, p2.x, p2.y, theme.ink, 0.35));
  }

  parts.push(circle(cx, cy, 2.5, `fill="#ffffff" stroke="${theme.cut}" stroke-width="0.4"`));
  parts.push(textBlock(cx, cy + 8.2, ["중앙 타공 5mm"], { size: 2.8, fill: "#d6336c", weights: [650] }));

  parts.push(roundedLabel(cx, 244, 178, 7.5, "투명 PET 0.5-0.7mm 권장 / 원판 위에 고정", {
    fill: "#fff7fb",
    stroke: "#ffc2d1",
    textFill: theme.softInk,
    size: 3.3,
  }));
  parts.push(textBlock(31, 251, ["260 x 260mm"], { size: 3.2, fill: "#d6336c", weights: [700] }));
  parts.push(textBlock(229, 251, ["원판 지름 230mm"], { size: 3.2, fill: theme.softInk, weights: [700] }));

  return svg(260, 260, parts.join("\n"), {
    title: "5도권 투명 표시판 260mm",
    desc: "회전 원판 위에 고정되는 투명 표시판. 기준선, 관계조, 코드 기능 창을 표시한다.",
  });
}

function createBaseBoard() {
  const cx = 130;
  const cy = 130;
  const parts = [];
  parts.push(rect(0.2, 0.2, 259.6, 259.6, `rx="8" fill="${theme.cream}" stroke="${theme.cut}" stroke-width="0.35" stroke-dasharray="2 1.5"`));
  parts.push(rect(7, 7, 246, 246, `rx="9" fill="none" stroke="#ffd6e7" stroke-width="0.8"`));
  parts.push(cuteConfetti(cx, cy, 121, 18, ["#ff8fab", "#65c3ad", "#8ecae6", "#f5a742", "#9b7ede"], { start: -4, end: 344, size: 1.4, opacity: 0.75 }));
  parts.push(circle(cx, cy, 115, `fill="#ffffff" stroke="#ffd6e7" stroke-width="1"`));
  parts.push(circle(cx, cy, 119, `fill="none" stroke="${theme.guide}" stroke-width="0.25" stroke-dasharray="1 1"`));
  parts.push(circle(cx, cy, 2.5, `fill="#ffffff" stroke="${theme.cut}" stroke-width="0.4"`));

  parts.push(textBlock(cx, 18, ["5도권 회전판"], {
    sizes: [9.5],
    weights: [850],
    fill: theme.ink,
  }));
  parts.push(textBlock(cx, 29, ["Circle of Fifths Learning Wheel"], {
    size: 4,
    weights: [600],
    fill: theme.softInk,
  }));
  parts.push(noteMark(73, 20, "♪", 6.5, "#65c3ad", -12, 0.9));
  parts.push(noteMark(188, 20, "♬", 6.2, "#ff8fab", 10, 0.9));
  parts.push(sparkle(57, 29, 2.2, "#f5a742", 0.9));
  parts.push(sparkle(204, 30, 2.2, "#8ecae6", 0.9));

  const top = polar(cx, cy, 122, 0);
  parts.push(line(cx, 35, top.x, top.y, "#ff5d8f", 0.62));
  parts.push(roundedLabel(cx, 39.5, 90, 7.5, "기준선에 알고 싶은 조를 맞추세요", {
    fill: "#fff0f6",
    stroke: "#ff8fab",
    textFill: "#d6336c",
    size: 3.1,
  }));

  parts.push(`<path d="M 192 72 A 88 88 0 0 1 219 139" fill="none" stroke="#d6336c" stroke-width="1.2" marker-end="url(#arrow)"/>`);
  parts.push(`<path d="M 68 72 A 88 88 0 0 0 41 139" fill="none" stroke="#2f80ed" stroke-width="1.2" marker-end="url(#arrowBlue)"/>`);
  parts.push(`<defs>
    <marker id="arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#d6336c"/></marker>
    <marker id="arrowBlue" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#2f80ed"/></marker>
  </defs>`);
  parts.push(roundedLabel(211, 68, 25, 7.3, "♯ 증가", { fill: "#fff0f6", stroke: "#ff8fab", textFill: "#d6336c", size: 3.2 }));
  parts.push(roundedLabel(49, 68, 25, 7.3, "♭ 증가", { fill: "#eff8ff", stroke: "#8ecae6", textFill: "#2f80ed", size: 3.2 }));

  const footPositions = [
    [17, 17],
    [243, 17],
    [17, 243],
    [243, 243],
  ];
  for (const [x, y] of footPositions) {
    parts.push(circle(x, y, 5, `fill="#ffffff" fill-opacity="0.45" stroke="#9aa4b2" stroke-width="0.25" stroke-dasharray="1 1"`));
    parts.push(textBlock(x, y + 8.8, ["고무발"], { size: 2.2, fill: theme.softInk, weights: [500] }));
  }

  const notes = [
    "조립 순서: 하판 → 회전 원판 → 투명 표시판 → 와셔 → 시카고 나사",
    "재단: 260 x 260mm / 모서리 R6mm / 중앙 타공 5mm",
    "원판이 너무 뻑뻑하면 0.2mm PET 와셔를 추가하세요.",
  ];
  parts.push(rect(23, 212, 214, 25, `rx="6" fill="#fff7fb" stroke="#ffc2d1" stroke-width="0.45"`));
  parts.push(sparkle(31, 219, 1.8, "#ff8fab", 0.8));
  parts.push(sparkle(229, 230, 1.8, "#65c3ad", 0.8));
  notes.forEach((note, idx) => {
    parts.push(textBlock(130, 219 + idx * 6.4, [note], { size: 3, fill: theme.ink, weights: [600] }));
  });

  return svg(260, 260, parts.join("\n"), {
    title: "5도권 하판 260mm",
    desc: "회전 원판과 투명 표시판을 고정하는 하판 도안.",
  });
}

function createSecondaryPointer() {
  const cx = 115;
  const cy = 115;
  const parts = [];
  parts.push(circle(cx, cy, 115, `fill="#ffffff" fill-opacity="0.04" stroke="${theme.cut}" stroke-width="0.35" stroke-dasharray="2 1.5"`));
  parts.push(circle(cx, cy, 112, `fill="none" stroke="${theme.ink}" stroke-width="0.32"`));
  parts.push(circle(cx, cy, 84, `fill="none" stroke="${theme.guide}" stroke-width="0.25" stroke-dasharray="1 1"`));
  parts.push(circle(cx, cy, 56, `fill="none" stroke="${theme.guide}" stroke-width="0.25" stroke-dasharray="1 1"`));
  parts.push(cuteConfetti(cx, cy, 104, 12, ["#ff8fab", "#65c3ad", "#8ecae6", "#f5a742", "#9b7ede"], { start: 15, end: 345, size: 1.2, opacity: 0.7 }));

  const target = polar(cx, cy, 99, 0);
  const dom = polar(cx, cy, 99, 30);
  parts.push(windowBox(target.x, target.y, 39, 16, "대상 코드", "대상", "#0f766e"));
  parts.push(windowBox(dom.x, dom.y, 39, 16, "세컨더리", "V/대상", "#d6336c"));
  parts.push(line(target.x, target.y, dom.x, dom.y, "#d6336c", 0.68, `stroke-dasharray="2 1"`));
  parts.push(circle(cx, cy, 28.5, `fill="#fff7fb" stroke="#ffc2d1" stroke-width="0.9"`));
  parts.push(textBlock(cx, cy - 16, ["고급 포인터"], { size: 6, fill: theme.ink, weights: [850] }));
  parts.push(textBlock(cx, cy - 7.8, ["두 창의 간격은 5도권 1칸 = 30도"], { size: 3.2, fill: theme.softInk, weights: [600] }));
  parts.push(noteMark(cx - 24, cy - 20, "♪", 5, "#65c3ad", -8, 0.9));
  parts.push(sparkle(cx + 25, cy - 22, 2.1, "#ff8fab", 0.9));
  parts.push(circle(cx, cy, 2.5, `fill="#ffffff" stroke="${theme.cut}" stroke-width="0.4"`));
  parts.push(textBlock(cx, cy + 8.2, ["중앙 타공 5mm"], { size: 2.8, fill: "#d6336c", weights: [650] }));
  parts.push(roundedLabel(cx, 220, 185, 8, "투명 PET 원형 포인터 / 대상 창을 맞추면 오른쪽 창이 V/대상", {
    fill: "#fff7fb",
    stroke: "#ffc2d1",
    textFill: theme.softInk,
    size: 2.85,
  }));

  return svg(230, 230, parts.join("\n"), {
    title: "세컨더리 도미넌트 포인터 230mm",
    desc: "고급 확장용 투명 원형 포인터.",
  });
}

const beginnerCards = [
  ["초급 01", "조표가 ♯ 1개인 장조는?", "정답: G 사장조\n순서: 기준선에서 1♯ 칸을 찾는다."],
  ["초급 02", "조표가 ♭ 2개인 장조는?", "정답: B♭ 내림나장조\n순서: 플랫 2개 칸을 찾는다."],
  ["초급 03", "D 장조의 조표를 쓰세요.", "정답: F♯, C♯\n순서: D를 기준선에 맞추고 조표 창을 읽는다."],
  ["초급 04", "F 장조의 관계단조는?", "정답: Dm 라단조\n순서: F 칸의 중간 원을 읽는다."],
  ["초급 05", "Am의 관계장조는?", "정답: C 다장조\n순서: 중간 원 Am이 있는 칸의 바깥 원을 읽는다."],
  ["초급 06", "조표가 없는 장조와 단조는?", "정답: C 다장조, Am 가단조\n순서: 조표 없음 칸을 찾는다."],
  ["초급 07", "E♭ 장조의 플랫 이름은?", "정답: B♭, E♭, A♭\n순서: E♭을 기준선에 맞추고 조표 창을 읽는다."],
  ["초급 08", "Bm의 관계장조는?", "정답: D 라장조\n순서: 중간 원 Bm이 있는 칸의 바깥 원을 읽는다."],
  ["초급 09", "C에서 G로 가려면 어느 방향, 몇 칸?", "정답: 시계방향 1칸\n순서: 5도권에서 C 다음 시계방향이 G."],
];

const intermediateCards = [
  ["중급 01", "D 장조의 딸림조와 버금딸림조는?", "정답: 딸림조 A, 버금딸림조 G\n순서: D 기준에서 V와 IV 창을 읽는다."],
  ["중급 02", "E♭ 장조의 같은 으뜸음 단조는?", "정답: E♭m\n순서: 같은 으뜸음 단조 창을 읽는다."],
  ["중급 03", "B♭ 장조에서 C 장조로 조옮김: 몇 칸?", "정답: 시계방향 2칸\n순서: B♭ → F → C."],
  ["중급 04", "G 장조의 관계단조와 같은 으뜸음 단조는?", "정답: 관계단조 Em, 같은 으뜸음 단조 Gm\n순서: 중간 원과 동단조 창을 함께 본다."],
  ["중급 05", "A 장조의 IV, V를 찾으세요.", "정답: IV = D, V = E\n순서: A 기준에서 좌우 기능 창을 읽는다."],
  ["중급 06", "F minor의 관계장조는?", "정답: A♭ 장조\n순서: Fm이 있는 칸의 바깥 원을 읽는다."],
  ["중급 07", "C 장조에서 A 장조로 조옮김: 방향과 칸 수", "정답: 시계방향 3칸\n순서: C → G → D → A."],
  ["중급 08", "D♭ 장조의 관계단조는?", "정답: B♭m\n순서: D♭ 칸의 중간 원을 읽는다."],
  ["중급 09", "E 장조의 조표와 관계단조를 찾으세요.", "정답: 4♯, C♯m\n순서: E를 기준선에 맞추고 중간·안쪽 원을 읽는다."],
];

const advancedCards = [
  ["고급 01", "C 장조의 V/V를 찾고 해결 코드를 말하세요.", "정답: D7 → G\n순서: 대상 G 위에 포인터의 대상 창을 둔다."],
  ["고급 02", "G 장조의 V/ii를 찾으세요.", "정답: E7 → Am\n순서: ii는 Am, Am의 딸림은 E."],
  ["고급 03", "D 장조의 다이어토닉 3화음을 순서대로 말하세요.", "정답: D, Em, F♯m, G, A, Bm, C♯dim\n순서: I부터 vii°까지 읽는다."],
  ["고급 04", "A minor에서 화성단음계의 V 코드는?", "정답: E 또는 E7\n순서: 자연단음계 Em을 장화음으로 올려 쓴다."],
  ["고급 05", "F 장조의 V/vi를 찾으세요.", "정답: A7 → Dm\n순서: vi는 Dm, D의 딸림은 A."],
  ["고급 06", "E♭ 장조의 ii-V-I를 쓰세요.", "정답: Fm - B♭ - E♭\n순서: ii, V, I 창을 차례로 읽는다."],
  ["고급 07", "A 장조의 vii° 코드는?", "정답: G♯dim\n순서: A 기준에서 vii° 창을 읽는다."],
  ["고급 08", "B♭ 장조의 V/IV를 찾으세요.", "정답: B♭7 → E♭\n순서: IV는 E♭, E♭의 딸림은 B♭."],
  ["고급 09", "C 장조의 I-vi-ii-V 진행을 쓰세요.", "정답: C - Am - Dm - G\n순서: I, vi, ii, V 창을 읽는다."],
];

function splitLines(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    if (!current) {
      current = word;
    } else if ((current + " " + word).length <= maxChars) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function createCardSheet(cards, level, palette, side = "front") {
  const pageW = 210;
  const pageH = 297;
  const cardW = 63;
  const cardH = 88;
  const gap = 4;
  const left = (pageW - cardW * 3 - gap * 2) / 2;
  const top = (pageH - cardH * 3 - gap * 2) / 2;
  const parts = [];

  parts.push(rect(0, 0, pageW, pageH, `fill="#ffffff"`));
  parts.push(roundedLabel(pageW / 2, 7.2, 91, 7.2, `5도권 회전판 ${level} 미션 카드 ${side === "front" ? "앞면" : "뒷면"}`, {
    fill: palette.soft,
    stroke: palette.accentLight,
    textFill: palette.accent,
    size: 3.1,
  }));

  cards.forEach((card, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = left + col * (cardW + gap);
    const y = top + row * (cardH + gap);
    const [id, question, answer] = card;

    const cardFill = side === "front" ? palette.bg : "#fffdf7";
    parts.push(rect(x, y, cardW, cardH, `rx="6" fill="${cardFill}" stroke="${theme.ink}" stroke-width="0.32"`));
    parts.push(rect(x + 2.4, y + 2.4, cardW - 4.8, cardH - 4.8, `rx="4.6" fill="none" stroke="#ffffff" stroke-width="1.15"`));
    parts.push(rect(x + 4.2, y + 4.2, cardW - 8.4, cardH - 8.4, `rx="3.8" fill="none" stroke="${palette.accentLight}" stroke-width="0.45"`));
    parts.push(line(x, y, x + cardW, y, theme.cut, 0.25, `stroke-dasharray="1 1"`));
    parts.push(line(x, y + cardH, x + cardW, y + cardH, theme.cut, 0.25, `stroke-dasharray="1 1"`));
    parts.push(line(x, y, x, y + cardH, theme.cut, 0.25, `stroke-dasharray="1 1"`));
    parts.push(line(x + cardW, y, x + cardW, y + cardH, theme.cut, 0.25, `stroke-dasharray="1 1"`));
    parts.push(sparkle(x + 8, y + 72, 1.55, palette.accentLight, 0.82));
    parts.push(noteMark(x + cardW - 8, y + 75, idx % 2 === 0 ? "♪" : "♬", 4.5, palette.accentLight, idx % 2 ? 12 : -10, 0.86));

    if (side === "front") {
      parts.push(rect(x + 6, y + 7, 31, 7.6, `rx="3.8" fill="#ffffff" fill-opacity="0.8" stroke="${palette.accentLight}" stroke-width="0.25"`));
      parts.push(textBlock(x + 9.4, y + 10.9, [id], { size: 3.1, fill: palette.accent, anchor: "start", weights: [850] }));
      parts.push(circle(x + cardW - 12, y + 12, 7.3, `fill="#ffffff" fill-opacity="0.82" stroke="${palette.accent}" stroke-width="0.32"`));
      parts.push(sparkle(x + cardW - 18.1, y + 7.1, 1.45, palette.accentLight, 0.8));
      parts.push(textBlock(x + cardW - 12, y + 12, ["5도"], { size: 3, fill: palette.accent, weights: [900] }));
      const qLines = splitLines(question, 11);
      parts.push(rect(x + 8.2, y + 24, cardW - 16.4, 34, `rx="5.5" fill="#ffffff" fill-opacity="0.5" stroke="#ffffff" stroke-width="0.35"`));
      parts.push(textBlock(x + cardW / 2, y + 39, qLines, {
        size: 5.1,
        fill: theme.ink,
        weights: qLines.map(() => 800),
        lineGap: 7.1,
      }));
      parts.push(rect(x + 9, y + 68, cardW - 18, 10, `rx="5" fill="#ffffff" fill-opacity="0.85" stroke="${palette.accent}" stroke-width="0.3"`));
      parts.push(textBlock(x + cardW / 2, y + 73.2, ["회전판으로 확인"], { size: 3.1, fill: palette.accent, weights: [750] }));
    } else {
      parts.push(rect(x + 9, y + 7.3, cardW - 18, 9.2, `rx="4.6" fill="${palette.soft}" stroke="${palette.accentLight}" stroke-width="0.3"`));
      parts.push(textBlock(x + cardW / 2, y + 12, [id + " 정답"], { size: 4, fill: palette.accent, weights: [850] }));
      const answerLines = answer.split("\n").flatMap((lineText) => splitLines(lineText, 15));
      parts.push(rect(x + 7, y + 23, cardW - 14, 33, `rx="5" fill="#ffffff" fill-opacity="0.62" stroke="#ffffff" stroke-width="0.4"`));
      parts.push(textBlock(x + cardW / 2, y + 39, answerLines, {
        size: 3.7,
        fill: theme.ink,
        weights: answerLines.map((_, i) => (i === 0 ? 800 : 550)),
        lineGap: 5.7,
      }));
      parts.push(circle(x + cardW / 2, y + 71, 9, `fill="#ffffff" fill-opacity="0.4" stroke="${palette.accent}" stroke-width="0.35"`));
      parts.push(circle(x + cardW / 2, y + 71, 5.8, `fill="none" stroke="${palette.accentLight}" stroke-width="0.35"`));
      parts.push(textBlock(x + cardW / 2, y + 71, ["답"], { size: 4.2, fill: palette.accent, weights: [850] }));
    }
  });

  parts.push(roundedLabel(pageW / 2, 290, 158, 7, "카드 크기 63 x 88mm / 재단선 기준으로 자르세요 / 실제 크기 100%", {
    fill: "#ffffff",
    stroke: "#ffd6e7",
    textFill: theme.softInk,
    size: 2.85,
  }));

  return svg(pageW, pageH, parts.join("\n"), {
    title: `5도권 ${level} 미션 카드 ${side}`,
    desc: "63 x 88mm 카드 9장 A4 배치.",
  });
}

function writeFile(name, contents) {
  fs.writeFileSync(path.join(SVG_DIR, name), contents, "utf8");
}

const files = {
  "01_회전원판_230mm.svg": createWheel(),
  "02_투명표시판_260mm.svg": createOverlay(),
  "03_하판_260mm.svg": createBaseBoard(),
  "04_세컨더리도미넌트_포인터_230mm.svg": createSecondaryPointer(),
  "05_초급카드_앞면_A4.svg": createCardSheet(beginnerCards, "초급", { bg: "#dff8ee", soft: "#f0fff8", accent: "#0f766e", accentLight: "#72d6bf" }, "front"),
  "06_초급카드_뒷면_A4.svg": createCardSheet(beginnerCards, "초급", { bg: "#dff8ee", soft: "#f0fff8", accent: "#0f766e", accentLight: "#72d6bf" }, "back"),
  "07_중급카드_앞면_A4.svg": createCardSheet(intermediateCards, "중급", { bg: "#e5f2ff", soft: "#f2f8ff", accent: "#2f80ed", accentLight: "#8ecae6" }, "front"),
  "08_중급카드_뒷면_A4.svg": createCardSheet(intermediateCards, "중급", { bg: "#e5f2ff", soft: "#f2f8ff", accent: "#2f80ed", accentLight: "#8ecae6" }, "back"),
  "09_고급카드_앞면_A4.svg": createCardSheet(advancedCards, "고급", { bg: "#fff0d6", soft: "#fff8e6", accent: "#b45309", accentLight: "#f6c36b" }, "front"),
  "10_고급카드_뒷면_A4.svg": createCardSheet(advancedCards, "고급", { bg: "#fff0d6", soft: "#fff8e6", accent: "#b45309", accentLight: "#f6c36b" }, "back"),
};

for (const [name, contents] of Object.entries(files)) {
  writeFile(name, contents);
}

function htmlPage(title, pageSize, fileNames) {
  const [w, h] = pageSize;
  const sections = fileNames
    .map((name, idx) => {
      const content = files[name];
      return `<section class="page">
  ${content.replace(/<\?xml[^>]*>\s*/, "")}
</section>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<style>
  @page { size: ${w}mm ${h}mm; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { font-family: ${font}; }
  .page {
    width: ${w}mm;
    height: ${h}mm;
    page-break-after: always;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: white;
  }
  .page:last-child { page-break-after: auto; }
  svg { flex: none; }
</style>
</head>
<body>
${sections}
</body>
</html>`;
}

const componentNames = [
  "01_회전원판_230mm.svg",
  "02_투명표시판_260mm.svg",
  "03_하판_260mm.svg",
  "04_세컨더리도미넌트_포인터_230mm.svg",
];

const cardNames = [
  "05_초급카드_앞면_A4.svg",
  "06_초급카드_뒷면_A4.svg",
  "07_중급카드_앞면_A4.svg",
  "08_중급카드_뒷면_A4.svg",
  "09_고급카드_앞면_A4.svg",
  "10_고급카드_뒷면_A4.svg",
];

fs.writeFileSync(
  path.join(PRINT_DIR, "5도권_회전판_부품_A3_인쇄.html"),
  htmlPage("5도권 회전판 부품 A3 인쇄", [420, 297], componentNames),
  "utf8"
);

fs.writeFileSync(
  path.join(PRINT_DIR, "5도권_미션카드_A4_인쇄.html"),
  htmlPage("5도권 미션 카드 A4 인쇄", [210, 297], cardNames),
  "utf8"
);

const readme = `# 5도권 회전판 제작 도안

리마스터 스타일: 파스텔 색상, 둥근 라벨, 작은 음표·별 장식, 부드러운 인쇄선으로 통일했습니다. 실물 치수와 재단 기준은 기존 제작 사양 그대로 유지됩니다.

## 출력 파일

- SVG/01_회전원판_230mm.svg: 지름 230mm 회전 원판
- SVG/02_투명표시판_260mm.svg: 260 x 260mm 투명 표시판
- SVG/03_하판_260mm.svg: 260 x 260mm 하판
- SVG/04_세컨더리도미넌트_포인터_230mm.svg: 지름 230mm 고급 포인터
- SVG/05-10_카드_*.svg: 63 x 88mm 카드 9장씩 A4 배치
- PRINT_HTML/5도권_회전판_부품_A3_인쇄.html: PDF 변환용 A3 부품 인쇄본
- PRINT_HTML/5도권_미션카드_A4_인쇄.html: PDF 변환용 A4 카드 인쇄본

## 실물 치수

- 하판: 260 x 260mm, 모서리 R6mm
- 회전 원판: 지름 230mm
- 투명 표시판: 260 x 260mm, 모서리 R5mm
- 고급 포인터: 지름 230mm
- 중앙 타공: 5mm
- 카드: 63 x 88mm, 모서리 R5mm

## 권장 재질

- 하판: 1.5-2.0mm 하드보드 또는 아크릴
- 회전 원판: 0.8-1.0mm PP 또는 350g 이상 카드지 합지
- 투명 표시판/포인터: 0.5-0.7mm PET
- 고정부: 5mm 시카고 나사, 얇은 와셔 1-2장

## 인쇄 주의

- 반드시 실제 크기 100%로 출력하세요.
- PDF 출력 시 '페이지에 맞춤'을 끄세요.
- 분홍 점선은 재단선, 회색 점선은 정렬/가이드선입니다.
- 투명 표시판과 포인터는 투명 PET에 인쇄하거나, 투명 필름 출력 후 PET에 합지하세요.
- 투명 부품의 장식 요소는 연한 색으로 설계되어 원판 정보가 가려지지 않도록 했습니다.
`;

fs.writeFileSync(path.join(ROOT, "제작_사양_README.md"), readme, "utf8");

console.log(`SVG files written: ${Object.keys(files).length}`);
console.log(`HTML print files written: 2`);
console.log(`Output root: ${ROOT}`);
