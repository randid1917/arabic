import { test } from "node:test";
import assert from "node:assert/strict";

import { VERBS, PERSONS, ACTIVE_PERSONS, NOTES } from "../data/verbs.js";
import { CONSTRUCTIONS, conjugationDrill, sentenceDrill } from "../engine/generator.js";
import { normalise, lev, judge } from "../engine/judge.js";

const PARADIGMS = ["past", "bare", "bform"];

/* ---------- data shape ---------- */

test("every verb has past/bare/bform arrays of exactly length 8", () => {
  for (const v of VERBS)
    for (const k of PARADIGMS) {
      assert.ok(Array.isArray(v[k]), `${v.id}.${k} is not an array`);
      assert.equal(v[k].length, 8, `${v.id}.${k} has ${v[k].length} slots, expected 8`);
    }
});

test("no form is empty or padded", () => {
  for (const v of VERBS)
    for (const k of PARADIGMS)
      v[k].forEach((f, i) => {
        assert.equal(typeof f, "string", `${v.id}.${k}[${i}] is not a string`);
        assert.notEqual(f.trim(), "", `${v.id}.${k}[${i}] is empty`);
        assert.equal(f, f.trim(), `${v.id}.${k}[${i}] has surrounding whitespace`);
      });
});

// Written as an exact pin rather than "no duplicates", because Levantine
// collapses two cells in each paradigm and the data is correct to do so:
//   past  — ana and inta share one form   (ru7t)
//   bare  — inta and hiyye share one form (trou7)
//   bform — likewise                      (btrou7)
// Anything beyond those two cells is a copy-paste slip, which this catches.
const EXPECTED_COLLISIONS = { past: [[0, 1]], bare: [[1, 4]], bform: [[1, 4]] };

test("the only repeated forms in a paradigm are the cells Levantine genuinely merges", () => {
  for (const v of VERBS)
    for (const k of PARADIGMS) {
      const groups = new Map();
      v[k].forEach((f, i) => groups.set(f, [...(groups.get(f) ?? []), i]));
      const found = [...groups.values()].filter(ix => ix.length > 1);
      assert.deepEqual(found, EXPECTED_COLLISIONS[k],
        `${v.id}.${k} repeats forms at ${JSON.stringify(found)}`);
    }
});

test("every verb has an id and en.base/en.s3/en.past", () => {
  for (const v of VERBS) {
    assert.equal(typeof v.id, "string");
    assert.notEqual(v.id, "");
    for (const k of ["base", "s3", "past"]) {
      assert.equal(typeof v.en?.[k], "string", `${v.id}.en.${k} missing`);
      assert.notEqual(v.en[k], "", `${v.id}.en.${k} is empty`);
    }
  }
});

test("verb ids are unique", () => {
  const ids = VERBS.map(v => v.id);
  assert.equal(new Set(ids).size, ids.length);
});

/* ---------- transcription standard ---------- */

// CLAUDE.md: no apostrophes anywhere, no digit-2 for glottal stops.
const OFFENDING = /['’ʼ2]/;

test("no form contains an apostrophe or the digit 2", () => {
  for (const v of VERBS)
    for (const k of PARADIGMS)
      v[k].forEach((f, i) =>
        assert.ok(!OFFENDING.test(f), `${v.id}.${k}[${i}] = ${JSON.stringify(f)}`));
});

test("no complement or construction fragment contains an apostrophe or the digit 2", () => {
  for (const v of VERBS)
    for (const c of v.comps)
      assert.ok(!OFFENDING.test(c.ar), `${v.id} comp ${JSON.stringify(c.ar)}`);
  for (const c of CONSTRUCTIONS)
    assert.ok(!OFFENDING.test(c.time), `${c.id} time ${JSON.stringify(c.time)}`);
});

/* ---------- generation ---------- */

const clean = (s, where) => {
  assert.equal(typeof s, "string", `${where} is not a string`);
  assert.notEqual(s.trim(), "", `${where} is empty`);
  assert.ok(!/\s\s/.test(s), `${where} has a double space: ${JSON.stringify(s)}`);
  assert.ok(!/undefined/.test(s), `${where} contains undefined: ${JSON.stringify(s)}`);
};

test("every construction x verb x active person builds a clean answer", () => {
  let n = 0;
  for (const c of CONSTRUCTIONS)
    for (const v of VERBS)
      for (const pi of ACTIVE_PERSONS) {
        const p = PERSONS[pi];
        clean(c.build(v, p), `${c.id}/${v.id}/${p.en}`);
        clean(c.en(v, p), `${c.id}/${v.id}/${p.en} (english)`);
        n++;
      }
  assert.equal(n, CONSTRUCTIONS.length * VERBS.length * ACTIVE_PERSONS.length);
});

test("every construction x verb x active person x complement builds a clean sentence", () => {
  for (const c of CONSTRUCTIONS)
    for (const v of VERBS.filter(x => x.comps.length))
      for (const pi of ACTIVE_PERSONS)
        for (const comp of v.comps) {
          const core = `${c.build(v, PERSONS[pi])} ${comp.ar}`;
          clean(`${c.time} ${core}`, `${c.id}/${v.id}/${comp.ar} (time first)`);
          clean(`${core} ${c.time}`, `${c.id}/${v.id}/${comp.ar} (time last)`);
        }
});

test("the feminine address slot is excluded from generated output", () => {
  assert.ok(!ACTIVE_PERSONS.includes(2), "inte must not be an active person");
  assert.equal(PERSONS[2].en, "you (f)", "slot 2 must remain in the data");
});

test("generating 1000 drills throws nothing and yields usable drills", () => {
  for (let i = 0; i < 1000; i++) {
    for (const d of [conjugationDrill(), sentenceDrill()]) {
      clean(d.eyebrow, "eyebrow");
      clean(d.prompt, "prompt");
      clean(d.note, "note");
      assert.ok(d.accept.length > 0, "drill has no accepted answer");
      d.accept.forEach(a => clean(a, `accept for ${d.tag}`));
      assert.ok(Object.values(NOTES).some(n => d.note.startsWith(n)),
        `note is not one of the canned NOTES: ${d.note}`);
    }
  }
});

test("a drill's own answer always judges as correct", () => {
  for (let i = 0; i < 500; i++)
    for (const d of [conjugationDrill(), sentenceDrill()])
      for (const a of d.accept)
        assert.equal(judge(a, d.accept).state, "correct", `${a} did not judge correct`);
});

/* ---------- judge ---------- */

test("normalise lowercases, trims, strips punctuation and collapses spaces", () => {
  assert.equal(normalise("  Ra7  Rou7. "), "ra7 rou7");
  assert.equal(normalise("Ma ru7t!"), "ma ru7t");
});

test("lev is a plain edit distance", () => {
  assert.equal(lev("rou7", "rou7"), 0);
  assert.equal(lev("brou7", "rou7"), 1);
  assert.equal(lev("ru7t", "r7ut"), 2);
});

test("exact match is correct", () => {
  assert.equal(judge("rou7", ["rou7"]).state, "correct");
  assert.equal(judge("  Ra7 Rou7 ", ["ra7 rou7"]).state, "correct");
  assert.equal(judge("akalt bel-mat3am mbaari7",
    ["mbaari7 akalt bel-mat3am", "akalt bel-mat3am mbaari7"]).state, "correct");
});

test("a single-letter slip is typing tax", () => {
  assert.equal(judge("ru7d", ["ru7t"]).state, "tax");      // substituted
  assert.equal(judge("ru7", ["ru7t"]).state, "tax");       // dropped
  assert.equal(judge("ru7tt", ["ru7t"]).state, "tax");     // doubled
  assert.equal(judge("r7ut", ["ru7t"]).state, "tax");      // transposed
  assert.equal(judge("bshuof", ["bshouf"]).state, "tax");  // transposed mid-word
});

test("a missing space is typing tax", () => {
  assert.equal(judge("ra7rou7", ["ra7 rou7"]).state, "tax");
  assert.equal(judge("maru7t", ["ma ru7t"]).state, "tax");
});

// The case the whole judge exists for. `brou7` is one character from `rou7`,
// so edit distance alone excuses it — but a b- surviving after ra7 is precisely
// the mistake being drilled, and must always score as a miss.
test("a stray or dropped b- is wrong, never tax", () => {
  assert.equal(judge("brou7", ["rou7"]).state, "wrong");
  assert.equal(judge("ra7 brou7", ["ra7 rou7"]).state, "wrong");
  assert.equal(judge("lazem bshouf", ["lazem shouf"]).state, "wrong");
  assert.equal(judge("fiini bjeeb", ["fiini jeeb"]).state, "wrong");
  assert.equal(judge("rou7", ["brou7"]).state, "wrong");     // dropped the other way
  assert.equal(judge("tishrab", ["btishrab"]).state, "wrong");
});

test("a stray or dropped ma is wrong, never tax", () => {
  assert.equal(judge("ru7t", ["ma ru7t"]).state, "wrong");
  assert.equal(judge("ma ru7t", ["ru7t"]).state, "wrong");
  assert.equal(judge("ma ra7 rou7", ["ra7 rou7"]).state, "wrong");
});

test("a real b- miss stays wrong even when another accepted order is close", () => {
  const accept = ["mbaari7 ma akalt bel-mat3am", "ma akalt bel-mat3am mbaari7"];
  assert.equal(judge("mbaari7 akalt bel-mat3am", accept).state, "wrong");
});

test("a genuinely different word is wrong", () => {
  assert.equal(judge("shouf", ["rou7"]).state, "wrong");
  assert.equal(judge("zzzz", ["ra7 rou7"]).state, "wrong");
});

test("wrong answers report the first accepted form as the target", () => {
  assert.equal(judge("zzzz", ["ra7 rou7", "rou7 ra7"]).target, "ra7 rou7");
});
