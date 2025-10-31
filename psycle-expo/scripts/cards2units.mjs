import fs from "fs"; import path from "path";
const IN="data/cards_duo", OUT="data/units_out"; fs.mkdirSync(OUT,{recursive:true});
const NODES=Number(process.env.NODES||4), LESSONS=Number(process.env.LESSONS||6), SIZE=Number(process.env.LESSON_SIZE||15);
const ORDER=["ab","mcq3","truefalse","mcq3","cloze1","method"];
const cut=(s,n)=> (s&&s.length>n?s.slice(0,n)+"…":(s||"")); const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const readJsonl=fp=>fs.readFileSync(fp,"utf8").split("\n").filter(Boolean).map(l=>JSON.parse(l));
const norm=r=>({ id:String(r.id||r.source_id||Math.random().toString(36).slice(2)), label:r.label||"研究", type:r.type||"mcq3", intro:r.intro||"", info:r.info||"", snack:r.snack||"", stem:r.stem||r.question||"正しいのはどれ？", choices:Array.isArray(r.choices)?r.choices.slice():[], answer_index:Number.isInteger(r.answer_index)?r.answer_index:0 });
function mcq3(b){ const cs=b.choices.slice(0,3); while(cs.length<3) cs.push("—"); return {...b,type:"mcq3",stem:"正しいのはどれ？",choices:cs,answer_index:Math.min(b.answer_index,2)};}
function ab(b,alt=false){ const cs=b.choices; if(cs.length<2) return null; const ai=Math.min(b.answer_index,cs.length-1); const w=cs.map((t,i)=>({t,i})).filter(x=>x.i!==ai); const pick=alt&&w[1]?w[1].t:(w[0]?.t??cs[0]); return {...b,type:"ab",stem:"どっち？",choices:[cs[ai],pick],answer_index:0}; }
function tf(b){ const st=b.choices?.[b.answer_index]||b.stem||"これは正しい？"; return {...b,type:"truefalse",stem:st,choices:["正しい","誤り"],answer_index:0}; }
function cloze(b){ const corr=(b.choices?.[b.answer_index]||"").replace(/[ 　]/g,""); if(!corr) return null; const dict=["見方を変える","ガマン","しあわせ"]; let stem=corr; const key=dict.find(k=>stem.includes(k)); if(!key) return null; stem=stem.replace(key,"［　］"); return {...b,type:"cloze1",stem:cut(stem,40),choices:[key,...dict.filter(x=>x!==key).slice(0,2)],answer_index:0}; }
function method(b){ const info=b.info||""; const opts=["横断","縦断","RCT","メタ分析"]; const has=opts.find(o=>info.includes(o)); if(!has) return null; return {...b,type:"method",stem:"この研究はどれ？",choices:[has,...opts.filter(x=>x!==has)].slice(0,3),answer_index:0}; }
function variants(b){ const m=mcq3(b); return { ab:[ab(b,false),ab(b,true)].filter(Boolean), mcq3:[m,mcq3(b)], truefalse:[tf(b)], cloze1:[cloze(b)].filter(Boolean), method:[method(b)].filter(Boolean) }; }
const files=fs.readdirSync(IN).filter(f=>f.endsWith(".jsonl"));
if(!files.length){ console.error("✗ data/cards_duo/*.jsonl が見つかりません"); process.exit(1); }
for(const f of files){
  const unitId = path.basename(f, ".jsonl") + ".u1";
  const dir = path.join(OUT, unitId); fs.mkdirSync(dir,{recursive:true});
  const rows=readJsonl(path.join(IN,f)).map(norm);
  const terms=rows.filter(r=>r.label==="用語").slice(0,2);
  const bases=rows.filter(r=>r.label!=="用語");
  const pool={ab:[],mcq3:[],truefalse:[],cloze1:[],method:[]};
  for(const b of bases){ const v=variants(b); for(const k of Object.keys(pool)) pool[k].push(...(v[k]||[])); }
  for(const k of Object.keys(pool)) pool[k]=shuffle(pool[k]);
  const take=(typ)=>{ if(pool[typ].length) return pool[typ].shift(); if((typ==="cloze1"||typ==="method")&&pool.mcq3.length) return pool.mcq3.shift(); const any=["mcq3","ab","truefalse","cloze1","method"].find(k=>pool[k].length); return any?pool[any].shift():null; };
  // NODES×LESSONS 生成（N1L1のみ用語2を先頭に含む）
  for(let ni=1; ni<=NODES; ni++){
    for(let li=1; li<=LESSONS; li++){
      const out=[]; if(ni===1 && li===1 && terms.length){ out.push(...terms); }
      let oi=0; while(out.length<SIZE){ const want=ORDER[oi%ORDER.length]; const got=take(want); if(!got) break; out.push(got); oi++; }
      const fp=path.join(dir, `n${String(ni).padStart(2,"0")}_l${String(li).padStart(2,"00")}.jsonl`);
      fs.writeFileSync(fp, out.slice(0,SIZE).map(o=>JSON.stringify(o)).join("\n")+"\n","utf8");
    }
  }
  console.log(`✓ ${unitId}: ${NODES} nodes × ${LESSONS} lessons 出力`);
}
