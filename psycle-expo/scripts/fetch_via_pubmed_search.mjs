import fs from 'fs/promises';

const PUBMED_SEARCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const PUBMED_FETCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
const DELAY_MS = 350;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function searchPubMedByTitle(title) {
  // タイトルをクリーンアップ
  const cleanTitle = title
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200); // 長すぎる場合は短縮

  const url = `${PUBMED_SEARCH}?db=pubmed&term=${encodeURIComponent(cleanTitle)}[Title]&retmode=json&retmax=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const pmids = data.esearchresult?.idlist || [];

    return pmids.length > 0 ? pmids[0] : null;
  } catch (error) {
    console.error(`  ❌ Search error:`, error.message);
    return null;
  }
}

async function fetchPubMedAbstract(pmid) {
  const url = `${PUBMED_FETCH}?db=pubmed&id=${pmid}&retmode=xml&rettype=abstract`;
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
    console.error(`  ❌ Fetch error for PMID ${pmid}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('=== PubMed検索による要約取得 ===\n');

  // Load sources
  const sources = JSON.parse(await fs.readFile('data/sources.json', 'utf8'));

  // Filter: 要約なし & PMIDなし (DOIのみ)
  const candidates = sources.filter(s =>
    (!s.abstract || s.abstract.trim().length === 0) &&
    !s.pmid &&
    s.doi
  );

  console.log(`対象論文: ${candidates.length}件`);
  console.log(`推定所要時間: 約${Math.round(candidates.length * 0.7 / 60)}分\n`);

  let foundPmid = 0;
  let gotAbstract = 0;
  let failed = 0;

  for (let i = 0; i < candidates.length; i++) {
    const source = candidates[i];
    const progress = `[${i + 1}/${candidates.length}]`;

    console.log(`${progress} ${source.title.substring(0, 60)}...`);

    // Search for PMID by title
    const pmid = await searchPubMedByTitle(source.title);
    await sleep(DELAY_MS);

    if (!pmid) {
      console.log(`  ⚠️  PubMedに見つからず`);
      failed++;
      continue;
    }

    foundPmid++;
    console.log(`  🔍 PMID: ${pmid}`);

    // Fetch abstract
    const abstract = await fetchPubMedAbstract(pmid);
    await sleep(DELAY_MS);

    if (abstract) {
      source.pmid = pmid;
      source.abstract = abstract;
      gotAbstract++;
      console.log(`  ✅ 要約取得成功 (${abstract.length}文字)`);
    } else {
      source.pmid = pmid; // PMIDは保存（要約なくても）
      console.log(`  ⚠️  PMIDあり・要約なし`);
      failed++;
    }

    // Save progress every 50 items
    if ((i + 1) % 50 === 0) {
      await fs.writeFile('data/sources.json', JSON.stringify(sources, null, 2));
      console.log(`\n💾 進捗保存: PMID ${foundPmid}件発見, 要約 ${gotAbstract}件取得\n`);
    }
  }

  // Final save
  await fs.writeFile('data/sources.json', JSON.stringify(sources, null, 2));

  console.log('\n=== 完了 ===');
  console.log(`PMID発見: ${foundPmid}件`);
  console.log(`要約取得成功: ${gotAbstract}件`);
  console.log(`失敗: ${failed}件`);
  console.log(`成功率: ${Math.round(gotAbstract / candidates.length * 100)}%`);

  const finalWithAbstract = sources.filter(s => s.abstract && s.abstract.trim().length > 0).length;
  console.log(`\n最終統計:`);
  console.log(`  総数: ${sources.length}件`);
  console.log(`  要約あり: ${finalWithAbstract}件 (${Math.round(finalWithAbstract/sources.length*100)}%)`);
}

main().catch(console.error);
