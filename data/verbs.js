/* ===================================================================
   DATA.  Every form is explicit and auditable.
   Fix a wrong form here and it is fixed everywhere.
   Paradigm order is always:
   [ana, inta, inte, huwwe, hiyye, ne7na, into, hinne]
   =================================================================== */

// `ar` is the independent subject pronoun, in the paradigm order named above.
export const PERSONS = [
  {i:0, ar:"ana",   en:"I",       has:"have", is3:false, fii:"fiini"},
  {i:1, ar:"inta",  en:"you",     has:"have", is3:false, fii:"fiik"},
  {i:2, ar:"inte",  en:"you (f)", has:"have", is3:false, fii:"fiike"},
  {i:3, ar:"huwwe", en:"he",      has:"has",  is3:true,  fii:"fii"},
  {i:4, ar:"hiyye", en:"she",     has:"has",  is3:true,  fii:"fiya"},
  {i:5, ar:"ne7na", en:"we",      has:"have", is3:false, fii:"fiina"},
  {i:6, ar:"into",  en:"you all", has:"have", is3:false, fii:"fiikon"},
  {i:7, ar:"hinne", en:"they",    has:"have", is3:false, fii:"fiyon"}
];
// Feminine address (inte) is off by default — masculine forms only.
export const ACTIVE_PERSONS = [0,1,3,4,5,6,7];

export const VERBS = [
  {
    id:"ra7", hollow:true, en:{base:"go", s3:"goes", past:"went"},
    past:["ru7t","ru7t","ru7te","ra7","ra7et","ru7na","ru7to","ra7o"],
    bare:["rou7","trou7","trou7e","yrou7","trou7","nrou7","trou7o","yrou7o"],
    bform:["brou7","btrou7","btrou7e","birou7","btrou7","mnrou7","btrou7o","birou7o"],
    comps:[{ar:"3al-bank",en:"to the bank"},{ar:"3al-beit",en:"home"},{ar:"3ash-shighel",en:"to work"}]
  },
  {
    id:"shaaf", hollow:true, en:{base:"see", s3:"sees", past:"saw"},
    past:["shift","shift","shifte","shaaf","shaafet","shifna","shifto","shaafo"],
    bare:["shouf","tshouf","tshoufe","yshouf","tshouf","nshouf","tshoufo","yshoufo"],
    bform:["bshouf","btshouf","btshoufe","bishouf","btshouf","mnshouf","btshoufo","bishoufo"],
    comps:[{ar:"as7aabi",en:"my friends"},{ar:"el-film",en:"the film"}]
  },
  {
    id:"kaan", hollow:true, en:{base:"be", s3:"is", past:"was"},
    past:["kint","kint","kinte","kaan","kaanet","kinna","kinto","kaano"],
    bare:["koun","tkoun","tkoune","ykoun","tkoun","nkoun","tkouno","ykouno"],
    bform:["bkoun","btkoun","btkoune","bikoun","btkoun","mnkoun","btkouno","bikouno"],
    comps:[]
  },
  {
    id:"jaab", hollow:true, en:{base:"bring", s3:"brings", past:"brought"},
    past:["jibt","jibt","jibte","jaab","jaabet","jibna","jibto","jaabo"],
    bare:["jeeb","tjeeb","tjeebe","yjeeb","tjeeb","njeeb","tjeebo","yjeebo"],
    bform:["bjeeb","btjeeb","btjeebe","bijeeb","btjeeb","mnjeeb","btjeebo","bijeebo"],
    comps:[{ar:"el-akel",en:"the food"},{ar:"ahwe",en:"coffee"}]
  },
  {
    id:"naam", hollow:true, en:{base:"sleep", s3:"sleeps", past:"slept"},
    past:["nimt","nimt","nimte","naam","naamet","nimna","nimto","naamo"],
    bare:["naam","tnaam","tnaame","ynaam","tnaam","nnaam","tnaamo","ynaamo"],
    bform:["bnaam","btnaam","btnaame","binaam","btnaam","mnnaam","btnaamo","binaamo"],
    comps:[]
  },
  {
    id:"shirib", hollow:false, en:{base:"drink", s3:"drinks", past:"drank"},
    past:["shribt","shribt","shribte","shirib","shirbet","shribna","shribto","shirbo"],
    bare:["shrab","tishrab","tishrabe","yishrab","tishrab","nishrab","tishrabo","yishrabo"],
    bform:["bishrab","btishrab","btishrabe","byishrab","btishrab","mnishrab","btishrabo","byishrabo"],
    comps:[{ar:"ahwe",en:"coffee"},{ar:"shay",en:"tea"}]
  },
  {
    id:"akal", hollow:false, en:{base:"eat", s3:"eats", past:"ate"},
    past:["akalt","akalt","akalte","akal","akalet","akalna","akalto","akalo"],
    bare:["aakol","taakol","taakle","yaakol","taakol","naakol","taaklo","yaaklo"],
    bform:["baakol","btaakol","btaakle","byaakol","btaakol","mnaakol","btaaklo","byaaklo"],
    comps:[{ar:"bel-mat3am",en:"at the restaurant"}]
  },
  {
    id:"katab", hollow:false, en:{base:"write", s3:"writes", past:"wrote"},
    past:["katabt","katabt","katabte","katab","katbet","katabna","katabto","katabo"],
    bare:["ktob","tiktob","tiktbe","yiktob","tiktob","niktob","tiktbo","yiktbo"],
    bform:["biktob","btiktob","btiktbe","byiktob","btiktob","mniktob","btiktbo","byiktbo"],
    comps:[]
  },
  {
    id:"3imil", hollow:false, en:{base:"do", s3:"does", past:"did"},
    past:["3milt","3milt","3milte","3imil","3imlet","3milna","3milto","3imlo"],
    bare:["3mol","ta3mol","ta3mle","ya3mol","ta3mol","na3mol","ta3mlo","ya3mlo"],
    bform:["ba3mol","bta3mol","bta3mle","bya3mol","bta3mol","mna3mol","bta3mlo","bya3mlo"],
    comps:[]
  }
];

/* Constructions. `slot` says which paradigm the bare verb comes from —
   this is the whole point of the ra7 / lazem / fiini drills. */
const CONSTRUCTIONS = [
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

export const NOTES = {
  modal:"After <b>ra7 / lazem / fiini</b> the verb takes the bare imperfect: the person prefix stays, the <b>b-</b> drops. Not <i>ra7 brou7</i> — <i>ra7 rou7</i>.",
  hollowShort:"Hollow verb, consonant ending → <b>short stem</b> (ru7t, shift, kint). Long stem only bare or before a vowel ending (ra7, ra7et, ra7o).",
  hollowLong:"Hollow verb, bare or vowel ending → <b>long stem</b> (ra7, ra7et, ra7o). Short stem only before a consonant ending.",
  neg:"<b>ma</b> sits in front of the whole verb and changes nothing inside it.",
  bform:"Habitual present carries the <b>b-</b> prefix on top of the person prefix — byishrab, mnishrab.",
  order:"Time word goes at the front or the very end; the verb block stays together."
};
