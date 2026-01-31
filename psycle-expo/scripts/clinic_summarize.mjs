import fs from "fs"; import path from "path";

/** --- 変換規則（表示最適化） --- **/
const MAX_STEM = 22;         // 質問見出しは全角22文字以内
const MAX_CHOICE = 20;       // 選択肢は全角20文字以内（2行想定）
const REPL = [
  [/統計的に有意/g, "有意"],
  [/(大幅に|著しく)/g, "大"],
  [/増加/g, "↑"], [/上昇/g,"↑"], [/改善/g,"↑"],
  [/減少/g, "↓"], [/低下/g,"↓"],
  [/主観的幸福/g, "幸福"], [/ウェルビーイング/g,"幸福"],
  [/表出抑制/g, "抑制"], [/認知的再評価/g, "再評価"],
  [/\(\s*p\s*[<≤]\s*0\.0*5\s*\)/gi, "p<.05"],
  [/この研究は.*?(目的|でした)。?/g, ""],
  [/^年齢や学歴を調整した後、/g, ""],
  [/^[ 　]+/gm, ""]
];

const keepNums = s => (s||"").match(/[-+]?\d+(\.\d+)?/g)||[];
const trim = (s, n) => {
  if(!s) return "";
  let t=s.replace(/\s+/g," ").trim();
  for(const [a,b] of REPL) t=t.replace(a,b);
  // 記号を活かして短縮
  if(t.length>n){
    // 数値と↑↓があればそれを優先表示
    const nums = keepNums(t).slice(0,3).join("・");
    const dir  = /↑|↓/.test(t) ? t.match(/↑|↓/g).join("") : "";
    const core = t.replace(/[（）\(\)［\]「」【】]/g,"");
    t = (core.slice(0,n- (nums?nums.length+1:0) - dir.length)).trim();
    if(nums) t += " " + nums;
    if(dir)  t += " " + dir;
  }
  return t;
};

// 選択肢を短文化して長さ差を均す
function compressChoices(arr){
  const out = arr.map(x => trim(x, MAX_CHOICE));
  const len = out.map(s=>s.length);
  const max = Math.max(...len), min = Math.min(...len);
  if(max>0 && min>0 && max/min>1.7){
    // 一番長いものをさらに詰める
    const i = len.indexOf(max);
    out[i] = trim(out[i], Math.ceil(min*1.4));
  }
  return out;
}

function fixOne(q){
  const t = q.type;
  // stem補完
  if(!q.stem || q.stem.trim()==="" || q.stem==="質問文なし"){
    if(t==="ab") q.stem = "どっち？";
    else if(t==="truefalse") q.stem = "正しい？";
    else if(t==="method") q.stem = "この研究はどれ？";
    else q.stem = "正しいのはどれ？";
  }
  q.stem = trim(q.stem, MAX_STEM);

  // 選択肢処理（選ぶ系のみ）
  if(Array.isArray(q.choices) && q.choices.length){
    q.choices = compressChoices(q.choices);
    // 正解indexのfallback
    if(!Number.isInteger(q.answer_index)) q.answer_index = (q.correct_index ?? 0);
    // 2択の左右バランス
    if(t==="ab" && q.choices.length!==2){
      q.choices = q.choices.slice(0,2);
      if(q.answer_index>1) q.answer_index = 0;
    }
    // 3択正規化
    if(t==="mcq3" && q.choices.length<3){
      while(q.choices.length<3) q.choices.push("—");
    }
  }

  // infoを一行チップに
  if(q.info){
    let chip = q.info;
    chip = chip.replace(/\s+/g," ")
               .replace(/(RCT|縦断|横断|準実験).*/,"$1")
               .replace(/.*?(RCT|縦断|横断|準実験)/,"$1");
    q.info_chip = trim(chip, 10); // 表示用
  }
  return q;
}

function processFile(inFp, outFp){
  const rows = fs.readFileSync(inFp,"utf8").split("\n").filter(Boolean).map(l=>JSON.parse(l));
  let arr = rows.map(fixOne);
  // 15問に正規化（不足は先頭から補完、過多は切り詰め）
  if(arr.length<15){ arr = arr.concat(arr.slice(0, 15-arr.length)); }
  if(arr.length>15){ arr = arr.slice(0,15); }
  fs.writeFileSync(outFp, arr.map(o=>JSON.stringify(o)).join("\n")+"\n","utf8");
  const kinds=[...new Set(arr.map(x=>x.type))].join(",");
  console.log(`✓ ${path.basename(outFp)}  ${arr.length}問  種類:${kinds}`);
}

function main(){
  const IN = process.argv[2], OUT = process.argv[3];
  if(!fs.existsSync(IN)){ console.error("✗ 入力ディレクトリがありません:", IN); process.exit(1); }
  fs.mkdirSync(OUT,{recursive:true});
  const files = fs.readdirSync(IN).filter(f=>f.endsWith(".jsonl"));
  if(files.length===0){
    // units_out の n??_l??.jsonl 形式に対応
    const dirs = fs.readdirSync(IN).filter(d=>fs.statSync(path.join(IN,d)).isDirectory());
    for(const d of dirs){
      const fs2 = fs.readdirSync(path.join(IN,d)).filter(f=>/^n\d{2}_l\d{2}\.jsonl$/.test(f));
      for(const f of fs2){
        processFile(path.join(IN,d,f), path.join(OUT, `${d}_${f}`));
      }
    }
    return;
  }
  for(const f of files){
    processFile(path.join(IN,f), path.join(OUT,f));
  }
}
main();
