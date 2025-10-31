import fs from 'fs/promises';

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const CROSSREF_BASE = 'https://api.crossref.org/works';
const DELAY_MS = 350; // Rate limiting

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchPubMedAbstract(pmid) {
  const url = `${PUBMED_BASE}/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml&rettype=abstract`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const xml = await response.text();

    // Extract AbstractText
    const abstractMatch = xml.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/);
    if (!abstractMatch) return null;

    // Clean HTML tags
    const abstract = abstractMatch[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();

    return abstract.length > 50 ? abstract : null;
  } catch (error) {
    console.error(`  ❌ PubMed error for ${pmid}:`, error.message);
    return null;
  }
}

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
    console.error(`  ❌ Crossref error for ${doi}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('=== 要約なし論文の要約取得開始 ===\n');

  // Load sources
  const sources = JSON.parse(await fs.readFile('data/sources.json', 'utf8'));

  // Filter sources without abstracts
  const missing = sources.filter(s => !s.abstract || s.abstract.trim().length === 0);

  console.log(`要約なし論文: ${missing.length}件`);
  console.log(`推定所要時間: 約${Math.round(missing.length * 0.7 / 60)}分\n`);

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < missing.length; i++) {
    const source = missing[i];
    const progress = `[${i + 1}/${missing.length}]`;

    console.log(`${progress} ${source.id}`);

    let abstract = null;

    // Try PubMed first (faster and more reliable)
    if (source.pmid) {
      console.log(`  🔍 PubMed (${source.pmid})...`);
      abstract = await fetchPubMedAbstract(source.pmid);
      await sleep(DELAY_MS);
    }

    // Try Crossref if PubMed failed
    if (!abstract && source.doi) {
      console.log(`  🔍 Crossref (${source.doi})...`);
      abstract = await fetchCrossrefAbstract(source.doi);
      await sleep(DELAY_MS);
    }

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
  console.log(`成功率: ${Math.round(updated / missing.length * 100)}%`);

  const finalWithAbstract = sources.filter(s => s.abstract && s.abstract.trim().length > 0).length;
  console.log(`\n最終統計:`);
  console.log(`  総数: ${sources.length}件`);
  console.log(`  要約あり: ${finalWithAbstract}件 (${Math.round(finalWithAbstract/sources.length*100)}%)`);
}

main().catch(console.error);
