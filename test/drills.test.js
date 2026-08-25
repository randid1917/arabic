import { test } from "node:test";
import assert from "node:assert/strict";

import { VERBS, PERSONS, ACTIVE_PERSONS, NOTES } from "../data/verbs.js";
import { CONSTRUCTIONS, conjugationDrill, sentenceDrill } from "../engine/generator.js";
import { normalise, lev, judge } from "../engine/judge.js";
import { readFileSync, readdirSync } from "node:fs";

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

// ne7na marks the habitual with mn-, not b-. Dropping it after ra7/lazem/fiini
// is the same grammar miss as a surviving b-, and just as close by distance.
test("a stray or dropped mn- is wrong, never tax", () => {
  assert.equal(judge("ra7 mnrou7", ["ra7 nrou7"]).state, "wrong");
  assert.equal(judge("lazem mnshouf", ["lazem shouf"]).state, "wrong");
  assert.equal(judge("fiini mnjeeb", ["fiini jeeb"]).state, "wrong");
  assert.equal(judge("mniktob", ["niktob"]).state, "wrong");
  assert.equal(judge("naakol", ["mnaakol"]).state, "wrong");  // dropped the other way
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

/* ---------- optional subject pronouns ---------- */

test("every person carries a unique pronoun matching the paradigm comment", () => {
  const header = readFileSync(new URL("../data/verbs.js", import.meta.url), "utf8")
    .match(/\[(ana[^\]]*)\]/)[1].split(",").map(x => x.trim());
  assert.deepEqual(PERSONS.map(p => p.ar), header,
    "PERSONS[].ar has drifted from the paradigm order named in the comment");
  const prons = PERSONS.map(p => p.ar);
  assert.equal(new Set(prons).size, prons.length, "two persons share a pronoun");
  for (const p of PERSONS) {
    assert.notEqual(p.ar.trim(), "", `person ${p.i} has no pronoun`);
    assert.ok(!OFFENDING.test(p.ar), `pronoun ${JSON.stringify(p.ar)} breaks the transcription rules`);
  }
});

// The verb ending already names the person, so both are right.
test("the pronoun is optional on every construction x verb x active person", () => {
  for (const c of CONSTRUCTIONS)
    for (const v of VERBS)
      for (const pi of ACTIVE_PERSONS) {
        const p = PERSONS[pi];
        const answer = c.build(v, p);
        const accept = [answer, `${p.ar} ${answer}`];
        assert.equal(judge(answer, accept).state, "correct",
          `bare ${answer} rejected for ${c.id}/${v.id}/${p.en}`);
        assert.equal(judge(`${p.ar} ${answer}`, accept).state, "correct",
          `${p.ar} ${answer} rejected for ${c.id}/${v.id}/${p.en}`);
      }
});

// inta/inte/into sit one edit apart, so without the pronoun check the distance
// test would wave a disagreeing pronoun through as a slip.
test("naming a different pronoun is a miss, never tax", () => {
  for (const c of CONSTRUCTIONS)
    for (const v of VERBS)
      for (const pi of ACTIVE_PERSONS) {
        const p = PERSONS[pi];
        const answer = c.build(v, p);
        const accept = [answer, `${p.ar} ${answer}`];
        for (const other of PERSONS) {
          if (other.ar === p.ar) continue;
          assert.equal(judge(`${other.ar} ${answer}`, accept).state, "wrong",
            `${other.ar} ${answer} was excused for ${c.id}/${v.id}/${p.en}`);
        }
      }
});

test("a slip inside the pronoun is still typing tax", () => {
  const accept = ["ru7t", "inta ru7t"];
  assert.equal(judge("intaa ru7t", accept).state, "tax");   // doubled
  assert.equal(judge("int ru7t", accept).state, "tax");     // dropped
  assert.equal(judge("intaru7t", accept).state, "tax");     // missing space
  assert.equal(judge("inta ru7d", accept).state, "tax");    // slip in the verb
});

test("a pronoun never rescues a b-/ma/mn- miss", () => {
  assert.equal(judge("ana brou7", ["rou7", "ana rou7"]).state, "wrong");
  assert.equal(judge("ne7na nrou7", ["mnrou7", "ne7na mnrou7"]).state, "wrong");
  assert.equal(judge("ana ru7t", ["ma ru7t", "ana ma ru7t"]).state, "wrong");
});

test("conjugation drills accept 2 forms, sentence drills 4, none duplicated", () => {
  for (let i = 0; i < 300; i++) {
    const c = conjugationDrill(), s = sentenceDrill();
    assert.equal(c.accept.length, 2, "conjugation should accept bare + pronoun");
    assert.equal(s.accept.length, 4, "sentence should accept 2 orders x 2 pronoun states");
    for (const d of [c, s])
      assert.equal(new Set(d.accept).size, d.accept.length,
        `duplicate accepted form: ${JSON.stringify(d.accept)}`);
  }
});

test("the bare form stays the answer shown on a miss", () => {
  for (let i = 0; i < 200; i++)
    for (const d of [conjugationDrill(), sentenceDrill()])
      assert.ok(!PERSONS.some(p => d.accept[0].split(" ").includes(p.ar)),
        `accept[0] should be the pronoun-less form, got ${d.accept[0]}`);
});

/* ---------- offline shell ---------- */

// There is no build step, so sw.js lists its assets by hand and nothing stops
// a new module from being added and silently left out of the cache. This walks
// the repo and insists the two agree.
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// not part of the installed app: the frozen prototype, the tests, the notes,
// and sw.js itself, which the browser fetches outside the cache it manages
// .nojekyll is a GitHub Pages build directive, not an asset the app loads
const NOT_SHIPPED = new Set(["drills.html", "sw.js", "CLAUDE.md", ".nojekyll"]);
const NOT_SHIPPED_DIRS = new Set([".git", "test", "node_modules"]);

const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  if (e.isDirectory())
    return NOT_SHIPPED_DIRS.has(e.name) ? [] : walk(join(dir, e.name));
  return [relative(ROOT, join(dir, e.name)).split("\\").join("/")];
});

const precache = () => {
  const src = readFileSync(join(ROOT, "sw.js"), "utf8");
  const body = src.match(/const PRECACHE = \[([\s\S]*?)\];/)[1];
  return JSON.parse("[" + body.replace(/\s+/g, "") + "]");
};

test("the service worker precaches every shipped asset and nothing stale", () => {
  const listed = precache();
  assert.ok(listed.includes("./"), "the bare root must be precached for start_url");

  const onDisk = walk(ROOT).filter(f => !NOT_SHIPPED.has(f)).sort();
  const cached = listed.filter(u => u !== "./").map(u => u.replace(/^\.\//, "")).sort();

  assert.deepEqual(cached, onDisk,
    "sw.js PRECACHE has drifted from the files on disk — bump CACHE and fix the list");
  assert.equal(new Set(cached).size, cached.length, "PRECACHE lists a file twice");
});

test("the service worker does not precache itself", () => {
  assert.ok(!precache().some(u => u.endsWith("sw.js")));
});

test("the manifest points only at assets that exist and are precached", () => {
  const m = JSON.parse(readFileSync(join(ROOT, "manifest.webmanifest"), "utf8"));
  const cached = new Set(precache());
  assert.ok(cached.has(m.start_url), `start_url ${m.start_url} is not precached`);
  for (const i of m.icons) {
    assert.ok(cached.has(i.src), `icon ${i.src} is not precached`);
    assert.ok(readFileSync(join(ROOT, i.src)).length > 0, `icon ${i.src} is empty`);
  }
  assert.ok(m.icons.some(i => i.purpose === "maskable"), "no maskable icon");
  assert.equal(m.display, "standalone");
});
