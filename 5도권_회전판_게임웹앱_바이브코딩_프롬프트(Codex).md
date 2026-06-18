# 5도권 회전판 게임 웹앱 바이브코딩 프롬프트

아래 프롬프트를 그대로 복사해서 코딩 AI에게 전달하면, `실물_보드_게임` 폴더의 실물 보드게임 자료를 기반으로 웹앱을 개발하게 됩니다. 핵심은 실제 교구처럼 `회전 원판만` 돌아가고, 투명 표시판과 기준선은 고정되며, 회전판이 빠르게 돌다가 점점 감속해 정확히 30도 단위의 조 위치에 멈추는 것입니다.

---

## 복사해서 사용할 최종 프롬프트

너는 시니어 프론트엔드 게임 개발자이자 음악 이론 학습 도구 설계자다. 현재 작업공간에는 `실물_보드_게임` 폴더가 있고, 그 안에는 5도권 회전판 실물 보드게임 제작 자료가 들어 있다. 이 자료를 바탕으로 실제 교구의 사용감을 웹에서 재현하는 반응형 게임 웹앱을 개발하라.

반드시 먼저 아래 파일들을 확인하고, 실물 자료의 구조와 규칙을 웹앱에 반영하라.

- `실물_보드_게임/제작_사양_README.md`
- `실물_보드_게임/제조업체_전달문서/5도권_회전판_제조업체_전달_제작사양서_v1.0.md`
- `실물_보드_게임/generate_circle_of_fifths_assets.js`
- `실물_보드_게임/SVG/01_회전원판_230mm.svg`
- `실물_보드_게임/SVG/02_투명표시판_260mm.svg`
- `실물_보드_게임/SVG/03_하판_260mm.svg`
- `실물_보드_게임/SVG/04_세컨더리도미넌트_포인터_230mm.svg`
- `실물_보드_게임/제품_이미지/5도권_회전판_제품_이미지_본체_클로즈업.png`
- `실물_보드_게임/제품_이미지/5도권_회전판_제품_이미지_구성품_플랫레이.png`

개발 목표는 랜딩 페이지가 아니라 첫 화면부터 바로 플레이 가능한 게임 웹앱이다. 실물 보드게임의 구성품을 디지털화하되, 회전판 조작감과 음악 이론 학습 흐름을 우선한다.

---

## 1. 앱 콘셉트

앱 이름은 `5도권 회전판: Spin & Solve`로 한다.

사용자는 화면 중앙의 5도권 회전판을 돌리고, 기준선에 멈춘 조를 읽어 미션 카드 문제를 해결한다. 앱은 초급, 중급, 고급 난이도를 제공한다.

초급은 조표, 장조, 관계단조를 찾는다. 중급은 딸림조, 버금딸림조, 같은 으뜸음 단조, 조옮김 거리를 찾는다. 고급은 다이어토닉 코드와 세컨더리 도미넌트를 다룬다.

화면은 교육용 도구처럼 명확하고 빠르게 읽히게 만든다. 과도한 마케팅 히어로, 장식 카드 남발, 의미 없는 설명 섹션을 만들지 말고, 게임 보드와 미션 해결 UI를 첫 화면에 배치한다.

---

## 2. 권장 기술 스택

기존 프로젝트가 없다면 다음 스택으로 새 웹앱을 구성한다.

- Vite
- React
- TypeScript
- CSS Modules 또는 일반 CSS
- lucide-react

새 패키지가 필요한 경우 최소화한다. 핵심 회전 애니메이션은 외부 애니메이션 라이브러리에 의존하지 말고 `requestAnimationFrame`으로 직접 구현한다. 그래야 최종 각도와 30도 스냅을 정확히 보장할 수 있다.

---

## 3. 에셋 구성

`public/assets/board/` 폴더를 만들고 아래 파일들을 복사해서 사용하라.

- `01_회전원판_230mm.svg`
- `02_투명표시판_260mm.svg`
- `03_하판_260mm.svg`
- `04_세컨더리도미넌트_포인터_230mm.svg`
- `5도권_회전판_제품_이미지_본체_클로즈업.png`
- `5도권_회전판_제품_이미지_구성품_플랫레이.png`

웹앱의 실제 보드 레이어는 SVG를 사용한다. 제품 PNG는 도움말, 자료 보기, 구성품 보기 패널에만 보조적으로 사용한다.

레이어 크기 비율은 실물 치수 그대로 따른다.

- 하판: 260 x 260mm
- 투명 표시판: 260 x 260mm
- 회전 원판: 지름 230mm
- 회전 원판은 260 기준 컨테이너 안에서 `230 / 260 = 88.461538%` 크기로 중앙 배치한다.
- 투명 표시판과 하판은 전체 보드 컨테이너에 꽉 차게 배치한다.
- 중앙 핀은 시각적으로 보이게 만들되, 회전 원판의 transform origin과 정확히 같은 중심에 둔다.

---

## 4. 필수 화면 구조

첫 화면은 다음 구성으로 만든다.

1. 상단 바
   - 앱 이름
   - 난이도 선택: 초급, 중급, 고급, 자유 연습
   - 타임어택 토글
   - 사운드 토글

2. 중앙 게임 영역
   - 왼쪽 또는 중앙: 5도권 회전판
   - 오른쪽 또는 하단: 현재 미션 카드, 답 선택, 점수, 기록

3. 회전판 컨트롤
   - 큰 `돌리기` 버튼
   - `멈춘 조 다시 읽기` 버튼
   - `C로 리셋` 버튼
   - 회전 중에는 모든 입력을 잠근다.

4. 미션 카드 패널
   - 현재 카드 난이도와 번호
   - 문제
   - 답 입력 또는 선택지
   - 정답 확인 후 풀이 순서 표시

5. 결과/기록 패널
   - 점수
   - 연속 정답
   - 최근 5개 결과
   - 현재 기준선에 놓인 조: 장조, 관계단조, 조표, IV, V

모바일에서는 회전판이 위, 미션 카드가 아래로 쌓이게 한다. 데스크톱에서는 회전판과 카드 패널을 2열로 둔다.

---

## 5. 음악 이론 데이터

다음 데이터를 TypeScript 상수로 만든다. 순서는 실제 원판의 시계방향 순서다. 한 칸은 30도다.

```ts
export const STEP_DEG = 30;

export const CIRCLE_KEYS = [
  { id: "C", major: "C", majorKo: "다장조", minor: "Am", minorKo: "가단조", sigCount: "0", signature: "조표 없음" },
  { id: "G", major: "G", majorKo: "사장조", minor: "Em", minorKo: "마단조", sigCount: "1♯", signature: "F♯" },
  { id: "D", major: "D", majorKo: "라장조", minor: "Bm", minorKo: "나단조", sigCount: "2♯", signature: "F♯ C♯" },
  { id: "A", major: "A", majorKo: "가장조", minor: "F♯m", minorKo: "올림바단조", sigCount: "3♯", signature: "F♯ C♯ G♯" },
  { id: "E", major: "E", majorKo: "마장조", minor: "C♯m", minorKo: "올림다단조", sigCount: "4♯", signature: "F♯ C♯ G♯ D♯" },
  { id: "B/Cb", major: "B / C♭", majorKo: "나장조 / 내림다장조", minor: "G♯m / A♭m", minorKo: "올림사단조 / 내림가단조", sigCount: "5♯ / 7♭", signature: "F♯ C♯ G♯ D♯ A♯" },
  { id: "F#/Gb", major: "F♯ / G♭", majorKo: "올림바장조 / 내림사장조", minor: "D♯m / E♭m", minorKo: "올림라단조 / 내림마단조", sigCount: "6♯ / 6♭", signature: "F♯ C♯ G♯ D♯ A♯ E♯" },
  { id: "C#/Db", major: "C♯ / D♭", majorKo: "올림다장조 / 내림라장조", minor: "A♯m / B♭m", minorKo: "올림가단조 / 내림나단조", sigCount: "7♯ / 5♭", signature: "B♭ E♭ A♭ D♭ G♭" },
  { id: "Ab", major: "A♭", majorKo: "내림가장조", minor: "Fm", minorKo: "바단조", sigCount: "4♭", signature: "B♭ E♭ A♭ D♭" },
  { id: "Eb", major: "E♭", majorKo: "내림마장조", minor: "Cm", minorKo: "다단조", sigCount: "3♭", signature: "B♭ E♭ A♭" },
  { id: "Bb", major: "B♭", majorKo: "내림나장조", minor: "Gm", minorKo: "사단조", sigCount: "2♭", signature: "B♭ E♭" },
  { id: "F", major: "F", majorKo: "바장조", minor: "Dm", minorKo: "라단조", sigCount: "1♭", signature: "B♭" },
] as const;
```

관계 계산 규칙은 다음처럼 구현한다.

```ts
const wrapIndex = (index: number) => (index + 12) % 12;

export function getKeyInfo(index: number) {
  const i = wrapIndex(index);
  return {
    current: CIRCLE_KEYS[i],
    dominant: CIRCLE_KEYS[wrapIndex(i + 1)],       // V, 딸림조
    subdominant: CIRCLE_KEYS[wrapIndex(i - 1)],    // IV, 버금딸림조
    ii: CIRCLE_KEYS[wrapIndex(i + 2)],
    vi: CIRCLE_KEYS[wrapIndex(i + 3)],
    iii: CIRCLE_KEYS[wrapIndex(i + 4)],
    vii: CIRCLE_KEYS[wrapIndex(i + 5)],
    sameTonicMinorLabel: `${CIRCLE_KEYS[i].major}m`,
  };
}
```

실물 투명 표시판은 `IV` 창이 -30도, `V` 창이 +30도에 있다. 웹앱에서도 같은 관계를 유지한다.

---

## 6. 미션 카드 데이터

원본 자료의 27개 미션을 앱 데이터로 넣는다.

```ts
export const MISSION_CARDS = [
  { level: "beginner", id: "초급 01", question: "조표가 ♯ 1개인 장조는?", answer: "G 사장조", solution: "기준선에서 1♯ 칸을 찾는다." },
  { level: "beginner", id: "초급 02", question: "조표가 ♭ 2개인 장조는?", answer: "B♭ 내림나장조", solution: "플랫 2개 칸을 찾는다." },
  { level: "beginner", id: "초급 03", question: "D 장조의 조표를 쓰세요.", answer: "F♯, C♯", solution: "D를 기준선에 맞추고 조표 창을 읽는다." },
  { level: "beginner", id: "초급 04", question: "F 장조의 관계단조는?", answer: "Dm 라단조", solution: "F 칸의 중간 원을 읽는다." },
  { level: "beginner", id: "초급 05", question: "Am의 관계장조는?", answer: "C 다장조", solution: "중간 원 Am이 있는 칸의 바깥 원을 읽는다." },
  { level: "beginner", id: "초급 06", question: "조표가 없는 장조와 단조는?", answer: "C 다장조, Am 가단조", solution: "조표 없음 칸을 찾는다." },
  { level: "beginner", id: "초급 07", question: "E♭ 장조의 플랫 이름은?", answer: "B♭, E♭, A♭", solution: "E♭을 기준선에 맞추고 조표 창을 읽는다." },
  { level: "beginner", id: "초급 08", question: "Bm의 관계장조는?", answer: "D 라장조", solution: "중간 원 Bm이 있는 칸의 바깥 원을 읽는다." },
  { level: "beginner", id: "초급 09", question: "C에서 G로 가려면 어느 방향, 몇 칸?", answer: "시계방향 1칸", solution: "5도권에서 C 다음 시계방향이 G." },

  { level: "intermediate", id: "중급 01", question: "D 장조의 딸림조와 버금딸림조는?", answer: "딸림조 A, 버금딸림조 G", solution: "D 기준에서 V와 IV 창을 읽는다." },
  { level: "intermediate", id: "중급 02", question: "E♭ 장조의 같은 으뜸음 단조는?", answer: "E♭m", solution: "같은 으뜸음 단조 창을 읽는다." },
  { level: "intermediate", id: "중급 03", question: "B♭ 장조에서 C 장조로 조옮김: 몇 칸?", answer: "시계방향 2칸", solution: "B♭ → F → C." },
  { level: "intermediate", id: "중급 04", question: "G 장조의 관계단조와 같은 으뜸음 단조는?", answer: "관계단조 Em, 같은 으뜸음 단조 Gm", solution: "중간 원과 동단조 창을 함께 본다." },
  { level: "intermediate", id: "중급 05", question: "A 장조의 IV, V를 찾으세요.", answer: "IV = D, V = E", solution: "A 기준에서 좌우 기능 창을 읽는다." },
  { level: "intermediate", id: "중급 06", question: "F minor의 관계장조는?", answer: "A♭ 장조", solution: "Fm이 있는 칸의 바깥 원을 읽는다." },
  { level: "intermediate", id: "중급 07", question: "C 장조에서 A 장조로 조옮김: 방향과 칸 수", answer: "시계방향 3칸", solution: "C → G → D → A." },
  { level: "intermediate", id: "중급 08", question: "D♭ 장조의 관계단조는?", answer: "B♭m", solution: "D♭ 칸의 중간 원을 읽는다." },
  { level: "intermediate", id: "중급 09", question: "E 장조의 조표와 관계단조를 찾으세요.", answer: "4♯, C♯m", solution: "E를 기준선에 맞추고 중간·안쪽 원을 읽는다." },

  { level: "advanced", id: "고급 01", question: "C 장조의 V/V를 찾고 해결 코드를 말하세요.", answer: "D7 → G", solution: "대상 G 위에 포인터의 대상 창을 둔다." },
  { level: "advanced", id: "고급 02", question: "G 장조의 V/ii를 찾으세요.", answer: "E7 → Am", solution: "ii는 Am, Am의 딸림은 E." },
  { level: "advanced", id: "고급 03", question: "D 장조의 다이어토닉 3화음을 순서대로 말하세요.", answer: "D, Em, F♯m, G, A, Bm, C♯dim", solution: "I부터 vii°까지 읽는다." },
  { level: "advanced", id: "고급 04", question: "A minor에서 화성단음계의 V 코드는?", answer: "E 또는 E7", solution: "자연단음계 Em을 장화음으로 올려 쓴다." },
  { level: "advanced", id: "고급 05", question: "F 장조의 V/vi를 찾으세요.", answer: "A7 → Dm", solution: "vi는 Dm, D의 딸림은 A." },
  { level: "advanced", id: "고급 06", question: "E♭ 장조의 ii-V-I를 쓰세요.", answer: "Fm - B♭ - E♭", solution: "ii, V, I 창을 차례로 읽는다." },
  { level: "advanced", id: "고급 07", question: "A 장조의 vii° 코드는?", answer: "G♯dim", solution: "A 기준에서 vii° 창을 읽는다." },
  { level: "advanced", id: "고급 08", question: "B♭ 장조의 V/IV를 찾으세요.", answer: "B♭7 → E♭", solution: "IV는 E♭, E♭의 딸림은 B♭." },
  { level: "advanced", id: "고급 09", question: "C 장조의 I-vi-ii-V 진행을 쓰세요.", answer: "C - Am - Dm - G", solution: "I, vi, ii, V 창을 읽는다." },
] as const;
```

---

## 7. 회전판 컴포넌트 구조

`CircleBoard.tsx`를 만들고 다음 레이어 구조를 반드시 지킨다.

```tsx
<div className="boardShell">
  <div className="boardStage" aria-label="5도권 회전판">
    <img className="baseBoard" src="/assets/board/03_하판_260mm.svg" alt="" />
    <img
      className="rotatingWheel"
      src="/assets/board/01_회전원판_230mm.svg"
      alt="회전 원판"
      style={{ transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)` }}
    />
    <img className="fixedOverlay" src="/assets/board/02_투명표시판_260mm.svg" alt="고정 투명 표시판" />
    {showSecondaryPointer && (
      <img
        className="secondaryPointer"
        src="/assets/board/04_세컨더리도미넌트_포인터_230mm.svg"
        alt="세컨더리 도미넌트 포인터"
        style={{ transform: `translate(-50%, -50%) rotate(${pointerRotationDeg}deg)` }}
      />
    )}
    <div className="centerPin" aria-hidden="true" />
  </div>
</div>
```

CSS는 다음 조건을 만족해야 한다.

```css
.boardStage {
  position: relative;
  width: min(92vw, 620px);
  aspect-ratio: 1 / 1;
  margin: 0 auto;
}

.baseBoard,
.fixedOverlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.rotatingWheel {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 88.461538%;
  height: 88.461538%;
  object-fit: contain;
  transform-origin: 50% 50%;
  will-change: transform;
  filter: drop-shadow(0 10px 18px rgba(41, 50, 65, 0.14));
}

.fixedOverlay {
  z-index: 3;
}

.secondaryPointer {
  position: absolute;
  z-index: 4;
  left: 50%;
  top: 50%;
  width: 88.461538%;
  height: 88.461538%;
  object-fit: contain;
  transform-origin: 50% 50%;
  pointer-events: none;
}

.rotatingWheel {
  z-index: 2;
}

.baseBoard {
  z-index: 1;
}

.centerPin {
  position: absolute;
  z-index: 5;
  left: 50%;
  top: 50%;
  width: clamp(18px, 4.5vw, 32px);
  height: clamp(18px, 4.5vw, 32px);
  transform: translate(-50%, -50%);
  border-radius: 999px;
  background: radial-gradient(circle at 35% 35%, #ffffff, #9aa4b2 48%, #52616b 100%);
  box-shadow: 0 2px 8px rgba(41, 50, 65, 0.28);
}
```

주의: `fixedOverlay`는 절대 회전시키지 않는다. 실제 교구처럼 하판과 투명 표시판은 고정이고, `rotatingWheel`만 회전해야 한다.

고급 모드에서 세컨더리 도미넌트 포인터를 보여줄 때는 `rotatingWheel`과 별도의 `pointerRotationDeg` 상태를 사용한다. 포인터는 원판 스핀 애니메이션과 함께 돌지 않는다. 사용자가 고급 문제에서 대상 코드를 맞출 때만 드래그 또는 버튼으로 회전시키며, 대상 코드 창과 `V/대상` 창의 간격은 항상 30도여야 한다.

---

## 8. 가장 중요한 회전/감속 애니메이션 구현

회전 애니메이션은 반드시 다음 수학을 따른다.

원판의 초기 상태는 C가 12시 기준선에 놓여 있다. 원본 SVG에서 각 조의 초기 각도는 다음과 같다.

- C: 0도
- G: 30도
- D: 60도
- A: 90도
- E: 120도
- B / C♭: 150도
- F♯ / G♭: 180도
- C♯ / D♭: 210도
- A♭: 240도
- E♭: 270도
- B♭: 300도
- F: 330도

CSS 회전에서 양수 각도는 화면상 시계방향 회전이다. 어떤 조 `targetIndex`를 12시 기준선에 맞추려면 최종 회전각은 다음과 같아야 한다.

```ts
const finalModuloAngle = -targetIndex * 30;
```

예를 들어 G는 원래 +30도 위치에 있으므로, G를 기준선으로 올리려면 원판 전체는 -30도와 같은 상태, 즉 330도 modulo 상태에 있어야 한다. 하지만 실제 애니메이션은 여러 바퀴를 돌아야 하므로 최종 각도는 `finalModuloAngle + 360 * n`처럼 큰 연속 각도로 만든다.

### 8.1 각도 유틸리티

```ts
const STEP_DEG = 30;
const FULL_TURN = 360;

function normalizeDeg(deg: number) {
  return ((deg % FULL_TURN) + FULL_TURN) % FULL_TURN;
}

function alignmentAngleForIndex(index: number) {
  return -index * STEP_DEG;
}

function getIndexAtNeedle(rotationDeg: number) {
  const angleAtNeedle = normalizeDeg(-rotationDeg);
  return Math.round(angleAtNeedle / STEP_DEG) % 12;
}

function futureClockwiseStopAngle(currentRotation: number, targetIndex: number, extraTurns: number) {
  const base = alignmentAngleForIndex(targetIndex);
  const minimum = currentRotation + extraTurns * FULL_TURN;
  let finalRotation = base;
  while (finalRotation <= minimum) {
    finalRotation += FULL_TURN;
  }
  return finalRotation;
}
```

### 8.2 감속 함수

실물 회전판처럼 처음에는 빠르게 돌고 마지막에는 서서히 속도가 줄어들어야 한다. `easeOutCubic` 또는 `easeOutQuint`를 사용한다. 기본은 `easeOutCubic`으로 하고, 더 묵직한 감속감을 원하면 `easeOutQuint`를 선택하게 한다.

```ts
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutQuint(t: number) {
  return 1 - Math.pow(1 - t, 5);
}
```

`easeOutCubic`의 속도는 시간이 갈수록 연속적으로 줄어든다. 마지막 프레임에서는 각도를 최종값으로 강제 보정해 30도 스냅 오차가 없게 한다.

### 8.3 `requestAnimationFrame` 기반 스핀 함수

다음 구조를 그대로 구현하라.

```ts
type SpinOptions = {
  targetIndex?: number;
  minTurns?: number;
  maxTurns?: number;
  minDurationMs?: number;
  maxDurationMs?: number;
  easing?: "cubic" | "quint";
};

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function spinWheel(options: SpinOptions = {}) {
  if (spinningRef.current) return;

  const targetIndex = options.targetIndex ?? randomInt(0, 11);
  const extraTurns = randomInt(options.minTurns ?? 4, options.maxTurns ?? 7);
  const durationMs = randomInt(options.minDurationMs ?? 4200, options.maxDurationMs ?? 6200);
  const easing = options.easing === "quint" ? easeOutQuint : easeOutCubic;

  const startRotation = rotationRef.current;
  const finalRotation = futureClockwiseStopAngle(startRotation, targetIndex, extraTurns);
  const totalDelta = finalRotation - startRotation;

  spinningRef.current = true;
  setIsSpinning(true);
  setSpinResult(null);

  let frameId = 0;
  let startTime = 0;
  let lastTickIndex = getIndexAtNeedle(startRotation);

  const animate = (now: number) => {
    if (!startTime) startTime = now;
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / durationMs);
    const eased = easing(t);
    const nextRotation = startRotation + totalDelta * eased;

    rotationRef.current = nextRotation;
    setRotationDeg(nextRotation);

    const currentTickIndex = getIndexAtNeedle(nextRotation);
    if (currentTickIndex !== lastTickIndex) {
      lastTickIndex = currentTickIndex;
      playSoftTick(); // 사운드가 꺼져 있으면 내부에서 아무것도 하지 않게 구현
    }

    if (t < 1) {
      frameId = requestAnimationFrame(animate);
      return;
    }

    rotationRef.current = finalRotation;
    setRotationDeg(finalRotation);

    const stoppedIndex = getIndexAtNeedle(finalRotation);
    if (stoppedIndex !== targetIndex) {
      console.error("Spin snap mismatch", { stoppedIndex, targetIndex, finalRotation });
    }

    spinningRef.current = false;
    setIsSpinning(false);
    setSpinResult({
      index: stoppedIndex,
      key: CIRCLE_KEYS[stoppedIndex],
      rotationDeg: finalRotation,
    });
  };

  frameId = requestAnimationFrame(animate);

  return () => {
    cancelAnimationFrame(frameId);
    spinningRef.current = false;
    setIsSpinning(false);
  };
}
```

### 8.4 회전 구현 필수 조건

다음 조건은 반드시 지켜라.

- 회전 상태는 `rotationDeg` 하나의 연속 숫자로 관리한다. 매번 0-360으로 잘라 저장하지 않는다.
- 최종 정렬 계산에만 `normalizeDeg`를 사용한다.
- 회전 중에는 `돌리기`, `정답 확인`, `난이도 변경`, `리셋`을 비활성화한다.
- 최종 프레임에서 반드시 `rotationDeg = finalRotation`으로 보정한다.
- 멈춘 후 `getIndexAtNeedle(finalRotation)` 값으로 현재 조를 표시한다.
- 회전이 끝난 뒤 기준선과 결과 패널의 조 이름이 항상 일치해야 한다.
- 30도 경계 통과 시 부드러운 틱 사운드나 작은 햅틱 느낌의 시각 효과를 넣는다.
- `prefers-reduced-motion: reduce`가 감지되면 회전 시간은 700-1000ms로 줄이되, 최종 각도 계산은 동일하게 유지한다.

### 8.5 회전 검증 시나리오

브라우저 콘솔 또는 테스트 코드로 다음을 반드시 검증하라.

```ts
for (let i = 0; i < 12; i++) {
  const final = futureClockwiseStopAngle(0, i, 4);
  const stopped = getIndexAtNeedle(final);
  console.assert(stopped === i, `index ${i} failed: stopped at ${stopped}`);
}
```

수동 검증도 수행하라.

- C에 멈추면 현재 장조 C, 관계단조 Am, 조표 없음, V=G, IV=F가 표시된다.
- G에 멈추면 현재 장조 G, 관계단조 Em, 조표 1♯ F♯, V=D, IV=C가 표시된다.
- F에 멈추면 현재 장조 F, 관계단조 Dm, 조표 1♭ B♭, V=C, IV=B♭가 표시된다.

---

## 9. 게임 로직

앱 상태는 다음처럼 구성한다.

```ts
type GameLevel = "free" | "beginner" | "intermediate" | "advanced";

type GameState = {
  level: GameLevel;
  currentMissionId: string | null;
  rotationDeg: number;
  isSpinning: boolean;
  stoppedIndex: number;
  score: number;
  streak: number;
  remainingSeconds: number | null;
  history: Array<{
    missionId: string;
    stoppedKey: string;
    correct: boolean;
    answer: string;
  }>;
};
```

게임 진행은 다음 순서다.

1. 난이도를 선택하면 해당 난이도의 미션 카드 중 하나를 보여준다.
2. 사용자가 `돌리기`를 누르면 회전판이 4-7바퀴 돌다가 감속해 멈춘다.
3. 멈춘 조의 정보가 결과 패널에 표시된다.
4. 사용자는 문제에 대한 답을 선택하거나 입력한다.
5. 정답이면 점수와 연속 정답이 오른다.
6. 오답이면 정답과 풀이 순서를 보여주고 연속 정답은 0이 된다.
7. `다음 카드`를 누르면 새 미션이 나온다.

자유 연습 모드에서는 미션 카드 없이 회전 결과의 음악 정보를 크게 보여준다.

---

## 10. 정답 UI

초급과 중급은 가능하면 객관식 버튼을 제공한다. 객관식 선택지는 정답 1개와 같은 난이도 안에서 뽑은 오답 3개를 섞는다.

고급은 답이 길 수 있으므로 다음 중 하나를 선택해 구현한다.

- 객관식: 초보자 친화적
- 입력식: 심화 학습용
- 둘 다: 설정에서 전환

기본 구현은 객관식으로 한다. 정답 확인 후에는 반드시 원본 카드의 `solution` 문장을 보여준다.

---

## 11. 시각 디자인

실물 자료의 분위기를 유지한다.

- 파스텔 톤
- 부드러운 분홍, 민트, 하늘색, 옅은 노랑
- 둥근 라벨과 얇은 라인
- 음악 교구 느낌의 명확한 정보 계층

하지만 UI 전체가 한 가지 색으로만 보이면 안 된다. 회전판의 파스텔 다색감을 살리고, 주변 UI는 흰색/연회색 기반으로 정리한다.

버튼은 명령 중심으로 간결하게 만든다.

- `돌리기`는 가장 큰 버튼
- `다음 카드`, `정답 확인`, `C로 리셋`은 보조 버튼
- 아이콘은 lucide-react에서 적절한 것을 사용한다. 예: RotateCw, Check, X, Timer, Volume2, VolumeX, RefreshCw

텍스트가 모바일에서 버튼 밖으로 넘치지 않게 한다. 작은 패널 안에서는 지나치게 큰 제목을 쓰지 않는다.

---

## 12. 사운드와 촉감

브라우저 자동재생 제한을 고려해 첫 사용자 클릭 이후에만 사운드를 활성화한다.

틱 사운드는 실제 회전판의 칸 통과 느낌을 주는 아주 짧은 소리로 만든다.

- Web Audio API 사용
- 30도 경계를 지날 때만 재생
- 회전 속도가 빠를 때 너무 많은 소리가 겹치면 35ms 이하 간격은 스킵
- 사운드 토글이 꺼져 있으면 재생하지 않음

시각 효과는 다음처럼 한다.

- 회전 중 보드 아래 그림자를 살짝 강하게 한다.
- 멈출 때 기준선 주변에 짧은 하이라이트 펄스를 준다.
- 정답이면 초록색 체크, 오답이면 부드러운 빨간색 피드백을 준다.

---

## 13. 접근성과 키보드 조작

다음 키보드 조작을 지원한다.

- Space: 회전 시작
- Enter: 정답 확인
- N: 다음 카드
- R: C로 리셋
- 1, 2, 3, 4: 객관식 선택

회전 중에는 화면 읽기 사용자에게 `회전 중입니다`를 `aria-live`로 알린다. 회전 종료 후에는 `G 사장조에 멈췄습니다. 관계단조는 Em, 조표는 F♯입니다.`처럼 결과를 읽어준다.

---

## 14. 컴포넌트 분리

다음 파일 구조를 권장한다.

```txt
src/
  App.tsx
  data/
    circleKeys.ts
    missionCards.ts
  hooks/
    useWheelSpin.ts
    useSound.ts
  components/
    CircleBoard.tsx
    MissionCard.tsx
    AnswerChoices.tsx
    GameControls.tsx
    ResultPanel.tsx
    ScorePanel.tsx
    AssetGallery.tsx
  styles/
    app.css
```

`useWheelSpin.ts`에는 회전 수학과 `requestAnimationFrame` 로직을 넣는다. `CircleBoard.tsx`는 상태를 받아 렌더링만 하게 한다.

---

## 15. 구현 순서

다음 순서대로 개발하라.

1. 프로젝트 생성 및 기본 레이아웃 구성
2. 실물 SVG/PNG 에셋을 `public/assets/board/`에 복사
3. 5도권 데이터와 미션 카드 데이터 작성
4. 하판, 회전 원판, 투명 표시판 레이어를 정확히 겹치는 `CircleBoard` 구현
5. `rotationDeg`를 props로 받아 회전 원판만 회전하는지 확인
6. `useWheelSpin` 훅 구현
7. `futureClockwiseStopAngle`, `getIndexAtNeedle` 테스트 코드 또는 콘솔 검증 추가
8. `돌리기` 버튼과 감속 애니메이션 연결
9. 회전 종료 후 현재 조 정보 표시
10. 미션 카드 UI 구현
11. 정답 확인, 점수, 기록 구현
12. 난이도 선택과 타임어택 구현
13. 사운드 토글과 틱 사운드 구현
14. 모바일 반응형 조정
15. 접근성/키보드 조작 추가
16. 브라우저에서 실제 플레이하며 C, G, F 정렬을 검증

---

## 16. 완료 기준

다음 기준을 모두 만족해야 완료다.

- 앱 첫 화면에서 바로 회전판 게임을 플레이할 수 있다.
- 실물 SVG가 웹앱에 사용된다.
- 하판과 투명 표시판은 고정되어 있고 회전 원판만 돌아간다.
- 원판은 빠르게 돌다가 점점 느려지며 멈춘다.
- 멈춘 각도는 항상 30도 단위와 일치한다.
- 멈춘 조와 결과 패널의 조 정보가 일치한다.
- C, G, F 기준 검증이 통과한다.
- 미션 카드 27개가 모두 들어 있다.
- 초급, 중급, 고급 난이도 전환이 된다.
- 모바일과 데스크톱에서 텍스트가 겹치거나 버튼 밖으로 넘치지 않는다.
- 회전 중 중복 입력이 막힌다.
- `prefers-reduced-motion` 사용자를 배려한다.
- 개발 서버를 실행하고 실제 브라우저에서 회전과 정렬을 확인한다.

---

## 17. 특히 조심할 버그

다음 버그가 생기지 않게 주의하라.

- CSS `transition`만 사용해서 최종 각도가 미세하게 어긋나는 문제
- `rotationDeg % 360`만 저장해 다음 스핀의 회전 방향이 갑자기 짧아지는 문제
- G를 기준선에 맞출 때 +30도로 돌려 반대로 정렬하는 문제
- SVG 크기 차이 때문에 회전 원판 중심이 투명 표시판 중심과 어긋나는 문제
- 투명 표시판까지 같이 돌아가는 문제
- 회전 중 정답 확인이나 다음 카드 버튼이 눌리는 문제
- 타임어택 시간이 0이 된 뒤에도 스핀 결과가 점수에 반영되는 문제
- 모바일에서 미션 카드가 보드 위를 덮는 문제

---

## 18. 개발 후 보고 형식

구현이 끝나면 다음 형식으로 보고하라.

```md
구현 완료:
- 사용한 에셋:
- 구현한 주요 컴포넌트:
- 회전 애니메이션 방식:
- C/G/F 정렬 검증 결과:
- 실행 URL:
- 남은 개선점:
```

브라우저 검증을 수행했다면, 회전판이 C, G, F에 멈춘 상태를 각각 확인한 결과를 구체적으로 적어라.
