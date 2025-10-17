# Pack QA Automation

Automated quality assurance for Psycle learning packs with GitHub Actions integration.

## Overview

The Pack QA system automatically validates pack integrity and format compliance:

- **Automatic validation** on every commit to `paper_packs/`
- **Auto-fix** for common issues (e.g., unit count mismatches)
- **PR comments** with validation results
- **Manual trigger** for specific packs

## Features

### ✅ Validation Checks

1. **Evidence Span References**
   - All `evidence_span_id` values in items.jsonl exist in spans.jsonl
   - No orphaned or missing references

2. **Lesson Distribution**
   - Each lesson has exactly `lesson_size` questions (15 for abstract_lite/multi_abstract_lite)
   - No over/under-filled lessons

3. **Unit Consistency**
   - pack.json units match items.jsonl units
   - No units defined without questions
   - No questions for undefined units

4. **Format Compliance**
   - Lite: Prompts ≤60 chars, MCQ 3-4 choices, TF 2 choices
   - Pro: Prompts ≤120 chars, MCQ 4-5 choices, TF 2 choices

5. **Figure Questions (Pro only)**
   - u3_results: ≥2 figure questions
   - Other units: ≥1 figure question (if figures exist)

6. **Schedule Consistency**
   - All items have corresponding schedule entries
   - No extra or missing schedule entries

### 🔧 Auto-Fix Capabilities

The QA system can automatically fix:

- **Unit mismatches**: Removes units from pack.json that have no items
- More fixes coming in future updates

## Usage

### Local Validation

```bash
# Validate a specific pack
node scripts/pack_qa.mjs paper_packs/pack_abstract_test_abstract

# Validate and auto-fix issues
node scripts/pack_qa.mjs paper_packs/pack_abstract_test_abstract --fix
```

### GitHub Actions (Automatic)

The workflow runs automatically on:

1. **Push to main/master** with changes to `paper_packs/`
2. **Pull requests** with changes to `paper_packs/`

#### Workflow Behavior

- Detects changed packs via git diff
- Runs validation on all changed packs
- Comments PR with detailed results
- Fails CI if critical errors found
- Warnings don't fail the build

### Manual Trigger

Trigger validation for a specific pack via GitHub Actions:

1. Go to **Actions** tab
2. Select **Pack QA** workflow
3. Click **Run workflow**
4. Enter pack directory (e.g., `paper_packs/pack_abstract_test`)
5. Click **Run workflow**

## Validation Report Format

### Example Output

```
🔍 Psycle Pack QA Validator

📊 Pack: pack_abstract_test_abstract
   Profile: lite
   Units: 3
   Items: 90
   Spans: 14
   Schedule: 90

✓ Checking evidence span references...
✓ Checking lesson distribution...
✓ Checking unit consistency...
✓ Checking format compliance...
✓ Checking schedule consistency...

============================================================

❌ 1 ERROR(S):

1. Uneven lesson distribution:
  u4_discussion_l1: 0/15
  u4_discussion_l2: 0/15

⚠️  2 WARNING(S):

1. u3_results_l1_q62: Prompt too long (81/60 chars)
2. u3_results_l2_q78: Prompt too long (104/60 chars)

🔧 1 FIXABLE ISSUE(S):

1. Units in pack.json have no items: u4_discussion
   → Remove unused units from pack.json

💡 Run with --fix to auto-apply fixes

============================================================
```

### Exit Codes

- `0`: Validation passed (warnings allowed)
- `1`: Validation failed (errors found)

## CI/CD Integration

### PR Workflow

1. Developer creates PR with pack changes
2. Pack QA workflow automatically runs
3. Bot comments on PR with validation results:
   ```markdown
   ## 🔍 Pack QA Results

   ### 📦 `paper_packs/pack_abstract_test`

   ✅ **Validation passed**

   90 items validated
   All checks passed

   ---

   *Automated validation by Pack QA Bot*
   ```
4. Developer fixes issues if needed
5. PR can be merged once validation passes

### Failed Validation Example

```markdown
## 🔍 Pack QA Results

### 📦 `paper_packs/pack_abstract_test`

❌ **Validation failed**

ERROR: Uneven lesson distribution
- u4_discussion_l1: 0/15
- u4_discussion_l2: 0/15

FIXABLE: Units in pack.json have no items: u4_discussion
→ Run `node scripts/pack_qa.mjs paper_packs/pack_abstract_test --fix`

---

*Automated validation by Pack QA Bot*
```

## Configuration

### Workflow File

`.github/workflows/pack-qa.yml`

Key settings:
- Triggers: `push`, `pull_request`, `workflow_dispatch`
- Paths: `paper_packs/**`
- Node version: 20

### Validation Script

`scripts/pack_qa.mjs`

Customizable thresholds:
- Max prompt length: 60 (Lite) / 120 (Pro)
- Choice count: 3-4 (Lite MCQ) / 4-5 (Pro MCQ)
- Figure questions: ≥2 (u3_results) / ≥1 (other units)

## Troubleshooting

### Common Issues

**Issue**: "Units in pack.json have no items"
- **Cause**: abstract_lite generated only 3 units but pack.json has 4
- **Fix**: Run with `--fix` to remove unused units

**Issue**: "Prompt too long"
- **Severity**: Warning (not blocking)
- **Fix**: Shorten prompt in question generation logic
- **Note**: TF questions excluded from length check

**Issue**: "Missing evidence span"
- **Cause**: Question references non-existent span ID
- **Fix**: Manual correction required - ensure spans.jsonl has all referenced IDs

**Issue**: "Uneven lesson distribution"
- **Cause**: Fact extraction insufficient for target question count
- **Fix**: Use longer/more structured abstracts, or adjust mode configuration

### Debug Mode

For detailed validation output:

```bash
# Run with verbose output
node scripts/pack_qa.mjs paper_packs/pack_abstract_test 2>&1 | tee qa-debug.log
```

## Extending the QA System

### Adding New Checks

Edit `scripts/pack_qa.mjs`:

```javascript
// Add new check
console.log(`✓ Checking [new rule]...`);

// Check logic here
if (/* condition */) {
  errors.push(`New error message`);
}
```

### Adding New Auto-Fixes

```javascript
async function applyFixes(packDir, fixes, pack) {
  // Add new fix handler
  for (const fix of fixes) {
    if (fix.file === "items.jsonl" && fix.type === "prompt_truncation") {
      // Implement fix logic
    }
  }
}
```

### Custom Validation Rules

Create custom validator for specific pack types:

```javascript
// In scripts/pack_qa.mjs
function validateProPack(pack, items) {
  // Pro-specific validation
}

function validateLitePack(pack, items) {
  // Lite-specific validation
}
```

## Performance

- **Average validation time**: ~500ms per pack
- **GitHub Actions runtime**: 30-60 seconds (including setup)
- **Parallel validation**: Supported for multiple packs

## Future Enhancements

Planned features:
- [ ] Auto-fix for prompt length issues (truncation)
- [ ] Auto-fix for missing evidence spans (regeneration)
- [ ] Content quality checks (hallucination detection)
- [ ] Difficulty calibration validation
- [ ] Batch validation for all packs
- [ ] Performance regression tests
- [ ] A/B test framework integration

## Support

For issues or questions:
- Open an issue with the `pack-qa` label
- Include validation output and pack directory
- Check existing issues for similar problems

## License

Same as main project license (see root LICENSE file).
