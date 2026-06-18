/* ============================================================
   5도권 회전판 웹앱 — 데이터 모델 (소스 도안과 1:1 일치)
   index: 5도권에서 C=0부터 시계방향(♯ 증가)으로 0..11
   ============================================================ */

const KEYS = [
  { i: 0,  major: "C",  majorKo: "다장조",       minor: "Am",  minorKo: "가단조",       accCount: "0",  acc: "조표 없음" },
  { i: 1,  major: "G",  majorKo: "사장조",       minor: "Em",  minorKo: "마단조",       accCount: "1♯", acc: "F♯" },
  { i: 2,  major: "D",  majorKo: "라장조",       minor: "Bm",  minorKo: "나단조",       accCount: "2♯", acc: "F♯ C♯" },
  { i: 3,  major: "A",  majorKo: "가장조",       minor: "F♯m", minorKo: "올림바단조",   accCount: "3♯", acc: "F♯ C♯ G♯" },
  { i: 4,  major: "E",  majorKo: "마장조",       minor: "C♯m", minorKo: "올림다단조",   accCount: "4♯", acc: "F♯ C♯ G♯ D♯" },
  { i: 5,  major: "B",  majorKo: "나장조",       minor: "G♯m", minorKo: "올림사단조",   accCount: "5♯", acc: "F♯ C♯ G♯ D♯ A♯",
    enharmonic: { major: "C♭", majorKo: "내림다장조", minor: "A♭m", minorKo: "내림가단조", accCount: "7♭" } },
  { i: 6,  major: "F♯", majorKo: "올림바장조",   minor: "D♯m", minorKo: "올림라단조",   accCount: "6♯", acc: "F♯ C♯ G♯ D♯ A♯ E♯",
    enharmonic: { major: "G♭", majorKo: "내림사장조", minor: "E♭m", minorKo: "내림마단조", accCount: "6♭" } },
  { i: 7,  major: "D♭", majorKo: "내림라장조",   minor: "B♭m", minorKo: "내림나단조",   accCount: "5♭", acc: "B♭ E♭ A♭ D♭ G♭",
    enharmonic: { major: "C♯", majorKo: "올림다장조", minor: "A♯m", minorKo: "올림가단조", accCount: "7♯" } },
  { i: 8,  major: "A♭", majorKo: "내림가장조",   minor: "Fm",  minorKo: "바단조",       accCount: "4♭", acc: "B♭ E♭ A♭ D♭" },
  { i: 9,  major: "E♭", majorKo: "내림마장조",   minor: "Cm",  minorKo: "다단조",       accCount: "3♭", acc: "B♭ E♭ A♭" },
  { i: 10, major: "B♭", majorKo: "내림나장조",   minor: "Gm",  minorKo: "사단조",       accCount: "2♭", acc: "B♭ E♭" },
  { i: 11, major: "F",  majorKo: "바장조",       minor: "Dm",  minorKo: "라단조",       accCount: "1♭", acc: "B♭" },
];

const SEGMENT_COLORS = [
  "#ffe5ec", "#d8f3dc", "#cde7f0", "#fff1c1", "#eadcf8", "#c8f7f2",
  "#ffd6a5", "#cdb4db", "#bde0fe", "#fad2e1", "#d0f4de", "#ffcad4"
];

// I ii iii IV V vi vii° (장조 다이어토닉 3화음, 정확한 철자)
const DIATONIC = {
  "C":  ["C","Dm","Em","F","G","Am","Bdim"],
  "G":  ["G","Am","Bm","C","D","Em","F♯dim"],
  "D":  ["D","Em","F♯m","G","A","Bm","C♯dim"],
  "A":  ["A","Bm","C♯m","D","E","F♯m","G♯dim"],
  "E":  ["E","F♯m","G♯m","A","B","C♯m","D♯dim"],
  "B":  ["B","C♯m","D♯m","E","F♯","G♯m","A♯dim"],
  "F♯": ["F♯","G♯m","A♯m","B","C♯","D♯m","E♯dim"],
  "D♭": ["D♭","E♭m","Fm","G♭","A♭","B♭m","Cdim"],
  "A♭": ["A♭","B♭m","Cm","D♭","E♭","Fm","Gdim"],
  "E♭": ["E♭","Fm","Gm","A♭","B♭","Cm","Ddim"],
  "B♭": ["B♭","Cm","Dm","E♭","F","Gm","Adim"],
  "F":  ["F","Gm","Am","B♭","C","Dm","Edim"],
};
const DEGREE_LABELS = ["I","ii","iii","IV","V","vi","vii°"];

const CARDS = {
  beginner: [
    { id:"초급 01", q:"조표가 ♯ 1개인 장조는?",            a:"정답: G 사장조\n순서: 기준선에서 1♯ 칸을 찾는다." },
    { id:"초급 02", q:"조표가 ♭ 2개인 장조는?",            a:"정답: B♭ 내림나장조\n순서: 플랫 2개 칸을 찾는다." },
    { id:"초급 03", q:"D 장조의 조표를 쓰세요.",           a:"정답: F♯, C♯\n순서: D를 기준선에 맞추고 조표 창을 읽는다." },
    { id:"초급 04", q:"F 장조의 관계단조는?",              a:"정답: Dm 라단조\n순서: F 칸의 중간 원을 읽는다." },
    { id:"초급 05", q:"Am의 관계장조는?",                 a:"정답: C 다장조\n순서: 중간 원 Am이 있는 칸의 바깥 원을 읽는다." },
    { id:"초급 06", q:"조표가 없는 장조와 단조는?",         a:"정답: C 다장조, Am 가단조\n순서: 조표 없음 칸을 찾는다." },
    { id:"초급 07", q:"E♭ 장조의 플랫 이름은?",            a:"정답: B♭, E♭, A♭\n순서: E♭을 기준선에 맞추고 조표 창을 읽는다." },
    { id:"초급 08", q:"Bm의 관계장조는?",                 a:"정답: D 라장조\n순서: 중간 원 Bm이 있는 칸의 바깥 원을 읽는다." },
    { id:"초급 09", q:"C에서 G로 가려면 어느 방향, 몇 칸?", a:"정답: 시계방향 1칸\n순서: 5도권에서 C 다음 시계방향이 G." },
  ],
  intermediate: [
    { id:"중급 01", q:"D 장조의 딸림조와 버금딸림조는?",         a:"정답: 딸림조 A, 버금딸림조 G\n순서: D 기준에서 V와 IV 창을 읽는다." },
    { id:"중급 02", q:"E♭ 장조의 같은 으뜸음 단조는?",          a:"정답: E♭m\n순서: 같은 으뜸음 단조 창을 읽는다." },
    { id:"중급 03", q:"B♭ 장조에서 C 장조로 조옮김: 몇 칸?",     a:"정답: 시계방향 2칸\n순서: B♭ → F → C." },
    { id:"중급 04", q:"G 장조의 관계단조와 같은 으뜸음 단조는?", a:"정답: 관계단조 Em, 같은 으뜸음 단조 Gm\n순서: 중간 원과 동단조 창을 함께 본다." },
    { id:"중급 05", q:"A 장조의 IV, V를 찾으세요.",            a:"정답: IV = D, V = E\n순서: A 기준에서 좌우 기능 창을 읽는다." },
    { id:"중급 06", q:"F minor의 관계장조는?",                a:"정답: A♭ 장조\n순서: Fm이 있는 칸의 바깥 원을 읽는다." },
    { id:"중급 07", q:"C 장조에서 A 장조로 조옮김: 방향과 칸 수", a:"정답: 시계방향 3칸\n순서: C → G → D → A." },
    { id:"중급 08", q:"D♭ 장조의 관계단조는?",                a:"정답: B♭m\n순서: D♭ 칸의 중간 원을 읽는다." },
    { id:"중급 09", q:"E 장조의 조표와 관계단조를 찾으세요.",     a:"정답: 4♯, C♯m\n순서: E를 기준선에 맞추고 중간·안쪽 원을 읽는다." },
  ],
  advanced: [
    { id:"고급 01", q:"C 장조의 V/V를 찾고 해결 코드를 말하세요.",       a:"정답: D7 → G\n순서: 대상 G 위에 포인터의 대상 창을 둔다." },
    { id:"고급 02", q:"G 장조의 V/ii를 찾으세요.",                    a:"정답: E7 → Am\n순서: ii는 Am, Am의 딸림은 E." },
    { id:"고급 03", q:"D 장조의 다이어토닉 3화음을 순서대로 말하세요.",   a:"정답: D, Em, F♯m, G, A, Bm, C♯dim\n순서: I부터 vii°까지 읽는다." },
    { id:"고급 04", q:"A minor에서 화성단음계의 V 코드는?",            a:"정답: E 또는 E7\n순서: 자연단음계 Em을 장화음으로 올려 쓴다." },
    { id:"고급 05", q:"F 장조의 V/vi를 찾으세요.",                    a:"정답: A7 → Dm\n순서: vi는 Dm, D의 딸림은 A." },
    { id:"고급 06", q:"E♭ 장조의 ii-V-I를 쓰세요.",                  a:"정답: Fm - B♭ - E♭\n순서: ii, V, I 창을 차례로 읽는다." },
    { id:"고급 07", q:"A 장조의 vii° 코드는?",                       a:"정답: G♯dim\n순서: A 기준에서 vii° 창을 읽는다." },
    { id:"고급 08", q:"B♭ 장조의 V/IV를 찾으세요.",                  a:"정답: B♭7 → E♭\n순서: IV는 E♭, E♭의 딸림은 B♭." },
    { id:"고급 09", q:"C 장조의 I-vi-ii-V 진행을 쓰세요.",            a:"정답: C - Am - Dm - G\n순서: I, vi, ii, V 창을 읽는다." },
  ],
};

// 루트 이름 → 5도권 인덱스 (이명동음 안전)
const ROOT_TO_INDEX = (() => {
  const m = {};
  KEYS.forEach(k => { m[k.major] = k.i; if (k.enharmonic) m[k.enharmonic.major] = k.i; });
  Object.assign(m, { "G♯": 8, "D♯": 9, "A♯": 10, "E♯": 11, "B♯": 0 });
  return m;
})();

// 루트 이름 → 음높이 클래스(0..11) — ♯/♭ 이명동음 포함
const PITCH_CLASS = {
  "C":0,"B♯":0,"C♯":1,"D♭":1,"D":2,"D♯":3,"E♭":3,"E":4,"F♭":4,
  "E♯":5,"F":5,"F♯":6,"G♭":6,"G":7,"G♯":8,"A♭":8,"A":9,"A♯":10,"B♭":10,"B":11,"C♭":11
};
