import {
  V2_GENERALIZATION_CONTENT_VERSION,
  V2_WALKING_CONTENT_VERSION,
  type V2GeneralizationLessonDefinition,
  type V2GeneralizationLessonId,
} from "../../../types/v2GeneralizationPilot";

const walkingDivergenceLesson = {
  id: "walking-divergence-v1",
  contentVersion: V2_WALKING_CONTENT_VERSION,
  sharedSkillId: "claim_boundary_transfer_v1",
  title: "歩くと助かるのは、どっち？",
  subtitle: "歩いて広げる · 決める工程は分ける",
  rawInsight: "歩いて広げる。決める工程は分ける。",
  stepOrder: ["prediction", "evidence", "update", "transfer", "complete"],
  sources: [
    {
      label: "Oppezzo & Schwartz (2014)",
      url: "https://doi.org/10.1037/a0036577",
    },
  ],
  steps: [
    {
      id: "prediction",
      kind: "capture",
      eyebrow: "PREDICTION · 先に直感",
      helperText:
        "5分歩いた直後を想像する。研究を見る前の予想なので、採点しません。",
      scene: "会議まで30分。今ある企画案は1つ。これから案を増やし、最後に1案を選ぶ。",
      prompt: "歩くと助かるのは、どっち？",
      options: [
        { id: "walking-prediction-expand", label: "案を増やすとき" },
        { id: "walking-prediction-narrow", label: "1案を選ぶとき" },
        { id: "walking-prediction-both", label: "両方とも" },
      ],
    },
    {
      id: "evidence",
      kind: "evidence",
      presentation: "compact",
      headline: "助けたのは「増やす」側",
      result:
        "歩行中・直後は、物の使い道や比喩を複数出す課題が改善しました。実際の仕事で良い案を選べるかは測っていません。",
      caveat:
        "収束課題を測ったのは実験1だけで、その課題は改善せず座位より低かった。長期成果や実務の選定精度は測っていない。",
      contrast: [
        { label: "候補を増やす", value: "4実験で改善" },
        { label: "1つに絞る", value: "効果は確認できていない" },
      ],
      frame: {
        target: "主に大学生・成人、小規模な4実験",
        comparison: "座位、屋内歩行、屋外歩行、屋外で車椅子移動",
        result:
          "発散的アイデア生成は改善。実験1の収束課題は改善せず座位より低かった",
        time: "歩行中と直後",
        setting: "短い実験課題。長期の仕事成果や意思決定ではない",
      },
    },
    {
      id: "update",
      kind: "capture",
      eyebrow: "SELF CHECK · 自分に当てはめる",
      helperText: "頭にある仕事を1つ思い浮かべる。入力はしません。",
      prompt: "いま、どっちで止まってる？",
      options: [
        { id: "walking-update-ideas", label: "案が出ない" },
        { id: "walking-update-decide", label: "案はある。決められない" },
        { id: "walking-update-none", label: "今は特にない" },
      ],
    },
    {
      id: "transfer",
      kind: "scored",
      eyebrow: "TRY · 1回だけ使い分ける",
      title: "歩く前の指示はどれ？",
      contextLabel: "明日の企画会議",
      context: "案は1つしかない。最初の5分を使う。",
      prompt: "どう進める？",
      correctFeedbackTitle: "使い分けできた",
      incorrectFeedbackTitle: "ここを分ける",
      options: [
        {
          id: "walking-transfer-expand-then-decide",
          label: "歩いて候補を3つ増やし、その後に条件で絞る",
          feedback:
            "歩行を試すのは、候補を増やすところまで。その後の選定とは工程を分けています。",
        },
        {
          id: "walking-transfer-do-both",
          label: "歩きながら候補出しと最終決定を済ませる",
          feedback:
            "最終決定まで良くなるとは、この研究からは言えません。",
        },
        {
          id: "walking-transfer-pick-then-justify",
          label: "歩いて最有力案を1つ選び、戻って理由を整える",
          feedback:
            "最有力案を選ぶ精度は測っていません。",
        },
      ],
      correctOptionId: "walking-transfer-expand-then-decide",
    },
    {
      id: "complete",
      kind: "complete",
      action:
        "次に案が1つしか出ない時だけ、安全な場所で5分歩いて候補を3つ。その後に選ぶ。",
      actionByOptionId: {
        "walking-update-ideas":
          "次に詰まったら、安全な場所で5分だけ歩いて候補を3つ。その後に条件で選ぶ。",
        "walking-update-decide":
          "今ほしいのは選定。歩行を切り札にせず、判断条件を3つ書く。",
        "walking-update-none":
          "次に案が1つしか出ない時だけ、安全な場所で5分歩いて候補を3つ。その後に選ぶ。",
      },
      disclaimer:
        "歩行の効果を保証する処方ではなく、自分では候補数だけを見る小さな実験です。歩きながら画面は操作しません。",
      nextQuestion:
        "次は、混ぜる練習で直接必要になる操作と、まだ断定できない原因を分ける。",
    },
  ],
} as const satisfies V2GeneralizationLessonDefinition;

const interleavingBoundaryLesson = {
  id: "interleaving-boundary-v1",
  contentVersion: V2_GENERALIZATION_CONTENT_VERSION,
  sharedSkillId: "claim_boundary_transfer_v1",
  title: "混ぜる練習は、いつ強い？",
  subtitle: "練習で選ぶ ≠ 初めて理解する",
  rawInsight:
    "既に授業で扱った複数種類を混ぜる練習は候補にできる。ただし、初学への効果や成績差の単一原因としては扱わない。",
  stepOrder: [
    "prediction",
    "evidence",
    "update",
    "boundary",
    "retrieval",
    "transfer",
    "complete",
  ],
  sources: [
    {
      label: "Rohrer, Dedrick, Hartwig & Cheung (2020)",
      url: "https://doi.org/10.1037/edu0000367",
    },
    {
      label: "What Works Clearinghouse study review",
      url: "https://ies.ed.gov/ncee/wwc/Study/88770",
    },
  ],
  steps: [
    {
      id: "prediction",
      kind: "capture",
      scene:
        "3種類の公式は単独なら使える。1か月後は問題だけ見て公式を選ぶ。",
      prompt: "練習問題の並べ方は？",
      options: [
        { id: "interleaving-prediction-blocked", label: "型ごとに固める" },
        { id: "interleaving-prediction-mixed", label: "3種類を混ぜる" },
        { id: "interleaving-prediction-none", label: "順番は無関係" },
      ],
    },
    {
      id: "evidence",
      kind: "evidence",
      headline: "混ぜた群は、1か月後の未告知テストで高得点",
      result:
        "同じ数学問題をmostly interleavedまたはmostly blockedに並べ、4か月の課題と共通reviewを行った後、1か月後の未告知テストで61%対38%だった。",
      caveat:
        "初回理解や全教科の万能則ではない。混合配置は方法の識別を要求するが、得点差の単一原因は確定していない。",
      frame: {
        target:
          "米国フロリダ州のHonors Advanced Grade 7 Mathの生徒787人、54クラス、5校",
        comparison:
          "同じ数学問題をmostly interleavedまたはmostly blockedに配置",
        result:
          "1か月後の未告知・研究者作成テストで61%対38%（d = 0.83）",
        time: "4か月の課題と共通review、その1か月後",
        setting:
          "授業で扱った複数種類の数学問題。初学だけを検証した研究ではない",
      },
    },
    {
      id: "update",
      kind: "capture",
      prompt: "研究結果を見て、予想は？",
      options: [
        { id: "interleaving-update-mixed", label: "予想より混合が強い" },
        { id: "interleaving-update-same", label: "ほぼ予想通り" },
        { id: "interleaving-update-blocked", label: "予想より固めが強い" },
      ],
    },
    {
      id: "boundary",
      kind: "scored",
      sourceClaim:
        "授業で扱った複数種類を4か月練習した中1では、混合群が1か月後の未告知・研究者作成テストで高得点だった",
      headline:
        "まだ教わっていない複数の公式を初めて理解する4か月でも、混合群が1か月後の未告知・研究者作成テストで高得点だった",
      prompt: "最初に入れ替わったものは？",
      options: [
        {
          id: "interleaving-boundary-stage",
          label: "学習段階: 練習 → 初学",
          feedback:
            "その通り。授業で扱った種類の練習から、まだ教わっていない公式の初学へ段階が変わっています。",
        },
        {
          id: "interleaving-boundary-result",
          label: "結果: 得点 → 学習時間",
          feedback:
            "見出しも結果は1か月後のテスト得点です。その前に、練習から初学へ学習段階が変わっています。",
        },
        {
          id: "interleaving-boundary-target",
          label: "対象: 中学生 → 大学生",
          feedback:
            "見出しの対象は中学生のままです。最初の越境は練習から初学への段階変更です。",
        },
      ],
      correctOptionId: "interleaving-boundary-stage",
    },
    {
      id: "retrieval",
      kind: "scored",
      prompt:
        "配置から直接必要になった操作と、研究が確定していないものの組合せは？",
      options: [
        {
          id: "interleaving-retrieval-bounded",
          label: "問題ごとに方法を見分ける / 成績差の単一原因",
          feedback:
            "その通り。混合配置では問題ごとの方法識別が必要ですが、それが得点差の単一原因だとは分離されていません。",
        },
        {
          id: "interleaving-retrieval-first-learning",
          label: "公式を初めて理解する / 1か月後の得点差",
          feedback:
            "1か月後の得点差は観察されましたが、公式を初めて理解する操作を直接検証した研究ではありません。",
        },
        {
          id: "interleaving-retrieval-blocked",
          label: "同じ型だけを反復する / 問題配置の違い",
          feedback:
            "混合配置が直接要求するのは、同じ型だけの反復ではなく、問題ごとに方法を見分けることです。",
        },
      ],
      correctOptionId: "interleaving-retrieval-bounded",
    },
    {
      id: "transfer",
      kind: "scored",
      context:
        "経験者が4種類の警報対応を、種類別または混合で練習した。1週間後の混合テストでは、混合練習群の得点が高かった。",
      headline:
        "警報対応を初めて教わる初心者でも、混合練習なら1週間後の同じテストで高得点になる",
      prompt: "最初に越えた境界は？",
      options: [
        {
          id: "interleaving-transfer-time",
          label: "時間条件",
          feedback:
            "見出しも1週間後を保っています。先に経験者から初学の初心者へ学習段階が変わっています。",
        },
        {
          id: "interleaving-transfer-stage",
          label: "学習段階",
          feedback:
            "その通り。経験者の練習結果を、初めて教わる初心者の初学へ広げています。",
        },
        {
          id: "interleaving-transfer-result",
          label: "測定結果",
          feedback:
            "見出しも測定結果はテスト得点です。最初の越境は経験者の練習から初心者の初学への変更です。",
        },
      ],
      correctOptionId: "interleaving-transfer-stage",
    },
    {
      id: "complete",
      kind: "complete",
      action:
        "次に学ぶものを「初学 / 同型の反復 / 方法を選ぶ練習」のどれかに10秒で分類する。",
      optionalSelfObservation:
        "方法を選ぶ練習なら、混合を試す候補として印を付けてもよい。",
      disclaimer:
        "数学以外への適用は未検証の自己観察であり、混合を初学へそのまま適用しない。",
      nextQuestion:
        "次は、増えた行動頻度を、測っていない品質へ広げていないかを見抜く。",
    },
  ],
} as const satisfies V2GeneralizationLessonDefinition;

const temptationBundlingLesson = {
  id: "temptation-bundling-v1",
  contentVersion: V2_GENERALIZATION_CONTENT_VERSION,
  sharedSkillId: "claim_boundary_transfer_v1",
  title: "ごほうびを足せば、何でも続く？",
  subtitle: "行動頻度 ≠ 作業品質",
  rawInsight:
    "すぐ楽しいものが主作業を邪魔しにくい時だけ、小さく束ねて頻度を見る。行動頻度の増加を品質・安全・習慣化へ広げない。",
  stepOrder: [
    "prediction",
    "evidence",
    "update",
    "boundary",
    "retrieval",
    "transfer",
    "complete",
  ],
  sources: [
    {
      label: "Milkman, Minson & Volpp (2014)",
      url: "https://doi.org/10.1287/mnsc.2013.1784",
    },
    {
      label: "Kirgios et al. (2020)",
      url: "https://doi.org/10.1016/j.obhdp.2020.09.003",
    },
  ],
  steps: [
    {
      id: "prediction",
      kind: "capture",
      scene:
        "人気audio入り端末をgymでだけ使える一式を受け取る群と、25ドルgift cardを受け取る対照群。",
      prompt: "当初のgym来館は？",
      options: [
        { id: "temptation-prediction-lower", label: "一式群が少ない" },
        { id: "temptation-prediction-same", label: "ほぼ同じ" },
        { id: "temptation-prediction-higher", label: "一式群が多い" },
      ],
    },
    {
      id: "evidence",
      kind: "evidence",
      headline: "gym限定audio一式群の当初の来館は対照より多かった",
      result:
        "運動を増やしたい大学ジム利用者で、gym限定audio一式群の当初のgym check-inは25ドルgift-card対照より多かった。",
      caveat:
        "効果は時間と中断で弱まった。運動時間、強度、フォーム、exercise以外の作業品質や安全は測っていない。",
      frame: {
        target:
          "運動を増やしたい大学ジム利用者226人。後続field experiment全体は6,792人",
        comparison:
          "2014年はgym限定audio一式、自己制限の推奨、25ドルgift card対照。後続の無作為な追加効果比較はaudio + 説明とaudioのみの2,334人",
        result:
          "当初のgym check-in・週のvisit回数が増加。運動時間、強度、フォーム、作業品質は未測定",
        time:
          "最初の研究は時間とThanksgiving後に減衰。後続は介入中から最大17週後まで追跡",
        setting: "audiobookとexerciseの組合せ",
      },
    },
    {
      id: "update",
      kind: "capture",
      prompt: "研究結果を見て、予想は？",
      options: [
        { id: "temptation-update-higher", label: "予想より増えた" },
        { id: "temptation-update-same", label: "ほぼ予想通り" },
        { id: "temptation-update-lower", label: "予想より減った" },
      ],
    },
    {
      id: "boundary",
      kind: "scored",
      headline:
        "gym限定audio一式群はgift-card対照より、運動フォームの正確さも高かった",
      prompt: "最初に入れ替わったものは？",
      options: [
        {
          id: "temptation-boundary-setting",
          label: "大学施設 → 自宅",
          feedback:
            "見出しは自宅へ場面を変えていません。来館頻度からフォームの正確さへ結果を変えています。",
        },
        {
          id: "temptation-boundary-result",
          label: "来館頻度 → 動作品質",
          feedback:
            "その通り。数えた来館頻度から、測っていない運動フォームの正確さへ結果が広がっています。",
        },
        {
          id: "temptation-boundary-time",
          label: "7週間 → 1週間",
          feedback:
            "見出しは期間を比較していません。最初の越境は来館頻度から動作品質への変更です。",
        },
      ],
      correctOptionId: "temptation-boundary-result",
    },
    {
      id: "retrieval",
      kind: "scored",
      prompt: "研究で直接数えたものと、まだ不明なものの組合せは？",
      options: [
        {
          id: "temptation-retrieval-duration",
          label: "運動時間と強度 / 来館頻度への効果",
          feedback:
            "直接数えた中心はgymへの訪問で、運動時間と強度ではありません。",
        },
        {
          id: "temptation-retrieval-bounded",
          label: "gymへの訪問回数 / 運動フォームへの効果",
          feedback:
            "その通り。gymへの訪問は数えましたが、運動フォームへの効果は測っていません。",
        },
        {
          id: "temptation-retrieval-quality",
          label: "作業の完成精度 / 開始回数への効果",
          feedback:
            "作業の完成精度は直接数えていません。観察されたのはgymへの訪問回数です。",
        },
      ],
      correctOptionId: "temptation-retrieval-bounded",
    },
    {
      id: "transfer",
      kind: "scored",
      context:
        "通知つき開始ボタンを使った群は、使わない群より2週間の課題開始回数が多かった。完了精度とエラーは測っていない。",
      headline: "通知つき開始ボタンは、2週間の課題完成精度も高めた",
      prompt: "最初に越えた境界は？",
      options: [
        {
          id: "temptation-transfer-comparison",
          label: "比較: ボタンなし → 専門家の指導",
          feedback:
            "見出しは専門家の指導へ比較を変えていません。開始回数から完成精度へ結果を変えています。",
        },
        {
          id: "temptation-transfer-time",
          label: "時間: 2週間 → 6か月",
          feedback:
            "見出しの時間は2週間のままです。最初の越境は開始回数から完成精度への結果変更です。",
        },
        {
          id: "temptation-transfer-result",
          label: "結果: 開始回数 → 完成精度",
          feedback:
            "その通り。増えた開始回数から、測っていない完成精度へ主張が広がっています。",
        },
      ],
      correctOptionId: "temptation-transfer-result",
    },
    {
      id: "complete",
      kind: "complete",
      action:
        "一回だけ試す候補に、別々の欄で「開始した？」「邪魔・ミスは出た？」と書く。",
      disclaimer:
        "exercise以外では効果実証ではなく仮説の自己観察。運転、危険作業、精度が重要な作業では試さない。",
      nextQuestion:
        "翌日の初見見出しで、対象・比較・結果・時間・場面のどこが変わったか見抜ける？",
    },
  ],
} as const satisfies V2GeneralizationLessonDefinition;

export const V2_GENERALIZATION_LESSONS = [
  walkingDivergenceLesson,
  interleavingBoundaryLesson,
  temptationBundlingLesson,
] as const satisfies readonly V2GeneralizationLessonDefinition[];

const V2_GENERALIZATION_LESSON_BY_ID = new Map<
  V2GeneralizationLessonId,
  V2GeneralizationLessonDefinition
>(V2_GENERALIZATION_LESSONS.map((lesson) => [lesson.id, lesson]));

export function getV2GeneralizationLesson(
  lessonId: V2GeneralizationLessonId
): V2GeneralizationLessonDefinition | null {
  return V2_GENERALIZATION_LESSON_BY_ID.get(lessonId) ?? null;
}
