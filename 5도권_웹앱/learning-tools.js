(function attachLearningTools(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.LearningTools = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function buildApi() {
  "use strict";

  const DEGREE_INDEX = {
    I: 0,
    ii: 1,
    iii: 2,
    IV: 3,
    V: 4,
    vi: 5,
    "vii°": 6,
    vii: 6,
  };

  function accidentalCount(accCount) {
    if (!accCount || accCount === "0" || accCount === "조표 없음") return 0;
    const match = String(accCount).match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  function keyTone(count) {
    if (count <= 2) return { tier: "초급", badge: "가독성 높음" };
    if (count <= 4) return { tier: "중급", badge: "천천히 읽기" };
    return { tier: "심화", badge: "주의 필요" };
  }

  function getKeySignaturePolicy(key) {
    const count = accidentalCount(key.accCount);
    const tone = keyTone(count);
    let preferredName = key.major;
    let note = "조표 개수와 실제 붙는 음 이름을 함께 읽습니다.";

    if (key.enharmonic) {
      const altCount = accidentalCount(key.enharmonic.accCount);
      if (altCount < count) {
        preferredName = key.enharmonic.major;
        note = `${key.major}보다 ${key.enharmonic.major} 표기가 임시표가 적어 더 읽기 쉽습니다.`;
      } else if (altCount > count) {
        note = `${key.enharmonic.major}보다 ${key.major} 표기가 임시표가 적어 더 읽기 쉽습니다.`;
      } else {
        note = `${key.major}와 ${key.enharmonic.major}는 임시표 수가 같으므로 수업 맥락에 맞춰 선택합니다.`;
      }
    } else if (count >= 5) {
      note = "임시표가 많으므로 실제 붙는 음 이름을 소리 내어 읽고 진행합니다.";
    }

    return {
      accidentalCount: count,
      tier: tone.tier,
      badge: tone.badge,
      preferredName,
      note,
    };
  }

  function buildProgression(keyName, degrees, diatonic) {
    const chords = diatonic[keyName];
    if (!chords) throw new Error(`Unknown key: ${keyName}`);
    return degrees.map((degree) => {
      const index = DEGREE_INDEX[degree];
      if (index == null) throw new Error(`Unknown degree: ${degree}`);
      return chords[index];
    });
  }

  function keyAt(keys, index) {
    return keys[((index % 12) + 12) % 12];
  }

  function majorName(keys, index) {
    return keyAt(keys, index).major;
  }

  function movement(fromIndex, toIndex) {
    const clockwise = (toIndex - fromIndex + 12) % 12;
    const counterClockwise = (fromIndex - toIndex + 12) % 12;
    if (clockwise <= counterClockwise) {
      return { direction: "시계방향", steps: clockwise, stepSign: 1 };
    }
    return { direction: "반시계방향", steps: counterClockwise, stepSign: -1 };
  }

  function movementPath(fromIndex, steps, stepSign, keys) {
    const names = [];
    for (let n = 0; n <= steps; n += 1) names.push(majorName(keys, fromIndex + n * stepSign));
    return names.join(" → ");
  }

  function transposeProgression(fromIndex, toIndex, degrees, keys, diatonic) {
    const fromKey = keyAt(keys, fromIndex);
    const toKey = keyAt(keys, toIndex);
    const move = movement(fromIndex, toIndex);
    return {
      fromKey,
      toKey,
      direction: move.direction,
      steps: move.steps,
      path: movementPath(fromIndex, move.steps, move.stepSign, keys),
      sourceChords: buildProgression(fromKey.major, degrees, diatonic),
      targetChords: buildProgression(toKey.major, degrees, diatonic),
    };
  }

  return {
    DEGREE_INDEX,
    buildProgression,
    getKeySignaturePolicy,
    transposeProgression,
  };
});
