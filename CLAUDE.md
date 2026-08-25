# Project rules

## Transcription standard — Beirut city Lebanese, Arabizi
- 3 = ع, 7 = ح, always
- No apostrophes anywhere. No digit-2 for glottal stops: laanno, suaal, mitaakhkhar
- ق → bare/glottal: ahwe, addeish, areeb, aal, halla
- Long u is written "ou": rou7, shouf, koun
- Short vowels stay short: ba7ibb (not ba7eb), mni7 (not mnee7), kteer (not ktheer)
- Geminates doubled: biddi, sitte, 3allam
- Sun assimilation written out: esh-shmaal, et-tawle. Moon letters keep el-: el-bank, 3al-yameen
- Spoken vocabulary only: as7aabi not asdiqaa, bidd- not ureed, shu not maadha
- Masculine address forms only in generated output. The `inte` (2nd person feminine)
  slot stays in the data arrays but is excluded from ACTIVE_PERSONS.

## Hard rule on linguistic data
Never invent, correct, or "improve" an Arabic form on your own initiative. Every form in
`data/verbs.js` is authoritative and human-verified. If you believe a form is wrong, stop
and ask — do not edit it. You may only reshape the data structurally (moving, renaming
keys, reformatting) with the string values byte-identical.

## Code rules
- No dependencies. No build step. No network calls at runtime. No CDN fonts.
- Storage is IndexedDB only. No localStorage.
- Plain ES modules, no framework.
