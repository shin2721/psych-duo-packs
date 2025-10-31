import fs from "fs";
import path from "path";

// ==== 可変パラメタ ==== //
const LESSON_SIZE  = Number(process.env.LESSON_SIZE  || 15);
const LESSON_COUNT = Number(process.env.LESSON_COUNT || 6);
const IN_DIR  = process.argv[2] || "data/cards_duo";
const OUT_DIR = process.argv[3] || "data/lessons_variety";

// L1・Lxの配分
const QUOTA = {
  L1: { term:2, ab:4, mcq3:4, truefalse:2, clozeN:1, method:1 },
  Lx: { term:0, ab:4, mcq3:4, truefalse:2, rank:1, categorize:1, highlight:1, clozeN:1, method:1 }
};

const readJsonl = fp => fs.readFileSync(fp,"utf8").split("\n").filter(Boolean).map((l,i)=>{
  try{ return JSON.parse(l); }catch{ return { id:"bad_"+i, label:"研究", type:"mcq3", stem:String(l), choices:[], answer_index:0 }; }
});

const writeJsonl= (fp,a)=>{ fs.writeFileSync(fp, a.map(o=>JSON.stringify(o)).join("\n")+"\n","utf8"); };

const shuffle = a => { for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; };

const cut=(s,n)=> (s && s.length>n ? s.slice(0,n)+"…" : (s||""));

function norm(rec){
  const id = String(rec.id || rec.source_id || Math.random().toString(36).slice(2));
  return {
    id, label: rec.label || "研究", type: rec.type || "mcq3",
    intro: rec.intro || "", info: rec.info || "", snack: rec.snack || "",
    stem: rec.stem || rec.question || "正しいのはどれ？",
    choices: Array.isArray(rec.choices) ? rec.choices.slice() : [],
    answer_index: Number.isInteger(rec.answer_index) ? rec.answer_index : 0
  };
}

function mcq3(b){ const cs=b.choices.slice(0,3); while(cs.length<3) cs.push("—"); return {...b,type:"mcq3",stem:"正しいのはどれ？",choices:cs,answer_index:Math.min(b.answer_index,2)}; }
function ab(b,alt=false){ const cs=b.choices; if(cs.length<2) return null; const ai=Math.min(b.answer_index,cs.length-1); const w=cs.map((t,i)=>({t,i})).filter(x=>x.i!==ai); const pick=alt && w[1]?w[1].t:(w[0]?.t??cs[0]); return {...b,type:"ab",stem:"どっち？",choices:[cs[ai],pick],answer_index:0}; }
function tf(b){ const st=b.choices?.[b.answer_index] || b.stem || "これは正しい？"; return {...b,type:"truefalse",stem:st,choices:["正しい","誤り"],answer_index:0}; }
function cloze1(b){ const corr=(b.choices?.[b.answer_index]||""); if(!corr) return null; const dict=["見方を変える","ガマン","しあわせ"]; let stem=corr; const key=dict.find(k=>stem.includes(k)); if(!key) return null; stem = stem.replace(key, "［　］"); return {...b,type:"cloze1",stem:cut(stem,40),choices:[key,...dict.filter(x=>x!==key).slice(0,2)],answer_index:0}; }
function method(b){ const info=b.info||""; const opts=["横断","縦断","RCT","メタ分析"]; const has=opts.find(o=>info.includes(o)); if(!has) return null; return {...b,type:"method",stem:"この研究はどれ？",choices:[has,...opts.filter(x=>x!==has)].slice(0,3),answer_index:0}; }

function deriveBaseVariants(base){
  return {
    ab:[ab(base,false),ab(base,true)].filter(Boolean),
    mcq3:[mcq3(base)],
    truefalse:[tf(base)],
    cloze1:[cloze1(base)].filter(Boolean),
    method:[method(base)].filter(Boolean)
  };
}

const LEX = { reapp: "見方を変える", suppr: "表情を隠す", gratitude: "感謝を書く", rumination: "反すう", happy: "しあわせ", calm: "落ち着き" };

function genRank(){ const items = [LEX.reapp, LEX.gratitude, LEX.suppr, LEX.rumination]; return { id: "rank_"+Math.random().toString(36).slice(2), type: "rank", prompt: "幸福への影響が強い順に並べてください（強→弱）", items: shuffle(items.slice()), answer_order: [LEX.reapp, LEX.gratitude, LEX.suppr, LEX.rumination], info: "総説｜主観的幸福｜一般成人" }; }

function genCategorize(){ const tokens = [LEX.reapp, LEX.suppr, "深呼吸", LEX.rumination, "ポストイットで計画", "ポジティブ日記"]; const key = {}; for(const t of tokens){ key[t] = (t===LEX.reapp || t==="ポジティブ日記") ? "再評価/ポジ" : (t===LEX.suppr) ? "抑制" : (t===LEX.rumination) ? "その他(反すう)" : "その他"; } return { id: "cat_"+Math.random().toString(36).slice(2), type: "categorize", prompt: "文例を分類してください", buckets: ["再評価/ポジ","抑制","その他(反すう/他)"], tokens, key, info: "概念分類｜再評価/抑制/その他" }; }

function genHighlight(){ const tokens = ["希望者割付","待機群","前後比較","ランダム","追跡2年"]; const keyIndices = [0,1,2]; return { id: "hl_"+Math.random().toString(36).slice(2), type: "highlight", prompt: "設計を示す手がかりをすべて選んでください（準実験）", tokens, keyIndices, info: "記述読解｜準実験の根拠" }; }

function genClozeN(){ return { id: "clozeN_"+Math.random().toString(36).slice(2), type: "clozeN", text: "［1］が多いほど、**［2］**が上がる傾向がある。", bank: [LEX.reapp, LEX.suppr, LEX.happy], key: { "1": LEX.reapp, "2": LEX.happy }, info: "横断｜n=800+｜成人｜方向=正" }; }

function genMethod(){ const opts = ["横断", "縦断", "RCT", "メタ分析"]; const answer = opts[Math.floor(Math.random() * opts.length)]; const choices = shuffle([answer, ...opts.filter(x=>x!==answer)]).slice(0,3); return { id: "method_"+Math.random().toString(36).slice(2), type: "method", stem: "この研究はどれ？", choices, answer_index: choices.indexOf(answer), info: "研究手法の分類問題" }; }

function genNonMcqPack(){ const out = []; out.push(genRank()); out.push(genCategorize()); out.push(genHighlight()); out.push(genClozeN()); out.push(genMethod()); return shuffle(out); }

function take(pool, typ){ if(pool[typ]?.length) return pool[typ].shift(); return null; }

function fillLesson(pool, quota, isL1, termCards){
  const out = [];

  // Step 1: 用語カードを追加 (L1のみ)
  if(isL1 && quota.term>0 && termCards.length) {
    out.push(...termCards.slice(0, Math.min(quota.term, termCards.length)));
  }

  // Step 2: 必要な問題タイプのリストを作成
  const wants = [];
  for(const [k, n] of Object.entries(quota)){
    if(k==="term") continue;
    for(let i=0;i<n;i++) wants.push(k);
  }

  // Step 3: 新形式 (rank/categorize/highlight/clozeN/method) を生成して埋める
  const nonPack = genNonMcqPack();
  const usedNonMcq = new Set();

  for(let i=wants.length-1; i>=0; i--){
    const typ = wants[i];
    if(["rank","categorize","highlight","clozeN","method"].includes(typ)){
      let item = nonPack.find(x=>x.type===typ && !usedNonMcq.has(x.id));
      if(item){
        out.push(item);
        usedNonMcq.add(item.id);
        wants.splice(i,1);
      }
    }
  }

  // Step 4: 既存プールから必要な数だけ取得
  for(const typ of wants){
    const got = take(pool, typ);
    if(got) out.push(got);
  }

  // 最終: シャッフルして返す（パディングなし）
  return shuffle(out);
}

function buildOneFile(inPath){
  const name = path.basename(inPath, ".jsonl");
  const rows = readJsonl(inPath).map(norm);
  const terms = rows.filter(r=>r.label==="用語").slice(0,2);
  const bases = rows.filter(r=>r.label!=="用語");

  const pool = { ab:[], mcq3:[], truefalse:[], cloze1:[], method:[] };
  for(const b of bases){
    const v = deriveBaseVariants(b);
    for(const k of Object.keys(pool)) pool[k].push(...(v[k]||[]));
  }
  for(const k of Object.keys(pool)) pool[k] = shuffle(pool[k]);

  const lessons = [];
  for(let li=1; li<=LESSON_COUNT; li++){
    const isL1 = (li===1);
    const q = isL1 ? QUOTA.L1 : QUOTA.Lx;
    const arr = fillLesson(pool, q, isL1, terms);
    lessons.push(arr);
  }

  const base = path.join(OUT_DIR, name);
  fs.mkdirSync(OUT_DIR, {recursive:true});
  lessons.forEach((arr, i)=>{
    const fp = base + "_l0" + (i+1) + ".jsonl";
    writeJsonl(fp, arr);
    const termN = arr.filter(x=>x.label==="用語").length;
    const kinds = new Map();
    arr.forEach(x=>kinds.set(x.type,1));
    const kindsList = [...kinds.keys()].join(",");
    console.log("✓ " + path.basename(fp) + " → " + arr.length + "問（用語" + termN + "） 種類:" + kindsList);
  });
}

function main(){
  if(!fs.existsSync(IN_DIR)){ console.error("✗ 入力ディレクトリがありません:", IN_DIR); process.exit(1); }
  const files = fs.readdirSync(IN_DIR).filter(f=>f.endsWith(".jsonl"));
  if(files.length===0){ console.error("✗ 入力がありません: "+IN_DIR+"/*.jsonl"); process.exit(1); }
  if(!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, {recursive:true});
  for(const f of files) buildOneFile(path.join(IN_DIR, f));
}

main();
