import fs from "fs";
import path from "path";

const LESSONS_DIR = "data/lessons";
const OUT_PATH = "data/path/path.json";

// エナジー仕様
const ENERGY = {
  max: 25,
  regen_ms: 60 * 60 * 1000,
  streak_bonuses: { "5": 1, "10": 3 },
  perfect_bonus: 5,
  cost_per_answer: 1
};

// 既存のレッスンファイルをスキャン
function scanLessons() {
  if (!fs.existsSync(LESSONS_DIR)) {
    console.error("✗ data/lessons が見つかりません");
    process.exit(1);
  }
  
  const units = new Map();
  const files = fs.readdirSync(LESSONS_DIR).filter(f => f.endsWith("_manual.json"));
  
  for (const f of files) {
    const match = f.match(/^(\w+)_l(\d+)_manual\.json$/);
    if (!match) continue;
    
    const unitName = match[1];
    const lessonNum = match[2];
    const filePath = path.join(LESSONS_DIR, f);
    
    if (!units.has(unitName)) {
      units.set(unitName, []);
    }
    units.get(unitName).push({ lesson: lessonNum, file: filePath });
  }
  
  return units;
}

// ユニット名→日本語タイトル
function getUnitTitle(unit) {
  const titles = {
    mental: "メンタルヘルス",
    money: "お金の心理学",
    work: "仕事とキャリア",
    health: "健康行動",
    social: "人間関係",
    study: "学習と記憶"
  };
  return titles[unit] || unit;
}

function buildPath() {
  const unitsMap = scanLessons();
  
  if (unitsMap.size === 0) {
    console.error("✗ *_manual.json ファイルが見つかりません");
    process.exit(1);
  }
  
  // セクションを構成（現在は1つのセクションに全ユニット）
  const units = [];
  for (const [unitName, lessons] of unitsMap) {
    lessons.sort((a, b) => a.lesson.localeCompare(b.lesson));
    
    const nodes = lessons.map((l, i) => ({
      node_id: `n${String(i + 1).padStart(2, "0")}`,
      lessons: [l.file]
    }));
    
    units.push({
      unit_id: unitName,
      title: getUnitTitle(unitName),
      context: unitName,
      lesson_size: 15,
      lessons_per_node: lessons.length,
      nodes
    });
  }
  
  const sections = [{
    id: "main.core",
    title: "心理学の基礎",
    units
  }];
  
  const payload = { version: "1.0", energy: ENERGY, sections };
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2) + "\n", "utf8");
  
  console.log(`✓ path.json 生成完了`);
  console.log(`- Sections: ${sections.length}`);
  console.log(`- Units: ${units.length}`);
  console.log(`- Total lessons: ${units.reduce((sum, u) => sum + u.nodes.length, 0)}`);
  console.log(`→ 出力: ${OUT_PATH}`);
}

buildPath();
