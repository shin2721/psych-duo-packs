import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EXPANDED_DETAILS_TRANSLATABLE_FIELDS,
  TOP_LEVEL_TRANSLATABLE_FIELDS,
  translateItemWithPolicy,
} from '../generate-translation-draft.mjs';

test('translation policy includes required nested fields', () => {
  assert.ok(TOP_LEVEL_TRANSLATABLE_FIELDS.includes('question'));
  assert.ok(TOP_LEVEL_TRANSLATABLE_FIELDS.includes('choices'));
  assert.ok(EXPANDED_DETAILS_TRANSLATABLE_FIELDS.includes('citation_role'));
  assert.ok(EXPANDED_DETAILS_TRANSLATABLE_FIELDS.includes('claim_tags'));
});

test('translateItemWithPolicy translates required fields and preserves fixed fields', async () => {
  const source = {
    id: 'mental_l01_q01',
    type: 'quiz',
    correct_index: 1,
    question: '反芻思考とは？',
    your_response_prompt: '最近の反芻を振り返ろう',
    choices: ['同じ考えを繰り返す', '気分が上がる'],
    explanation: '反芻思考は同じ考えを繰り返す状態。',
    actionable_advice: '10秒呼吸を試す',
    expanded_details: {
      try_this: ['3回深呼吸'],
      best_for: ['考えが止まらない時'],
      limitations: ['重度症状には単独で不十分'],
      citation_role: '反芻思考の定義を支持',
      claim_tags: ['反芻思考', '認知的評価'],
      evidence_ids: ['doi:10.1000/example'],
      tiny_metric: {
        label: '気分',
        value: '低い',
      },
      comparator: {
        better: '今週',
        worse: '先週',
      },
      fallback: {
        short: '短い説明',
      },
    },
  };

  const calls = [];
  const mockTranslate = async (text, context) => {
    calls.push({ text, context });
    return `T:${text}`;
  };

  const translated = await translateItemWithPolicy(source, mockTranslate);

  assert.equal(translated.id, source.id);
  assert.equal(translated.type, source.type);
  assert.equal(translated.correct_index, source.correct_index);
  assert.deepEqual(translated.expanded_details.evidence_ids, source.expanded_details.evidence_ids);

  assert.equal(translated.question, `T:${source.question}`);
  assert.equal(translated.your_response_prompt, `T:${source.your_response_prompt}`);
  assert.deepEqual(translated.choices, source.choices.map((x) => `T:${x}`));
  assert.equal(translated.explanation, `T:${source.explanation}`);
  assert.equal(translated.actionable_advice, `T:${source.actionable_advice}`);
  assert.equal(translated.expanded_details.citation_role, `T:${source.expanded_details.citation_role}`);
  assert.deepEqual(
    translated.expanded_details.claim_tags,
    source.expanded_details.claim_tags.map((x) => `T:${x}`)
  );
  assert.deepEqual(
    translated.expanded_details.try_this,
    source.expanded_details.try_this.map((x) => `T:${x}`)
  );
  assert.equal(translated.expanded_details.tiny_metric.label, `T:${source.expanded_details.tiny_metric.label}`);
  assert.equal(translated.expanded_details.comparator.better, `T:${source.expanded_details.comparator.better}`);
  assert.equal(translated.expanded_details.fallback.short, `T:${source.expanded_details.fallback.short}`);

  assert.ok(calls.length > 10);
});
