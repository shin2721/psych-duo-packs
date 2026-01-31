import fs from 'fs/promises';

const CROSSREF_BASE = 'https://api.crossref.org/works';
const DELAY_MS = 350;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchCrossrefAbstract(doi) {
  const encodedDoi = encodeURIComponent(doi);
  const url = `${CROSSREF_BASE}/${encodedDoi}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const abstract = data.message?.abstract;

    if (!abstract) return null;

    // Clean JATS XML tags if present
    const cleaned = abstract
      .replace(/<jats:p[^>]*>/g, '')
      .replace(/<\/jats:p>/g, '')
      .replace(/<[^>]+>/g, '')
      .trim();

    return cleaned.length > 50 ? cleaned : null;
  } catch (error) {
    console.error(`  ❌ Crossref error:`, error.message);
    return null;
  }
}

async function main() {
  console.log('=== DOIのみの論文から要約取得 ===\n');

  const sources = JSON.parse(await fs.readFile('data/sources.json', 'utf8'));

  // Filter: DOIのみ (PMIDなし、要約なし、Supplementalでない)
  const doiOnly = sources.filter(s =>
    s.doi &&
    !s.pmid &&
    (!s.abstract || s.abstract.trim().length === 0) &&
    !s.title.includes('Supplemental Material')
  );

  console.log(`対象論文: ${doiOnly.length}件`);
  console.log(`推定所要時間: 約${Math.round(doiOnly.length * 0.35 / 60)}分\n`);

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < doiOnly.length; i++) {
    const source = doiOnly[i];
    const progress = `[${i + 1}/${doiOnly.length}]`;

    console.log(`${progress} ${source.title.substring(0, 60)}...`);
    console.log(`  🔍 DOI: ${source.doi}`);

    const abstract = await fetchCrossrefAbstract(source.doi);
    await sleep(DELAY_MS);

    if (abstract) {
      source.abstract = abstract;
      updated++;
      console.log(`  ✅ 取得成功 (${abstract.length}文字)`);
    } else {
      failed++;
      console.log(`  ⚠️  要約なし`);
    }

    // Save progress every 50 items
    if ((i + 1) % 50 === 0) {
      await fs.writeFile('data/sources.json', JSON.stringify(sources, null, 2));
      console.log(`\n💾 進捗保存: ${updated}件取得, ${failed}件失敗\n`);
    }
  }

  // Final save
  await fs.writeFile('data/sources.json', JSON.stringify(sources, null, 2));

  console.log('\n=== 完了 ===');
  console.log(`取得成功: ${updated}件`);
  console.log(`取得失敗: ${failed}件`);
  console.log(`成功率: ${Math.round(updated / doiOnly.length * 100)}%`);

  const finalWithAbstract = sources.filter(s => s.abstract && s.abstract.trim().length > 0).length;
  console.log(`\n最終統計:`);
  console.log(`  総数: ${sources.length}件`);
  console.log(`  要約あり: ${finalWithAbstract}件 (${Math.round(finalWithAbstract/sources.length*100)}%)`);
}

main().catch(console.error);
