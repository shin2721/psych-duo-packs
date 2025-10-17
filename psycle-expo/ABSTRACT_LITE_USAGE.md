# Abstract Lite Pack Builder - Usage Guide

## Overview

The `abstract_lite` mode generates learning packs from research paper abstracts with the following configuration:

- **Lessons per unit**: 2
- **Questions per lesson**: 15
- **Total questions**: 90 (3 units × 2 lessons × 15 questions)
- **Question types**: MCQ, True/False, Cloze, Word Bank
- **Evidence**: Paragraph-level granularity

## Input Requirements

### Abstract Text File

Create a `.txt` file containing the abstract text. The file should:

- Be at least 100 characters long (recommended: 500+ chars)
- Contain structured sections: Background, Methods, Results, Conclusions
- Include quantitative findings for richer question generation

### Filename Conventions (Optional)

The builder can extract metadata from the filename:

- **PMID**: `PMID_12345678.txt` or `PMID12345678.txt`
- **DOI**: `10.1234_abcd.txt`

Example: `PMID_41074139_working_memory.txt`

## Usage

### Basic Usage

```bash
node scripts/pack_builder.mjs abstract_lite path/to/abstract.txt
```

### Example

```bash
node scripts/pack_builder.mjs abstract_lite test_abstract.txt
```

## Generated Pack Structure

```
paper_packs/pack_abstract_<filename>/
├── pack.json       # Pack metadata and structure
├── items.jsonl     # 90 questions (JSONL format)
├── spans.jsonl     # Evidence spans from abstract
└── schedule.jsonl  # Spaced repetition schedule
```

### Pack Metadata (pack.json)

```json
{
  "id": "pack_abstract_<filename>",
  "title": "Abstract: <filename>",
  "units": [
    { "id": "u1_background", "name": "背景・目的", "lessons": 2 },
    { "id": "u2_methods", "name": "方法", "lessons": 2 },
    { "id": "u3_results", "name": "結果", "lessons": 2 },
    { "id": "u4_discussion", "name": "考察・示唆", "lessons": 2 }
  ],
  "lesson_size": 15,
  "profiles": ["lite"],
  "source": {
    "pmid": null,
    "doi": null,
    "license": "abstract_fair_use"
  }
}
```

### Question Distribution

- **Unit 1 (Background)**: 30 questions (2 lessons × 15)
- **Unit 2 (Methods)**: 30 questions (2 lessons × 15)
- **Unit 3 (Results)**: 30 questions (2 lessons × 15)
- **Unit 4 (Discussion)**: 0 questions (only 3 units generated)

### Question Types

The builder generates a mix of question types:

- **True/False (tf)**: ~40% - Short factual statements
- **Multiple Choice (mcq)**: ~40% - Comparative/causal relationships
- **Cloze (fill-in-blank)**: ~20% - Complex sentences with key terms

## Example Abstract Format

```
Background: Working memory (WM) is a cognitive system... Objectives: This study aimed to...

Methods: A randomized controlled trial was conducted... Participants were randomly assigned...

Results: The training group showed significant improvements... (p < 0.001) These improvements...

Conclusions: Adaptive WM training produces near-transfer effects... Future research should...
```

## Technical Details

### Fact Extraction Strategy

1. **Sentence Splitting**: Splits abstract into sentences (15+ chars)
2. **Sub-sentence Extraction**: Splits complex sentences by:
   - Semicolons
   - Commas with conjunctions (and, but, however, while)
   - Parentheses
   - Statistical findings (p-values, percentages)
3. **Minimum Threshold**: 40% of target facts (36 out of 90)
4. **Fact Reuse**: Same facts can generate multiple question types

### Unit Classification

Facts are automatically classified by keywords:

- **Background**: background, theory, hypothesis, aim, purpose
- **Methods**: method, procedure, participant, design, measure
- **Results**: result, finding, showed, significant, p <
- **Discussion**: implication, limitation, suggest, conclude

## Constraints and Limitations

### Success Requirements

- Abstract must generate at least 36 distinct facts (40% of 90 target)
- Final pack must have at least 72 questions (80% of 90 target)
- Each lesson should have at least 10 questions (70% of 15 target)

### Common Issues

**"Insufficient facts extracted"**
- Abstract is too short or lacks detail
- Try an abstract with more structured content
- Minimum ~500 chars recommended

**"Too few questions generated"**
- Fact extraction succeeded but question generation failed
- Check that facts contain quantitative/comparative information

**"Uneven lesson distribution"**
- Abstract content is heavily skewed to one section
- Ensure balanced coverage across Background/Methods/Results

## Advanced Usage

### Custom Metadata

Create a JSON file alongside your abstract:

```json
{
  "pmid": "41074139",
  "doi": "10.1234/abcd",
  "tags": ["education", "construct:WM"],
  "license": "CC-BY-4.0"
}
```

### Integration with Sources

For batch processing from sources.json:

```bash
# Use existing source by ID
node scripts/pack_builder.mjs abstract_lite <source_id>
```

## Output Format

### Items (items.jsonl)

Each line is a JSON object:

```json
{
  "id": "u1_background_l1_q01",
  "unit": "u1_background",
  "lesson": 1,
  "profile": "lite",
  "type": "tf",
  "prompt": "次の記述は正しいか？\n\nWorking memory is...",
  "choices": ["正しい", "誤り"],
  "answer": "正しい",
  "evidence_span_id": "ABS:S1_1",
  "beta": 0.0,
  "tags": ["background"],
  "retry_hint": false
}
```

### Spans (spans.jsonl)

Evidence references:

```json
{
  "id": "ABS:S1_1",
  "section": "abstract",
  "text": "Working memory (WM) is a cognitive system...",
  "note": null
}
```

### Schedule (schedule.jsonl)

Spaced repetition timing:

```json
{
  "item_id": "u1_background_l1_q01",
  "due_at_offset_min": 10,
  "half_life_h": 24
}
```

## License

Generated packs use `abstract_fair_use` license, suitable for educational purposes under fair use doctrine.

## Support

For issues or questions, refer to the main pack_builder.mjs documentation or CLAUDE.md.
