import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const SOURCES_PATH = "data/sources.json";
const ROOT_DIR = "../"; // Relative to psycle-expo/scripts/
const TRACKS = ["mental", "work"];

async function processFile(filePath, sources) {
    console.log(`\n🎯 Processing: ${filePath}...`);
    try {
        const targetRaw = await readFile(filePath, "utf8");
        const targetData = JSON.parse(targetRaw);

        // Handle both array and object formats
        const cards = Array.isArray(targetData) ? targetData : (targetData.cards || []);

        if (cards.length === 0) {
            console.log("   ⚠️ No cards found.");
            return;
        }

        let matchCount = 0;

        for (const card of cards) {
            // Skip if already has a valid source_id (optional, but good for speed)
            // if (card.source_id && !card.source_id.startsWith("work_l")) continue; 

            // Extract keywords from explanation (e.g., 【Theory Name】)
            const explainText = card.explain || card.snack || card.info || "";
            const theoryMatch = explainText.match(/【(.*?)】/);
            const theory = theoryMatch ? theoryMatch[1] : "";

            // Also use keywords from the question itself
            const questionText = card.q || card.stem || card.question || "";
            if (!questionText) {
                console.log(`   ⚠️ Skipping card ${card.id}: No question text found.`);
                continue;
            }

            const keywords = [theory, ...questionText.split(/[\s,、。?？]+/)].filter(k => k && k.length > 1);

            // console.log(`   Question: "${card.q.substring(0, 20)}..." (Keywords: ${keywords.join(", ")})`);

            // Search for best matching paper
            let bestMatch = null;
            let bestScore = 0;

            // 0. Try to match by DOI or Title from 'info' field
            if (card.info) {
                const doiMatch = card.info.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
                if (doiMatch) {
                    const doi = doiMatch[0];
                    const sourceByDoi = sources.find(s => s.doi && s.doi.includes(doi));
                    if (sourceByDoi) {
                        // console.log(`     ✅ Found match by DOI: ${sourceByDoi.title.substring(0, 50)}...`);
                        card.source_id = sourceByDoi.id;
                        matchCount++;
                        continue; // Skip keyword search if DOI matched
                    }
                }
            }

            for (const source of sources) {
                let score = 0;
                const text = (source.title + " " + (source.abstract || "") + " " + (source.tags || []).join(" ") + " " + (source.type || "")).toLowerCase();

                const termMapping = {
                    "燃え尽き症候群": "burnout",
                    "認知負荷理論": "cognitive load",
                    "不確実性": "uncertainty",
                    "精緻化": "elaboration",
                    "リハーサル": "rehearsal",
                    "スモールステップ": "small step",
                    "自己効力感": "self-efficacy",
                    "ポモドーロ": "pomodoro",
                    "時間管理": "time management",
                    "ツァイガルニク": "Zeigarnik",
                    "アイゼンハワー": "Eisenhower",
                    "意思決定": "decision making",
                    "目標設定": "goal setting",
                    "先延ばし": "procrastination",
                    "責任の分散": "diffusion of responsibility",
                    "流暢性効果": "fluency",
                    "マジカルナンバー": "working memory",
                    "将来展望記憶": "prospective memory",
                    "境界条件": "common ground",
                    "トップダウン処理": "top-down processing",
                    "パーキンソンの法則": "time pressure",
                    "アンカリング": "anchoring",
                    "確証バイアス": "confirmation bias",
                    "正常性バイアス": "normalcy bias",
                    "サンクコスト": "sunk cost",
                    "現状維持バイアス": "status quo",
                    "バンドワゴン": "bandwagon",
                    "ハロー効果": "halo effect",
                    "フレーミング": "framing",
                    "損失回避": "loss aversion",
                    "利用可能性": "availability heuristic"
                };

                // 1. Search by Theory/Keywords
                for (const k of keywords) {
                    const engTerm = termMapping[k] || k;
                    if (text.includes(engTerm.toLowerCase())) {
                        score += 3; // High score for theory match
                    }
                }

                // 2. Fallback: Search by Context
                const contextTerms = {
                    "会議": "meeting",
                    "ミーティング": "meeting",
                    "メール": "email",
                    "メモ": "note",
                    "資料": "document",
                    "議事録": "minutes",
                    "TODO": "to-do",
                    "タスク": "task",
                    "ストレス": "stress",
                    "メンタル": "mental",
                    "健康": "health"
                };

                for (const [jp, eng] of Object.entries(contextTerms)) {
                    const qNorm = questionText.normalize('NFC');
                    const jpNorm = jp.normalize('NFC');

                    if (qNorm.includes(jpNorm)) {
                        if (text.includes(eng)) {
                            score += 1; // Low score for context match
                        }
                    }
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = source;
                }
            }

            if (bestMatch && bestScore > 0) {
                // console.log(`     ✅ Found match (Score: ${bestScore}): ${bestMatch.title.substring(0, 50)}...`);
                card.source_id = bestMatch.id || bestMatch.doi || bestMatch.pmid;
                matchCount++;
            }
        }

        console.log(`   📊 Matched ${matchCount}/${cards.length} questions.`);

        if (matchCount > 0) {
            // Preserve original structure
            const outputData = Array.isArray(targetData) ? cards : { ...targetData, cards };
            await writeFile(filePath, JSON.stringify(outputData, null, 2));
            console.log(`   💾 Updated ${filePath}`);
        }

    } catch (err) {
        console.error(`   ❌ Error processing ${filePath}: ${err.message}`);
    }
}

async function main() {
    // 1. Read Sources
    console.log("📚 Reading sources...");
    const sourcesRaw = await readFile(SOURCES_PATH, "utf8");
    const sources = JSON.parse(sourcesRaw);
    console.log(`   -> Loaded ${sources.length} sources.`);

    // 2. Iterate Tracks
    for (const track of TRACKS) {
        const trackDir = path.resolve(ROOT_DIR, track);
        console.log(`\n📂 Scanning track: ${track}...`);

        try {
            const files = await readdir(trackDir);
            const packFiles = files.filter(f => f.startsWith(`${track}_w`) && f.endsWith(".json"));

            for (const file of packFiles) {
                await processFile(path.join(trackDir, file), sources);
            }
        } catch (e) {
            console.error(`   ❌ Failed to scan dir ${trackDir}: ${e.message}`);
        }
    }
}

main().catch(console.error);

