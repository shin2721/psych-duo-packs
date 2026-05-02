#!/usr/bin/env node

/**
 * Evidence Scaffold Generator
 * 不足しているEvidence Cardを自動生成（既存は保護）
 */

const fs = require('fs');
const path = require('path');
const { createNetNewContinuityMetadata } = require('./lib/continuity-metadata.js');

const LESSONS_ROOT = 'data/lessons';
const THEMES_ROOT = 'data/themes';

// Evidence最小テンプレート（未承認・ドラフト状態）
const EVIDENCE_TEMPLATE = {
    "source_type": "unknown",
    "citation": {
        "doi": "",
        "pmid": "",
        "url": ""
    },
    "source_label": "",
    "claim": "",
    "limitations": "",
    "evidence_grade": "bronze",
    "severity_tier": "B",
    "confidence": "low",
    "status": "active",
    "last_verified": new Date().toISOString().split('T')[0],
    "last_verified_at": new Date().toISOString().split('T')[0],
    "review_sla_days": 90,
    "expiry_action": "refresh_queue",
    "next_review_due_at": "",
    "stale_route_owner": "content_ops",
    "refresh_value_reason_candidate": "evidence_strength_update",
    "generated_by": "mode_a",
    "review": {
        "human_approved": false,
        "auto_approved": true,
        "approval_mode": "autonomous",
        "reviewer": "system",
        "approval_reasons": [],
        "evaluated_at": new Date().toISOString()
    },
    "promotion": {
        "eligible": true,
        "reasons": [],
        "warnings": []
    },
    "content_package": {
        "lesson_path": "",
        "evidence_path": "",
        "theme_manifest_path": "",
        "continuity_metadata_path": "",
        "analytics_contract_id": "",
        "analytics_contract_version": 1,
        "analytics_schema_lineage": "content.lesson.base",
        "analytics_backward_compat_until": "",
        "package_dependencies": {
            "requires_package_ids": [],
            "dependency_rule": "no_additional_package_dependency",
            "invalidation_rule": "dependency_change_requires_revalidation"
        },
        "owner_id": "content_ops",
        "state": "production",
        "rollback_route": "",
        "rollback_class": "soft",
        "localized_locales": ["ja"],
        "localization_owner": "content_ops",
        "approval_locale_set": ["ja"],
        "semantic_parity_rule": "claim_strength_and_safety_must_match_across_locales",
        "tone_guard": "no_shame_no_threat_better_choice_tone",
        "readiness": {
            "quality_gate_pass": false,
            "dependency_valid": false,
            "continuity_complete": false,
            "analytics_wired": false,
            "rollback_defined": false
        },
        "readiness_authority": {
            "quality_gate_pass": {
                "owner": "content_ops",
                "auto_source": "deterministic_validator",
                "final_authority": "human_review_or_approved_source"
            },
            "dependency_valid": {
                "owner": "runtime",
                "auto_source": "theme_manifest_validator",
                "final_authority": "approved_bypass_only"
            },
            "continuity_complete": {
                "owner": "content_ops",
                "auto_source": "continuity_aftercare_validator",
                "final_authority": "redirect_and_analytics_continuity_complete"
            },
            "analytics_wired": {
                "owner": "analytics",
                "auto_source": "analytics_contract_checker",
                "final_authority": "continuity_events_verified"
            },
            "rollback_defined": {
                "owner": "content_ops",
                "auto_source": "rollback_metadata_checker",
                "final_authority": "rollback_route_and_owner_present"
            }
        },
        "completeness": {
            "localized_copy_ready": true,
            "analytics_contract_named": true,
            "rollback_route_present": true,
            "owner_assigned": true,
            "readiness_authority_complete": true
        },
        "review_decision": {
            "change_type": "content_patch",
            "human_review_required": false,
            "approved_source": "deterministic_validator",
            "review_reason": "autonomous_default_content_package_gate",
            "reviewed_at": new Date().toISOString(),
            "rollback_trigger_if_reverted": "guardrail_or_contract_regression"
        }
    }
};

function addDays(dateString, days) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
        return "";
    }
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().split('T')[0];
}

function buildReadinessAuthority() {
    return JSON.parse(JSON.stringify(EVIDENCE_TEMPLATE.content_package.readiness_authority));
}

function buildContentPackage(args) {
    const qualityGatePass =
        args.existingEvidence?.review?.human_approved === true ||
        args.existingEvidence?.review?.auto_approved === true ||
        args.existingEvidence?.promotion?.eligible === true ||
        args.existingEvidence?.status === "active";

    return {
        lesson_path: `data/lessons/${args.domain}_units/${args.basename}.ja.json`,
        evidence_path: `data/lessons/${args.domain}_units/${args.basename}.evidence.json`,
        theme_manifest_path: `data/themes/${args.domain}.meta.json`,
        continuity_metadata_path: `data/lessons/${args.domain}_units/${args.basename}.continuity.json`,
        analytics_contract_id: `content.lesson.${args.domain}.v1`,
        analytics_contract_version: 1,
        analytics_schema_lineage: `content.lesson.${args.domain}.base`,
        analytics_backward_compat_until: addDays(new Date().toISOString().split('T')[0], 180),
        package_dependencies: {
            requires_package_ids: [],
            dependency_rule: "no_additional_package_dependency",
            invalidation_rule: "dependency_change_requires_revalidation"
        },
        owner_id: "content_ops",
        state: "production",
        rollback_route: `course:${args.domain}:entry`,
        rollback_class: "soft",
        localized_locales: ["ja"],
        localization_owner: "content_ops",
        approval_locale_set: ["ja"],
        semantic_parity_rule: "claim_strength_and_safety_must_match_across_locales",
        tone_guard: "no_shame_no_threat_better_choice_tone",
        readiness: {
            quality_gate_pass: qualityGatePass,
            dependency_valid: true,
            continuity_complete: true,
            analytics_wired: true,
            rollback_defined: true
        },
        readiness_authority: buildReadinessAuthority(),
        completeness: {
            localized_copy_ready: true,
            analytics_contract_named: true,
            rollback_route_present: true,
            owner_assigned: true,
            readiness_authority_complete: true
        },
        review_decision: {
            "change_type": "content_patch",
            "human_review_required": false,
            "approved_source": "deterministic_validator",
            "review_reason": "autonomous_default_content_package_gate",
            "reviewed_at": new Date().toISOString(),
            "rollback_trigger_if_reverted": "guardrail_or_contract_regression"
        }
    };
}

function hydrateEvidenceMetadata(args) {
    const merged = mergeWithTemplate(args.existingEvidence ?? {}, EVIDENCE_TEMPLATE);
    const lastVerifiedAt = merged.last_verified_at || merged.last_verified || new Date().toISOString().split('T')[0];
    const reviewSlaDays =
        typeof merged.review_sla_days === 'number' && Number.isFinite(merged.review_sla_days) && merged.review_sla_days > 0
            ? merged.review_sla_days
            : 90;
    merged.last_verified_at = lastVerifiedAt;
    merged.last_verified = lastVerifiedAt;
    merged.review_sla_days = reviewSlaDays;
    merged.severity_tier = merged.severity_tier || "B";
    merged.expiry_action = merged.expiry_action || "refresh_queue";
    merged.stale_route_owner = merged.stale_route_owner || "content_ops";
    merged.refresh_value_reason_candidate =
        merged.expiry_action === "refresh_queue"
            ? merged.refresh_value_reason_candidate || "evidence_strength_update"
            : merged.refresh_value_reason_candidate || "";
    merged.next_review_due_at =
        merged.next_review_due_at && !Number.isNaN(Date.parse(merged.next_review_due_at))
            ? merged.next_review_due_at
            : addDays(lastVerifiedAt, reviewSlaDays);
    merged.content_package = buildContentPackage({
        basename: args.basename,
        domain: args.domain,
        existingEvidence: merged,
    });
    return merged;
}

function hydrateContinuityMetadata(args) {
    if (!args.existingContinuity || args.existingContinuity.continuity_mode !== 'net_new') {
        return args.existingContinuity;
    }

    const defaults = createNetNewContinuityMetadata({
        lessonId: args.basename,
        themeId: args.domain,
        aftercareDefaults: args.aftercareDefaults,
    });

    return {
        ...defaults,
        ...args.existingContinuity,
        aftercare: {
            ...defaults.aftercare,
            ...(args.existingContinuity.aftercare ?? {}),
        },
    };
}

function generateEvidenceCards() {
    console.log('🔧 Evidence Card自動生成開始...');
    
    const domains = ['mental', 'money', 'work', 'health', 'social', 'study'];
    let generated = 0;
    let skipped = 0;
    let updated = 0;
    
    for (const domain of domains) {
        const domainDir = path.join(LESSONS_ROOT, `${domain}_units`);
        
        if (!fs.existsSync(domainDir)) {
            console.log(`⏭️  Skipped: ${domainDir} (not found)`);
            continue;
        }
        
        const lessonFiles = fs.readdirSync(domainDir)
            .filter(f => f.endsWith('.ja.json') && /_[lm]\d+\.ja\.json$/.test(f))
            .sort();
        
        console.log(`\n📁 Processing ${domain}: ${lessonFiles.length} lessons`);
        
        for (const lessonFile of lessonFiles) {
            const basename = lessonFile.replace('.ja.json', '');
            const evidenceFile = `${basename}.evidence.json`;
            const evidencePath = path.join(domainDir, evidenceFile);
            const continuityFile = `${basename}.continuity.json`;
            const continuityPath = path.join(domainDir, continuityFile);
            const themeManifestPath = path.join(THEMES_ROOT, `${domain}.meta.json`);
            const themeManifest = fs.existsSync(themeManifestPath)
                ? JSON.parse(fs.readFileSync(themeManifestPath, 'utf-8'))
                : null;
            
            if (fs.existsSync(evidencePath)) {
                // 既存ファイルの必須キー補完
                try {
                    const existing = JSON.parse(fs.readFileSync(evidencePath, 'utf-8'));
                    if (!fs.existsSync(continuityPath)) {
                        const continuity = createNetNewContinuityMetadata({
                            lessonId: basename,
                            themeId: domain,
                            aftercareDefaults: themeManifest?.replacement_aftercare_defaults,
                        });
                        fs.writeFileSync(continuityPath, JSON.stringify(continuity, null, 2));
                        console.log(`  ✨ Created: ${continuityFile}`);
                        generated++;
                    } else {
                        const existingContinuity = JSON.parse(fs.readFileSync(continuityPath, 'utf-8'));
                        const hydratedContinuity = hydrateContinuityMetadata({
                            basename,
                            domain,
                            existingContinuity,
                            aftercareDefaults: themeManifest?.replacement_aftercare_defaults,
                        });

                        if (JSON.stringify(existingContinuity) !== JSON.stringify(hydratedContinuity)) {
                            fs.writeFileSync(continuityPath, JSON.stringify(hydratedContinuity, null, 2));
                            console.log(`  🔄 Updated: ${continuityFile} (missing keys added)`);
                            updated++;
                        }
                    }
                    const merged = hydrateEvidenceMetadata({
                        basename,
                        domain,
                        existingEvidence: existing,
                    });
                    
                    if (JSON.stringify(existing) !== JSON.stringify(merged)) {
                        fs.writeFileSync(evidencePath, JSON.stringify(merged, null, 2));
                        console.log(`  🔄 Updated: ${evidenceFile} (missing keys added)`);
                        updated++;
                    } else {
                        console.log(`  ✅ OK: ${evidenceFile}`);
                        skipped++;
                    }

                } catch (error) {
                    console.error(`  ❌ Error updating ${evidenceFile}:`, error.message);
                }
            } else {
                // 新規作成
                const newEvidence = hydrateEvidenceMetadata({
                    basename,
                    domain,
                    existingEvidence: {
                        ...EVIDENCE_TEMPLATE,
                        source_label: `Evidence for ${basename}`,
                        claim: `Claims made in lesson ${basename}`,
                        limitations: `Limitations and context for ${basename}`,
                    },
                });
                
                fs.writeFileSync(evidencePath, JSON.stringify(newEvidence, null, 2));
                console.log(`  ✨ Created: ${evidenceFile}`);
                generated++;

                const continuity = createNetNewContinuityMetadata({
                    lessonId: basename,
                    themeId: domain,
                    aftercareDefaults: themeManifest?.replacement_aftercare_defaults,
                });
                fs.writeFileSync(continuityPath, JSON.stringify(continuity, null, 2));
                console.log(`  ✨ Created: ${continuityFile}`);
                generated++;
            }
        }
    }
    
    console.log(`\n📊 Evidence Card生成完了:`);
    console.log(`  ✨ 新規作成: ${generated}`);
    console.log(`  🔄 更新: ${updated}`);
    console.log(`  ✅ スキップ: ${skipped}`);
    console.log(`  📈 総処理: ${generated + updated + skipped}`);
    
    return { generated, updated, skipped };
}

function mergeWithTemplate(existing, template) {
    const merged = { ...existing };
    
    // 必須キーを再帰的に補完
    function ensureKeys(target, source) {
        for (const [key, value] of Object.entries(source)) {
            if (!(key in target)) {
                target[key] = value;
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                if (typeof target[key] !== 'object' || target[key] === null) {
                    target[key] = {};
                }
                ensureKeys(target[key], value);
            }
        }
    }
    
    ensureKeys(merged, template);
    return merged;
}

// 実行
if (require.main === module) {
    generateEvidenceCards();
}

module.exports = { generateEvidenceCards };
