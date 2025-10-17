# Multi-Abstract Lite Pack Builder - Usage Guide

## Overview

The `multi_abstract_lite` mode generates learning packs by combining multiple research paper abstracts into a single comprehensive pack:

- **Sources to combine**: 3-5 abstracts
- **Lessons per unit**: 2
- **Questions per lesson**: 15
- **Total questions**: 90 (3 units × 2 lessons × 15 questions)
- **Question types**: MCQ, True/False, Cloze, Word Bank
- **Evidence**: Paragraph-level granularity with source tracking

## Use Cases

- **Topic synthesis**: Combine multiple papers on the same topic (e.g., "working memory AND sleep")
- **Literature review**: Create learning materials from a collection of related studies
- **Comparative learning**: Students can learn from multiple methodologies and findings
- **Enhanced evidence base**: More diverse questions from multiple sources

## Input Requirements

### Directory Structure

Create a directory containing abstract text files (`.txt`):

```
my_abstracts/
├── PMID_001_sleep_wm.txt
├── PMID_002_circadian_cognition.txt
└── PMID_003_napping_memory.txt
```

### Abstract File Requirements

Each abstract file should:
- Be at least 100 characters long (recommended: 500+ chars)
- Contain structured sections: Background, Methods, Results, Conclusions
- Include quantitative findings for richer question generation
- Be named with descriptive identifiers (PMID recommended)

### Filename Conventions (Optional)

The builder extracts metadata from filenames:

- **PMID**: `PMID_12345678_topic.txt` or `PMID12345678.txt`
- **DOI**: `10.1234_abcd_topic.txt`

Example: `PMID_41074139_sleep_working_memory.txt`

## Usage

### Basic Usage

```bash
node scripts/pack_builder.mjs multi_abstract_lite path/to/abstracts_directory
```

### Example

```bash
# Create directory with abstracts
mkdir sleep_cognition_papers
echo "Abstract 1..." > sleep_cognition_papers/PMID_001.txt
echo "Abstract 2..." > sleep_cognition_papers/PMID_002.txt
echo "Abstract 3..." > sleep_cognition_papers/PMID_003.txt

# Generate pack
node scripts/pack_builder.mjs multi_abstract_lite sleep_cognition_papers
```

## Generated Pack Structure

```
paper_packs/pack_multi_psychology_<timestamp>/
├── pack.json       # Pack metadata with source list
├── items.jsonl     # 90 questions (JSONL format)
├── spans.jsonl     # Evidence spans from all abstracts
└── schedule.jsonl  # Spaced repetition schedule
```

### Pack Metadata (pack.json)

```json
{
  "id": "pack_multi_psychology_1760600209846",
  "title": "PSYCHOLOGY Research Collection (3 papers)",
  "units": [
    { "id": "u1_background", "name": "背景・目的", "lessons": 2 },
    { "id": "u2_methods", "name": "方法", "lessons": 2 },
    { "id": "u3_results", "name": "結果", "lessons": 2 }
  ],
  "lesson_size": 15,
  "profiles": ["lite"],
  "source": {
    "type": "multi_abstract",
    "papers": [
      {
        "pmid": "001",
        "doi": null,
        "title": "Abstract 1: PMID_001_sleep_wm"
      },
      {
        "pmid": "002",
        "doi": null,
        "title": "Abstract 2: PMID_002_circadian_cognition"
      },
      {
        "pmid": "003",
        "doi": null,
        "title": "Abstract 3: PMID_003_napping_memory"
      }
    ],
    "license": "abstract_fair_use"
  }
}
```

### Question Distribution

- **Unit 1 (Background)**: 30 questions (2 lessons × 15)
- **Unit 2 (Methods)**: 30 questions (2 lessons × 15)
- **Unit 3 (Results)**: 30 questions (2 lessons × 15)

Questions are pooled from all abstracts and distributed evenly across units.

### Question Types

- **True/False (tf)**: ~50-60% - Short factual statements
- **Multiple Choice (mcq)**: ~40-50% - Comparative/causal relationships
- **Cloze (fill-in-blank)**: Variable - Complex sentences with key terms

### Source Tracking

Every question and evidence span is tagged with its source paper:

```json
{
  "id": "u1_background_l1_q01",
  "evidence_span_id": "P1:ABS:S1_1",
  "prompt": "次の記述は正しいか？\n\nShort sleepers showed significantly poorer...",
  "answer": "正しい"
}
```

Evidence span IDs use the format: `P<paper_number>:<section>:<paragraph>`
- `P1`: Paper 1
- `P2`: Paper 2
- `P3`: Paper 3

## Technical Details

### Enhanced Fact Extraction

The builder uses aggressive fact extraction from each abstract:

1. **Sentence Splitting**: Splits abstracts into sentences (15+ chars)
2. **Sub-sentence Extraction**: Further splits by:
   - Semicolons
   - Commas with conjunctions
   - Parentheses
   - Statistical findings (p-values, percentages)
3. **Fact Pooling**: Combines facts from all abstracts into a shared pool
4. **Smart Distribution**: Distributes facts across units based on content keywords

### Fact Reuse Strategy

- **Minimum Threshold**: 40% of target facts (36 out of 90)
- **Fact Cycling**: Same facts can be reused with different question types
- **Type Variation**: Automatically varies question type (MCQ → TF → Cloze)
- **Source Diversity**: Ensures questions draw from multiple papers

### Unit Classification

Facts are automatically classified by keywords:

- **Background**: background, theory, hypothesis, aim, purpose, previous, literature
- **Methods**: method, procedure, participant, design, measure, protocol, sample
- **Results**: result, finding, showed, significant, p <, correlation, effect

## Success Requirements

### Minimum Requirements

- At least 3 abstract files in the directory
- Each abstract must be at least 100 characters
- Combined facts must meet 40% threshold (36 facts for 90 questions)
- Final pack must have at least 72 questions (80% of target)

### Common Issues

**"Insufficient abstract files"**
- Directory contains fewer than 3 `.txt` files
- Ensure at least 3 valid abstract files

**"Insufficient facts extracted"**
- Abstracts are too short or lack detail
- Each abstract should be 500+ characters
- Include structured sections and quantitative findings

**"Too few questions generated"**
- Fact extraction succeeded but question generation failed
- Check that facts contain quantitative/comparative information
- Try abstracts with more structured content

## Advanced Usage

### Custom Topics

Organize abstracts by research topic:

```bash
# Working memory and sleep
mkdir wm_sleep_studies
cp abstracts/PMID_*.txt wm_sleep_studies/

# Mindfulness and attention
mkdir mindfulness_studies
cp abstracts/PMID_*.txt mindfulness_studies/
```

### Batch Processing

```bash
# Process multiple topic directories
for dir in topic_*/; do
  node scripts/pack_builder.mjs multi_abstract_lite "$dir"
done
```

### Integration with Literature Search

1. Search PubMed/PsycINFO for topic
2. Export abstracts to text files
3. Organize by subtopic
4. Generate packs with multi_abstract_lite

## Comparison with abstract_lite

| Feature | abstract_lite | multi_abstract_lite |
|---------|---------------|---------------------|
| Sources | 1 abstract | 3-5 abstracts |
| Questions | 90 (3 units) | 90 (3 units) |
| Evidence base | Single study | Multiple studies |
| Source tracking | No | Yes (P1, P2, P3) |
| Diversity | Single methodology | Varied methodologies |
| Use case | Single paper learning | Topic synthesis |

## Example Workflow

### 1. Literature Search

Search for "working memory AND sleep" on PubMed:
- Select 3-5 high-quality studies
- Export abstracts

### 2. Prepare Files

```bash
mkdir sleep_wm_collection
cd sleep_wm_collection

# Create abstract files
cat > PMID_001_sleep_deprivation.txt <<EOF
Background: Sleep deprivation impairs working memory...
Methods: 180 participants completed...
Results: Short sleepers showed significantly poorer...
Conclusions: Maintaining adequate sleep is critical...
EOF

cat > PMID_002_napping_effects.txt <<EOF
Background: Daytime napping may enhance memory...
...
EOF

cat > PMID_003_circadian_timing.txt <<EOF
Background: Circadian rhythms regulate cognitive...
...
EOF
```

### 3. Generate Pack

```bash
cd ..
node scripts/pack_builder.mjs multi_abstract_lite sleep_wm_collection
```

### 4. Verify Output

```bash
# Check generated pack
ls paper_packs/pack_multi_psychology_*/
cat paper_packs/pack_multi_psychology_*/pack.json | jq '.source.papers'
```

## Output Example

### Items (items.jsonl)

Questions from different sources:

```json
{"id":"u1_background_l1_q01","evidence_span_id":"P1:ABS:S1_1","prompt":"次の記述は正しいか？\n\nShort sleepers showed significantly poorer working memory...",}
{"id":"u1_background_l1_q02","evidence_span_id":"P2:ABS:S2_3","prompt":"この研究の結果として正しく述べられているものはどれか？","choices":["Morning types performed best at 8 AM...",...]}
{"id":"u2_methods_l1_q01","evidence_span_id":"P3:ABS:¶2","type":"cloze","prompt":"次の文の空欄に入る語を選べ：\n\nPolysomnography monitored ______ stages..."}
```

### Spans (spans.jsonl)

Evidence from all papers:

```json
{"id":"P1:¶1","section":"abstract","text":"Background: Sleep deprivation..."}
{"id":"P2:¶1","section":"abstract","text":"Background: Circadian rhythms..."}
{"id":"P3:¶1","section":"abstract","text":"Background: Daytime napping..."}
```

## License

Generated packs use `abstract_fair_use` license, suitable for educational purposes under fair use doctrine.

## Support

For issues or questions, refer to the main pack_builder.mjs documentation or CLAUDE.md.
