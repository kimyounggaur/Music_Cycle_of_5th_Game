# 5도권 회전판 웹앱 — 바이브코딩 프롬프트 (v1.0)

> 이 문서는 `실물_보드_게임` 폴더의 실물 교구 자료(SVG 도안, 제작 사양서, 마스터 룰북, 27장 미션카드)를
> **그대로 디지털로 재현**하는 웹앱을 만들기 위한 "복사해서 붙여넣는" 바이브코딩 프롬프트입니다.
> AI 코딩 도구(Claude Code / Cursor / v0 등)에 **이 문서 전체 또는 섹션 단위**로 붙여넣어 단계적으로 구현하세요.
>
> **최우선 구현 목표:** 회전 원판이 손가락으로 튕기면 **실제로 회전하다가 마찰로 점점 느려지며 정확히 한 조성 칸에 멈추는** 물리 애니메이션. → [섹션 6](#6-회전-애니메이션-정밀-구현-핵심) 참조.

---

## 0. 이 프롬프트를 쓰는 법

1. **한 번에 다 만들지 말 것.** [섹션 10의 마일스톤 순서](#10-단계별-구현-순서-마일스톤)대로 M1 → M9를 차례로 진행합니다.
2. 각 마일스톤마다 "이 마일스톤만 구현하고, 끝나면 멈춰서 확인 요청"이라고 지시하세요.
3. 음악 이론 데이터([섹션 4](#4-데이터-모델-그대로-복사))와 기하/오프셋 규칙([섹션 5](#5-화면-레이아웃과-기하-구조))은 **임의로 바꾸지 말 것**. 실물 교구 검수 기준과 1:1로 일치해야 합니다.
4. 회전 물리([섹션 6](#6-회전-애니메이션-정밀-구현-핵심))는 상수값까지 그대로 쓰고, [섹션 11의 인수 테스트](#11-인수-검수-체크리스트)를 통과시키세요.

---

## 1. 프로젝트 개요

### 1.1 무엇을 만드는가
음악 이론 학습용 **5도권(Circle of Fifths) 회전판**의 웹앱 버전. 실물 교구는 다음 4개 물리 부품으로 구성됩니다. 웹앱은 이 부품들을 **레이어**로 재현합니다.

| 실물 부품 | 역할 | 웹앱에서의 표현 |
|---|---|---|
| 하판 (260×260mm) | 배경, 방향 안내(♯ 증가/♭ 증가) | 최하단 정적 레이어 |
| **3중 회전 원판 (지름 230mm)** | 돌아가는 부분. 바깥=장조, 중간=관계단조, 안쪽=조표 | **회전하는 레이어 (이것만 돈다)** |
| 투명 표시판 (260×260mm) | 고정. 기준선 + 기능 창(I, IV, V, ii, iii, vi, vii°, 관계단조, 조표, 동단조) | 회전 원판 위 정적 오버레이 레이어 |
| 세컨더리 도미넌트 포인터 (지름 230mm) | 고급용. 두 창이 30° 간격 | 토글로 켜는 별도 회전 포인터 레이어 |

### 1.2 핵심 학습 원리 (앱 로직의 근거)
- 원판은 12칸, **한 칸 = 5도권 1칸 = 30°**. 12칸 × 30° = 360°.
- **기준선(12시 방향, 화면 최상단)** 에 어떤 장조를 맞추면, 고정된 표시판의 창들이 그 조의 관계조·코드 기능을 자동으로 읽어 줍니다.
- 시계방향 = ♯(샵) 증가, 반시계방향 = ♭(플랫) 증가 *(이는 원판 면에 인쇄된 라벨 배열 순서)*. **단, 어떤 칸을 12시 기준선으로 "가져오기 위해" 원판을 돌리는 방향은 그 반대**임에 주의 — 화살표·키 매핑은 [섹션 6.8](#68-엣지품질-체크리스트-애니메이션)의 실제 동작에 맞출 것.

### 1.3 사용자/용도
- 대상: 초등 고학년~성인 입문자. 1:1 레슨, 소그룹 수업, 음악 이론 게임.
- 3단계: **초급**(조표·조 이름) / **중급**(관계조·조옮김) / **고급**(다이어토닉 코드·세컨더리 도미넌트).

---

## 2. 기술 스택과 제약

**권장(기본):** 의존성 없는 **단일 폴더 정적 웹앱**.
- `index.html` + `style.css` + `app.js` (또는 ES 모듈 분리). 빌드 도구 없이 더블클릭/정적 호스팅으로 실행 가능해야 함.
- 회전판은 **인라인 SVG**로 그리고 `<g transform="rotate(...)">` 로 회전. (CSS `transform: rotate()` 도 가능하나, JS 물리 루프에서 매 프레임 각도를 직접 제어하므로 SVG/CSS 어느 쪽이든 **JS가 회전 각도의 단일 진실 공급원**이어야 함.)
- 애니메이션은 **`requestAnimationFrame` 기반 물리 루프**. CSS transition/keyframe으로 감속을 흉내내지 말 것(정밀 제어·중단·드래그 연동 불가).
- 사운드는 **Web Audio API**(외부 파일 없이 오실레이터로 화음 재생).

**선택(대안):** React + Vite. 이 경우 회전 각도는 `useRef`로 보관하고 rAF 루프에서 DOM/SVG transform을 직접 갱신(리렌더 금지). 물리 로직은 동일.

**제약**
- 모바일 터치 + 데스크톱 마우스 + 키보드 모두 지원(Pointer Events 사용).
- 한글/♯/♭/° 기호가 깨지지 않게 `<meta charset="utf-8">`, 폰트 폴백 지정.
- 외부 네트워크 의존 금지(오프라인 동작). 폰트는 시스템 폰트 폴백.

---

## 3. 디자인 토큰 (실물 도안과 동일한 파스텔 톤)

실물 SVG 생성기와 동일한 값을 CSS 변수로 정의하세요.

```css
:root {
  /* 잉크/텍스트 */
  --ink:      #293241;
  --soft-ink: #5b6375;
  --guide:    #9aa4b2;
  /* 포인트 */
  --cut:      #ff5d8f;   /* 기준선·강조 핑크 */
  --mint:     #65c3ad;
  --coral:    #ff7b7b;
  --blue:     #5ba7e1;
  --lavender: #9b7ede;
  --honey:    #f5a742;
  /* 배경 */
  --blush:    #fff7fb;
  --cream:    #fffdf4;
  --paper:    #fffdf7;
}
```

**12칸 세그먼트 색(인덱스 0~11 순서, 절대 순서 바꾸지 말 것):**
```js
const SEGMENT_COLORS = [
  "#ffe5ec", "#d8f3dc", "#cde7f0", "#fff1c1", "#eadcf8", "#c8f7f2",
  "#ffd6a5", "#cdb4db", "#bde0fe", "#fad2e1", "#d0f4de", "#ffcad4"
];
```

**폰트:** `"Malgun Gothic", "Noto Sans KR", Apple SD Gothic Neo, Arial, sans-serif`
**장식 모티프:** 작은 음표(♪ ♬)·별(✦)·콘페티를 연한 색으로. 정보 가독성을 해치지 않게 opacity 0.7~0.9.
**라벨 스타일:** 둥근 알약형(pill, border-radius 큼), 부드러운 테두리.

---

## 4. 데이터 모델 (그대로 복사)

> ⚠️ 아래 데이터는 실물 교구의 룰북/도안에서 추출한 **정답 기준**입니다. 값/순서/철자를 바꾸지 마세요.
> 인덱스 0~11은 **시계방향(♯ 증가 방향)** 순서입니다. C(0)에서 시작해 한 칸씩 시계방향으로 G, D, A …

### 4.1 12조성 기본 테이블

```js
// index: 5도권에서 C=0부터 시계방향(♯ 증가)으로 0..11
// major: 장조(영문, 한글)  minor: 관계단조  sharps/flats: 조표 개수와 실제 음
const KEYS = [
  { i: 0,  major: "C",      majorKo: "다장조",            minor: "Am",  minorKo: "가단조",              accCount: "0",      acc: "조표 없음" },
  { i: 1,  major: "G",      majorKo: "사장조",            minor: "Em",  minorKo: "마단조",              accCount: "1♯",     acc: "F♯" },
  { i: 2,  major: "D",      majorKo: "라장조",            minor: "Bm",  minorKo: "나단조",              accCount: "2♯",     acc: "F♯ C♯" },
  { i: 3,  major: "A",      majorKo: "가장조",            minor: "F♯m", minorKo: "올림바단조",          accCount: "3♯",     acc: "F♯ C♯ G♯" },
  { i: 4,  major: "E",      majorKo: "마장조",            minor: "C♯m", minorKo: "올림다단조",          accCount: "4♯",     acc: "F♯ C♯ G♯ D♯" },
  { i: 5,  major: "B",      majorKo: "나장조",            minor: "G♯m", minorKo: "올림사단조",          accCount: "5♯",     acc: "F♯ C♯ G♯ D♯ A♯",  enharmonic: { major: "C♭", majorKo: "내림다장조", minor: "A♭m", minorKo: "내림가단조", accCount: "7♭" } },
  { i: 6,  major: "F♯",     majorKo: "올림바장조",        minor: "D♯m", minorKo: "올림라단조",          accCount: "6♯",     acc: "F♯ C♯ G♯ D♯ A♯ E♯", enharmonic: { major: "G♭", majorKo: "내림사장조", minor: "E♭m", minorKo: "내림마단조", accCount: "6♭" } },
  { i: 7,  major: "D♭",     majorKo: "내림라장조",        minor: "B♭m", minorKo: "내림나단조",          accCount: "5♭",     acc: "B♭ E♭ A♭ D♭ G♭", enharmonic: { major: "C♯", majorKo: "올림다장조", minor: "A♯m", minorKo: "올림가단조", accCount: "7♯" } },
  { i: 8,  major: "A♭",     majorKo: "내림가장조",        minor: "Fm",  minorKo: "바단조",              accCount: "4♭",     acc: "B♭ E♭ A♭ D♭" },
  { i: 9,  major: "E♭",     majorKo: "내림마장조",        minor: "Cm",  minorKo: "다단조",              accCount: "3♭",     acc: "B♭ E♭ A♭" },
  { i: 10, major: "B♭",     majorKo: "내림나장조",        minor: "Gm",  minorKo: "사단조",              accCount: "2♭",     acc: "B♭ E♭" },
  { i: 11, major: "F",      majorKo: "바장조",            minor: "Dm",  minorKo: "라단조",              accCount: "1♭",     acc: "B♭" },
];
```

### 4.2 다이어토닉 3화음 (장조 기준, 정확한 철자 — 표시용 룩업)

```js
// I  ii  iii  IV  V  vi  vii°  (장조 다이어토닉 7화음의 3화음 버전)
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
// 화음 기능별 성질(품질)은 항상 고정: I=장, ii=단, iii=단, IV=장, V=장, vi=단, vii°=감
```

### 4.3 미션 카드 27장 (그대로 복사)

```js
const CARDS = {
  beginner: [ // 초급 9장: 조표·조 이름·관계조
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
  intermediate: [ // 중급 9장: 딸림/버금딸림·동주음조·조옮김
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
  advanced: [ // 고급 9장: 다이어토닉·ii-V-I·세컨더리 도미넌트
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
```

---

## 5. 화면 레이아웃과 기하 구조

### 5.1 레이어 구조 (z-index 낮은 것부터)
```
[0] 하판 배경        : 정적. 방향 화살표(♯/♭), 타이틀, 고무발 장식.
[1] 회전 원판        : ★유일하게 회전★. 12칸 × 3링(장조/관계단조/조표).
[2] 투명 표시판      : 정적 오버레이. 기준선 + 기능 창 테두리.
[3] 세컨더리 포인터  : 토글 ON일 때만. 별도 회전(드래그). 두 창 30° 간격.
[4] 기준선/인디케이터: 12시 방향 삼각/선 마커(항상 최상단).
```
모든 원형 레이어는 **동일한 중심**을 공유합니다. `viewBox="0 0 260 260"`, 중심 `(130,130)`. 회전 원판(지름 230) 반지름 115.

### 5.2 각도 좌표계 (반드시 통일)
- **각도는 "12시(위)에서 시계방향"으로 측정.** 위=0°, 3시=90°, 6시=180°, 9시=270°.
- 극좌표 변환:
```js
function polar(cx, cy, r, deg) { // deg: 위에서 시계방향
  const rad = (deg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
```
- **칸 i의 중심 각도 = i × 30°** (정지 상태에서 칸 0=C가 12시).
- 칸 경계선은 `i × 30 − 15°`.

### 5.3 회전 원판의 3개 링(반지름은 230mm 도안 기준)
| 링 | 반지름(중심선) | 내용 | 데이터 |
|---|---|---|---|
| 바깥 | r ≈ 99 | 장조 (영문 큰 글씨 + 한글) | `KEYS[i].major / majorKo` |
| 중간 | r ≈ 70 | 관계단조 | `KEYS[i].minor / minorKo` |
| 안쪽 | r ≈ 42 | 조표 개수 + 실제 음 | `KEYS[i].accCount / acc` |
| 중앙 | r < 28 | 허브(타이틀, "시계방향 ♯ / 반시계방향 ♭") | 정적 |

링 세그먼트(부채꼴)는 각 칸 `i*30−15`부터 `i*30+15`까지 그립니다. **반지름 경계(소스 도안 230mm 기준, M1에서 그대로 사용):** 외곽 림 `115`, 세그먼트 환(annulus) 경계 `111.5 / 84 / 56 / 28`, 허브(중앙 원) `0~28`, 중앙 타공 표시 반지름 `2.5`(=실물 5mm). 글자 배치 반지름은 바깥 링 `≈99`, 중간 링 `≈70`, 안쪽 링 `≈42`.

### 5.4 투명 표시판의 고정 창 = "오프셋 규칙" (★앱 로직의 핵심)

기준선(12시)에 칸 `i`를 맞추면, 표시판의 각 창은 **회전 원판의 바깥 링을 고정된 각도 오프셋 위치에서 읽습니다.** 5도권의 수학적 성질상, 바깥 링의 "장조 루트"를 읽되 **기능에 따라 화음 성질(장/단/감)만 덧씌우면** 다이어토닉 코드가 됩니다.

```
오프셋(칸) | 화면 각도 |  기능   | 창 라벨        | 읽는 링 | 성질
   -1     |  330°(-30)| IV     | 버금딸림조      | 바깥   | 장
    0     |    0°     | I      | 현재 장조       | 바깥   | 장
   +1     |   30°     | V      | 딸림조          | 바깥   | 장
   +2     |   60°     | ii     | 2도 단화음      | 바깥   | 단
   +3     |   90°     | vi     | 6도 단화음      | 바깥   | 단
   +4     |  120°     | iii    | 3도 단화음      | 바깥   | 단
   +5     |  150°     | vii°   | 이끔감화음      | 바깥   | 감
    0     |    0°     | 관계단조 | 관계단조        | 중간   | (KEYS.minor)
   -3     |  270°(-90)| 동단조  | 같은 으뜸음 단조 | 중간   | (KEYS.minor)
    0     |    0°     | 조표    | 조표            | 안쪽   | (KEYS.acc)
```

**읽기 함수(정보 패널/창 텍스트 생성):**
```js
function readWindows(i) {                 // i = 기준선에 온 칸 인덱스
  const at = (off) => KEYS[((i + off) % 12 + 12) % 12];
  const major = (k) => k.major;           // 바깥 링 루트
  const minor = (k) => k.minor;           // 중간 링
  return {
    key:        KEYS[i],
    I:          major(at(0)),
    IV:         major(at(-1)),
    V:          major(at(1)),
    ii:         minor3(at(2)),            // 루트는 at(2)의 major, 성질은 단 → 아래 헬퍼
    iii:        minor3(at(4)),
    vi:         minor3(at(3)),            // = 관계단조와 동일 루트
    vii_dim:    dim3(at(5)),
    relativeMinor: minor(at(0)),          // 관계단조
    parallelMinor: minor(at(-3)),         // 동단조(같은 으뜸음 단조)
    signature:  { count: KEYS[i].accCount, notes: KEYS[i].acc },
    // 정확한 철자는 DIATONIC 룩업으로 교차검증(아래 5.5 참고)
    diatonic:   DIATONIC[KEYS[i].major],
  };
}
// 기능 화음 표기 헬퍼: 기하 루트에 성질 덧씌우기(개념 설명용). 화면 표기는 DIATONIC 우선.
function minor3(k){ return k.major + "m"; }
function dim3(k){ return k.major + "dim"; }
```

### 5.5 기하 읽기 vs 정확한 철자 (반드시 처리할 미묘한 지점)
- 위 "오프셋 규칙"은 **개념적으로** 항상 맞지만, **이명동음(enharmonic) 철자**에서 어긋날 수 있습니다.
  예) A 장조의 vii°는 정확히는 **G♯dim**인데, 오프셋 +5 칸은 인덱스 8 = `A♭`(=G♯의 이명동음)로 표시됩니다.
- **해결:** 화면에 실제로 표기하는 코드 이름은 **`DIATONIC[현재장조]` 룩업 테이블(4.2)을 1순위**로 사용하고,
  오프셋 규칙은 "원판에서 위치를 찾는 학습 원리"를 시각화(하이라이트)하는 데만 사용하세요.
- 즉: **위치 찾기 = 기하 오프셋, 글자 표기 = DIATONIC 테이블.** 둘 다 보여주되 표기는 테이블이 정답.

### 5.6 V / IV의 간단 규칙 (검증용)
- 딸림조 V = `KEYS[(i+1)%12]`, 버금딸림조 IV = `KEYS[(i+11)%12]`.
- 조옮김 거리 = 5도권 칸 차이 = `((target - start) % 12 + 12) % 12` (시계방향 칸 수), 6 초과면 반시계가 더 가까움.

### 5.7 세컨더리 도미넌트 포인터 (고급 토글)
- 별도 투명 원형 레이어. 창 2개가 **30°(1칸) 간격**: "대상 코드" 창(0°)과 "V/대상" 창(+30°).
- 사용법: 대상 코드 루트가 있는 칸 위에 "대상 코드" 창을 두면, "V/대상" 창에는 그 대상의 **딸림화음 루트**(= 1칸 시계방향)가 들어옴. 거기에 `7`을 붙여 도미넌트7로 사용.
- 로직(이명동음 안전): 대상 코드의 **루트 이름 → 5도권 인덱스** 매핑이 필요합니다. 샵 철자(G♯·A♯·D♯·E♯ 등)는 `KEYS[i].major`에 없으므로 보강 맵이 필수입니다(없으면 `findIndex`가 -1 반환).
```js
// 모든 가능한 루트 철자 → 5도권 인덱스
const ROOT_TO_INDEX = (() => {
  const m = {};
  KEYS.forEach(k => { m[k.major] = k.i; if (k.enharmonic) m[k.enharmonic.major] = k.i; });
  Object.assign(m, { "G♯":8, "D♯":9, "A♯":10, "E♯":11, "B♯":0 }); // DIATONIC에만 등장하는 샵 루트
  return m;
})();
function rootOf(chord){ return chord.replace(/(maj|m|dim|°|7).*$/, ""); } // "G♯m"→"G♯", "Bdim"→"B"
function secondaryDominant(targetChord){
  const idx = ROOT_TO_INDEX[rootOf(targetChord)];
  if (idx == null) return null;                 // 표에 없는 철자는 미지원(안내 메시지)
  return KEYS[(idx + 1) % 12].major + "7";      // 대상의 딸림7 (5도권 1칸 시계방향)
}
// 예: secondaryDominant("Am") → ROOT_TO_INDEX["A"]=3 → KEYS[4]="E" → "E7" (V/ii in G), 해결은 대상 Am.
```

---

## 6. 회전 애니메이션 정밀 구현 (핵심) ★

> 목표: **사용자가 원판을 손가락/마우스로 튕기면(flick) 실제 관성으로 빠르게 돌다가, 마찰로 점점 느려지고, 마지막에 정확히 한 조성 칸이 기준선에 딱 맞으며 멈춘다.** CSS 트랜지션이 아니라 **물리 적분 루프**로 구현한다.

### 6.1 회전의 단일 상태
```js
const wheel = {
  angle: 0,        // 원판의 현재 회전각(도). 시계방향 +. 누적 실수값(범위 제한 없음).
  omega: 0,        // 각속도(도/초). 시계방향 +.
  mode: "idle",    // "idle" | "dragging" | "spinning" | "settling" | "tweening"
};
```
- **`angle`이 회전의 단일 진실 공급원.** 렌더는 매 프레임 `disc`의 transform만 갱신(React라면 리렌더 금지, ref로 직접 조작).

**필수 보조 함수(아래 6.4~6.7 모든 코드가 사용 — 반드시 먼저 정의):**
```js
const svg  = document.querySelector("#wheel-svg");   // viewBox="0 0 260 260" 인 SVG 루트
const disc = document.querySelector("#disc");         // 회전하는 <g> (회전 중심 130,130)

// 회전각을 화면에 반영하는 유일한 렌더(원판 transform만 건드림)
function render() {
  disc.setAttribute("transform", `rotate(${wheel.angle} 130 130)`);
}

// 화면 픽셀 → SVG 좌표. 반드시 '정지한 SVG 루트' 기준(회전하는 <g>가 아님!).
// 이렇게 해야 6.6의 드래그 피드백 루프가 원천 차단된다.
function toSvgCoords(ev) {
  const p = svg.createSVGPoint();
  p.x = ev.clientX; p.y = ev.clientY;
  return p.matrixTransform(svg.getScreenCTM().inverse());  // 회전과 무관한 고정 좌표계
}
```

### 6.2 어느 칸이 기준선에 왔는지 (인덱스 매핑)
칸 i는 정지 시 각도 `i*30`에 있음. 원판을 `angle`만큼 시계방향 회전하면 칸 i는 `i*30 + angle`로 이동. 기준선(0°)에 오는 칸은 `i*30 + angle ≡ 0 (mod 360)`:
```js
function selectedIndex(angle) {
  // i ≡ -angle/30 (mod 12)
  const raw = Math.round(-angle / 30);
  return ((raw % 12) + 12) % 12;
}
// 가장 가까운 디텐트(칸 정렬) 각도
function nearestDetent(angle) { return Math.round(angle / 30) * 30; }
```
**단위 테스트(섹션 11에서 사용):**
`selectedIndex(0)===0`(C), `selectedIndex(-30)===1`(G), `selectedIndex(30)===11`(F), `selectedIndex(-90)===3`(A), `selectedIndex(360-30)===1`(G, 정규화 무관).

### 6.3 물리 모델: 점성 + 쿨롱 마찰 (유한 시간에 정지)
실제 회전 원판은 두 가지 마찰을 받음:
- **점성 마찰(공기·축):** 속도에 비례 → 빠를 때 강하게 감속 (자연스러운 초반 감속).
- **쿨롱 마찰(베어링 정지 마찰):** 일정 크기 → 속도가 0이 되는 **유한 시간 정지**를 보장.

미분방정식:
```
dω/dt = -(VISCOUS · ω + COULOMB · sign(ω))
```
순수 지수감쇠(점성만)는 영원히 안 멈추는 꼬리가 생기므로 **쿨롱 항을 반드시 포함**한다.

### 6.4 프레임레이트 독립 적분 루프 (그대로 사용)
```js
// ── 튜닝 상수 (도/초 단위) ───────────────────────────────
const VISCOUS    = 1.2;     // 점성 계수 [1/s]. 클수록 초반 감속 빠름.
const COULOMB    = 140;     // 쿨롱 감속 [도/초^2]. 클수록 빨리 멈춤.
const MAX_OMEGA  = 1800;    // 각속도 상한 [도/초] (=5회전/초). flick 폭주 방지.
const SETTLE_OMEGA = 90;    // 이 속도 미만이면 '정렬(snap)' 단계로 전환 [도/초].
const SETTLE_MS  = 420;     // snap 정렬 트윈 시간 [ms].
const MAX_DT     = 0.032;   // dt 상한 [s] (탭 비활성 후 점프 방지).

let _last = null;
function loop(now) {
  if (_last == null) _last = now;
  let dt = (now - _last) / 1000;
  _last = now;
  if (dt > MAX_DT) dt = MAX_DT;          // 큰 점프 클램프

  if (wheel.mode === "spinning") {           // 관성 감속(drag flick)일 때만 물리 적분
    integrate(dt);
    if (Math.abs(wheel.omega) < SETTLE_OMEGA) startSettle();
  } else if (wheel.mode === "settling") {    // 마지막 칸 정렬 트윈
    stepSettle(now);
  }
  // mode === "tweening"(버튼 룰렛/칩) · "dragging" · "idle" 일 때 이 루프는 적분/정렬하지 않음.
  // (tweening은 6.7의 tweenAngle이 자체 rAF로 angle을 직접 제어한다.)
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function integrate(dt) {
  // 안정성을 위해 dt를 작은 서브스텝으로 쪼갠다(고속 회전 시 정확도↑)
  const STEP = 1 / 240;                  // 240Hz 고정 서브스텝
  let t = dt;
  while (t > 0) {
    const h = Math.min(STEP, t);
    const s = Math.sign(wheel.omega) || 0;
    let next = wheel.omega - (VISCOUS * wheel.omega + COULOMB * s) * h;
    if (Math.sign(next) !== s) next = 0;  // 쿨롱 항이 부호를 뒤집으면 정지
    wheel.omega = next;
    wheel.angle += wheel.omega * h;
    t -= h;
  }
}
```

### 6.5 마지막 정렬(Snap/Settle): 정확히 칸에 멈추기
물리 정지 위치는 칸과 어긋나므로, 속도가 `SETTLE_OMEGA` 아래로 떨어지면 **가장 가까운 디텐트로 부드럽게 트윈**한다.
```js
let _settle = null;
function startSettle() {
  const from = wheel.angle;
  const to   = nearestDetent(wheel.angle);   // 가장 가까운 30° 배수
  wheel.mode = "settling";
  wheel.omega = 0;
  _settle = { from, to, start: null, dur: SETTLE_MS };
}
function stepSettle(now) {
  if (_settle.start == null) _settle.start = now;
  const p = Math.min(1, (now - _settle.start) / _settle.dur);
  const e = easeOutBack(p);                  // 살짝 "톡" 걸리는 느낌(원판 디텐트 감성)
  wheel.angle = _settle.from + (_settle.to - _settle.from) * e;
  if (p >= 1) {
    wheel.angle = _settle.to;
    wheel.mode = "idle";
    onStop(selectedIndex(wheel.angle));      // ← 멈춘 조성 확정 콜백(정보 패널 갱신, 사운드 등)
  }
}
// 이징: 끝에서 살짝 넘었다 돌아오는 디텐트 느낌. 과하면 b를 줄이거나 easeOutCubic 사용.
function easeOutBack(t){ const b=1.2; return 1 + (b+1)*Math.pow(t-1,3) + b*Math.pow(t-1,2); }
function easeOutCubic(t){ return 1 - Math.pow(1-t, 3); }
```
> 톡 걸리는 느낌이 싫으면 `easeOutBack` 대신 `easeOutCubic`을 쓰세요. 둘 다 제공하고 설정으로 토글하면 좋음.

**정지 확정 콜백 `onStop(i)`** — 드래그·버튼·칩 어느 경로로 멈추든 호출되어 화면을 갱신합니다. 표시판 창은 **정지한 오버레이 레이어**에, 세그먼트는 **회전하는 원판 레이어**에 있으므로, 하이라이트는 *오버레이가 아니라* **회전 원판의 세그먼트 DOM에 클래스를 토글**하는 방식이라야 회전과 함께 정확한 칸을 가리킵니다.
```js
function onStop(i) {
  updatePanel(readWindows(i));   // 정보 패널 텍스트 갱신(섹션 5.4)
  updateHighlights(i);           // 회전 원판 위 해당 세그먼트 강조
  announce(i);                   // 접근성 aria-live 안내(섹션 9)
  // playChord(i);               // (선택) 사운드(섹션 8)
}

// M1에서 각 칸 그룹에 data-seg="0..11" 을 부여해 둔다는 전제.
function updateHighlights(i) {
  document.querySelectorAll('#disc [data-seg]').forEach(el => el.classList.remove('hl','hl-root'));
  const offsets = [-1, 0, 1, 2, 3, 4, 5];                 // IV,I,V,ii,vi,iii,vii° (바깥 링 기능 창)
  for (const off of offsets) {
    const seg = ((i + off) % 12 + 12) % 12;
    document.querySelector(`#disc [data-seg="${seg}"]`)?.classList.add('hl');
  }
  document.querySelector(`#disc [data-seg="${i}"]`)?.classList.add('hl-root');  // 기준 칸 강조
}
// updatePanel(readWindows(i)) 와 announce(i) 는 정보 패널/aria-live DOM에 텍스트를 채우는 단순 함수(M4·M9에서 구현).
```

### 6.6 입력 ① — 드래그로 튕기기 (Pointer Events, 관성 물리)
포인터의 **최근 이동 각속도**를 측정해 `omega` 초기값으로 넘긴다(자연스러운 flick).
```js
const center = { x: 130, y: 130 };           // SVG 좌표 기준(렌더 시 화면좌표로 변환 필요)
let drag = null;

function angleOfPointer(ev) {                 // 중심 기준 포인터 각도(도, 위에서 시계방향)
  const pt = toSvgCoords(ev);                 // 화면→SVG 좌표 변환(아래 주의)
  const dx = pt.x - center.x, dy = pt.y - center.y;
  return Math.atan2(dx, -dy) * 180 / Math.PI; // atan2(dx, -dy): 위=0, 시계방향+
}

disc.addEventListener("pointerdown", (ev) => {
  disc.setPointerCapture(ev.pointerId);
  wheel.mode = "dragging";
  wheel.omega = 0;
  const a = angleOfPointer(ev);
  drag = { lastAngle: a, baseAngle: wheel.angle, samples: [{ a, t: ev.timeStamp }] };
});

disc.addEventListener("pointermove", (ev) => {
  if (wheel.mode !== "dragging" || !drag) return;
  const a = angleOfPointer(ev);
  let d = a - drag.lastAngle;
  if (d > 180) d -= 360; else if (d < -180) d += 360;  // 각도 언랩(경계 점프 방지)
  wheel.angle += d;                          // 원판이 손가락을 그대로 따라감
  drag.lastAngle = a;
  drag.samples.push({ a: drag.samples[drag.samples.length-1].a + d, t: ev.timeStamp });
  // 최근 80ms 샘플만 유지
  const cutoff = ev.timeStamp - 80;
  while (drag.samples.length > 2 && drag.samples[0].t < cutoff) drag.samples.shift();
  render();
});

function endDrag(ev) {
  if (wheel.mode !== "dragging") return;
  const s = drag.samples;
  // 최근 구간의 평균 각속도 = flick 속도
  const first = s[0], last = s[s.length - 1];
  const dt = (last.t - first.t) / 1000;
  let w = dt > 0 ? (last.a - first.a) / dt : 0;   // 도/초
  w = Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, w));
  wheel.omega = w;
  drag = null;
  if (Math.abs(w) < SETTLE_OMEGA) startSettle();  // 거의 안 튕겼으면 바로 정렬
  else wheel.mode = "spinning";
}
disc.addEventListener("pointerup", endDrag);
disc.addEventListener("pointercancel", endDrag);
```
**⚠️ 좌표 변환 주의(`toSvgCoords`):** 마우스 좌표(clientX/Y)는 화면 픽셀, 회전 각 계산은 SVG/원판 중심 기준이어야 함. `svg.getScreenCTM().inverse()`로 변환하거나, 컨테이너 `getBoundingClientRect()`로 중심을 구해 같은 좌표계에서 계산할 것. **드래그 회전은 원판 회전 변환의 영향을 받지 않는 정지 좌표계(중심·반지름)에서 각도를 계산**해야 한다(원판이 도는데 그 위 좌표로 각을 재면 피드백 루프 발생).

### 6.7 입력 ② — "돌리기" 버튼 (룰렛식, 지정 칸 정확 착지)
퀴즈/게임 모드용. **랜덤 또는 지정한 칸에 정확히 멈추도록** 결정론적 스핀(여러 바퀴 후 이징 착지).
```js
function spinTo(targetIndex /* null이면 랜덤 */, opts = {}) {
  const turns = opts.turns ?? (4 + Math.floor(rand() * 3));   // 4~6바퀴
  const dur   = opts.dur ?? 3800;                              // ms
  const idx   = (targetIndex == null) ? Math.floor(rand()*12) : targetIndex;
  // 목표 각: idx가 기준선에 오려면 angle ≡ -idx*30 (mod 360)
  const base = wheel.angle;
  const targetMod = ((-idx * 30) % 360 + 360) % 360;
  const curMod    = ((base % 360) + 360) % 360;
  let forward = targetMod - curMod; if (forward < 0) forward += 360; // 시계방향 전진(이미 정렬돼 있으면 forward=0 → 정확히 turns바퀴)
  const to = base + turns * 360 + forward;
  tweenAngle(base, to, dur, easeOutQuart, () => onStop(idx));
}
function easeOutQuart(t){ return 1 - Math.pow(1-t, 4); }       // 강한 감속 꼬리

// 인접 칸 이동(키보드 ←/→)·조성 칩 클릭용: 여러 바퀴 없이 '최단 경로'로 부드럽게 이동.
function stepTo(targetIndex, dur = 420) {
  const base = wheel.angle;
  const targetBase = -targetIndex * 30;                       // targetIndex가 기준선에 오는 절대 각
  const delta = (((targetBase - base) % 360) + 540) % 360 - 180; // [-180,180) 최단 경로
  tweenAngle(base, base + delta, dur, easeOutCubic, () => onStop(targetIndex));
}

function tweenAngle(from, to, dur, ease, done) {
  wheel.mode = "tweening"; wheel.omega = 0;                    // ★물리 루프가 건드리지 않는 전용 모드(스핀/정렬 로직과 충돌 방지)
  let start = null;
  function frame(now){
    if (wheel.mode !== "tweening") return;                    // 드래그로 인터럽트되면 즉시 양보
    if (start == null) start = now;
    const p = Math.min(1, (now - start) / dur);
    wheel.angle = from + (to - from) * ease(p);
    render();
    if (p < 1) requestAnimationFrame(frame);
    else { wheel.mode = "idle"; done && done(); }
  }
  requestAnimationFrame(frame);
}
// rand(): 결정론적 시드가 필요하면 시드 RNG 사용. 일반 사용은 Math.random.
function rand(){ return Math.random(); }
```
> 드래그식(6.6)과 버튼식(6.7)을 **모두** 제공하세요. 드래그식은 "직접 돌리는 손맛", 버튼식은 "공정한 랜덤 퀴즈"에 적합.

### 6.8 엣지/품질 체크리스트 (애니메이션)
- [ ] 탭 전환/백그라운드 후 복귀 시 원판이 순간이동하지 않음(`MAX_DT` 클램프 동작).
- [ ] 회전 중 다시 잡으면(pointerdown) 즉시 그 자리에서 드래그로 인계(omega 0, mode dragging).
- [ ] 아주 살짝만 돌려도(작은 flick) 어색하게 튀지 않고 가까운 칸으로 부드럽게 정렬.
- [ ] 세게 튕기면 4~8바퀴가량 돌고 3~6초 사이 정지(상수로 조정 가능).
- [ ] 멈춘 뒤 `selectedIndex`와 화면 정보 패널·창 하이라이트가 항상 일치.
- [ ] **방향 정합성(주의):** 원판은 손가락을 그대로 따라 돈다(직접 조작). 원판을 **반시계방향**으로 돌리면 기준선에는 **♯(샵)이 늘어나는 조**(C→G→D…)가, **시계방향**으로 돌리면 **♭(플랫)이 늘어나는 조**(C→F→B♭…)가 올라온다. (원판 면 인쇄 배열은 "시계방향=♯ 증가"지만, 그 칸을 12시 기준선으로 **가져오려면 원판을 반대로** 돌려야 하기 때문이다. 화살표·안내 문구를 이 실제 동작에 맞춰 표기할 것.)
- [ ] `prefers-reduced-motion: reduce` 시: 긴 스핀 대신 짧은 페이드/즉시 정렬로 대체.
- [ ] 60fps가 아닌 기기(고주사율 120/144Hz 포함)에서도 정지 시간/거리 거의 동일(프레임레이트 독립).

### 6.9 튜닝 가이드 (느낌 조절표)
| 원하는 변화 | 바꿀 상수 | 방향 |
|---|---|---|
| 더 오래 돈다 | `VISCOUS`↓, `COULOMB`↓ | 작게 |
| 더 빨리 선다 | `COULOMB`↑ | 크게 |
| 초반 쫙 감속 | `VISCOUS`↑ | 크게 |
| 멈출 때 더 "톡" | `easeOutBack`의 b↑ | 크게(과하면 멀미) |
| 버튼 스핀 더 길게 | `dur`, `turns`↑ | 크게 |

---

## 7. 상호작용과 게임 모드

### 7.1 자유 탐색 모드 (기본)
- 드래그로 원판 회전 → 멈추면 **정보 패널**이 그 조성의 전체 정보 표시:
  현재 장조(영/한), 관계단조, 조표(개수+음), 딸림조 V, 버금딸림조 IV, ii·iii·vi·vii°, 동단조(같은 으뜸음 단조), 다이어토닉 7화음.
- 표시판 창들이 회전 원판 위에서 **실제로 해당 칸을 가리키도록** 하이라이트(테두리 강조).
- 조성 칩(C·G·D…) 클릭 시 `stepTo(index)`(최단 경로 트윈)로 그 조까지 회전. *(여러 바퀴 도는 룰렛식 `spinTo()`는 퀴즈 전용.)*

### 7.2 미션 카드 모드
- 난이도 선택(초급/중급/고급) → 카드 덱에서 한 장 뽑기(`CARDS`).
- **덱 상태(무작위·중복 없이):** 난이도별 배열을 셔플해 두고 `pop()`으로 뽑습니다. 소진되면 "덱 완료" 표시 후 재셔플. 타임어택은 **서로 다른 5장**을 보장합니다.
```js
function shuffle(a){ for(let k=a.length-1;k>0;k--){ const j=Math.floor(rand()*(k+1)); [a[k],a[j]]=[a[j],a[k]]; } return a; }
let currentLevel = "beginner";
let deck = shuffle([...CARDS[currentLevel]]);
function drawCard(){
  if (deck.length === 0) deck = shuffle([...CARDS[currentLevel]]);  // 소진 시 재셔플(= "덱 완료" 후 재시작)
  return deck.pop();
}
function changeLevel(level){ currentLevel = level; deck = shuffle([...CARDS[level]]); }
function dealTimeAttack(){ const d = shuffle([...CARDS[currentLevel]]); return d.slice(0,5); } // 서로 다른 5장
```
- 카드 앞면(질문) 표시 → 사용자가 원판을 돌려 답을 찾음 → "정답 확인" 누르면 뒷면(`a`) 공개.
- 점수 규칙(룰북 기반): 답만 맞히면 1점, **찾은 과정 설명까지** 하면 2점(자기 평가 토글).
- 게임 변형: **릴레이**(한 명 조 맞추고 다음 명 관계조 읽기), **타임어택**(60초/5장).

### 7.3 세컨더리 도미넌트 모드 (고급 토글)
- 포인터 레이어 ON → 대상 코드를 고르면 포인터가 회전해 "대상 코드" 창을 대상 위에 정렬.
- "V/대상" 창에 표시되는 루트 + `7` 을 도미넌트7로 안내, 해결 코드(=대상)도 함께 표시.

### 7.4 학습 단계 UI
- 상단 토글: **초급 / 중급 / 고급**. 단계별로 정보 패널에 표시하는 항목을 점진 공개:
  - 초급: 장조·관계단조·조표만.
  - 중급: + V/IV, 동단조, 조옮김 거리 계산기.
  - 고급: + 다이어토닉 7화음 전체, 세컨더리 도미넌트.

---

## 8. 사운드 (선택, Web Audio)
- 멈춘 조성의 **으뜸화음(I)** 또는 음계를 오실레이터로 재생(외부 파일 없이).
- 다이어토닉 코드 칩 클릭 시 해당 3화음 재생. **루트 이름→음높이 매핑(♯/♭ 이명동음 포함)과 3화음 빌더**가 필요(이게 없으면 G♯·B♭ 같은 철자를 재생 못 함):
```js
const PITCH_CLASS = { "C":0,"B♯":0,"C♯":1,"D♭":1,"D":2,"D♯":3,"E♭":3,"E":4,"F♭":4,
  "E♯":5,"F":5,"F♯":6,"G♭":6,"G":7,"G♯":8,"A♭":8,"A":9,"A♯":10,"B♭":10,"B":11,"C♭":11 };
function triadMidi(root, quality){            // quality: "maj" | "min" | "dim"
  const third = quality === "maj" ? 4 : 3;
  const fifth = quality === "dim" ? 6 : 7;
  const r = 60 + PITCH_CLASS[root];           // C4=60 부근
  return [r, r + third, r + fifth];
}
const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);
// 코드 문자열 → (root, quality): "Dm"→("D","min"), "Bdim"→("B","dim"), "C"→("C","maj")
```
- 옵션: 회전 중 "틱" 사운드(칸을 지날 때). 과하지 않게 음소거 기본 + 토글.
- 접근성: 소리는 보조 수단. 모든 정보는 텍스트로도 제공.

---

## 9. 반응형 · 접근성
- 회전판은 정사각 컨테이너에 `min(90vw, 90vh, 560px)` 등으로 반응형. 정보 패널은 데스크톱은 우측, 모바일은 하단.
- 터치 타깃 ≥ 44px. 드래그/버튼 모두 제공.
- 키보드: ←/→ 로 한 칸씩 회전(`stepTo(currentIndex±1)` 짧은 최단 트윈), Space=돌리기(`spinTo()`), Enter=정답 확인.
- 스크린리더: 멈출 때 `aria-live`로 "현재 C 다장조, 관계단조 Am, 조표 없음" 음성 안내.
- 대비: 텍스트는 `--ink`(#293241)로 충분한 대비 확보. 파스텔 배경 위 가독성 확인.
- `prefers-reduced-motion` 존중(섹션 6.8).

---

## 10. 단계별 구현 순서 (마일스톤)

> 각 마일스톤을 **독립적으로** 구현·확인 후 다음으로. AI에게 "M1만 구현하고 멈춰"라고 지시.

- **M1 — 정적 회전판 렌더링:** `KEYS`로 12칸 3링 SVG를 절차적으로 그림(섹션 5.3). 정지 상태에서 C가 12시.
- **M2 — 표시판 오버레이:** 기준선 + 기능 창 테두리(섹션 5.4 위치). 아직 정적.
- **M3 — 회전 상태 + 렌더 결합:** `wheel.angle`을 transform에 연결, 슬라이더로 수동 각도 변경 테스트.
- **M4 — 인덱스 매핑 + 정보 패널:** `selectedIndex`, `readWindows`로 정지 칸 정보 표시. 단위 테스트(6.2) 통과.
- **M5 — ★드래그 물리 회전:** 섹션 6.4~6.6 전체. flick→감속→정렬. 엣지 체크리스트(6.8) 통과. **(최우선·가장 공들일 곳)**
- **M6 — "돌리기" 버튼(룰렛 착지):** 섹션 6.7. 지정/랜덤 칸 정확 착지.
- **M7 — 미션 카드 모드:** `CARDS` 덱, 앞/뒷면, 점수.
- **M8 — 고급(다이어토닉 표기 + 세컨더리 도미넌트 포인터):** 5.5의 철자 처리, 5.7 포인터.
- **M9 — 사운드·반응형·접근성·다듬기:** 섹션 8·9.

각 마일스톤 종료 시: 동작 스크린샷/설명 + 다음 마일스톤 진입 여부 확인.

---

## 11. 인수·검수 체크리스트 (실물 교구 기준과 일치)

> 실물 제작 사양서의 "기능 검사"와 동일한 정렬 검증을 자동/수동 테스트로 만들 것.

**기준 정렬 검사(실물 룰북 그대로):**
- [ ] **C** 기준선 정렬 → 현재 장조 **C**, 관계단조 **Am**, 조표 **없음**, **V=G**, **IV=F**.
- [ ] **G** 기준선 정렬 → 관계단조 **Em**, 조표 **1♯ F♯**, **V=D**, **IV=C**.
- [ ] **F** 기준선 정렬 → 관계단조 **Dm**, 조표 **1♭ B♭**, **V=C**, **IV=B♭**.

**인덱스/물리 단위 테스트(섹션 6.2):**
- [ ] `selectedIndex(0)=0`, `(-30)=1`, `(30)=11`, `(-90)=3`, `(330)=1`.
- [ ] 정렬(settle) 종료 후 불변식: `wheel.angle === nearestDetent(정렬 직전 각)` 이고, `selectedIndex(wheel.angle)`가 정보 패널·하이라이트 표기와 **항상 일치**.
- [ ] `spinTo(k)` 종료 시 `selectedIndex(wheel.angle) === k` (지정 칸 정확 착지). `stepTo(k)`도 동일.
- [ ] 60/120/144Hz에서 정지까지의 총 회전량 편차 < 5%(프레임레이트 독립).

**데이터 정합성:**
- [ ] `DIATONIC[조].length === 7`, 12조 모두 존재.
- [ ] 미션 카드 27장(초9/중9/고9), 각 카드 `q`/`a` 누락 없음. 덱이 중복 없이 27장을 모두 소진 후 재셔플.
- [ ] A 장조 vii° 표기가 **G♯dim**(테이블 우선) 으로 나오는지(5.5의 이명동음 처리 확인).
- [ ] 모든 `i`에 대해 기하 vi(`minor3(at(3))`)의 루트 == 표 관계단조 `KEYS[i].minor`의 루트(두 경로 일치).

**UX:**
- [ ] 멈춘 조성과 화면 표기/하이라이트가 항상 일치.
- [ ] 모바일 드래그·데스크톱 마우스·키보드 모두 회전 가능.
- [ ] 한글/♯/♭/° 글리프 정상 표시.

---

## 12. 확장 아이디어 (선택)
- 조옮김 시뮬레이터: 출발/도착 조 선택 → 시계/반시계 칸 수와 경로 애니메이션.
- 코드 진행 빌더: I-vi-ii-V 등 클릭으로 만들고 Web Audio로 재생.
- 학습 기록/뱃지(localStorage). 외부 서버 없이.
- 다국어(영문 음이름/한글 음이름 토글은 기본 제공).
- 실물 도안 PDF 다운로드 링크 연결(인쇄해서 실물도 만들 수 있게).

---

## 부록 A. AI에게 줄 "시작" 한 줄 지시 예시

> "위 문서의 **M1만** 구현해줘. 의존성 없는 `index.html`/`style.css`/`app.js` 단일 폴더 정적 앱으로,
> `KEYS` 데이터를 사용해 12칸 3링 5도권 회전판을 인라인 SVG로 절차적으로 그려줘.
> 정지 상태에서 C가 12시 방향이어야 하고, 섹션 3의 색/폰트 토큰을 그대로 써줘.
> 회전 로직은 아직 넣지 말고 정적 렌더만. 끝나면 멈추고 결과를 보여줘."

이후 M2 → M9를 같은 방식으로 한 단계씩 진행. **M5(드래그 물리)** 에서는 섹션 6 코드를 그대로 이식하고 6.8 체크리스트를 통과시키도록 지시하세요.

---

*근거 자료: `실물_보드_게임/generate_circle_of_fifths_assets.js`(도안·데이터), `generate_master_rulebook.js`(조표/다이어토닉/운영), `제조업체_전달문서/...제작사양서_v1.0.md`(치수·검수 기준). 음악 이론 데이터와 검수 기준은 실물 교구와 1:1로 일치합니다.*
