#!/usr/bin/env python3
"""
Content generation script for Psycle
Generates Level 4-6 questions for Work genre
"""

import json

# Work Level 4: Team Collaboration & Leadership
work_l04 = [
    {
        "id": "work_l04_001",
        "type": "multiple_choice",
        "question": "🤝 チームの心理的安全性を高めるために最も効果的な行動は？",
        "choices": [
            "失敗を責めず、学びの機会として扱う",
            "完璧な成果だけを評価する",
            "ミスをした人を厳しく指導する"
        ],
        "correct_index": 0,
        "explanation": "【心理的安全性】\nGoogleの研究（Project Aristotle）で、高パフォーマンスチームの最大の特徴は「心理的安全性」でした。失敗を学びとして扱うことで、メンバーが安心してリスクを取れるようになります。\n\n💡 Try this: 次回チームミーティングで、「今週の失敗から学んだこと」を共有する時間を作りましょう。",
        "source_id": "google_project_aristotle_2015",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "work_l04_002",
        "type": "true_false",
        "question": "💬 優れたリーダーは、常に答えを持っていなければならない",
        "choices": ["正しい", "誤り"],
        "correct_index": 1,
        "explanation": "【謙虚なリーダーシップ】\n「分からない」と認めることは弱さではなく、強さです。これにより、チームメンバーが自分のアイデアを出しやすくなり、集合知が生まれます。\n\n💡 Try this: 次回のミーティングで「これについて、みんなの意見を聞きたい」と素直に言ってみましょう。",
        "source_id": "humble_leadership_2018",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "work_l04_003",
        "type": "multiple_choice",
        "question": "🎯 フィードバックを受け入れやすくするために最も重要なのは？",
        "choices": [
            "「成長のための情報」として捉える",
            "「批判」として受け止める",
            "「無視する」"
        ],
        "correct_index": 0,
        "explanation": "【成長マインドセット】\nキャロル・ドゥエックの研究で、フィードバックを「成長の機会」と捉える人は、能力が向上し続けることが分かっています。\n\n💡 Try this: フィードバックを受けたら、「ありがとう、これで成長できる」と声に出して言ってみましょう。",
        "source_id": "dweck_mindset_2006",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "work_l04_004",
        "type": "multiple_choice",
        "question": "🗣️ 効果的な1on1ミーティングの頻度は？",
        "choices": [
            "週1回、30分",
            "月1回、2時間",
            "必要な時だけ"
        ],
        "correct_index": 0,
        "explanation": "【継続的フィードバック】\n研究では、短時間でも頻繁なコミュニケーションの方が、長時間の不定期ミーティングよりも効果的です。信頼関係が築かれ、問題の早期発見につながります。\n\n💡 Try this: 部下やチームメンバーと、毎週30分の1on1を設定してみましょう。",
        "source_id": "continuous_feedback_2019",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "work_l04_005",
        "type": "multiple_choice",
        "question": "🧠 チームの創造性を最大化するブレインストーミングのルールは？",
        "choices": [
            "批判禁止、量を重視、自由な発想",
            "すぐに実現可能なアイデアのみ",
            "リーダーが最終決定する"
        ],
        "correct_index": 0,
        "explanation": "【創造的思考】\nオズボーンのブレインストーミング4原則：批判厳禁、自由奔放、質より量、結合改善。これにより、心理的安全性が高まり、革新的なアイデアが生まれます。\n\n💡 Try this: 次回のブレストで、「最初の15分は批判禁止」というルールを設けてみましょう。",
        "source_id": "osborn_brainstorming_1953",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "work_l04_006",
        "type": "true_false",
        "question": "🏆 内発的動機（やりがい）は、外発的動機（報酬）より持続しやすい",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【自己決定理論】\nデシとライアンの研究で、内発的動機（興味、成長）の方が、外発的動機（お金、評価）よりも長期的なパフォーマンスを生むことが実証されています。\n\n💡 Try this: 仕事の「意義」や「成長」を意識的に言語化してみましょう。",
        "source_id": "deci_ryan_sdt_1985",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "work_l04_007",
        "type": "multiple_choice",
        "question": "⚡ 緊急ではないが重要なタスク（第2領域）に時間を使うべき理由は？",
        "choices": [
            "長期的な成果と成長につながるから",
            "すぐに結果が出るから",
            "他人に評価されやすいから"
        ],
        "correct_index": 0,
        "explanation": "【時間管理マトリクス】\nスティーブン・コヴィーの「7つの習慣」で、第2領域（重要だが緊急でない）に時間を使う人が最も成功することが示されています。例：スキル向上、人間関係構築、戦略立案。\n\n💡 Try this: 毎週、第2領域のタスクに最低2時間を確保しましょう。",
        "source_id": "covey_7habits_1989",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "work_l04_008",
        "type": "multiple_choice",
        "question": "🎭 感情労働（Emotional Labor）が多い職種で燃え尽きを防ぐには？",
        "choices": [
            "感情の切り替えスキルを身につける",
            "感情を完全に抑え込む",
            "仕事を辞める"
        ],
        "correct_index": 0,
        "explanation": "【感情労働】\n看護師、接客業などの感情労働では、「表層演技（偽る）」より「深層演技（本当にそう感じる）」の方が燃え尽きリスクが低いことが研究で示されています。\n\n💡 Try this: 仕事後に「感情のデブリーフィング」（今日の感情を振り返る）を5分行いましょう。",
        "source_id": "hochschild_emotional_labor_1983",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "work_l04_009",
        "type": "multiple_choice",
        "question": "🔄 フィードバックを与える時の「サンドイッチ法」とは？",
        "choices": [
            "ポジティブ→改善点→ポジティブの順で伝える",
            "改善点だけを簡潔に伝える",
            "ポジティブなことだけを伝える"
        ],
        "correct_index": 0,
        "explanation": "【効果的フィードバック】\nサンドイッチ法は、受け手の防衛反応を下げ、改善点を受け入れやすくします。ただし、形式的にならないよう、本心から伝えることが重要です。\n\n💡 Try this: 次回フィードバックする時、「良かった点→改善点→期待」の順で伝えてみましょう。",
        "source_id": "feedback_sandwich_2010",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "work_l04_010",
        "type": "true_false",
        "question": "🧘 マインドフルネスは、職場のストレス軽減に科学的根拠がある",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【マインドフルネス at Work】\n多数のRCT（ランダム化比較試験）で、8週間のマインドフルネストレーニングがストレス、不安、燃え尽きを有意に減少させることが実証されています。\n\n💡 Try this: 仕事の合間に1分間、呼吸に意識を向ける「マイクロ瞑想」を試してみましょう。",
        "source_id": "mindfulness_workplace_meta_2016",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "work_l04_011",
        "type": "multiple_choice",
        "question": "📊 データドリブンな意思決定で最も重要なのは？",
        "choices": [
            "データを批判的に解釈する能力",
            "大量のデータを集めること",
            "最新のツールを使うこと"
        ],
        "correct_index": 0,
        "explanation": "【批判的思考】\nデータは「事実」ではなく「解釈が必要な情報」です。確証バイアス、選択バイアスなどに注意し、データの限界を理解することが重要です。\n\n💡 Try this: データを見る時、「このデータは何を示していないか？」と自問してみましょう。",
        "source_id": "data_literacy_2020",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "work_l04_012",
        "type": "multiple_choice",
        "question": "🌐 リモートワークで生産性を維持するために最も効果的なのは？",
        "choices": [
            "明確な境界線（仕事とプライベート）を設ける",
            "24時間いつでも対応できるようにする",
            "オフィスと全く同じスケジュールを守る"
        ],
        "correct_index": 0,
        "explanation": "【ワークライフバランス】\n研究では、リモートワークの最大の課題は「境界線の曖昧さ」です。物理的・時間的な境界を設けることで、燃え尽きを防ぎ、生産性が向上します。\n\n💡 Try this: 仕事終了時に「終業の儀式」（例：PCをシャットダウン、散歩）を作りましょう。",
        "source_id": "remote_work_boundaries_2021",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "work_l04_013",
        "type": "true_false",
        "question": "🎯 目標は具体的であればあるほど、達成率が高まる",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【目標設定理論】\nロックとレイサムの研究で、「曖昧な目標（頑張る）」より「具体的な目標（売上10%増）」の方が、達成率が高いことが実証されています。\n\n💡 Try this: 目標を「SMART」（Specific, Measurable, Achievable, Relevant, Time-bound）で設定しましょう。",
        "source_id": "locke_latham_goal_setting_1990",
        "difficulty": "easy",
        "xp": 5
    },
    {
        "id": "work_l04_014",
        "type": "multiple_choice",
        "question": "🔥 バーンアウト（燃え尽き症候群）の3つの症状は？",
        "choices": [
            "情緒的消耗、脱人格化、達成感の低下",
            "頭痛、不眠、食欲不振",
            "怒り、悲しみ、不安"
        ],
        "correct_index": 0,
        "explanation": "【バーンアウト】\nマスラックの定義では、バーンアウトは①情緒的消耗（疲れ果てる）、②脱人格化（冷淡になる）、③達成感の低下の3要素で構成されます。\n\n💡 Try this: 定期的に「今、この3つの症状が出ていないか？」とセルフチェックしましょう。",
        "source_id": "maslach_burnout_1981",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "work_l04_015",
        "type": "multiple_choice",
        "question": "🤔 意思決定の質を高めるために有効な「デビルズ・アドボケイト」とは？",
        "choices": [
            "あえて反対意見を述べる役割を設ける",
            "最も経験豊富な人が決める",
            "多数決で決める"
        ],
        "correct_index": 0,
        "explanation": "【集団思考の回避】\nデビルズ・アドボケイト（悪魔の代弁者）を設けることで、集団思考（みんなが同じ意見に流される）を防ぎ、多角的な視点から意思決定できます。\n\n💡 Try this: 重要な決定の前に、「あえて反対意見を言う人」を指名してみましょう。",
        "source_id": "devils_advocate_groupthink_1972",
        "difficulty": "hard",
        "xp": 15
    }
]

# Work Level 5: Advanced Productivity & Well-being
work_l05 = [
    {
        "id": "work_l05_001",
        "type": "multiple_choice",
        "question": "🧠 「ディープワーク」（Deep Work）を実現するために最も重要なのは？",
        "choices": [
            "長時間の中断されない集中時間を確保する",
            "マルチタスクで効率を上げる",
            "常にメールをチェックする"
        ],
        "correct_index": 0,
        "explanation": "【ディープワーク】\nカル・ニューポートの研究で、中断のない集中時間（90-120分）が、創造的で価値の高い仕事を生むことが示されています。\n\n💡 Try this: 午前中に「ディープワーク専用の2時間」を確保し、通知を全てオフにしましょう。",
        "source_id": "newport_deep_work_2016",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "work_l05_002",
        "type": "true_false",
        "question": "⏰ 「締め切り効果」は、常にパフォーマンスを向上させる",
        "choices": ["正しい", "誤り"],
        "correct_index": 1,
        "explanation": "【ヤーキーズ・ドットソンの法則】\n適度なプレッシャーはパフォーマンスを向上させますが、過度なプレッシャーは逆効果です。複雑なタスクほど、この傾向が強くなります。\n\n💡 Try this: 締め切りを「適度に余裕を持たせた中間目標」に分割してみましょう。",
        "source_id": "yerkes_dodson_1908",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "work_l05_003",
        "type": "multiple_choice",
        "question": "🎨 創造性を高めるために効果的な環境は？",
        "choices": [
            "適度な雑音（カフェの音など）がある環境",
            "完全な静寂",
            "大音量の音楽"
        ],
        "correct_index": 0,
        "explanation": "【創造性と環境】\n研究では、70デシベル程度の適度な雑音（カフェの音）が、創造的思考を促進することが分かっています。完全な静寂や大音量は逆効果です。\n\n💡 Try this: 創造的な仕事をする時、カフェや「Coffitivity」などの環境音アプリを試してみましょう。",
        "source_id": "ambient_noise_creativity_2012",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "work_l05_004",
        "type": "multiple_choice",
        "question": "🔄 「フロー状態」（完全な没入）に入るための条件は？",
        "choices": [
            "スキルと課題の難易度が釣り合っている",
            "課題が非常に簡単",
            "課題が非常に難しい"
        ],
        "correct_index": 0,
        "explanation": "【フロー理論】\nチクセントミハイの研究で、フロー状態は「スキルと課題のバランス」が取れた時に生まれます。簡単すぎると退屈、難しすぎると不安になります。\n\n💡 Try this: タスクの難易度を、「少し頑張れば達成できる」レベルに調整しましょう。",
        "source_id": "csikszentmihalyi_flow_1990",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "work_l05_005",
        "type": "true_false",
        "question": "🌙 夜型人間は、朝型に変えるべきである",
        "choices": ["正しい", "誤り"],
        "correct_index": 1,
        "explanation": "【クロノタイプ】\n遺伝的に決まる体内時計（クロノタイプ）は、無理に変えるとパフォーマンスが下がります。自分のリズムに合わせた働き方を見つけることが重要です。\n\n💡 Try this: 自分の「最も集中できる時間帯」を見つけ、重要なタスクをその時間に配置しましょう。",
        "source_id": "chronotype_productivity_2019",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "work_l05_006",
        "type": "multiple_choice",
        "question": "🧘 「マインドフル・リーダーシップ」の核心は？",
        "choices": [
            "今この瞬間に意識を向け、判断を保留する",
            "常に冷静でいる",
            "感情を完全に排除する"
        ],
        "correct_index": 0,
        "explanation": "【マインドフル・リーダーシップ】\nGoogleの「Search Inside Yourself」プログラムでも採用されている手法です。今に集中し、自動的な反応ではなく、意識的な対応ができるようになります。\n\n💡 Try this: 会議前に1分間、呼吸に意識を向けて「今ここ」に戻る練習をしましょう。",
        "source_id": "mindful_leadership_google_2012",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "work_l05_007",
        "type": "multiple_choice",
        "question": "📝 「実装意図」（Implementation Intention）とは？",
        "choices": [
            "「いつ・どこで・何をするか」を事前に決めること",
            "「頑張る」と決意すること",
            "「できたらやる」と柔軟に構えること"
        ],
        "correct_index": 0,
        "explanation": "【実装意図】\nゴルヴィッツァーの研究で、「月曜の朝9時に、オフィスで、企画書を書く」のように具体的に決めると、実行率が2-3倍になることが示されています。\n\n💡 Try this: 重要なタスクを「いつ・どこで・何をするか」まで具体的に決めてカレンダーに入れましょう。",
        "source_id": "gollwitzer_implementation_intention_1999",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "work_l05_008",
        "type": "true_false",
        "question": "💼 ワーカホリック（仕事中毒）と仕事熱心は同じである",
        "choices": ["正しい", "誤り"],
        "correct_index": 1,
        "explanation": "【ワーカホリズム】\nワーカホリックは「強迫的に働く」状態で、健康を害します。一方、仕事熱心（ワーク・エンゲージメント）は「楽しんで働く」状態で、健康的です。\n\n💡 Try this: 「仕事が楽しいから働く」のか「不安だから働く」のか、自分の動機を振り返ってみましょう。",
        "source_id": "workaholism_vs_engagement_2014",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "work_l05_009",
        "type": "multiple_choice",
        "question": "🎯 「OKR」（Objectives and Key Results）の最大の利点は？",
        "choices": [
            "目標と成果を明確に結びつけ、進捗を可視化できる",
            "完璧な計画を立てられる",
            "失敗を完全に防げる"
        ],
        "correct_index": 0,
        "explanation": "【OKR】\nGoogleやIntelが採用するOKRは、「野心的な目標（Objective）」と「測定可能な成果（Key Results）」を設定し、透明性と集中力を高めます。\n\n💡 Try this: 四半期ごとに「達成したい目標1つ」と「それを測る指標3つ」を設定してみましょう。",
        "source_id": "okr_google_2013",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "work_l05_010",
        "type": "multiple_choice",
        "question": "🔋 エネルギーマネジメントで最も重要なのは？",
        "choices": [
            "90分働いて10-15分休む「ウルトラディアンリズム」",
            "8時間ぶっ通しで働く",
            "疲れたら休む"
        ],
        "correct_index": 0,
        "explanation": "【ウルトラディアンリズム】\n人間の集中力は90-120分周期で変動します。このリズムに合わせて休憩を取ることで、生産性が最大化されます。\n\n💡 Try this: 90分集中したら、10分間完全に離れる（散歩、ストレッチ）習慣をつけましょう。",
        "source_id": "ultradian_rhythm_productivity_2010",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "work_l05_011",
        "type": "true_false",
        "question": "🧠 「認知的負荷」が高すぎると、学習効率が下がる",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【認知負荷理論】\nスウェラーの研究で、ワーキングメモリには限界があり、情報過多は学習を妨げることが示されています。情報を「チャンク化」することが重要です。\n\n💡 Try this: 複雑なタスクを「3つの小さなステップ」に分解してから取り組みましょう。",
        "source_id": "sweller_cognitive_load_1988",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "work_l05_012",
        "type": "multiple_choice",
        "question": "🌟 「ジョブ・クラフティング」とは？",
        "choices": [
            "仕事の内容や意味を自分で再定義すること",
            "転職すること",
            "上司に仕事を変えてもらうこと"
        ],
        "correct_index": 0,
        "explanation": "【ジョブ・クラフティング】\nエール大学の研究で、仕事の「タスク」「人間関係」「認知」を自分で調整することで、やりがいと満足度が向上することが示されています。\n\n💡 Try this: 今の仕事に「どんな意味があるか？」「誰の役に立っているか？」を書き出してみましょう。",
        "source_id": "wrzesniewski_job_crafting_2001",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "work_l05_013",
        "type": "multiple_choice",
        "question": "🎭 「インポスター症候群」（詐欺師症候群）を克服するには？",
        "choices": [
            "自分の成功を「運」ではなく「努力」として認める",
            "完璧を目指す",
            "他人と比較する"
        ],
        "correct_index": 0,
        "explanation": "【インポスター症候群】\n高達成者の70%が経験する「自分は詐欺師だ」という感覚。成功を外的要因（運、タイミング）ではなく、内的要因（努力、スキル）に帰属させることが重要です。\n\n💡 Try this: 成功した時、「運が良かった」ではなく「努力した結果だ」と意識的に言い換えてみましょう。",
        "source_id": "clance_impostor_syndrome_1978",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "work_l05_014",
        "type": "true_false",
        "question": "🤝 多様性のあるチームは、常に同質的なチームより高パフォーマンスである",
        "choices": ["正しい", "誤り"],
        "correct_index": 1,
        "explanation": "【多様性のパラドックス】\n多様性は「潜在的な強み」ですが、心理的安全性やコミュニケーションがないと、逆に対立を生みます。多様性を活かすには、包摂的な文化が必要です。\n\n💡 Try this: チームで「違いを尊重し、全員の意見を聞く」文化を意識的に作りましょう。",
        "source_id": "diversity_inclusion_2017",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "work_l05_015",
        "type": "multiple_choice",
        "question": "🧘 「コンパッション疲労」（共感疲労）を防ぐには？",
        "choices": [
            "セルフコンパッション（自分への優しさ）を実践する",
            "他人の問題を完全に無視する",
            "感情を完全に抑え込む"
        ],
        "correct_index": 0,
        "explanation": "【コンパッション疲労】\n医療従事者やカウンセラーに多い症状。他人を助け続けると、自分が消耗します。自分自身にも優しくすることで、持続可能な支援ができます。\n\n💡 Try this: 毎日寝る前に「今日、自分がよく頑張ったこと」を3つ書き出してみましょう。",
        "source_id": "compassion_fatigue_neff_2015",
        "difficulty": "hard",
        "xp": 15
    }
]

# Work Level 6: Mastery & Innovation
work_l06 = [
    {
        "id": "work_l06_001",
        "type": "multiple_choice",
        "question": "🚀 「10x思考」（10倍の成果）を実現するために必要なのは？",
        "choices": [
            "既存の枠組みを捨て、ゼロベースで考える",
            "今の方法を10倍頑張る",
            "10倍の予算を使う"
        ],
        "correct_index": 0,
        "explanation": "【10x思考】\nGoogleのムーンショット思考。10%改善は「今の延長」ですが、10倍は「全く新しいアプローチ」が必要です。これにより、イノベーションが生まれます。\n\n💡 Try this: 「もし予算が1/10になったら、どうやって同じ成果を出すか？」と考えてみましょう。",
        "source_id": "google_10x_thinking_2013",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "work_l06_002",
        "type": "true_false",
        "question": "🎯 「完璧主義」は常に高いパフォーマンスにつながる",
        "choices": ["正しい", "誤り"],
        "correct_index": 1,
        "explanation": "【適応的 vs 不適応的完璧主義】\n「高い基準を持つ（適応的）」は良いですが、「失敗を恐れて動けない（不適応的）」は逆効果です。「80%で出して改善する」方が成果が出ます。\n\n💡 Try this: 「完璧」ではなく「十分に良い（Good Enough）」を目指してみましょう。",
        "source_id": "perfectionism_adaptive_2016",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "work_l06_003",
        "type": "multiple_choice",
        "question": "🧠 「メタ認知」（自分の思考を観察する能力）を高めるには？",
        "choices": [
            "定期的に「今、自分は何を考えているか？」と自問する",
            "考えずに直感で行動する",
            "他人の意見だけを聞く"
        ],
        "correct_index": 0,
        "explanation": "【メタ認知】\n自分の思考プロセスを客観視できると、バイアスに気づき、より良い意思決定ができます。これは「思考の思考」と呼ばれます。\n\n💡 Try this: 重要な決断の前に、「なぜこう考えたのか？」を5分間書き出してみましょう。",
        "source_id": "metacognition_decision_making_2018",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "work_l06_004",
        "type": "multiple_choice",
        "question": "🔄 「アジャイル思考」の核心は？",
        "choices": [
            "小さく試して、素早く学び、改善を繰り返す",
            "完璧な計画を立ててから実行する",
            "一度決めたら変更しない"
        ],
        "correct_index": 0,
        "explanation": "【アジャイル・マインドセット】\nソフトウェア開発から生まれた思考法。不確実性の高い環境では、「計画→実行→学習→改善」のサイクルを高速で回すことが成功の鍵です。\n\n💡 Try this: 新しいプロジェクトを「2週間の実験」として始め、結果を見てから調整しましょう。",
        "source_id": "agile_manifesto_2001",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "work_l06_005",
        "type": "true_false",
        "question": "🎨 創造性は、生まれつきの才能である",
        "choices": ["正しい", "誤り"],
        "correct_index": 1,
        "explanation": "【創造性の科学】\nアマビールの研究で、創造性は「スキル」「動機」「環境」の組み合わせであり、訓練で向上することが示されています。\n\n💡 Try this: 毎日10分、「もし制約がなかったら？」と自由に発想する時間を作りましょう。",
        "source_id": "amabile_creativity_1996",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "work_l06_006",
        "type": "multiple_choice",
        "question": "🌍 「システム思考」とは？",
        "choices": [
            "部分ではなく、全体のつながりを見る思考法",
            "システムを作ること",
            "論理的に考えること"
        ],
        "correct_index": 0,
        "explanation": "【システム思考】\nピーター・センゲの「学習する組織」で提唱。問題を「孤立した事象」ではなく「相互作用するシステム」として捉えることで、根本原因を見つけられます。\n\n💡 Try this: 問題が起きたら、「これは何の結果か？」「これが何に影響するか？」と連鎖を考えてみましょう。",
        "source_id": "senge_systems_thinking_1990",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "work_l06_007",
        "type": "multiple_choice",
        "question": "🧘 「レジリエンス」（回復力）を高めるために最も効果的なのは？",
        "choices": [
            "困難を「成長の機会」として捉え直す",
            "困難を避ける",
            "感情を抑え込む"
        ],
        "correct_index": 0,
        "explanation": "【レジリエンス】\n心理学者マーティン・セリグマンの研究で、逆境を「学びの機会」と捉える人は、ストレスに強く、早く回復することが分かっています。\n\n💡 Try this: 失敗した時、「この経験から何を学べるか？」と3つ書き出してみましょう。",
        "source_id": "seligman_resilience_2011",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "work_l06_008",
        "type": "true_false",
        "question": "💡 イノベーションは、天才の「ひらめき」から生まれる",
        "choices": ["正しい", "誤り"],
        "correct_index": 1,
        "explanation": "【イノベーションのプロセス】\nスティーブン・ジョンソンの研究で、イノベーションは「異なるアイデアの衝突」と「長期的な探索」から生まれることが示されています。\n\n💡 Try this: 異なる分野の本を読んだり、異業種の人と話したりして、「アイデアの衝突」を意図的に作りましょう。",
        "source_id": "johnson_where_good_ideas_2010",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "work_l06_009",
        "type": "multiple_choice",
        "question": "🎯 「エッセンシャル思考」の核心は？",
        "choices": [
            "「より少なく、しかしより良く」を追求する",
            "全てをやろうとする",
            "他人の期待に応える"
        ],
        "correct_index": 0,
        "explanation": "【エッセンシャル思考】\nグレッグ・マキューンの著書で提唱。「全てをやる」のではなく、「本質的なこと」に集中することで、最大の成果を生みます。\n\n💡 Try this: 今週のタスクリストから、「これがなくても大丈夫」なものを3つ削除してみましょう。",
        "source_id": "mckeown_essentialism_2014",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "work_l06_010",
        "type": "multiple_choice",
        "question": "🔥 「グリット」（やり抜く力）を構成する2つの要素は？",
        "choices": [
            "情熱と粘り強さ",
            "才能と運",
            "知識と経験"
        ],
        "correct_index": 0,
        "explanation": "【グリット】\nアンジェラ・ダックワースの研究で、長期的な成功には「才能」よりも「情熱（興味）」と「粘り強さ（継続）」が重要であることが示されています。\n\n💡 Try this: 自分の「長期的な目標」を書き出し、それに向かって毎日小さな一歩を踏み出しましょう。",
        "source_id": "duckworth_grit_2016",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "work_l06_011",
        "type": "true_false",
        "question": "🧠 「認知的柔軟性」が高い人は、変化に強い",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【認知的柔軟性】\n異なる視点を取り入れ、状況に応じて思考を切り替える能力。これが高い人は、不確実な環境でも適応し、問題解決能力が高いことが研究で示されています。\n\n💡 Try this: 意見が対立した時、「相手の立場だったらどう考えるか？」と想像してみましょう。",
        "source_id": "cognitive_flexibility_2019",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "work_l06_012",
        "type": "multiple_choice",
        "question": "🌟 「心理的資本」（PsyCap）を構成する4つの要素は？",
        "choices": [
            "自己効力感、希望、楽観性、レジリエンス",
            "知識、スキル、経験、人脈",
            "お金、時間、健康、人間関係"
        ],
        "correct_index": 0,
        "explanation": "【心理的資本】\nルーサンスの研究で、この4つの心理的資源が高い人は、パフォーマンスが高く、ストレスに強いことが実証されています。\n\n💡 Try this: 毎朝、「今日達成できること」「うまくいく理由」「困難があっても乗り越えられる根拠」を書き出しましょう。",
        "source_id": "luthans_psycap_2007",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "work_l06_013",
        "type": "multiple_choice",
        "question": "🎭 「感情知性」（EQ）が高いリーダーの特徴は？",
        "choices": [
            "自分と他人の感情を認識し、適切に対応できる",
            "感情を完全に抑え込む",
            "常にポジティブでいる"
        ],
        "correct_index": 0,
        "explanation": "【感情知性】\nダニエル・ゴールマンの研究で、EQの高いリーダーは、チームのモチベーションを高め、離職率を下げることが示されています。\n\n💡 Try this: 感情が高ぶった時、「今、自分は何を感じているか？」と名前をつけてみましょう（例：「不安」「焦り」）。",
        "source_id": "goleman_eq_1995",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "work_l06_014",
        "type": "true_false",
        "question": "🔄 「失敗から学ぶ文化」がある組織は、イノベーションが生まれやすい",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【学習する組織】\nエイミー・エドモンドソンの研究で、「失敗を罰しない」文化がある組織は、実験を恐れず、イノベーションが生まれやすいことが示されています。\n\n💡 Try this: チームで「今月の最高の失敗」を共有し、そこから学んだことを祝う習慣を作りましょう。",
        "source_id": "edmondson_psychological_safety_2018",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "work_l06_015",
        "type": "multiple_choice",
        "question": "🌍 「パーパス・ドリブン」（目的駆動）な働き方の利点は？",
        "choices": [
            "内発的動機が高まり、持続的なパフォーマンスが生まれる",
            "お金がたくさん稼げる",
            "楽に働ける"
        ],
        "correct_index": 0,
        "explanation": "【パーパス・ドリブン】\nサイモン・シネックの「WHYから始めよ」で提唱。「なぜこの仕事をするのか？」が明確な人は、困難にも耐え、長期的に成功します。\n\n💡 Try this: 「自分の仕事が、誰のどんな問題を解決しているか？」を具体的に書き出してみましょう。",
        "source_id": "sinek_start_with_why_2009",
        "difficulty": "hard",
        "xp": 15
    }
]

# Combine all levels
all_questions = work_l04 + work_l05 + work_l06

print(json.dumps(all_questions, ensure_ascii=False, indent=2))
