const fs = require('fs');

// Read existing mental.json
const mentalData = JSON.parse(fs.readFileSync('/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/data/lessons/mental.json', 'utf8'));

// Premium content for Mental L7-10 (60 questions total)
const premiumQuestions = [
    // LEVEL 7: CBT (Cognitive Behavioral Therapy) - 15 questions
    {
        id: "mental_l07_cbt_01",
        type: "swipe_judgment",
        difficulty: "hard",
        xp: 15,
        question: "認知の歪み：全か無かの思考",
        statement: "「一度失敗したら、もう全て終わりだ」と考えるのは、論理的で現実的な思考である。",
        is_true: false,
        explanation: "これは「全か無かの思考（All-or-Nothing Thinking）」と呼ばれる認知の歪みです。現実は白か黒かではなく、グラデーション（灰色）で構成されています。失敗はプロセスの一部であり、全否定する根拠にはなりません。",
        source_id: "Burns, D. D. (1980). Feeling Good: The New Mood Therapy."
    },
    {
        id: "mental_l07_cbt_02",
        type: "multiple_choice",
        difficulty: "hard",
        xp: 15,
        question: "「すべき思考」への対処法として、最も適切なリフレーミングは？",
        choices: [
            "「〜した方が良いかもしれない」と言い換える",
            "「絶対に〜しなければならない」と強く念じる",
            "「〜できない自分はダメだ」と反省する",
            "思考を完全に停止させる"
        ],
        correct_index: 0,
        explanation: "「〜すべき（Should）」を「〜した方が良い（Prefer）」と言い換えることで、義務感によるプレッシャーを軽減し、自律的な選択へと変化させることができます（Ellis, A., 1962）。",
        source_id: "Ellis, A. (1962). Reason and Emotion in Psychotherapy."
    },
    {
        id: "mental_l07_cbt_03",
        type: "fill_blank",
        difficulty: "hard",
        xp: 15,
        question: "思考記録（Thought Record）では、「自動思考」「感情」「[   ]」の3つを記録することが推奨される。",
        choices: ["証拠", "願望", "記憶", "予測"],
        correct_index: 0,
        explanation: "CBTの思考記録では、自動思考を支持する「証拠」と反証する「証拠」を客観的に検証することで、認知の歪みを修正します（Beck, A. T., 1979）。",
        source_id: "Beck, A. T. (1979). Cognitive Therapy of Depression."
    },
    {
        id: "mental_l07_cbt_04",
        type: "sort_order",
        difficulty: "hard",
        xp: 15,
        question: "行動活性化療法（Behavioral Activation）のステップを正しい順序に並べよ",
        items: [
            "活動のモニタリング（現状把握）",
            "価値観の明確化",
            "活動スケジュールの作成",
            "実行と振り返り"
        ],
        correct_order: [0, 1, 2, 3],
        explanation: "行動活性化は、まず現状を把握し、自分の価値観に沿った活動を計画・実行することで、うつ症状を改善する手法です（Martell, C. R., et al., 2001）。",
        source_id: "Martell, C. R., et al. (2001). Behavioral Activation for Depression."
    },
    {
        id: "mental_l07_cbt_05",
        type: "swipe_judgment",
        difficulty: "hard",
        xp: 15,
        question: "曝露療法（Exposure Therapy）",
        statement: "不安を感じる状況を完全に避け続けることで、不安は自然に消失する。",
        is_true: false,
        explanation: "回避行動は短期的には不安を軽減しますが、長期的には不安を維持・強化します。曝露療法では、恐怖対象に段階的に直面することで、不安反応を消去します（Foa, E. B., & Kozak, M. J., 1986）。",
        source_id: "Foa, E. B., & Kozak, M. J. (1986). Emotional processing of fear."
    },
    {
        id: "mental_l07_cbt_06",
        type: "multiple_choice",
        difficulty: "hard",
        xp: 15,
        question: "認知再構成（Cognitive Restructuring）で最も重要なステップは？",
        choices: [
            "自動思考を特定する",
            "思考を完全に消去する",
            "ポジティブ思考に強制的に置き換える",
            "思考を無視する"
        ],
        correct_index: 0,
        explanation: "認知再構成の第一歩は、自動的に浮かぶネガティブな思考（自動思考）を意識化することです。無理にポジティブに変えるのではなく、現実的でバランスの取れた思考を育てます。",
        source_id: "Beck, J. S. (2011). Cognitive Behavior Therapy: Basics and Beyond."
    },
    {
        id: "mental_l07_cbt_07",
        type: "fill_blank",
        difficulty: "hard",
        xp: 15,
        question: "CBTでは、思考・感情・行動の3つが相互に影響し合う「[   ]モデル」が基盤となる。",
        choices: ["認知", "行動", "感情", "生理"],
        correct_index: 0,
        explanation: "認知モデル（Cognitive Model）では、出来事そのものではなく、その出来事をどう解釈するか（認知）が感情と行動を決定すると考えます。",
        source_id: "Beck, A. T. (1976). Cognitive Therapy and the Emotional Disorders."
    },
    {
        id: "mental_l07_cbt_08",
        type: "swipe_judgment",
        difficulty: "hard",
        xp: 15,
        question: "中核信念（Core Beliefs）",
        statement: "中核信念は幼少期に形成され、一度形成されると変更不可能である。",
        is_true: false,
        explanation: "中核信念は幼少期の経験から形成されますが、CBTを通じて修正可能です。ソクラテス式質問法や行動実験を用いて、徐々に柔軟な信念へと変化させることができます。",
        source_id: "Young, J. E., et al. (2003). Schema Therapy."
    },
    {
        id: "mental_l07_cbt_09",
        type: "multiple_choice",
        difficulty: "hard",
        xp: 15,
        question: "「破局的思考（Catastrophizing）」の例として最も適切なのは？",
        choices: [
            "「頭痛がする。これは脳腫瘍に違いない」",
            "「今日は疲れた。明日は早く寝よう」",
            "「失敗した。次はもっと準備しよう」",
            "「雨が降っている。傘を持っていこう」"
        ],
        correct_index: 0,
        explanation: "破局的思考とは、小さな出来事を最悪の結果に結びつける思考パターンです。現実的な可能性を無視し、極端な結論に飛躍します。",
        source_id: "Burns, D. D. (1980). Feeling Good."
    },
    {
        id: "mental_l07_cbt_10",
        type: "sort_order",
        difficulty: "hard",
        xp: 15,
        question: "曝露階層表（Exposure Hierarchy）の作成手順",
        items: [
            "恐怖対象をリストアップ",
            "各項目に不安度（0-100）を評価",
            "不安度の低い順に並べる",
            "最も低い項目から実施"
        ],
        correct_order: [0, 1, 2, 3],
        explanation: "曝露療法では、段階的に不安に直面するため、まず恐怖対象を洗い出し、不安度を数値化し、低いものから順に取り組みます。",
        source_id: "Abramowitz, J. S., et al. (2011). Exposure Therapy for Anxiety."
    },
    {
        id: "mental_l07_cbt_11",
        type: "fill_blank",
        difficulty: "hard",
        xp: 15,
        question: "「心の読みすぎ（Mind Reading）」とは、[   ]を確認せずに、他者の考えを決めつける認知の歪みである。",
        choices: ["証拠", "感情", "記憶", "予測"],
        correct_index: 0,
        explanation: "心の読みすぎは、客観的な証拠なしに「あの人は私を嫌っている」などと他者の考えを推測する歪みです。実際に確認することで修正できます。",
        source_id: "Burns, D. D. (1980). Feeling Good."
    },
    {
        id: "mental_l07_cbt_12",
        type: "swipe_judgment",
        difficulty: "hard",
        xp: 15,
        question: "ソクラテス式質問法",
        statement: "ソクラテス式質問法では、セラピストが正しい答えを直接教えることで、クライアントの認知を修正する。",
        is_true: false,
        explanation: "ソクラテス式質問法では、セラピストは答えを教えるのではなく、質問を通じてクライアント自身が気づきを得られるよう導きます（Guided Discovery）。",
        source_id: "Padesky, C. A. (1993). Socratic Questioning."
    },
    {
        id: "mental_l07_cbt_13",
        type: "multiple_choice",
        difficulty: "hard",
        xp: 15,
        question: "行動実験（Behavioral Experiment）の主な目的は？",
        choices: [
            "思考の妥当性を実際の行動で検証する",
            "失敗を避けるために行動を制限する",
            "他者の反応を操作する",
            "完璧な結果を目指す"
        ],
        correct_index: 0,
        explanation: "行動実験では、「もし〜したら、〜になるだろう」という予測を実際の行動で検証し、認知の歪みを修正します。結果ではなくプロセスが重要です。",
        source_id: "Bennett-Levy, J., et al. (2004). Oxford Guide to Behavioural Experiments."
    },
    {
        id: "mental_l07_cbt_14",
        type: "fill_blank",
        difficulty: "hard",
        xp: 15,
        question: "「感情的理由づけ（Emotional Reasoning）」とは、[   ]を証拠として、事実を判断する認知の歪みである。",
        choices: ["感情", "論理", "データ", "他者の意見"],
        correct_index: 0,
        explanation: "感情的理由づけは、「不安だから危険に違いない」のように、感情を事実の証拠として扱う歪みです。感情と事実は別物であることを認識する必要があります。",
        source_id: "Burns, D. D. (1980). Feeling Good."
    },
    {
        id: "mental_l07_cbt_15",
        type: "swipe_judgment",
        difficulty: "hard",
        xp: 15,
        question: "認知行動療法の効果",
        statement: "CBTは薬物療法と比較して、再発率が低いことが多数の研究で示されている。",
        is_true: true,
        explanation: "CBTは症状を一時的に抑えるのではなく、思考パターンそのものを変えるため、治療終了後も効果が持続し、再発率が低い傾向があります（Hollon, S. D., et al., 2005）。",
        source_id: "Hollon, S. D., et al. (2005). Prevention of relapse following CBT."
    },

    // LEVEL 8: Neuroscience of Emotion - 15 questions
    {
        id: "mental_l08_neuro_01",
        type: "sort_order",
        difficulty: "hard",
        xp: 15,
        question: "恐怖反応の脳内プロセス（扁桃体ハイジャック）の順序",
        items: [
            "感覚入力（視覚・聴覚）",
            "視床（Thalamus）",
            "扁桃体（Amygdala）",
            "闘争・逃走反応（Fight or Flight）"
        ],
        correct_order: [0, 1, 2, 3],
        explanation: "感覚情報は視床を経由して、大脳皮質（思考）を通らずに直接扁桃体へ送られる「低次経路（Low Road）」があります。これが瞬時の恐怖反応を引き起こします（LeDoux, J. E., 1996）。",
        source_id: "LeDoux, J. E. (1996). The Emotional Brain."
    },
    {
        id: "mental_l08_neuro_02",
        type: "fill_blank",
        difficulty: "hard",
        xp: 15,
        question: "慢性的なストレスは、記憶を司る脳部位である[   ]を萎縮させることが知られている。",
        choices: ["海馬", "小脳", "延髄", "前頭葉"],
        correct_index: 0,
        explanation: "コルチゾール（ストレスホルモン）の過剰分泌は、海馬の神経細胞を損傷し、萎縮させることが多数の研究で示されています（Sapolsky, R. M., 1996）。",
        source_id: "Sapolsky, R. M. (1996). Why Zebras Don't Get Ulcers."
    },
    {
        id: "mental_l08_neuro_03",
        type: "swipe_judgment",
        difficulty: "hard",
        xp: 15,
        question: "神経可塑性（Neuroplasticity）",
        statement: "成人の脳は固定されており、新しい神経回路を形成することはできない。",
        is_true: false,
        explanation: "神経可塑性により、成人の脳も経験や学習によって構造と機能を変化させることができます。瞑想やCBTなどの介入で脳の物理的変化が確認されています（Davidson, R. J., & Lutz, A., 2008）。",
        source_id: "Davidson, R. J., & Lutz, A. (2008). Buddha's Brain: Neuroplasticity and Meditation."
    },
    {
        id: "mental_l08_neuro_04",
        type: "multiple_choice",
        difficulty: "hard",
        xp: 15,
        question: "前頭前皮質（Prefrontal Cortex）の主な機能は？",
        choices: [
            "実行機能（計画・意思決定・感情調整）",
            "視覚情報の処理",
            "運動の制御",
            "聴覚情報の処理"
        ],
        correct_index: 0,
        explanation: "前頭前皮質は「脳の最高司令官」として、計画、意思決定、感情調整、衝動抑制などの実行機能を担います。扁桃体の活動を抑制する役割も持ちます。",
        source_id: "Miller, E. K., & Cohen, J. D. (2001). An integrative theory of prefrontal cortex function."
    },
    {
        id: "mental_l08_neuro_05",
        type: "fill_blank",
        difficulty: "hard",
        xp: 15,
        question: "セロトニンは[   ]と呼ばれ、気分、睡眠、食欲の調整に関与する神経伝達物質である。",
        choices: ["幸せホルモン", "ストレスホルモン", "睡眠ホルモン", "記憶ホルモン"],
        correct_index: 0,
        explanation: "セロトニンは気分を安定させ、幸福感をもたらすため「幸せホルモン」と呼ばれます。SSRI（選択的セロトニン再取り込み阻害薬）はセロトニンの働きを強化します。",
        source_id: "Young, S. N. (2007). How to increase serotonin in the human brain."
    },
    {
        id: "mental_l08_neuro_06",
        type: "swipe_judgment",
        difficulty: "hard",
        xp: 15,
        question: "迷走神経（Vagus Nerve）",
        statement: "迷走神経の活性化は、心拍数を上げ、ストレス反応を強化する。",
        is_true: false,
        explanation: "迷走神経は副交感神経系の一部で、活性化すると心拍数を下げ、リラックス状態を促進します。深呼吸や瞑想で迷走神経を刺激できます（Porges, S. W., 2011）。",
        source_id: "Porges, S. W. (2011). The Polyvagal Theory."
    },
    {
        id: "mental_l08_neuro_07",
        type: "multiple_choice",
        difficulty: "hard",
        xp: 15,
        question: "ドーパミンの主な役割は？",
        choices: [
            "報酬予測とモチベーション",
            "痛みの感知",
            "体温調節",
            "血圧の調整"
        ],
        correct_index: 0,
        explanation: "ドーパミンは報酬系の中心的な神経伝達物質で、目標達成への動機づけや快感に関与します。依存症やうつ病とも深く関連しています。",
        source_id: "Schultz, W. (2015). Neuronal reward and decision signals."
    },
    {
        id: "mental_l08_neuro_08",
        type: "sort_order",
        difficulty: "hard",
        xp: 15,
        question: "ストレス反応（HPA軸）の活性化プロセス",
        items: [
            "ストレッサーの認知",
            "視床下部（Hypothalamus）",
            "下垂体（Pituitary）",
            "副腎（Adrenal）→コルチゾール分泌"
        ],
        correct_order: [0, 1, 2, 3],
        explanation: "HPA軸（視床下部-下垂体-副腎軸）は、ストレスに対する主要な生理的反応系です。最終的にコルチゾールが分泌され、エネルギー動員が行われます。",
        source_id: "Sapolsky, R. M. (1996). Why Zebras Don't Get Ulcers."
    },
    {
        id: "mental_l08_neuro_09",
        type: "fill_blank",
        difficulty: "hard",
        xp: 15,
        question: "マインドフルネス瞑想は、[   ]の活動を低下させ、前頭前皮質の活動を高めることが脳画像研究で示されている。",
        choices: ["扁桃体", "海馬", "小脳", "視床"],
        correct_index: 0,
        explanation: "瞑想の継続的な実践により、扁桃体（恐怖・不安の中枢）の活動が低下し、前頭前皮質（理性的思考）の活動が高まることが確認されています（Hölzel, B. K., et al., 2011）。",
        source_id: "Hölzel, B. K., et al. (2011). Mindfulness practice leads to increases in regional brain gray matter density."
    },
    {
        id: "mental_l08_neuro_10",
        type: "swipe_judgment",
        difficulty: "hard",
        xp: 15,
        question: "神経伝達物質とホルモン",
        statement: "神経伝達物質とホルモンは、どちらも化学物質だが、作用する範囲と速度が異なる。",
        is_true: true,
        explanation: "神経伝達物質はシナプス間で局所的・高速に作用し、ホルモンは血流を通じて全身に広範囲・緩やかに作用します。両者は協調して心身の機能を調整します。",
        source_id: "Bear, M. F., et al. (2015). Neuroscience: Exploring the Brain."
    },
    {
        id: "mental_l08_neuro_11",
        type: "multiple_choice",
        difficulty: "hard",
        xp: 15,
        question: "オキシトシンの主な効果は？",
        choices: [
            "社会的絆の形成と信頼感の向上",
            "攻撃性の増加",
            "食欲の抑制",
            "睡眠の促進"
        ],
        correct_index: 0,
        explanation: "オキシトシンは「愛情ホルモン」「絆ホルモン」と呼ばれ、他者との信頼関係や親子の絆形成に重要な役割を果たします（Uvnäs-Moberg, K., et al., 2015）。",
        source_id: "Uvnäs-Moberg, K., et al. (2015). Oxytocin, a mediator of anti-stress, well-being, social interaction."
    },
    {
        id: "mental_l08_neuro_12",
        type: "fill_blank",
        difficulty: "hard",
        xp: 15,
        question: "ノルアドレナリンは、[   ]反応において覚醒度と注意力を高める神経伝達物質である。",
        choices: ["闘争・逃走", "休息・消化", "睡眠", "記憶"],
        correct_index: 0,
        explanation: "ノルアドレナリンは交感神経系の活性化に関与し、ストレス時に覚醒度、注意力、心拍数を上昇させます。過剰分泌は不安やパニックを引き起こします。",
        source_id: "Aston-Jones, G., & Cohen, J. D. (2005). An integrative theory of locus coeruleus-norepinephrine function."
    },
    {
        id: "mental_l08_neuro_13",
        type: "swipe_judgment",
        difficulty: "hard",
        xp: 15,
        question: "脳の左右半球",
        statement: "左脳は論理的思考、右脳は創造的思考を担当するという明確な分業がある。",
        is_true: false,
        explanation: "「左脳型・右脳型」という単純な分類は科学的根拠が乏しく、ほとんどの認知機能は両半球が協調して処理します。ただし、言語は左半球優位など、一部の機能に偏りはあります（Nielsen, J. A., et al., 2013）。",
        source_id: "Nielsen, J. A., et al. (2013). An evaluation of the left-brain vs. right-brain hypothesis."
    },
    {
        id: "mental_l08_neuro_14",
        type: "multiple_choice",
        difficulty: "hard",
        xp: 15,
        question: "GABA（ガンマアミノ酪酸）の主な機能は？",
        choices: [
            "神経活動の抑制（鎮静作用）",
            "神経活動の興奮",
            "記憶の強化",
            "食欲の増進"
        ],
        correct_index: 0,
        explanation: "GABAは脳の主要な抑制性神経伝達物質で、神経の過剰な興奮を抑え、リラックス状態を促します。抗不安薬の多くはGABA系に作用します。",
        source_id: "Möhler, H. (2012). The GABA system in anxiety and depression."
    },
    {
        id: "mental_l08_neuro_15",
        type: "fill_blank",
        difficulty: "hard",
        xp: 15,
        question: "運動は[   ]と呼ばれる脳由来神経栄養因子を増加させ、神経細胞の成長と保護を促進する。",
        choices: ["BDNF", "GABA", "ATP", "DNA"],
        correct_index: 0,
        explanation: "BDNF（Brain-Derived Neurotrophic Factor）は、運動により増加し、神経細胞の成長、シナプス形成、記憶・学習能力の向上に寄与します（Cotman, C. W., & Berchtold, N. C., 2002）。",
        source_id: "Cotman, C. W., & Berchtold, N. C. (2002). Exercise: a behavioral intervention to enhance brain health."
    },

    // LEVEL 9: Resilience & Recovery - 15 questions
    {
        id: "mental_l09_resilience_01",
        type: "multiple_choice",
        difficulty: "expert",
        xp: 20,
        question: "レジリエンス（回復力）を高める要因として、研究で最も支持されているのは？",
        choices: [
            "ソーシャルサポート（社会的支援）の存在",
            "高い知能指数（IQ）",
            "過去に一度も失敗していないこと",
            "感情を一切表に出さないこと"
        ],
        correct_index: 0,
        explanation: "信頼できる他者とのつながり（ソーシャルサポート）は、レジリエンスの最も強力な予測因子の一つです。孤立はストレス耐性を著しく低下させます（Southwick, S. M., et al., 2012）。",
        source_id: "Southwick, S. M., & Charney, D. S. (2012). Resilience: The Science of Mastering Life's Greatest Challenges."
    },
    {
        id: "mental_l09_resilience_02",
        type: "swipe_judgment",
        difficulty: "expert",
        xp: 20,
        question: "ポスト・トラウマティック・グロース（PTG）",
        statement: "トラウマ体験は必ず心理的成長をもたらす。",
        is_true: false,
        explanation: "PTG（心的外傷後成長）は、トラウマ体験後に一部の人に見られる現象ですが、全員に起こるわけではありません。適切なサポートと意味づけのプロセスが重要です（Tedeschi, R. G., & Calhoun, L. G., 2004）。",
        source_id: "Tedeschi, R. G., & Calhoun, L. G. (2004). Posttraumatic Growth: Conceptual Foundations and Empirical Evidence."
    },
    {
        id: "mental_l09_resilience_03",
        type: "fill_blank",
        difficulty: "expert",
        xp: 20,
        question: "レジリエンスの3つの柱は、「楽観性」「[   ]」「目的意識」である。",
        choices: ["自己効力感", "完璧主義", "依存性", "回避性"],
        correct_index: 0,
        explanation: "自己効力感（Self-Efficacy）は、「自分には困難を乗り越える力がある」という信念で、レジリエンスの中核要素です（Bandura, A., 1997）。",
        source_id: "Bandura, A. (1997). Self-Efficacy: The Exercise of Control."
    },
    {
        id: "mental_l09_resilience_04",
        type: "sort_order",
        difficulty: "expert",
        xp: 20,
        question: "ストレス対処（コーピング）の適応的プロセス",
        items: [
            "ストレッサーの評価",
            "対処資源の確認",
            "対処戦略の選択",
            "実行と再評価"
        ],
        correct_order: [0, 1, 2, 3],
        explanation: "適応的コーピングでは、まずストレッサーを評価し、利用可能な資源を確認し、最適な戦略を選択・実行し、結果を振り返ります（Lazarus, R. S., & Folkman, S., 1984）。",
        source_id: "Lazarus, R. S., & Folkman, S. (1984). Stress, Appraisal, and Coping."
    },
    {
        id: "mental_l09_resilience_05",
        type: "swipe_judgment",
        difficulty: "expert",
        xp: 20,
        question: "意味づけ（Meaning-Making）",
        statement: "困難な経験に意味を見出すことは、レジリエンスの向上に寄与する。",
        is_true: true,
        explanation: "Viktor Franklの「意味への意志」理論が示すように、苦難に意味を見出すことは、心理的回復と成長を促進します。これはPTGの重要な要素でもあります（Frankl, V. E., 1946）。",
        source_id: "Frankl, V. E. (1946). Man's Search for Meaning."
    },
    {
        id: "mental_l09_resilience_06",
        type: "multiple_choice",
        difficulty: "expert",
        xp: 20,
        question: "問題焦点型コーピングと情動焦点型コーピングの使い分けとして最も適切なのは？",
        choices: [
            "変えられる状況には問題焦点型、変えられない状況には情動焦点型",
            "常に問題焦点型のみを使う",
            "常に情動焦点型のみを使う",
            "ランダムに選択する"
        ],
        correct_index: 0,
        explanation: "問題焦点型（状況を変える）と情動焦点型（感情を調整する）は、状況に応じて使い分けることが重要です。変えられないものを受け入れる柔軟性がレジリエンスの鍵です（Lazarus & Folkman, 1984）。",
        source_id: "Lazarus, R. S., & Folkman, S. (1984). Stress, Appraisal, and Coping."
    },
    {
        id: "mental_l09_resilience_07",
        type: "fill_blank",
        difficulty: "expert",
        xp: 20,
        question: "「[   ]的楽観主義」とは、ポジティブな結果を期待しつつも、現実的なリスクを認識する態度である。",
        choices: ["現実", "盲目", "悲観", "中立"],
        correct_index: 0,
        explanation: "現実的楽観主義（Realistic Optimism）は、希望を持ちながらも現実を直視する態度で、盲目的楽観主義よりもレジリエンスを高めます（Schneider, S. L., 2001）。",
        source_id: "Schneider, S. L. (2001). In search of realistic optimism."
    },
    {
        id: "mental_l09_resilience_08",
        type: "swipe_judgment",
        difficulty: "expert",
        xp: 20,
        question: "心理的柔軟性（Psychological Flexibility）",
        statement: "心理的柔軟性とは、自分の価値観に反する行動でも、状況に応じて柔軟に変えることである。",
        is_true: false,
        explanation: "心理的柔軟性（ACTの中核概念）は、不快な思考や感情を受け入れつつ、自分の価値観に沿った行動を取る能力です。価値観を曲げることではありません（Hayes, S. C., et al., 2006）。",
        source_id: "Hayes, S. C., et al. (2006). Acceptance and Commitment Therapy."
    },
    {
        id: "mental_l09_resilience_09",
        type: "multiple_choice",
        difficulty: "expert",
        xp: 20,
        question: "成長マインドセット（Growth Mindset）の特徴は？",
        choices: [
            "能力は努力と学習で伸ばせると信じる",
            "能力は生まれつき固定されていると信じる",
            "失敗を避けることを最優先する",
            "他者との比較を重視する"
        ],
        correct_index: 0,
        explanation: "成長マインドセットは、能力は可変的で努力により向上すると信じる態度です。失敗を学習機会と捉え、レジリエンスを高めます（Dweck, C. S., 2006）。",
        source_id: "Dweck, C. S. (2006). Mindset: The New Psychology of Success."
    },
    {
        id: "mental_l09_resilience_10",
        type: "sort_order",
        difficulty: "expert",
        xp: 20,
        question: "感謝の実践（Gratitude Practice）の効果的な手順",
        items: [
            "毎日3つの感謝できることを書き出す",
            "なぜそれに感謝するのか理由を記述",
            "感謝の感情を味わう",
            "定期的に振り返る"
        ],
        correct_order: [0, 1, 2, 3],
        explanation: "感謝の実践は、ポジティブな出来事に注意を向け、幸福感とレジリエンスを高めます。単に列挙するだけでなく、理由を深掘りすることが重要です（Emmons, R. A., & McCullough, M. E., 2003）。",
        source_id: "Emmons, R. A., & McCullough, M. E. (2003). Counting blessings versus burdens."
    },
    {
        id: "mental_l09_resilience_11",
        type: "fill_blank",
        difficulty: "expert",
        xp: 20,
        question: "「[   ]コントロール」とは、自分がコントロールできる範囲に焦点を当て、できない部分は手放す態度である。",
        choices: ["内的", "外的", "完全", "部分"],
        correct_index: 0,
        explanation: "内的コントロール（Internal Locus of Control）は、自分の行動や態度など、コントロール可能な要素に焦点を当てることで、無力感を減らし、レジリエンスを高めます（Rotter, J. B., 1966）。",
        source_id: "Rotter, J. B. (1966). Generalized expectancies for internal versus external control of reinforcement."
    },
    {
        id: "mental_l09_resilience_12",
        type: "swipe_judgment",
        difficulty: "expert",
        xp: 20,
        question: "セルフ・コンパッション（Self-Compassion）",
        statement: "セルフ・コンパッションは、自分に甘くなり、努力を怠ることを意味する。",
        is_true: false,
        explanation: "セルフ・コンパッションは、失敗時に自分を責めるのではなく、優しく受け入れる態度です。これは自己改善の動機を高め、レジリエンスを促進します（Neff, K. D., 2003）。",
        source_id: "Neff, K. D. (2003). Self-Compassion: An Alternative Conceptualization."
    },
    {
        id: "mental_l09_resilience_13",
        type: "multiple_choice",
        difficulty: "expert",
        xp: 20,
        question: "「逆境を乗り越えた経験（Mastery Experience）」がレジリエンスを高める理由は？",
        choices: [
            "「自分には困難を克服する力がある」という自信が育つ",
            "失敗を完全に避けられるようになる",
            "他者に依存しなくなる",
            "感情を感じなくなる"
        ],
        correct_index: 0,
        explanation: "小さな成功体験の積み重ねは、自己効力感を高め、将来の困難に対する自信とレジリエンスを育てます（Bandura, A., 1997）。",
        source_id: "Bandura, A. (1997). Self-Efficacy."
    },
    {
        id: "mental_l09_resilience_14",
        type: "fill_blank",
        difficulty: "expert",
        xp: 20,
        question: "「[   ]的説明スタイル」とは、ネガティブな出来事を一時的・限定的・外的要因に帰属させる思考パターンである。",
        choices: ["楽観", "悲観", "中立", "回避"],
        correct_index: 0,
        explanation: "楽観的説明スタイルは、失敗を「今回だけ」「この状況だけ」と捉え、自己全体を否定しません。これはレジリエンスと強く関連します（Seligman, M. E. P., 1990）。",
        source_id: "Seligman, M. E. P. (1990). Learned Optimism."
    },
    {
        id: "mental_l09_resilience_15",
        type: "swipe_judgment",
        difficulty: "expert",
        xp: 20,
        question: "ストレス免疫訓練（Stress Inoculation Training）",
        statement: "ストレス免疫訓練では、小さなストレスに段階的に曝露することで、ストレス耐性を高める。",
        is_true: true,
        explanation: "ワクチンの原理と同様に、管理された環境で小さなストレスに曝露し、対処スキルを練習することで、将来の大きなストレスへの耐性を高めます（Meichenbaum, D., 1985）。",
        source_id: "Meichenbaum, D. (1985). Stress Inoculation Training."
    },

    // LEVEL 10: Advanced Anxiety Research - 15 questions
    {
        id: "mental_l10_anxiety_01",
        type: "swipe_judgment",
        difficulty: "expert",
        xp: 20,
        question: "エクスポージャー療法（曝露療法）",
        statement: "不安を感じる状況に意図的に身を置き、回避せずに留まることで、不安は時間とともに自然に減少する。",
        is_true: true,
        explanation: "これは「馴化（Habituation）」と呼ばれるプロセスです。不安対象を回避し続けると不安は維持・強化されますが、直面し続けることで脳は「危険ではない」と学習し、不安反応が消去されます（Craske, M. G., et al., 2014）。",
        source_id: "Craske, M. G., et al. (2014). Maximizing exposure therapy: An inhibitory learning approach."
    },
    {
        id: "mental_l10_anxiety_02",
        type: "multiple_choice",
        difficulty: "expert",
        xp: 20,
        question: "抑制学習（Inhibitory Learning）モデルにおける曝露療法の目標は？",
        choices: [
            "恐怖記憶を消去するのではなく、新しい安全記憶を形成する",
            "恐怖記憶を完全に消去する",
            "恐怖を感じなくなるまで曝露を続ける",
            "恐怖対象を完全に避ける"
        ],
        correct_index: 0,
        explanation: "最新の研究では、曝露療法は恐怖記憶を消去するのではなく、「この状況は安全だ」という新しい記憶を形成し、恐怖記憶を抑制すると考えられています（Craske et al., 2014）。",
        source_id: "Craske, M. G., et al. (2014). Maximizing exposure therapy."
    },
    {
        id: "mental_l10_anxiety_03",
        type: "fill_blank",
        difficulty: "expert",
        xp: 20,
        question: "「[   ]行動」とは、不安を一時的に軽減するが、長期的には不安を維持する行動パターンである。",
        choices: ["安全", "適応", "回復", "成長"],
        correct_index: 0,
        explanation: "安全行動（Safety Behaviors）は、お守りを持つ、常に出口を確認するなど、不安を和らげる行動ですが、「この行動がなければ危険だ」という誤った信念を強化します（Salkovskis, P. M., 1991）。",
        source_id: "Salkovskis, P. M. (1991). The importance of behaviour in the maintenance of anxiety and panic."
    },
    {
        id: "mental_l10_anxiety_04",
        type: "sort_order",
        difficulty: "expert",
        xp: 20,
        question: "パニック障害の悪循環（Panic Cycle）",
        items: [
            "身体感覚（心拍数上昇など）",
            "破局的解釈（「心臓発作だ」）",
            "不安の増大",
            "さらなる身体症状"
        ],
        correct_order: [0, 1, 2, 3],
        explanation: "パニック障害では、正常な身体感覚を危険と誤解釈し、それが不安を高め、さらに身体症状を悪化させる悪循環が生じます（Clark, D. M., 1986）。",
        source_id: "Clark, D. M. (1986). A cognitive approach to panic."
    },
    {
        id: "mental_l10_anxiety_05",
        type: "swipe_judgment",
        difficulty: "expert",
        xp: 20,
        question: "不確実性への不耐性（Intolerance of Uncertainty）",
        statement: "不確実性への不耐性が高い人は、全般性不安障害（GAD）のリスクが高い。",
        is_true: true,
        explanation: "不確実性への不耐性は、GADの中核的な認知的脆弱性因子です。「確実でないことは耐えられない」という信念が、過度の心配を引き起こします（Dugas, M. J., et al., 1998）。",
        source_id: "Dugas, M. J., et al. (1998). Intolerance of uncertainty and problem orientation in worry."
    },
    {
        id: "mental_l10_anxiety_06",
        type: "multiple_choice",
        difficulty: "expert",
        xp: 20,
        question: "メタ認知療法（Metacognitive Therapy）における「心配についての心配」とは？",
        choices: [
            "心配すること自体を問題視し、さらに心配する",
            "心配の内容を分析する",
            "心配を完全に止める",
            "心配を他者に相談する"
        ],
        correct_index: 0,
        explanation: "メタ認知療法では、「心配は危険だ」「心配をコントロールできない」といった心配についての信念（メタ心配）が、不安を維持すると考えます（Wells, A., 2009）。",
        source_id: "Wells, A. (2009). Metacognitive Therapy for Anxiety and Depression."
    },
    {
        id: "mental_l10_anxiety_07",
        type: "fill_blank",
        difficulty: "expert",
        xp: 20,
        question: "社交不安障害では、[   ]に過度に注意を向け、自己をネガティブに評価する傾向がある。",
        choices: ["自己", "他者", "環境", "未来"],
        correct_index: 0,
        explanation: "社交不安障害の人は、他者の反応ではなく、自分の内的状態（赤面、震えなど）に過度に注意を向け、それを他者も気づいていると過大評価します（Clark, D. M., & Wells, A., 1995）。",
        source_id: "Clark, D. M., & Wells, A. (1995). A cognitive model of social phobia."
    },
    {
        id: "mental_l10_anxiety_08",
        type: "swipe_judgment",
        difficulty: "expert",
        xp: 20,
        question: "注意バイアス修正訓練（Attention Bias Modification）",
        statement: "注意バイアス修正訓練は、脅威刺激への注意を意図的にそらす訓練により、不安を軽減する。",
        is_true: true,
        explanation: "不安障害では脅威刺激に注意が向きやすいバイアスがあります。コンピュータ課題で中立刺激に注意を向ける訓練を繰り返すことで、このバイアスを修正し、不安を軽減できます（MacLeod, C., et al., 2002）。",
        source_id: "MacLeod, C., et al. (2002). Selective attention and emotional vulnerability."
    },
    {
        id: "mental_l10_anxiety_09",
        type: "multiple_choice",
        difficulty: "expert",
        xp: 20,
        question: "強迫性障害（OCD）における「強迫行為」の機能は？",
        choices: [
            "不安を一時的に軽減するが、長期的には強迫観念を強化する",
            "強迫観念を完全に消去する",
            "不安を永続的に解消する",
            "強迫観念の発生を予防する"
        ],
        correct_index: 0,
        explanation: "強迫行為（手洗い、確認など）は短期的には不安を軽減しますが、「この行為をしないと危険だ」という誤った信念を強化し、強迫観念を維持します（Salkovskis, P. M., 1985）。",
        source_id: "Salkovskis, P. M. (1985). Obsessional-compulsive problems: A cognitive-behavioural analysis."
    },
    {
        id: "mental_l10_anxiety_10",
        type: "sort_order",
        difficulty: "expert",
        xp: 20,
        question: "PTSD（心的外傷後ストレス障害）の認知処理療法（CPT）のステップ",
        items: [
            "トラウマ記憶の詳細な記述",
            "トラウマに関する誤った信念の特定",
            "証拠に基づく信念の修正",
            "新しい適応的信念の統合"
        ],
        correct_order: [0, 1, 2, 3],
        explanation: "CPTでは、トラウマ記憶を詳細に振り返り、「自分が悪かった」などの誤った信念を特定・修正し、適応的な信念を形成します（Resick, P. A., et al., 2002）。",
        source_id: "Resick, P. A., et al. (2002). Cognitive processing therapy for rape victims."
    },
    {
        id: "mental_l10_anxiety_11",
        type: "fill_blank",
        difficulty: "expert",
        xp: 20,
        question: "「[   ]曝露」とは、実際の状況ではなく、想像の中で恐怖対象に直面する曝露療法の一種である。",
        choices: ["想像", "現実", "仮想", "段階"],
        correct_index: 0,
        explanation: "想像曝露（Imaginal Exposure）は、PTSDや特定の恐怖症で用いられ、安全な環境で恐怖場面を詳細に想像することで、不安反応を消去します（Foa, E. B., & Rothbaum, B. O., 1998）。",
        source_id: "Foa, E. B., & Rothbaum, B. O. (1998). Treating the trauma of rape."
    },
    {
        id: "mental_l10_anxiety_12",
        type: "swipe_judgment",
        difficulty: "expert",
        xp: 20,
        question: "不安感受性（Anxiety Sensitivity）",
        statement: "不安感受性が高い人は、不安の身体症状を危険と解釈しやすく、パニック障害のリスクが高い。",
        is_true: true,
        explanation: "不安感受性とは、不安の身体症状（心拍数上昇など）を「危険だ」と恐れる傾向です。これが高いと、正常な身体感覚をパニック発作と誤解釈しやすくなります（Reiss, S., & McNally, R. J., 1985）。",
        source_id: "Reiss, S., & McNally, R. J. (1985). The expectancy model of fear."
    },
    {
        id: "mental_l10_anxiety_13",
        type: "multiple_choice",
        difficulty: "expert",
        xp: 20,
        question: "受容とコミットメント療法（ACT）における「脱フュージョン（Defusion）」とは？",
        choices: [
            "思考を事実ではなく、単なる心の産物として捉える",
            "思考を完全に消去する",
            "思考を現実として受け入れる",
            "思考を他者に伝える"
        ],
        correct_index: 0,
        explanation: "脱フュージョンは、「私は無価値だ」という思考を「『私は無価値だ』という思考が浮かんでいる」と距離を置いて観察することで、思考の影響力を弱めます（Hayes, S. C., et al., 1999）。",
        source_id: "Hayes, S. C., et al. (1999). Acceptance and Commitment Therapy."
    },
    {
        id: "mental_l10_anxiety_14",
        type: "fill_blank",
        difficulty: "expert",
        xp: 20,
        question: "「[   ]予防法」とは、強迫行為を意図的に行わないことで、不安が自然に減少することを学習する技法である。",
        choices: ["反応", "曝露", "回避", "強化"],
        correct_index: 0,
        explanation: "反応予防法（Response Prevention）は、強迫観念が生じても強迫行為を行わず、不安が時間とともに減少することを体験的に学習する、OCDの主要な治療技法です（Meyer, V., 1966）。",
        source_id: "Meyer, V. (1966). Modification of expectations in cases with obsessional rituals."
    },
    {
        id: "mental_l10_anxiety_15",
        type: "swipe_judgment",
        difficulty: "expert",
        xp: 20,
        question: "不安障害の薬物療法と心理療法",
        statement: "薬物療法は即効性があるが、心理療法（CBT）は長期的な再発予防効果が高い。",
        is_true: true,
        explanation: "抗不安薬やSSRIは症状を速やかに軽減しますが、CBTは思考・行動パターンを根本から変えるため、治療終了後も効果が持続し、再発率が低い傾向があります（Hofmann, S. G., & Smits, J. A., 2008）。",
        source_id: "Hofmann, S. G., & Smits, J. A. (2008). Cognitive-behavioral therapy for adult anxiety disorders."
    }
];

// Merge with existing data
const updatedData = [...mentalData, ...premiumQuestions];

// Write back to mental.json
fs.writeFileSync(
    '/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/data/lessons/mental.json',
    JSON.stringify(updatedData, null, 2),
    'utf8'
);

console.log(`✅ Successfully added ${premiumQuestions.length} premium questions to mental.json`);
console.log(`Total questions in mental.json: ${updatedData.length}`);
