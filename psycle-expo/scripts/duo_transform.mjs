import fs from "fs";
import path from "path";

const INPUT_DIR = process.argv[2] || "data/questions";
const OUTPUT_DIR = process.argv[3] || "data/cards_duo";
const SOURCES_PATH = process.argv[4] || "sources.json";

// 軽量リプレース（研究→日常語）
const jpMap = [
  [/認知的再評価/g, "見方を変える"],
  [/再評価/g, "見方を変える"],
  [/表出抑制|感情抑制|抑制/g, "ガマンして隠す"],
  [/幸福度|ウェルビーイング|幸福/g, "しあわせ度"],
  [/正の影響/g, "↑"],
  [/負の影響/g, "↓"]
];

// 文字数制御
const cut = (s, n) => (s && s.length > n ? s.slice(0, n).trim() + "…" : s || "");

// ソース情報（著者(年)｜対象｜設計）を 1 行に
function loadSourcesMap(p) {
  try {
    const raw = fs.readFileSync(p, "utf8");
    const obj = JSON.parse(raw);
    const arr = Array.isArray(obj) ? obj : (Array.isArray(obj.sources) ? obj.sources : []);
    const map = new Map();
    for (const it of arr) {
      const id = it.id || it.source_id || it.uid;
      if (!id) continue;
      const author =
        it.authors?.[0]?.last ||
        it.authors?.[0]?.family ||
        it.author ||
        (typeof it.authors === "string" ? it.authors.split(",")[0] : "");
      const year = it.year || it.pub_year || it.date?.match(/\d{4}/)?.[0] || "";
      const n =
        it.sample_size || it.n || it.N || (it.participants && Number(it.participants)) || "";
      const design =
        it.design || it.method || it.study_design || it.type || "";
      const info =
        [author ? `${author}(${year || "年不明"})` : (year ? `(${year})` : "出典"),
         n ? `対象${n}` : null,
         design || null].filter(Boolean).join("｜");
      map.set(String(id), info);
    }
    return map;
  } catch {
    return new Map();
  }
}

const sourcesMap = loadSourcesMap(SOURCES_PATH);

// 専門用語の定義カード
const termCards = {
  mental: [
    {
      term: "認知的再評価",
      meaning: "見方を変えて考え直すこと",
      example: "失敗を「成長のチャンス」と捉える",
      distractors: ["感情をガマンして隠す", "深呼吸してリラックスする"]
    },
    {
      term: "表出抑制",
      meaning: "感情をガマンして隠すこと",
      example: "怒りを感じても顔に出さない",
      distractors: ["見方を変えて考え直す", "感情を言葉で表現する"]
    }
  ],
  work: [
    {
      term: "バーンアウト",
      meaning: "燃え尽き症候群。疲れ果てた状態",
      example: "仕事のやる気が全く出ない",
      distractors: ["仕事に夢中になること", "昇進すること"]
    }
  ],
  health: [
    {
      term: "心拍変動",
      meaning: "心臓の鼓動の間隔の変化",
      example: "リラックスすると変動が大きくなる",
      distractors: ["心臓の音の大きさ", "1分間の心拍数"]
    }
  ],
  study: [
    {
      term: "分散学習",
      meaning: "時間を空けて繰り返し学ぶ方法",
      example: "毎日30分ずつ勉強する",
      distractors: ["一夜漬けで集中して学ぶ", "場所を変えて学ぶ"]
    }
  ],
  money: [],
  social: []
};

// 用語カードを生成
function makeTermCard(term, meaning, example, distractors, idx) {
  return {
    id: `term_${term}`,
    label: "用語",
    intro: `「${term}」って何？`,
    snack: `覚えよう: ${meaning}`,
    info: "基本用語",
    type: "mcq3",
    stem: `「${term}」の意味は？`,
    choices: [meaning, ...distractors].slice(0, 3),
    answer_index: 0
  };
}

// intro の自動生成（超簡易）
function makeIntro(rec) {
  const base = [rec.title, rec.abstract, rec.stem].filter(Boolean).join(" ");
  let s = "このテーマ、どれが正しい？";
  if (/再評価|抑制|幸福|しあわせ/.test(base)) {
    s = "気持ちの向き合い方、どれが幸せ↑？";
  } else if (/ストレス|不安|うつ|抑うつ/.test(base)) {
    s = "ストレスとの付き合い方、どれが良い？";
  } else if (/睡眠/.test(base)) {
    s = "ねむりのコツ、どれが正しい？";
  }
  // 日常語置換
  for (const [re, rep] of jpMap) s = s.replace(re, rep);
  return cut(s, 28);
}

// スナック解説（rationale→短縮／無ければ定型）
function makeSnack(rec) {
  let s = rec.rationale || rec.explanation || "";
  if (!s) s = "ポイントは↑/↓の方向。くわしくは(i)。";
  for (const [re, rep] of jpMap) s = s.replace(re, rep);
  return cut(s, 30);
}

// info
function makeInfo(rec) {
  const id = String(rec.source_id || rec.sourceId || rec.id || "");
  const info = (id && sourcesMap.get(id)) || rec.info || "";
  return cut(info || "出典あり（i）", 48);
}

// 選択肢の整形（ひらがな多め推奨はここで軽く置換）
function normalizeChoice(c) {
  if (!c) return "";
  // choices が {text: "...", is_correct: bool} 形式の場合
  let s = typeof c === "object" && c.text ? c.text : String(c);
  for (const [re, rep] of jpMap) s = s.replace(re, rep);
  return s; // 選択肢は全文表示
}

// 型決め（6枚ユニットの並び）
function decideType(idx, hasMethod) {
  const order = ["ab", "mcq3", "truefalse", "mcq3", hasMethod ? "rank3" : "mcq3", hasMethod ? "method" : "mcq3"];
  return order[idx % order.length];
}

// true/false 生成（適切に作れない場合は mcq3 にフォールバック）
function buildTrueFalse(rec) {
  const correct = rec.choices?.[rec.answer_index];
  if (!correct) return null;
  // 「〜である。」に寄せる（無理ならそのまま）
  return {
    type: "truefalse",
    stem: "正しい？",
    choices: ["正しい", "誤り"],
    answer_index: 0, // 正をデフォルト
    // ヒューリスティック：逆向きを見つけたら誤へ
    ...( /↓/.test(correct) && !/↑/.test(correct) ? { answer_index: 1 } : {} )
  };
}

// A/B 二択（簡潔な比較用に変換）
function buildAB(rec) {
  const cs = (rec.choices || []).map(normalizeChoice).filter(Boolean);
  const ai = Number.isInteger(rec.answer_index) ? rec.answer_index : 0;
  if (cs.length < 2) return null;

  // 選択肢が長すぎる場合（60文字以上）または研究文脈を含む場合はAB問題にしない
  const correct = cs[ai] || "";
  if (correct.length > 60 ||
      /研究|調査|分析|明らかに|示され|目的|質問/.test(correct)) {
    return null;
  }

  // 正解＋最も短い誤答を採用（60文字以内、研究文脈を含まない）
  const wrongs = cs.map((t,i)=>({t,i}))
    .filter(x=>x.i!==ai && x.t.length <= 60 && !/研究|調査|分析|明らかに|示され|目的|質問/.test(x.t))
    .sort((a,b)=>a.t.length-b.t.length);
  if (!wrongs.length) return null;

  return {
    type: "ab",
    stem: "どっち？",
    choices: [cs[ai], wrongs[0].t],
    answer_index: 0
  };
}

// rank3（強→弱）: choicesから3つ選ぶ（正解→影響なし→負などのヒューリスティックが必要だが、無理ならmcq3へ）
function buildRank3(rec) {
  const cs = (rec.choices || []).map(normalizeChoice).filter(Boolean);
  if (cs.length < 3) return null;
  // 短い上位3つ
  const take = cs.slice(0,3);
  return {
    type: "rank3",
    stem: "強い→弱いに並べる",
    choices: take,
    // 並べ替え回答はクライアントで評価する想定（ここではダミー）
    answer_index: 0
  };
}

// method（設計あて）: infoから設計語を拾う
function buildMethod(rec) {
  const info = makeInfo(rec);
  const opts = ["横断", "縦断", "RCT", "メタ分析"];
  const has = opts.find(o => info.includes(o));
  if (!has) return null;
  const all = opts.slice();
  // 正解は最初に
  const choices = [has, ...all.filter(x=>x!==has)].slice(0,3);
  return {
    type: "method",
    stem: "この研究はどれ？",
    choices,
    answer_index: 0
  };
}

function toDuo(record, idx) {
  const base = {
    id: String(record.id || record.source_id || `q_${idx}`),
    label: "きょうのポイント",
    intro: makeIntro(record),
    snack: makeSnack(record),
    info: makeInfo(record)
  };

  // デフォルトは MCQ3
  const mcq = {
    type: "mcq3",
    stem: "正しいのはどれ？",
    choices: (record.choices || []).map(normalizeChoice).slice(0,3),
    answer_index: Math.min(
      Number.isInteger(record.answer_index) ? record.answer_index : 0,
      2
    )
  };

  const hasMethod = /横断|縦断|RCT|メタ/.test(base.info);
  const t = decideType(idx, hasMethod);

  let built = null;
  if (t === "ab") built = buildAB(record);
  if (t === "truefalse") built = buildTrueFalse(record);
  if (t === "rank3") built = buildRank3(record);
  if (t === "method") built = buildMethod(record);

  const card = { ...base, ...(built || mcq) };

  // 最後に文字数ガード（画面合計≦120字目安）
  const totalLen =
    (card.label?.length||0)+(card.intro?.length||0)+(card.stem?.length||0)+
    (card.choices?.join("").length||0);
  if (totalLen > 120 && card.type !== "ab") {
    // きつければ MCQ3 に落として短縮
    card.type = "mcq3";
    card.stem = "正しいのはどれ？";
    card.choices = (record.choices || []).map(normalizeChoice).slice(0,3);
    card.answer_index = Math.min(
      Number.isInteger(record.answer_index) ? record.answer_index : 0,
      (card.choices.length||1)-1
    );
  }
  return card;
}

function readJsonl(fp) {
  const text = fs.readFileSync(fp, "utf8");
  return text.split("\n").filter(Boolean).map((l,i)=>{
    try { return JSON.parse(l); }
    catch { return { id:`bad_${i}`, stem:l, choices:[], answer_index:0 }; }
  });
}

function writeJsonl(fp, arr) {
  fs.writeFileSync(fp, arr.map(o=>JSON.stringify(o)).join("\n")+"\n", "utf8");
}

function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const files = fs.readdirSync(INPUT_DIR).filter(f=>f.endsWith(".jsonl"));
  if (files.length === 0) {
    console.error(`入力がありません: ${INPUT_DIR}/*.jsonl`);
    process.exit(1);
  }
  for (const f of files) {
    const inPath = path.join(INPUT_DIR, f);
    const outPath = path.join(OUTPUT_DIR, f);
    const rows = readJsonl(inPath);
    const duo = rows.map((r,i)=>toDuo(r,i));

    // 用語カードをユニットの最初に追加
    const unitName = f.replace('.jsonl', '');
    const terms = termCards[unitName] || [];
    const termCardList = terms.map((t, i) =>
      makeTermCard(t.term, t.meaning, t.example, t.distractors, i)
    );
    const allCards = [...termCardList, ...duo];

    writeJsonl(outPath, allCards);
    console.log(`✓ ${f} → ${outPath} （${allCards.length}枚: 用語${termCardList.length}枚 + 研究${duo.length}枚）`);
  }
}
main();
