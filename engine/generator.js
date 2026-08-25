/* ===================================================================
   GENERATOR.  Pure functions, no DOM. It is the only part that
   needs to be correct.
   =================================================================== */

import { PERSONS, ACTIVE_PERSONS, VERBS, NOTES } from "../data/verbs.js";

/* Constructions. `slot` says which paradigm the bare verb comes from —
   this is the whole point of the ra7 / lazem / fiini drills. */
export const CONSTRUCTIONS = [
  {id:"past",     label:"Past",              slot:"past",  time:"mbaari7", timeEn:"yesterday",
   build:(v,p)=>v.past[p.i],
   en:(v,p)=>`${p.en} ${v.en.past}`},

  {id:"pastNeg",  label:"Past · negative",   slot:"past",  time:"mbaari7", timeEn:"yesterday",
   build:(v,p)=>`ma ${v.past[p.i]}`,
   en:(v,p)=>`${p.en} didn't ${v.en.base}`},

  {id:"pres",     label:"Habitual present",  slot:"bform", time:"kill yom", timeEn:"every day",
   build:(v,p)=>v.bform[p.i],
   en:(v,p)=>`${p.en} ${p.is3?v.en.s3:v.en.base}`},

  {id:"presNeg",  label:"Present · negative",slot:"bform", time:"kill yom", timeEn:"every day",
   build:(v,p)=>`ma ${v.bform[p.i]}`,
   en:(v,p)=>`${p.en} ${p.is3?"doesn't":"don't"} ${v.en.base}`},

  {id:"future",   label:"Future · ra7",      slot:"bare",  time:"bukra", timeEn:"tomorrow",
   build:(v,p)=>`ra7 ${v.bare[p.i]}`,
   en:(v,p)=>`${p.en} will ${v.en.base}`},

  {id:"futureNeg",label:"Future · negative", slot:"bare",  time:"bukra", timeEn:"tomorrow",
   build:(v,p)=>`ma ra7 ${v.bare[p.i]}`,
   en:(v,p)=>`${p.en} won't ${v.en.base}`},

  {id:"lazem",    label:"Obligation · lazem",slot:"bare",  time:"bukra", timeEn:"tomorrow",
   build:(v,p)=>`lazem ${v.bare[p.i]}`,
   en:(v,p)=>`${p.en} ${p.has} to ${v.en.base}`},

  {id:"fiini",    label:"Ability · fiini",   slot:"bare",  time:"bukra", timeEn:"tomorrow",
   build:(v,p)=>`${p.fii} ${v.bare[p.i]}`,
   en:(v,p)=>`${p.en} can ${v.en.base}`}
];

const pick = a => a[Math.floor(Math.random()*a.length)];

function personFor(){ return PERSONS[pick(ACTIVE_PERSONS)]; }

// The verb ending already carries the person, so the independent pronoun is
// optional: `ru7t` and `ana ru7t` are both right. Accept either. A pronoun
// that disagrees with the verb is simply not in the list, so it still misses.
const withPronoun = (p, core) => [core, `${p.ar} ${core}`];

function noteFor(c, v, p){
  if(c.slot==="bare" && c.id!=="past") return NOTES.modal;
  if(c.slot==="past" && v.hollow){
    const longStem = [3,4,7].includes(p.i);
    return longStem ? NOTES.hollowLong : NOTES.hollowShort;
  }
  if(c.id==="presNeg"||c.id==="pastNeg") return NOTES.neg;
  if(c.id==="pres") return NOTES.bform;
  return NOTES.bform;
}

export function conjugationDrill(){
  const c = pick(CONSTRUCTIONS);
  const v = pick(VERBS);
  const p = personFor();
  const answer = c.build(v,p);
  return {
    eyebrow: c.label,
    prompt: c.en(v,p),
    accept: withPronoun(p, answer),
    note: noteFor(c,v,p),
    tag: c.id
  };
}

export function sentenceDrill(){
  const c = pick(CONSTRUCTIONS);
  const v = pick(VERBS.filter(x=>x.comps.length));
  const p = personFor();
  const comp = pick(v.comps);
  const core = `${c.build(v,p)} ${comp.ar}`;
  return {
    eyebrow: `${c.label} · full sentence`,
    prompt: `${cap(c.timeEn)}, ${c.en(v,p)} ${comp.en}.`,
    // both word orders are natural, and the pronoun is optional in each
    accept: withPronoun(p, core).flatMap(x => [`${c.time} ${x}`, `${x} ${c.time}`]),
    note: noteFor(c,v,p) + " " + NOTES.order,
    tag: c.id
  };
}

const cap = s => s[0].toUpperCase()+s.slice(1);
