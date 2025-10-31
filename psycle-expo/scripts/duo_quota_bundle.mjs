import fs from "fs"; import path from "path";

const IN_DIR  = process.argv[2] || "data/cards_duo";
const OUT_DIR = process.argv[3] || "data/lessons15";

const QUOTA = {
  L1: { term:2, ab:4, mcq3:5, truefalse:2, cloze1:1, method:1 },
  Lx: { term:0, ab:5, mcq3:5, truefalse:3, cloze1:1, method:1 },
  ORDER: ["ab","mcq3","truefalse","mcq3","cloze1","method"]
};

const readJsonl = fp => fs.readFileSync(fp,"utf8").split("\n").filter(Boolean).map(l=>JSON.parse(l));
const writeJsonl= (fp,a)=> fs.writeFileSync(fp,a.map(o=>JSON.stringify(o)).join("\n")+"\n","utf8");
const cut=(s,n)=> (s && s.length>n ? s.slice(0,n)+"…" : (s||""));

function norm(rec){
  const id = String(rec.id || rec.source_id || Math.random().toString(36).slice(2));
  return {
    id, label: rec.label || "研究", type: rec.type || "mcq3",
    intro: rec.intro || "", info: rec.info || "", snack: rec.snack || "",
    stem: rec.stem || "正しいのはどれ？",
    choices: Array.isArray(rec.choices) ? rec.choices.slice() : [],
    answer_index: Number.isInteger(rec.answer_index)?rec.answer_index:0
  };
}
function mcq3(b){ const cs=b.choices.slice(0,3); while(cs.length<3) cs.push("—");
  return {...b,type:"mcq3",stem:"正しいのはどれ？",choices:cs,answer_index:Math.min(b.answer_index,2)}; }
function ab(b,alt=false){
  const cs=b.choices; if(cs.length<2) return null;
  const ai=Math.min(b.answer_index, cs.length-1);
  // 選択肢が長すぎる（60文字以上）または研究文脈を含む場合はAB問題にしない
  const correct = cs[ai] || "";
  if(correct.length > 60 || /研究|調査|分析|明らかに|示され|目的|質問/.test(correct)) return null;
  const wrongs = cs.map((t,i)=>({t,i})).filter(x=>x.i!==ai && x.t.length<=60 && !/研究|調査|分析|明らかに|示され|目的|質問/.test(x.t));
  if(!wrongs.length) return null;
  const pick = alt && wrongs[1] ? wrongs[1].t : (wrongs[0]?.t ?? cs[0]);
  return {...b,type:"ab",stem:"どっち？",choices:[cs[ai], pick],answer_index:0};
}
function tf(b){ const st=b.choices?.[b.answer_index] || b.stem || "これは正しい？";
  return {...b,type:"truefalse",stem:st,choices:["正しい","誤り"],answer_index:0}; }
function cloze(b){
  const correct=(b.choices?.[b.answer_index]||"").replace(/[ 　]/g,"");
  if(!correct) return null;
  const dict = ["見方を変える","ガマン","しあわせ"];
  let stem = correct; const key = dict.find(k=>stem.includes(k));
  if(!key) return null;
  stem = stem.replace(key,"［　］");
  const ds = dict.filter(x=>x!==key).slice(0,2);
  return {...b,type:"cloze1",stem:cut(stem,40),choices:[key,...ds],answer_index:0};
}
function method(b){
  const info=b.info||""; const opts=["横断","縦断","RCT","メタ分析"];
  const has = opts.find(o=>info.includes(o)); if(!has) return null;
  return {...b,type:"method",stem:"この研究はどれ？",choices:[has,...opts.filter(x=>x!==has)].slice(0,3),answer_index:0};
}

function deriveVariants(base){
  const m = mcq3(base);
  return {
    mcq3: [m, mcq3(base)],
    ab:   [ab(base,false), ab(base,true)].filter(Boolean),
    truefalse: [tf(base)],
    cloze1: [cloze(base)].filter(Boolean),
    method: [method(base)].filter(Boolean)
  };
}

function buildLessonByQuota(pools, quota, isL1, termCards){
  const out = [];
  if(isL1 && quota.term>0 && termCards.length){
    out.push(...termCards.slice(0, quota.term));
  }
  const wants = [];
  for(const t of QUOTA.ORDER){
    const need = quota[t]||0;
    for(let i=0;i<need;i++) wants.push(t);
  }
  while(out.length + wants.length > 15) wants.pop();

  for(const typ of wants){
    const pool = pools[typ];
    if(pool.length===0){
      if(typ==="ab" && pools.mcq3.length) { 
        const base = pools.mcq3.shift(); 
        const v = ab(base,false) || tf(base) || base; 
        out.push(v); 
        continue; 
      }
      if(typ==="truefalse" && pools.mcq3.length){
        const base = pools.mcq3.shift(); 
        out.push(tf(base)); 
        continue;
      }
      if(typ==="cloze1" && pools.mcq3.length){
        const base = pools.mcq3.shift(); 
        out.push(cloze(base) || mcq3(base)); 
        continue;
      }
      if(typ==="method" && pools.mcq3.length){
        const base = pools.mcq3.shift(); 
        out.push(method(base) || mcq3(base)); 
        continue;
      }
      const any = ["ab","mcq3","truefalse","cloze1","method"].find(k=>pools[k].length);
      if(any){ out.push(pools[any].shift()); }
      continue;
    }
    out.push(pool.shift());
  }

  while(out.length<15){
    const any = ["mcq3","ab","truefalse","cloze1","method"].find(k=>pools[k].length);
    if(any) out.push(pools[any].shift()); else break;
  }
  return out.slice(0,15);
}

function buildAll(inPath){
  const name = path.basename(inPath, ".jsonl");
  const rows = readJsonl(inPath).map(norm);
  const terms = rows.filter(r=>r.label==="用語");
  const bases = rows.filter(r=>r.label!=="用語");

  const pools = { ab:[], mcq3:[], truefalse:[], cloze1:[], method:[] };
  for(const b of bases){
    const v = deriveVariants(b);
    for(const k of Object.keys(pools)) pools[k].push(...(v[k]||[]));
  }

  const needTotal = 15*6 - Math.min(terms.length,2);
  let safety=0;
  while(Object.values(pools).reduce((s,a)=>s+a.length,0) < needTotal && safety<6){
    for(const b of bases){
      const v = deriveVariants(b);
      for(const k of Object.keys(pools)) pools[k].push(...(v[k]||[]));
    }
    safety++;
  }

  const l1 = buildLessonByQuota(pools, QUOTA.L1, true, terms.slice(0,2));
  const lessons = [l1];
  for(let i=2;i<=6;i++){
    lessons.push(buildLessonByQuota(pools, QUOTA.Lx, false, []));
  }
  return { name, lessons };
}

function main(){
  if(!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR,{recursive:true});
  const files = fs.readdirSync(IN_DIR).filter(f=>f.endsWith(".jsonl"));
  if(!files.length){ console.error("入力なし: " + IN_DIR + "/*.jsonl"); process.exit(1); }
  for(const f of files){
    const {name, lessons} = buildAll(path.join(IN_DIR,f));
    lessons.forEach((arr,i)=>{
      const fp = path.join(OUT_DIR, name + "_l0" + (i+1) + ".jsonl");
      writeJsonl(fp, arr);
      const termN = arr.filter(x=>x.label==="用語").length;
      console.log("✓ " + name + "_l0" + (i+1) + ".jsonl → " + arr.length + "問（用語" + termN + "）");
    });
  }
}
main();
