// scripts/pmc_fetcher.mjs
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

/**
 * Fetch full-text XML from Europe PMC API
 * @param {string} pmcid - PMC ID (e.g., "PMC12513020")
 * @returns {Promise<string>} - XML content
 */
export async function fetchPMCFullText(pmcid) {
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/${pmcid}/fullTextXML`;

  try {
    const { stdout } = await execAsync(`curl -sL "${url}"`);

    if (!stdout || stdout.includes("404") || stdout.includes("error")) {
      throw new Error(`Failed to fetch PMC ${pmcid}`);
    }

    return stdout;
  } catch (error) {
    throw new Error(`PMC fetch error: ${error.message}`);
  }
}

/**
 * Parse JATS XML to extract sections and figures
 * @param {string} xml - JATS XML content
 * @returns {Object} - Parsed content with sections and figures
 */
export function parseJATSXML(xml) {
  const result = {
    title: "",
    abstract: "",
    sections: [],
    figures: [],
    tables: [],
  };

  // Extract title
  const titleMatch = xml.match(/<article-title>(.*?)<\/article-title>/s);
  if (titleMatch) {
    result.title = cleanText(titleMatch[1]);
  }

  // Extract abstract
  const abstractMatch = xml.match(/<abstract[^>]*>(.*?)<\/abstract>/s);
  if (abstractMatch) {
    result.abstract = extractText(abstractMatch[1]);
  }

  // Extract body sections (Background, Methods, Results, Discussion)
  const bodyMatch = xml.match(/<body>(.*?)<\/body>/s);
  if (bodyMatch) {
    const body = bodyMatch[1];

    // Extract all <sec> elements
    const secRegex = /<sec[^>]*>(.*?)<\/sec>/gs;
    let secMatch;
    let secIndex = 0;

    while ((secMatch = secRegex.exec(body)) !== null) {
      const secContent = secMatch[1];

      // Extract section title
      const titleMatch = secContent.match(/<title>(.*?)<\/title>/);
      const sectionTitle = titleMatch ? cleanText(titleMatch[1]) : `Section ${secIndex + 1}`;

      // Determine section type
      let sectionType = "other";
      if (/background|introduction/i.test(sectionTitle)) {
        sectionType = "background";
      } else if (/method|procedure|design/i.test(sectionTitle)) {
        sectionType = "methods";
      } else if (/result|finding/i.test(sectionTitle)) {
        sectionType = "results";
      } else if (/discussion|conclusion|limitation/i.test(sectionTitle)) {
        sectionType = "discussion";
      }

      // Extract paragraphs
      const paragraphs = extractParagraphs(secContent);

      result.sections.push({
        id: `${sectionType}:sec${secIndex + 1}`,
        type: sectionType,
        title: sectionTitle,
        paragraphs,
      });

      secIndex++;
    }
  }

  // Extract figures
  const figRegex = /<fig[^>]*>(.*?)<\/fig>/gs;
  let figMatch;
  let figIndex = 0;

  while ((figMatch = figRegex.exec(xml)) !== null) {
    const figContent = figMatch[1];

    // Extract caption
    const captionMatch = figContent.match(/<caption>(.*?)<\/caption>/s);
    const caption = captionMatch ? extractText(captionMatch[1]) : "";

    // Extract label (e.g., "Figure 1")
    const labelMatch = figContent.match(/<label>(.*?)<\/label>/);
    const label = labelMatch ? cleanText(labelMatch[1]) : `Figure ${figIndex + 1}`;

    result.figures.push({
      id: `Fig${figIndex + 1}`,
      label,
      caption,
    });

    figIndex++;
  }

  // Extract tables
  const tableWrapRegex = /<table-wrap[^>]*>(.*?)<\/table-wrap>/gs;
  let tableMatch;
  let tableIndex = 0;

  while ((tableMatch = tableWrapRegex.exec(xml)) !== null) {
    const tableContent = tableMatch[1];

    // Extract caption
    const captionMatch = tableContent.match(/<caption>(.*?)<\/caption>/s);
    const caption = captionMatch ? extractText(captionMatch[1]) : "";

    // Extract label
    const labelMatch = tableContent.match(/<label>(.*?)<\/label>/);
    const label = labelMatch ? cleanText(labelMatch[1]) : `Table ${tableIndex + 1}`;

    result.tables.push({
      id: `Tab${tableIndex + 1}`,
      label,
      caption,
    });

    tableIndex++;
  }

  return result;
}

function extractParagraphs(content) {
  const paragraphs = [];
  const pRegex = /<p[^>]*>(.*?)<\/p>/gs;
  let pMatch;
  let pIndex = 0;

  while ((pMatch = pRegex.exec(content)) !== null) {
    const text = extractText(pMatch[1]);
    if (text.length > 50) {
      paragraphs.push({
        id: `p${pIndex + 1}`,
        text,
      });
      pIndex++;
    }
  }

  return paragraphs;
}

function extractText(html) {
  // Remove all XML tags and clean up
  return html
    .replace(/<xref[^>]*>.*?<\/xref>/gs, "") // Remove citations
    .replace(/<italic>(.*?)<\/italic>/g, "$1")
    .replace(/<bold>(.*?)<\/bold>/g, "$1")
    .replace(/<sub>(.*?)<\/sub>/g, "_$1")
    .replace(/<sup>(.*?)<\/sup>/g, "^$1")
    .replace(/<[^>]+>/g, "") // Remove all tags
    .replace(/\s+/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .trim();
}

function cleanText(text) {
  return extractText(text);
}

/**
 * Get PMC ID from PMID using PubMed API
 * @param {string} pmid - PubMed ID
 * @returns {Promise<string|null>} - PMC ID or null
 */
export async function getPMCIDFromPMID(pmid) {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml`;

  try {
    const { stdout } = await execAsync(`curl -s "${url}"`);
    const pmcMatch = stdout.match(/PMC(\d+)/);
    return pmcMatch ? `PMC${pmcMatch[1]}` : null;
  } catch (error) {
    return null;
  }
}
