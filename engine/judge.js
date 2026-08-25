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

// "typing tax": one transposition or one doubled/dropped letter in a word
// he plainly knows. Not a knowledge error — must not be scored as one.
export function judge(given, accept){
  const g = normalise(given);
  for(const a of accept){
    const t = normalise(a);
    if(g === t) return {state:"correct", target:a};
    const dist = lev(g,t);
    if(dist <= 1) return {state:"tax", target:a};
    if(dist === 2 && sortedChars(g) === sortedChars(t)) return {state:"tax", target:a};
  }
  return {state:"wrong", target:accept[0]};
}
