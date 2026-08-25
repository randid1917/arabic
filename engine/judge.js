/* ===================================================================
   JUDGE.  Answer checking: three states, not two.
   =================================================================== */

export function normalise(s){
  return s.toLowerCase().trim().replace(/[.,!?]/g,"").replace(/\s+/g," ");
}
export function lev(a,b){
  const m=a.length,n=b.length,d=Array.from({length:m+1},(_,i)=>[i,...Array(n).fill(0)]);
  for(let j=0;j<=n;j++) d[0][j]=j;
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++)
    d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  return d[m][n];
}
const sortedChars = s => s.replace(/\s/g,"").split("").sort().join("");
const despace = s => s.replace(/\s/g,"");

// The b- of the habitual and the negator ma are grammar, not spelling. A
// difference in either is always a real miss however small the edit distance:
// `ra7 brou7` for `ra7 rou7` is exactly the error these drills exist to catch,
// and it sits one character from correct. Counted, not aligned, so a missing
// space cannot shift the reading.
const markers = s => {
  const w = normalise(s).split(" ").filter(Boolean);
  return w.filter(x => x === "ma").length + ":" +
         w.filter(x => x !== "ma" && x.startsWith("b")).length;
};

// "typing tax": one transposition or one doubled/dropped letter in a word
// he plainly knows. Not a knowledge error — must not be scored as one.
export function judge(given, accept){
  const g = normalise(given);
  for(const a of accept){
    const t = normalise(a);
    if(g === t) return {state:"correct", target:a};
    // same letters in the same order, spaced differently — a thumb slip
    if(despace(g) === despace(t)) return {state:"tax", target:a};
    // a b-/ma difference is never excused, so it never reaches the distance test
    if(markers(g) !== markers(t)) continue;
    const dist = lev(g,t);
    if(dist <= 1) return {state:"tax", target:a};
    if(dist === 2 && sortedChars(g) === sortedChars(t)) return {state:"tax", target:a};
  }
  return {state:"wrong", target:accept[0]};
}
