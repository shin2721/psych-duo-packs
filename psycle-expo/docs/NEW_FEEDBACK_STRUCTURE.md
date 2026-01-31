# 新しいフィードバック構造設計

## 目標
Duolingo式の教育効果を最大化する、共感的で励まし的なフィードバックシステム

## 新しいJSON構造

### Before (旧構造)
```json
{
  "explanation": "基本説明",
  "fun_fact": "💡豆知識",
  "tip": "🔍実践",
  "choices": ["選択肢1", "選択肢2", "選択肢3"],
  "answer_index": 0
}
```

### After (新構造)
```json
{
  "choices": ["選択肢1", "選択肢2", "選択肢3"],
  "answer_index": 0,
  "feedback": {
    "correct": {
      "praise": "正解！",
      "short_explanation": "基本説明(1-2文)",
      "fun_fact": "💡豆知識: 興味深い背景知識",
      "tip": "🔍実践: 日常で使えるテクニック",
      "next_concept": "次に学ぶと良い概念"
    },
    "incorrect": {
      "0": {
        "empathy": "その選択肢を選んだ理由はわかります",
        "why_wrong": "なぜこの選択肢が不正解か",
        "hint": "見分け方のコツ"
      },
      "1": {
        "empathy": "...",
        "why_wrong": "...",
        "hint": "..."
      },
      "2": {
        "empathy": "...",
        "why_wrong": "...",
        "hint": "..."
      }
    },
    "general_explanation": "全体の説明(正解を選んだ後に表示)",
    "fun_fact": "💡豆知識",
    "tip": "🔍実践"
  }
}
```

## フィードバックの表示フロー

### 1. 不正解時
```
❌ 惜しい！

[empathy for selected choice]
その選択肢を選んだ理由はわかります。〜という点で魅力的に見えますよね。

[why_wrong]
しかし、この場合は〜という理由で不正解なんです。

✅ 正解: [correct choice]

[hint]
💡見分け方: 〜に注目すると、正解を選びやすくなるよ。

📚 復習に追加しました
```

### 2. 正解時
```
✅ 正解！

[short_explanation]
その通り！〜ということですね。

💡豆知識
[fun_fact]

🔍実践
[tip]

➡️ 次のステップ: [next_concept]
```

## テンプレート関数の設計

```javascript
const FEEDBACK_TEMPLATES = {
  // 研究批判問題
  research_critique: {
    correct: (flaw) => ({
      praise: "正解！",
      short_explanation: `その通り、「${flaw}」が最も重要な限界だね。`,
      fun_fact: "💡「完璧な研究」は存在しないんだ。だからこそメタ分析（複数の研究を統合）が重要になるんだよ。",
      tip: "🔍実践: 論文を読む時は、「どんな限界がある？」って考える習慣をつけよう。批判的思考力が鍛えられるよ。",
      next_concept: "研究デザインの種類を学ぼう"
    }),
    incorrect: {
      sample_size: {
        empathy: "サンプルサイズを気にするのは素晴らしい視点だね！",
        why_wrong: "でも今回の研究では、サンプルサイズよりも〜の方が深刻な問題なんだ。",
        hint: "💡「何が最も結果に影響するか？」という優先順位で考えよう。"
      },
      causation: {
        empathy: "因果関係と相関を区別しようとしているのは良いね！",
        why_wrong: "ただ、この研究では因果関係の問題よりも〜がより重要な限界なんだ。",
        hint: "💡研究デザイン（RCTか観察研究か）をまず確認しよう。"
      }
    }
  },

  // セラピー選択問題
  therapy_matching: {
    correct: (therapy, disorder) => ({
      praise: "完璧！",
      short_explanation: `${therapy}は${disorder}に特に効果的だと、多くの研究で示されているよ。`,
      fun_fact: "💡実際の臨床では、複数の治療法を組み合わせる「統合的アプローチ」が主流になってきてるんだ。",
      tip: "🔍実践: 治療を受ける時は、「他の方法と組み合わせることもできる？」って聞いてみよう。",
      next_concept: "治療効果の測定方法を学ぼう"
    }),
    incorrect: {
      plausible_but_less_effective: {
        empathy: "その療法も効果はあるんだけど...",
        why_wrong: "〜という理由で、この状況では別の療法の方がより適切なんだ。",
        hint: "💡各療法の「得意分野」を覚えておくと選びやすいよ。"
      }
    }
  },

  // バイアス検出問題
  bias_detection: {
    correct: (bias_name) => ({
      praise: "その通り！",
      short_explanation: `これは「${bias_name}」の典型例だね。よく気づいたね！`,
      fun_fact: `💡${bias_name}は誰にでもあるよ。プロの研究者でもこのバイアスにハマることがあるんだ。`,
      tip: "🔍対策: 〜を意識することで、このバイアスを避けやすくなるよ。",
      next_concept: "他の認知バイアスも見てみよう"
    }),
    incorrect: {
      similar_bias: {
        empathy: "そのバイアスも似ているから、混同しやすいよね。",
        why_wrong: "でも〜という点が違うんだ。",
        hint: "💡キーワードは「〜」。これがあったら〜バイアスを疑おう。"
      }
    }
  }
};
```

## 実装の優先順位

1. ✅ 新しいフィードバック構造の設計（このドキュメント）
2. ⏳ EXPLANATIONSテンプレートを新構造に変換
3. ⏳ generateResearchCritique()を例として1関数だけ実装
4. ⏳ テスト生成して動作確認
5. ⏳ 残り15関数を変換
6. ⏳ 全36レッスン再生成

## 注意点

- **共感が先、修正が後**: 不正解でも学習者の思考プロセスを認める
- **励まし的トーン**: 「間違い」ではなく「学習機会」として位置づける
- **具体的なヒント**: 「次はこうすると良い」を明確に
- **段階的開示**: 不正解時は全ての情報を一度に出さず、ヒントから
