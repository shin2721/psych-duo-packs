import fs from "fs";
import path from "path";

const UNITS_DIR = "data/units_out";
const OUT_PATH = "data/path/path.json";
const RECIPES_DIR = "recipes";

const ENERGY = {
  max: Number(process.env.ENERGY_MAX || 25),
  regen_ms: Number(process.env.REGEN_MS || 3600000),
  streak_bonuses: {
    "5": Number(process.env.STREAK5 || 1),
    "10": Number(process.env.STREAK10 || 3)
  },
  perfect_bonus: Number(process.env.PERFECT || 5),
  cost_per_answer: 1
};

function scanUnits() {
  if (!fs.existsSync(UNITS_DIR)) return new Map();
  const dirs = fs.readdirSync(UNITS_DIR).filter(d => 
    fs.statSync(path.join(UNITS_DIR, d)).isDirectory()
  );
  
  const out = new Map();
  for (const u of dirs) {
    const udir = path.join(UNITS_DIR, u);
    const files = fs.readdirSync(udir).filter(f => /^n\d{2}_l\d{2}\.jsonl$/.test(f));
    
    if (!files.length) continue;
    
    const byNode = new Map();
    for (const f of files) {
      const m = f.match(/^n(\d{2})_l(\d{2})\.jsonl$/);
      if (!m) continue;
      const nodeId = "n" + m[1];
      const arr = byNode.get(nodeId) || [];
      arr.push(path.join(udir, f));
      byNode.set(nodeId, arr);
    }
    
    for (const [k, arr] of byNode) {
      arr.sort((a, b) => a.localeCompare(b));
      byNode.set(k, arr);
    }
    
    const nodes = [...byNode.keys()].sort().map(k => ({
      node_id: k,
      lessons: byNode.get(k)
    }));
    
    out.set(u, { unit_id: u, nodes });
  }
  
  return out;
}

function build() {
  const scanned = scanUnits();
  
  if (scanned.size === 0) {
    console.error("✗ data/units_out にユニットがありません");
    process.exit(1);
  }
  
  const sections = [{
    id: "main.auto",
    title: "心理学の基礎",
    units: [...scanned.values()].map(meta => ({
      ...meta,
      title: meta.unit_id.replace(".u1", ""),
      context: meta.unit_id.split(".")[0] || "general",
      lesson_size: Number(process.env.LESSON_SIZE || 15),
      lessons_per_node: meta.nodes[0]?.lessons?.length || 6
    }))
  }];
  
  const payload = { version: "1.0", energy: ENERGY, sections };
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2) + "\n", "utf8");
  
  let U = 0, N = 0, L = 0;
  for (const s of sections) {
    U += s.units.length;
    for (const u of s.units) {
      N += u.nodes.length;
      for (const n of u.nodes) L += n.lessons.length;
    }
  }
  
  console.log(`✓ path.json 生成: Sections=${sections.length}, Units=${U}, Nodes=${N}, Lessons=${L}`);
  console.log(`→ 出力: ${OUT_PATH}`);
}

build();
