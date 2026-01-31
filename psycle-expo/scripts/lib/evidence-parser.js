/**
 * Evidence Parser Library
 * 互換性のあるevidence.json解析ユーティリティ
 */

const fs = require('fs');
const path = require('path');

/**
 * Evidence cardから引用情報を抽出（legacy citation と新 citations[] 両対応）
 * @param {Object} evidenceData - evidence.jsonの内容
 * @returns {Object} 正規化された引用情報
 */
function extractCitations(evidenceData) {
    const result = {
        citations: [],
        primaryCitation: null,
        citationCount: 0,
        hasDoi: false,
        hasPmid: false,
        hasIsbn: false,
        hasUrl: false
    };

    // Legacy citation field (単数)
    if (evidenceData.citation && typeof evidenceData.citation === 'object') {
        const citation = evidenceData.citation;
        const normalizedCitation = {
            doi: citation.doi?.trim() || null,
            pmid: citation.pmid?.trim() || null,
            isbn: citation.isbn?.trim() || null,
            url: citation.url?.trim() || null,
            role: 'primary',
            source_type: evidenceData.source_type || 'unknown'
        };

        if (isValidCitation(normalizedCitation)) {
            result.citations.push(normalizedCitation);
            result.primaryCitation = normalizedCitation;
        }
    }

    // New citations[] field (配列)
    if (evidenceData.citations && Array.isArray(evidenceData.citations)) {
        for (const citation of evidenceData.citations) {
            const normalizedCitation = {
                doi: citation.doi?.trim() || null,
                pmid: citation.pmid?.trim() || null,
                isbn: citation.isbn?.trim() || null,
                url: citation.url?.trim() || null,
                role: citation.role || 'supporting',
                source_type: citation.source_type || evidenceData.source_type || 'unknown'
            };

            if (isValidCitation(normalizedCitation)) {
                result.citations.push(normalizedCitation);

                // Primary citation detection
                if (citation.role === 'primary' || (!result.primaryCitation && result.citations.length === 1)) {
                    result.primaryCitation = normalizedCitation;
                }
            }
        }
    }

    // 統計計算
    result.citationCount = result.citations.length;

    for (const citation of result.citations) {
        if (citation.doi) result.hasDoi = true;
        if (citation.pmid) result.hasPmid = true;
        if (citation.isbn) result.hasIsbn = true;
        if (citation.url) result.hasUrl = true;
    }

    return result;
}

/**
 * 引用が有効かチェック（DOI, PMID, ISBN, URLのいずれか1つ以上）
 * @param {Object} citation - 引用オブジェクト
 * @returns {boolean} 有効性
 */
function isValidCitation(citation) {
    return !!(citation.doi || citation.pmid || citation.isbn || citation.url);
}

/**
 * Source typeによる引用分類
 * @param {Array} citations - 引用配列
 * @returns {Object} 分類結果
 */
function classifyCitations(citations) {
    const result = {
        peerReviewed: [],
        systematic: [],
        meta: [],
        book: [],
        classic: [],
        unknown: []
    };

    for (const citation of citations) {
        switch (citation.source_type) {
            case 'peer_reviewed':
                result.peerReviewed.push(citation);
                break;
            case 'systematic':
                result.systematic.push(citation);
                break;
            case 'meta':
            case 'meta_analysis':
                result.meta.push(citation);
                break;
            case 'book':
                result.book.push(citation);
                break;
            case 'classic':
                result.classic.push(citation);
                break;
            default:
                result.unknown.push(citation);
        }
    }

    return result;
}

/**
 * Evidence cardの基本情報を抽出
 * @param {string} evidencePath - evidence.jsonファイルパス
 * @returns {Object|null} Evidence情報またはnull（エラー時）
 */
function parseEvidenceCard(evidencePath) {
    try {
        if (!fs.existsSync(evidencePath)) {
            return null;
        }

        const evidenceData = JSON.parse(fs.readFileSync(evidencePath, 'utf-8'));
        const citations = extractCitations(evidenceData);
        const classification = classifyCitations(citations.citations);

        return {
            filePath: evidencePath,
            basename: path.basename(evidencePath, '.evidence.json'),
            domain: getDomainFromPath(evidencePath),
            evidenceGrade: evidenceData.evidence_grade || 'unknown',
            sourceType: evidenceData.source_type || 'unknown',
            status: evidenceData.status || 'unknown',
            lastVerified: evidenceData.last_verified || null,
            humanApproved: evidenceData.review?.human_approved || false,
            reviewer: evidenceData.review?.reviewer || null,
            claim: evidenceData.claim || '',
            limitations: evidenceData.limitations || '',
            citations,
            classification,
            rawData: evidenceData
        };
    } catch (error) {
        console.error(`Error parsing evidence card ${evidencePath}:`, error.message);
        return null;
    }
}

/**
 * ファイルパスからドメインを抽出
 * @param {string} filePath - ファイルパス
 * @returns {string} ドメイン名
 */
function getDomainFromPath(filePath) {
    const match = filePath.match(/([a-z]+)_units/);
    return match ? match[1] : 'unknown';
}

/**
 * 対応するレッスンファイルを読み込み
 * @param {string} evidencePath - evidence.jsonファイルパス
 * @returns {Object|null} レッスンデータまたはnull
 */
function loadCorrespondingLesson(evidencePath) {
    try {
        const basename = path.basename(evidencePath, '.evidence.json');
        const lessonPath = path.join(path.dirname(evidencePath), `${basename}.ja.json`);

        if (!fs.existsSync(lessonPath)) {
            return null;
        }

        const lessonData = JSON.parse(fs.readFileSync(lessonPath, 'utf-8'));
        return {
            filePath: lessonPath,
            basename,
            data: lessonData
        };
    } catch (error) {
        console.error(`Error loading lesson for ${evidencePath}:`, error.message);
        return null;
    }
}

/**
 * 全ドメインのevidence cardを収集
 * @param {Object} options - オプション
 * @returns {Array} Evidence card配列
 */
function collectAllEvidenceCards(options = {}) {
    const { includeStaging = false, domains = ['mental', 'money', 'work', 'health', 'social', 'study'] } = options;
    const evidenceCards = [];
    const LESSONS_ROOT = 'data/lessons';

    for (const domain of domains) {
        const domainDir = path.join(LESSONS_ROOT, `${domain}_units`);

        if (!fs.existsSync(domainDir)) {
            continue;
        }

        const evidenceFiles = fs.readdirSync(domainDir)
            .filter(f => f.endsWith('.evidence.json'))
            .sort();

        for (const evidenceFile of evidenceFiles) {
            const evidencePath = path.join(domainDir, evidenceFile);
            const evidenceCard = parseEvidenceCard(evidencePath);

            if (evidenceCard) {
                evidenceCards.push(evidenceCard);
            }
        }
    }

    // Staging mode対応
    if (includeStaging) {
        const stagingDir = path.join(LESSONS_ROOT, '_staging');
        if (fs.existsSync(stagingDir)) {
            for (const domain of domains) {
                const stagingDomainDir = path.join(stagingDir, `${domain}_units`);

                if (!fs.existsSync(stagingDomainDir)) {
                    continue;
                }

                const evidenceFiles = fs.readdirSync(stagingDomainDir)
                    .filter(f => f.endsWith('.evidence.json'))
                    .sort();

                for (const evidenceFile of evidenceFiles) {
                    const evidencePath = path.join(stagingDomainDir, evidenceFile);
                    const evidenceCard = parseEvidenceCard(evidencePath);

                    if (evidenceCard) {
                        evidenceCard.isStaging = true;
                        evidenceCards.push(evidenceCard);
                    }
                }
            }
        }
    }

    return evidenceCards;
}

module.exports = {
    extractCitations,
    isValidCitation,
    classifyCitations,
    parseEvidenceCard,
    getDomainFromPath,
    loadCorrespondingLesson,
    collectAllEvidenceCards
};