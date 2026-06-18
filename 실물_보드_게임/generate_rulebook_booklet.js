const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = __dirname;
const PRINT_DIR = path.join(ROOT, "PRINT_HTML");
const PDF_DIR = path.join(ROOT, "PDF");
const sourceHtmlPath = path.join(PRINT_DIR, "5도권_회전판_마스터_롤북.html");
const bookletHtmlPath = path.join(PRINT_DIR, "5도권_회전판_마스터_롤북_중철_A4소책자.html");
const bookletPdfPath = path.join(PDF_DIR, "5도권_회전판_마스터_롤북_중철_A4소책자.pdf");

fs.mkdirSync(PRINT_DIR, { recursive: true });
fs.mkdirSync(PDF_DIR, { recursive: true });

if (!fs.existsSync(sourceHtmlPath)) {
  require("./generate_master_rulebook.js");
}

const sourceHtml = fs.readFileSync(sourceHtmlPath, "utf8");
const styleMatch = sourceHtml.match(/<style>([\s\S]*?)<\/style>/);
if (!styleMatch) {
  throw new Error("Could not find <style> block in master rulebook HTML.");
}

const sourceStyle = styleMatch[1].replace(
  /@page\s*\{\s*size:\s*A4;\s*margin:\s*0;\s*\}/,
  "@page { size: A4 landscape; margin: 0; }"
);

const sections = sourceHtml.match(/<section class="page(?: [^"]*)?">[\s\S]*?<\/section>/g) || [];
if (sections.length === 0) {
  throw new Error("Could not find rulebook page sections.");
}

const blankPage = `<section class="page blank-page">
  <div style="position:absolute; inset:16mm; border:0.35mm solid #ffd6e7; border-radius:7mm; background:#fffdf7;"></div>
</section>`;

const pages = [...sections];
while (pages.length % 4 !== 0) {
  pages.push(blankPage);
}

function page(index1Based) {
  return pages[index1Based - 1] || blankPage;
}

const totalPages = pages.length;
const spreads = [];
for (let left = totalPages, right = 1; right < left; left -= 2, right += 2) {
  spreads.push([left, right]);
  spreads.push([right + 1, left - 1]);
}

const sheetHtml = spreads
  .map(([leftPage, rightPage], idx) => {
    const sideLabel = idx % 2 === 0 ? "앞면" : "뒷면";
    const sheetNumber = Math.floor(idx / 2) + 1;
    return `<section class="booklet-sheet" data-sheet="${sheetNumber}" data-side="${sideLabel}">
  <div class="slot left">${page(leftPage)}</div>
  <div class="slot right">${page(rightPage)}</div>
</section>`;
  })
  .join("\n");

const bookletHtml = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>5도권 회전판 마스터 롤북 중철 A4 소책자</title>
<style>
${sourceStyle}

@page { size: A4 landscape; margin: 0; }
html, body {
  width: 297mm;
  margin: 0;
  padding: 0;
  background: #fff;
}
.booklet-sheet {
  width: 297mm;
  height: 210mm;
  margin: 0;
  padding: 0;
  position: relative;
  overflow: hidden;
  background: #fff;
  page-break-after: always;
  break-after: page;
}
.booklet-sheet:last-child {
  page-break-after: auto;
  break-after: auto;
}
.slot {
  position: absolute;
  top: 0;
  width: 148.5mm;
  height: 210mm;
  overflow: hidden;
  background: #fffdf7;
}
.slot.left { left: 0; }
.slot.right { left: 148.5mm; }
.slot > .page {
  transform: scale(0.7070707071);
  transform-origin: top left;
  page-break-after: auto !important;
  break-after: auto !important;
  margin: 0 !important;
}
.slot > .page:last-child {
  page-break-after: auto !important;
  break-after: auto !important;
}
</style>
</head>
<body>
${sheetHtml}
</body>
</html>`;

fs.writeFileSync(bookletHtmlPath, bookletHtml, "utf8");

const browserCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];
const browser = browserCandidates.find((candidate) => fs.existsSync(candidate));

if (!browser) {
  console.log(`Booklet HTML written: ${bookletHtmlPath}`);
  console.log("PDF was not generated because Chrome or Edge was not found.");
  process.exit(0);
}

execFileSync(browser, [
  "--headless=new",
  "--disable-gpu",
  "--no-pdf-header-footer",
  `--print-to-pdf=${bookletPdfPath}`,
  new URL("file:///" + bookletHtmlPath.replace(/\\/g, "/")).href,
], { stdio: "inherit" });

console.log(`Source pages: ${sections.length}`);
console.log(`Booklet pages with blanks: ${totalPages}`);
console.log(`Printed sides: ${spreads.length}`);
console.log(`Booklet HTML written: ${bookletHtmlPath}`);
console.log(`Booklet PDF written: ${bookletPdfPath}`);
