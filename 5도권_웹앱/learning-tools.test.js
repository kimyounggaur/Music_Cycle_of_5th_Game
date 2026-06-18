const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildProgression,
  getKeySignaturePolicy,
  transposeProgression,
} = require("./learning-tools.js");

const keys = [
  { i: 0, major: "C", majorKo: "다장조", minor: "Am", accCount: "0", acc: "조표 없음" },
  { i: 1, major: "G", majorKo: "사장조", minor: "Em", accCount: "1♯", acc: "F♯" },
  { i: 2, major: "D", majorKo: "라장조", minor: "Bm", accCount: "2♯", acc: "F♯ C♯" },
  { i: 3, major: "A", majorKo: "가장조", minor: "F♯m", accCount: "3♯", acc: "F♯ C♯ G♯" },
  { i: 4, major: "E", majorKo: "마장조", minor: "C♯m", accCount: "4♯", acc: "F♯ C♯ G♯ D♯" },
  {
    i: 5,
    major: "B",
    majorKo: "나장조",
    minor: "G♯m",
    accCount: "5♯",
    acc: "F♯ C♯ G♯ D♯ A♯",
    enharmonic: { major: "C♭", accCount: "7♭" },
  },
  {
    i: 6,
    major: "F♯",
    majorKo: "올림바장조",
    minor: "D♯m",
    accCount: "6♯",
    acc: "F♯ C♯ G♯ D♯ A♯ E♯",
    enharmonic: { major: "G♭", accCount: "6♭" },
  },
  {
    i: 7,
    major: "D♭",
    majorKo: "내림라장조",
    minor: "B♭m",
    accCount: "5♭",
    acc: "B♭ E♭ A♭ D♭ G♭",
    enharmonic: { major: "C♯", accCount: "7♯" },
  },
  { i: 8, major: "A♭", majorKo: "내림가장조", minor: "Fm", accCount: "4♭", acc: "B♭ E♭ A♭ D♭" },
  { i: 9, major: "E♭", majorKo: "내림마장조", minor: "Cm", accCount: "3♭", acc: "B♭ E♭ A♭" },
  { i: 10, major: "B♭", majorKo: "내림나장조", minor: "Gm", accCount: "2♭", acc: "B♭ E♭" },
  { i: 11, major: "F", majorKo: "바장조", minor: "Dm", accCount: "1♭", acc: "B♭" },
];

const diatonic = {
  C: ["C", "Dm", "Em", "F", "G", "Am", "Bdim"],
  A: ["A", "Bm", "C♯m", "D", "E", "F♯m", "G♯dim"],
  "E♭": ["E♭", "Fm", "Gm", "A♭", "B♭", "Cm", "Ddim"],
  "B♭": ["B♭", "Cm", "Dm", "E♭", "F", "Gm", "Adim"],
};

test("key signature policy grades simple keys as beginner readable", () => {
  const policy = getKeySignaturePolicy(keys[1]);
  assert.equal(policy.accidentalCount, 1);
  assert.equal(policy.tier, "초급");
  assert.equal(policy.badge, "가독성 높음");
  assert.equal(policy.preferredName, "G");
});

test("key signature policy recommends the lower-accidental enharmonic spelling", () => {
  const policy = getKeySignaturePolicy(keys[5]);
  assert.equal(policy.accidentalCount, 5);
  assert.equal(policy.tier, "심화");
  assert.equal(policy.preferredName, "B");
  assert.match(policy.note, /C♭보다 B/);
});

test("buildProgression maps roman numerals to the current major key", () => {
  assert.deepEqual(buildProgression("C", ["I", "vi", "ii", "V"], diatonic), ["C", "Am", "Dm", "G"]);
  assert.deepEqual(buildProgression("E♭", ["ii", "V", "I"], diatonic), ["Fm", "B♭", "E♭"]);
});

test("transposeProgression reports 5th-cycle movement and target chords", () => {
  const result = transposeProgression(0, 3, ["I", "vi", "IV", "V"], keys, diatonic);
  assert.equal(result.direction, "시계방향");
  assert.equal(result.steps, 3);
  assert.deepEqual(result.sourceChords, ["C", "Am", "F", "G"]);
  assert.deepEqual(result.targetChords, ["A", "F♯m", "D", "E"]);
});

test("transposeProgression chooses the shorter readable direction", () => {
  const result = transposeProgression(10, 0, ["I", "IV", "V"], keys, diatonic);
  assert.equal(result.direction, "시계방향");
  assert.equal(result.steps, 2);
  assert.equal(result.path, "B♭ → F → C");
});
