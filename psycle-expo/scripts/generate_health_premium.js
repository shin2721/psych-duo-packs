const fs = require('fs');

// Complete premium content for Health L7-10
const healthPremiumQuestions = [
    // LEVEL 7: Sleep Architecture - 15 questions
    {
        id: "health_l07_sleep_01",
        type: "swipe_judgment",
        difficulty: "hard",
        xp: 15,
        question: "睡眠サイクル",
        statement: "一晩の睡眠は、約90分周期で繰り返されるREM睡眠とノンREM睡眠のサイクルから成る。",
        is_true: true,
        explanation: "睡眠は約90分（70-120分）のサイクルで、ノンREM睡眠（ステージ1-4）とREM睡眠を繰り返します。一晩で通常4-6サイクル経験します（Walker, M., 2017）。",
        source_id: "Walker, M. (2017). Why We Sleep."
    },
    {
        id: "health_l07_sleep_02",
        type: "multiple_choice",
        difficulty: "hard",
        xp: 15,
        question: "深い睡眠（ノンREM ステージ3-4）の主な機能は？",
        choices: [
            "記憶の定着と脳の老廃物除去",
            "夢を見ること",
            "体温の上昇",
            "エネルギー消費の増加"
        ],
        correct_index: 0,
        explanation: "深い睡眠（徐波睡眠）は、記憶の長期保存、脳の老廃物（アミロイドβなど）の除去、成長ホルモンの分泌に重要です（Walker, 2017）。",
        source_id: "Walker, M. (2017). Why We Sleep."
    },
    {
        id: "health_l07_sleep_03",
        type: "fill_blank",
        difficulty: "hard",
        xp: 15,
        question: "REM睡眠中、脳は活発に活動するが、筋肉は[   ]状態になり、夢の中の行動を実際に行うことを防ぐ。",
        choices: ["麻痺", "緊張", "痙攣", "収縮"],
        correct_index: 0,
        explanation: "REM睡眠中は「REM睡眠麻痺（REM atonia）」により、骨格筋が一時的に麻痺します。これにより夢の内容を実際に行動に移すことを防ぎます。",
        source_id: "Walker, M. (2017). Why We Sleep."
    },
    {
        id: "health_l07_sleep_04",
        type: "sort_order",
        difficulty: "hard",
        xp: 15,
        question: "睡眠サイクルの進行順序",
        items: [
            "入眠（ステージ1）",
            "浅い睡眠（ステージ2）",
            "深い睡眠（ステージ3-4）",
            "REM睡眠"
        ],
        correct_order: [0, 1, 2, 3],
        explanation: "睡眠は、入眠→浅い睡眠→深い睡眠→REM睡眠の順で進行し、これを一晩で複数回繰り返します。後半のサイクルほどREM睡眠が長くなります。",
        source_id: "Walker, M. (2017). Why We Sleep."
    },
    {
        id: "health_l07_sleep_05",
        type: "swipe_judgment",
        difficulty: "hard",
        xp: 15,
        question: "睡眠負債",
        statement: "週末の寝だめで、平日の睡眠不足を完全に解消できる。",
        is_true: false,
        explanation: "睡眠負債は蓄積され、週末の寝だめでは完全には解消できません。慢性的な睡眠不足は、認知機能、免疫、代謝に長期的な悪影響を及ぼします（Walker, 2017）。",
        source_id: "Walker, M. (2017). Why We Sleep."
    },
    {
        id: "health_l07_sleep_06",
        type: "multiple_choice",
        difficulty: "hard",
        xp: 15,
        question: "睡眠不足が最も影響を与える認知機能は？",
        choices: [
            "注意力と集中力",
            "言語能力",
            "視覚認識",
            "聴覚処理"
        ],
        correct_index: 0,
        explanation: "睡眠不足は、前頭前皮質の機能を低下させ、注意力、集中力、意思決定、感情調整に最も大きな影響を与えます。",
        source_id: "Walker, M. (2017). Why We Sleep."
    },
    {
        id: "health_l07_sleep_07",
        type: "fill_blank",
        difficulty: "hard",
        xp: 15,
        question: "睡眠中、脳は[   ]系（グリンパティック系）を活性化し、老廃物を除去する。",
        choices: ["リンパ", "神経", "血管", "内分泌"],
        correct_index: 0,
        explanation: "睡眠中、グリンパティック系（glymphatic system）が活性化し、脳脊髄液が脳内を循環して、アミロイドβなどの老廃物を除去します（Xie et al., 2013）。",
        source_id: "Xie, L., et al. (2013). Sleep drives metabolite clearance from the adult brain."
    },
    {
        id: "health_l07_sleep_08",
        type: "swipe_judgment",
        difficulty: "hard",
        xp: 15,
        question: "睡眠と記憶",
        statement: "睡眠は、学習した情報を長期記憶に定着させるために不可欠である。",
        is_true: true,
        explanation: "睡眠、特に深い睡眠とREM睡眠は、記憶の固定化（consolidation）に重要です。睡眠中に海馬から大脳皮質へ情報が転送されます（Walker, 2017）。",
        source_id: "Walker, M. (2017). Why We Sleep."
    },
    {
        id: "health_l07_sleep_09",
        type: "multiple_choice",
        difficulty: "hard",
        xp: 15,
        question: "睡眠の質を高めるために最も効果的な習慣は？",
        choices: [
            "毎日同じ時刻に就寝・起床する",
            "寝る直前に激しい運動をする",
            "寝室を明るく保つ",
            "寝る前にカフェインを摂取する"
        ],
        correct_index: 0,
        explanation: "規則正しい睡眠スケジュールは、体内時計（概日リズム）を安定させ、睡眠の質を最も効果的に高めます。",
        source_id: "Walker, M. (2017). Why We Sleep."
    },
    {
        id: "health_l07_sleep_10",
        type: "sort_order",
        difficulty: "hard",
        xp: 15,
        question: "睡眠衛生の優先順位",
        items: [
            "規則正しい睡眠時間",
            "寝室を暗く涼しく保つ",
            "カフェイン・アルコールを避ける",
            "寝る前のスクリーンタイムを減らす"
        ],
        correct_order: [0, 1, 2, 3],
        explanation: "睡眠衛生では、まず規則正しいスケジュールを確立し、次に環境を整え、刺激物を避け、最後にブルーライトを減らすことが推奨されます。",
        source_id: "Walker, M. (2017). Why We Sleep."
    },
    {
        id: "health_l07_sleep_11",
        type: "fill_blank",
        difficulty: "hard",
        xp: 15,
        question: "成人の推奨睡眠時間は、一晩あたり[   ]時間である。",
        choices: ["7-9", "5-6", "9-11", "4-5"],
        correct_index: 0,
        explanation: "米国睡眠医学会（AASM）は、成人に対して7-9時間の睡眠を推奨しています。個人差はありますが、7時間未満は健康リスクが高まります。",
        source_id: "Watson, N. F., et al. (2015). Recommended Amount of Sleep for a Healthy Adult."
    },
    {
        id: "health_l07_sleep_12",
        type: "swipe_judgment",
        difficulty: "hard",
        xp: 15,
        question: "アルコールと睡眠",
        statement: "アルコールは入眠を助けるため、睡眠の質を向上させる。",
        is_true: false,
        explanation: "アルコールは入眠を早めますが、REM睡眠を抑制し、睡眠の後半で覚醒を増やすため、全体的な睡眠の質を低下させます（Walker, 2017）。",
        source_id: "Walker, M. (2017). Why We Sleep."
    },
    {
        id: "health_l07_sleep_13",
        type: "multiple_choice",
        difficulty: "hard",
        xp: 15,
        question: "ブルーライトが睡眠に与える影響は？",
        choices: [
            "メラトニン分泌を抑制し、入眠を遅らせる",
            "メラトニン分泌を促進し、入眠を早める",
            "睡眠に影響を与えない",
            "深い睡眠を増やす"
        ],
        correct_index: 0,
        explanation: "ブルーライト（スマホ、PCなど）は、メラトニン（睡眠ホルモン）の分泌を抑制し、体内時計を遅らせ、入眠を困難にします（Chang et al., 2015）。",
        source_id: "Chang, A. M., et al. (2015). Evening use of light-emitting eReaders negatively affects sleep."
    },
    {
        id: "health_l07_sleep_14",
        type: "fill_blank",
        difficulty: "hard",
        xp: 15,
        question: "睡眠不足は、食欲を増進させるホルモン[   ]を増加させ、肥満のリスクを高める。",
        choices: ["グレリン", "レプチン", "インスリン", "コルチゾール"],
        correct_index: 0,
        explanation: "睡眠不足はグレリン（食欲増進ホルモン）を増加させ、レプチン（満腹ホルモン）を減少させるため、過食と肥満のリスクが高まります（Taheri et al., 2004）。",
        source_id: "Taheri, S., et al. (2004). Short sleep duration is associated with reduced leptin, elevated ghrelin."
    },
    {
        id: "health_l07_sleep_15",
        type: "swipe_judgment",
        difficulty: "hard",
        xp: 15,
        question: "昼寝の効果",
        statement: "20-30分の短い昼寝は、午後の認知機能とパフォーマンスを向上させる。",
        is_true: true,
        explanation: "20-30分の「パワーナップ」は、深い睡眠に入る前に目覚めるため、覚醒後のぼんやり感（睡眠慣性）を避けつつ、注意力と記憶を改善します（Mednick et al., 2003）。",
        source_id: "Mednick, S., et al. (2003). The restorative effect of naps on perceptual deterioration."
    },

    // LEVEL 8: Circadian Rhythms - 15 questions
    {
        id: "health_l08_circadian_01",
        type: "sort_order",
        difficulty: "hard",
        xp: 15,
        question: "概日リズムの調整プロセス",
        items: [
            "光が網膜に入る",
            "視交叉上核（SCN）が刺激される",
            "松果体がメラトニン分泌を調整",
            "睡眠・覚醒サイクルが調整される"
        ],
        correct_order: [0, 1, 2, 3],
        explanation: "光は網膜→視交叉上核（体内時計の中枢）→松果体の経路で、メラトニン分泌を調整し、概日リズムを同調させます（Roenneberg, 2012）。",
        source_id: "Roenneberg, T. (2012). Internal Time."
    },
    {
        id: "health_l08_circadian_02",
        type: "fill_blank",
        difficulty: "hard",
        xp: 15,
        question: "人間の体内時計の自然な周期は、約[   ]時間である。",
        choices: ["24.2", "23.5", "25.0", "22.0"],
        correct_index: 0,
        explanation: "人間の概日リズムは、外部の光がない状態では約24.2時間（24-25時間）です。毎日、光によって24時間にリセットされます（Czeisler et al., 1999）。",
        source_id: "Czeisler, C. A., et al. (1999). Stability, precision, and near-24-hour period of the human circadian pacemaker."
    },
    {
        id: "health_l08_circadian_03",
        type: "swipe_judgment",
        difficulty: "hard",
        xp: 15,
        question: "クロノタイプ（朝型・夜型）",
        statement: "クロノタイプは遺伝的に決まっており、意志の力では変えられない。",
        is_true: true,
        explanation: "クロノタイプは遺伝的要因が強く（約50%）、PER3などの遺伝子が関与します。完全に変えることは困難ですが、光療法などで部分的に調整可能です（Roenneberg, 2012）。",
        source_id: "Roenneberg, T. (2012). Internal Time."
    },
    {
        id: "health_l08_circadian_04",
        type: "multiple_choice",
        difficulty: "hard",
        xp: 15,
        question: "時差ぼけ（Jet Lag）を最も早く解消する方法は？",
        choices: [
            "到着地の現地時間に合わせて光を浴びる",
            "到着後すぐに寝る",
            "カフェインを大量に摂取する",
            "暗い部屋で過ごす"
        ],
        correct_index: 0,
        explanation: "時差ぼけは、体内時計と現地時間のズレが原因です。到着地の朝に明るい光を浴びることで、体内時計を最も早くリセットできます（Eastman & Burgess, 2009）。",
        source_id: "Eastman, C. I., & Burgess, H. J. (2009). How to travel the world without jet lag."
    },
    {
        id: "health_l08_circadian_05",
        type: "fill_blank",
        difficulty: "hard",
        xp: 15,
        question: "夜勤労働者は、[   ]のリスクが高まることが研究で示されている。",
        choices: ["がん・心血管疾患", "骨折", "視力低下", "聴力低下"],
        correct_index: 0,
        explanation: "夜勤による概日リズムの乱れは、がん（特に乳がん）、心血管疾患、糖尿病、肥満のリスクを高めることが多数の研究で示されています（Schernhammer et al., 2003）。",
        source_id: "Schernhammer, E. S., et al. (2003). Night-shift work and risk of colorectal cancer."
    },
    {
        id: "health_l08_circadian_06",
        type: "swipe_judgment",
        difficulty: "hard",
        xp: 15,
        question: "社会的時差ぼけ（Social Jet Lag）",
        statement: "平日と週末の睡眠時間のズレは、健康に悪影響を与える。",
        is_true: true,
        explanation: "社会的時差ぼけ（平日と週末の睡眠時間の差）は、肥満、糖尿病、心血管疾患のリスクを高めます。2時間以上のズレは特に有害です（Roenneberg et al., 2012）。",
        source_id: "Roenneberg, T., et al. (2012). Social jetlag and obesity."
    },
    {
        id: "health_l08_circadian_07",
        type: "multiple_choice",
        difficulty: "hard",
        xp: 15,
        question: "メラトニンサプリメントの最も効果的な使用法は？",
        choices: [
            "就寝の1-2時間前に少量（0.5-3mg）を摂取",
            "就寝直前に大量（10mg以上）を摂取",
            "朝起きた直後に摂取",
            "昼食後に摂取"
        ],
        correct_index: 0,
        explanation: "メラトニンは、就寝の1-2時間前に少量（0.5-3mg）摂取することで、体内時計を調整し、入眠を促進します。大量摂取は効果を高めません（Buscemi et al., 2006）。",
        source_id: "Buscemi, N., et al. (2006). Efficacy and safety of exogenous melatonin for secondary sleep disorders."
    },
    {
        id: "health_l08_circadian_08",
        type: "sort_order",
        difficulty: "hard",
        xp: 15,
        question: "光療法（Light Therapy）の手順",
        items: [
            "朝起きてすぐに実施",
            "10,000ルクスの光を使用",
            "30分間光を浴びる",
            "毎日同じ時刻に繰り返す"
        ],
        correct_order: [0, 1, 2, 3],
        explanation: "光療法は、朝起きてすぐに10,000ルクスの明るい光を30分間浴びることで、体内時計を前進させ、季節性うつ病や概日リズム障害を改善します（Terman & Terman, 2005）。",
        source_id: "Terman, M., & Terman, J. S. (2005). Light therapy for seasonal and nonseasonal depression."
    },
    {
        id: "health_l08_circadian_09",
        type: "fill_blank",
        difficulty: "hard",
        xp: 15,
        question: "体温は、概日リズムに従って変動し、通常[   ]に最低となる。",
        choices: ["早朝（午前4-6時）", "正午", "夕方", "深夜0時"],
        correct_index: 0,
        explanation: "体温は概日リズムに従い、早朝（午前4-6時頃）に最低となり、夕方（午後4-6時頃）に最高となります。この体温低下が深い睡眠を促進します。",
        source_id: "Roenneberg, T. (2012). Internal Time."
    },
    {
        id: "health_l08_circadian_10",
        type: "swipe_judgment",
        difficulty: "hard",
        xp: 15,
        question: "概日リズムと運動",
        statement: "運動のパフォーマンスは、夕方に最も高くなる。",
        is_true: true,
        explanation: "筋力、持久力、反応速度は、体温が最高となる夕方（午後4-6時頃）に最も高くなります。ただし、朝の運動も体内時計を前進させる効果があります（Drust et al., 2005）。",
        source_id: "Drust, B., et al. (2005). Circadian rhythms in sports performance."
    },
    {
        id: "health_l08_circadian_11",
        type: "multiple_choice",
        difficulty: "hard",
        xp: 15,
        question: "夜間のブルーライト曝露を減らす最も効果的な方法は？",
        choices: [
            "ブルーライトカットメガネを使用する",
            "画面の明るさを最大にする",
            "白色光に切り替える",
            "画面を近づける"
        ],
        correct_index: 0,
        explanation: "ブルーライトカットメガネ（琥珀色レンズ）は、夜間のブルーライト曝露を効果的に減らし、メラトニン分泌を保護します。画面のナイトモードも有効です（Burkhart & Phelps, 2009）。",
        source_id: "Burkhart, K., & Phelps, J. R. (2009). Amber lenses to block blue light and improve sleep."
    },
    {
        id: "health_l08_circadian_12",
        type: "fill_blank",
        difficulty: "hard",
        xp: 15,
        question: "概日リズムは、[   ]だけでなく、食事、運動、社会的活動によっても調整される。",
        choices: ["光", "音", "温度", "湿度"],
        correct_index: 0,
        explanation: "光は最も強力な同調因子（Zeitgeber）ですが、食事時間、運動、社会的活動も体内時計に影響を与えます。これらを組み合わせることで、より効果的にリズムを調整できます。",
        source_id: "Roenneberg, T. (2012). Internal Time."
    },
    {
        id: "health_l08_circadian_13",
        type: "swipe_judgment",
        difficulty: "hard",
        xp: 15,
        question: "朝型・夜型と生産性",
        statement: "朝型の人は、夜型の人よりも生産性が高い。",
        is_true: false,
        explanation: "朝型・夜型は単なる体内時計の違いであり、どちらが優れているわけではありません。重要なのは、自分のクロノタイプに合わせて活動時間を調整することです（Roenneberg, 2012）。",
        source_id: "Roenneberg, T. (2012). Internal Time."
    },
    {
        id: "health_l08_circadian_14",
        type: "multiple_choice",
        difficulty: "hard",
        xp: 15,
        question: "概日リズム睡眠障害（CRSD）の治療法として最も効果的なのは？",
        choices: [
            "光療法とメラトニン療法の組み合わせ",
            "睡眠薬のみ",
            "カフェインの大量摂取",
            "完全な暗闇での生活"
        ],
        correct_index: 0,
        explanation: "概日リズム睡眠障害（遅延型、前進型など）は、光療法とメラトニン療法を組み合わせることで、体内時計を効果的にリセットできます（Auger et al., 2015）。",
        source_id: "Auger, R. R., et al. (2015). Clinical Practice Guideline for the Treatment of Intrinsic Circadian Rhythm Sleep-Wake Disorders."
    },
    {
        id: "health_l08_circadian_15",
        type: "fill_blank",
        difficulty: "hard",
        xp: 15,
        question: "夜勤労働者は、夜勤後に[   ]色の光を避けることで、帰宅後の入眠を促進できる。",
        choices: ["青", "赤", "緑", "黄"],
        correct_index: 0,
        explanation: "夜勤後は、青色光（ブルーライト）を避けることで、メラトニン分泌を抑制せず、帰宅後の入眠を促進できます。サングラスやブルーライトカットメガネが有効です。",
        source_id: "Eastman, C. I., et al. (1994). Bright light treatment of winter depression."
    },

    // LEVEL 9: Gut-Brain Axis - 15 questions
    {
        id: "health_l09_gut_01",
        type: "multiple_choice",
        difficulty: "expert",
        xp: 20,
        question: "腸脳相関（Gut-Brain Axis）において、腸と脳を結ぶ主要な神経は？",
        choices: [
            "迷走神経",
            "坐骨神経",
            "視神経",
            "三叉神経"
        ],
        correct_index: 0,
        explanation: "迷走神経は、腸と脳を双方向に結ぶ主要な神経で、腸内細菌の情報を脳に伝え、脳からの信号を腸に伝えます（Mayer, E., 2016）。",
        source_id: "Mayer, E. (2016). The Mind-Gut Connection."
    },
    {
        id: "health_l09_gut_02",
        type: "swipe_judgment",
        difficulty: "expert",
        xp: 20,
        question: "腸内細菌とセロトニン",
        statement: "体内のセロトニンの約90%は、腸で産生される。",
        is_true: true,
        explanation: "セロトニンの約90%は腸内で産生され、腸の運動や感覚を調整します。腸内細菌はセロトニン産生に影響を与え、気分にも間接的に影響します（Yano et al., 2015）。",
        source_id: "Yano, J. M., et al. (2015). Indigenous bacteria from the gut microbiota regulate host serotonin biosynthesis."
    },
    {
        id: "health_l09_gut_03",
        type: "fill_blank",
        difficulty: "expert",
        xp: 20,
        question: "腸内細菌の多様性を高めるために最も効果的な食事は、[   ]を多く含む食品である。",
        choices: ["食物繊維", "砂糖", "飽和脂肪", "塩分"],
        correct_index: 0,
        explanation: "食物繊維（野菜、果物、全粒穀物）は、腸内細菌の多様性を高め、有益な短鎖脂肪酸（SCFA）の産生を促進します（Sonnenburg & Sonnenburg, 2014）。",
        source_id: "Sonnenburg, E. D., & Sonnenburg, J. L. (2014). Starving our microbial self: the deleterious consequences of a diet deficient in microbiota-accessible carbohydrates."
    },
    {
        id: "health_l09_gut_04",
        type: "sort_order",
        difficulty: "expert",
        xp: 20,
        question: "腸内細菌が脳に影響を与える経路",
        items: [
            "腸内細菌が代謝物を産生",
            "代謝物が腸壁を通過",
            "迷走神経または血流を介して脳に到達",
            "脳の神経伝達物質や炎症に影響"
        ],
        correct_order: [0, 1, 2, 3],
        explanation: "腸内細菌は、短鎖脂肪酸（SCFA）などの代謝物を産生し、これが迷走神経や血流を介して脳に到達し、神経伝達物質、炎症、気分に影響を与えます（Cryan & Dinan, 2012）。",
        source_id: "Cryan, J. F., & Dinan, T. G. (2012). Mind-altering microorganisms: the impact of the gut microbiota on brain and behaviour."
    },
    {
        id: "health_l09_gut_05",
        type: "swipe_judgment",
        difficulty: "expert",
        xp: 20,
        question: "プロバイオティクスとメンタルヘルス",
        statement: "特定のプロバイオティクス（サイコバイオティクス）は、不安やうつ症状を軽減する可能性がある。",
        is_true: true,
        explanation: "ラクトバチルスやビフィズス菌などの特定のプロバイオティクス（サイコバイオティクス）は、腸脳相関を介して不安やうつ症状を軽減することが研究で示されています（Dinan et al., 2013）。",
        source_id: "Dinan, T. G., et al. (2013). Psychobiotics: a novel class of psychotropic."
    },
    {
        id: "health_l09_gut_06",
        type: "multiple_choice",
        difficulty: "expert",
        xp: 20,
        question: "腸内細菌の多様性が低下する主な原因は？",
        choices: [
            "抗生物質の過剰使用と低繊維食",
            "運動不足",
            "睡眠不足",
            "ストレス"
        ],
        correct_index: 0,
        explanation: "抗生物質の過剰使用と低繊維・高脂肪・高糖質の食事は、腸内細菌の多様性を著しく低下させます。運動、睡眠、ストレスも影響しますが、食事と抗生物質が最大の要因です。",
        source_id: "Mayer, E. (2016). The Mind-Gut Connection."
    },
    {
        id: "health_l09_gut_07",
        type: "fill_blank",
        difficulty: "expert",
        xp: 20,
        question: "腸内細菌が産生する短鎖脂肪酸（SCFA）の一つである[   ]は、抗炎症作用を持つ。",
        choices: ["酪酸", "乳酸", "クエン酸", "リンゴ酸"],
        correct_index: 0,
        explanation: "酪酸（butyrate）は、腸内細菌が食物繊維を発酵させて産生する短鎖脂肪酸で、腸のバリア機能を強化し、抗炎症作用を持ちます（Koh et al., 2016）。",
        source_id: "Koh, A., et al. (2016). From Dietary Fiber to Host Physiology: Short-Chain Fatty Acids as Key Bacterial Metabolites."
    },
    {
        id: "health_l09_gut_08",
        type: "swipe_judgment",
        difficulty: "expert",
        xp: 20,
        question: "リーキーガット症候群",
        statement: "腸のバリア機能が低下すると、細菌や毒素が血流に漏れ出し、全身性炎症を引き起こす可能性がある。",
        is_true: true,
        explanation: "リーキーガット（腸管透過性亢進）は、腸壁のタイトジャンクションが緩み、細菌や毒素が血流に漏れ出す状態です。これが全身性炎症、自己免疫疾患、メンタルヘルス問題に関連する可能性があります（Fasano, 2012）。",
        source_id: "Fasano, A. (2012). Leaky gut and autoimmune diseases."
    },
    {
        id: "health_l09_gut_09",
        type: "multiple_choice",
        difficulty: "expert",
        xp: 20,
        question: "発酵食品が腸内環境に与える効果は？",
        choices: [
            "有益な乳酸菌を供給し、腸内細菌の多様性を高める",
            "腸内細菌を完全に除去する",
            "腸の運動を停止させる",
            "炎症を悪化させる"
        ],
        correct_index: 0,
        explanation: "ヨーグルト、キムチ、納豆などの発酵食品は、生きた乳酸菌を供給し、腸内細菌の多様性を高め、腸の健康を促進します（Tamang et al., 2016）。",
        source_id: "Tamang, J. P., et al. (2016). Fermented foods in a global age: East meets West."
    },
    {
        id: "health_l09_gut_10",
        type: "sort_order",
        difficulty: "expert",
        xp: 20,
        question: "腸内環境を改善する食事の優先順位",
        items: [
            "食物繊維を増やす（野菜、果物、全粒穀物）",
            "発酵食品を取り入れる（ヨーグルト、キムチ）",
            "加工食品と砂糖を減らす",
            "プロバイオティクスサプリメントを検討"
        ],
        correct_order: [0, 1, 2, 3],
        explanation: "腸内環境改善は、まず食物繊維を増やし、発酵食品を取り入れ、加工食品を減らすことが基本です。サプリメントは補助的に使用します。",
        source_id: "Mayer, E. (2016). The Mind-Gut Connection."
    },
    {
        id: "health_l09_gut_11",
        type: "fill_blank",
        difficulty: "expert",
        xp: 20,
        question: "ストレスは、[   ]を介して腸内細菌の組成を変化させる。",
        choices: ["HPA軸", "視床下部", "海馬", "扁桃体"],
        correct_index: 0,
        explanation: "ストレスはHPA軸（視床下部-下垂体-副腎軸）を活性化し、コルチゾールを分泌させます。これが腸の運動、分泌、バリア機能に影響し、腸内細菌の組成を変化させます（Mayer, 2016）。",
        source_id: "Mayer, E. (2016). The Mind-Gut Connection."
    },
    {
        id: "health_l09_gut_12",
        type: "swipe_judgment",
        difficulty: "expert",
        xp: 20,
        question: "腸内細菌と肥満",
        statement: "肥満者と痩せ型の人では、腸内細菌の組成が異なる。",
        is_true: true,
        explanation: "肥満者は、ファーミキューテス門の細菌が多く、バクテロイデーテス門が少ない傾向があります。腸内細菌は、エネルギー代謝、脂肪蓄積、炎症に影響を与えます（Turnbaugh et al., 2006）。",
        source_id: "Turnbaugh, P. J., et al. (2006). An obesity-associated gut microbiome with increased capacity for energy harvest."
    },
    {
        id: "health_l09_gut_13",
        type: "multiple_choice",
        difficulty: "expert",
        xp: 20,
        question: "プレバイオティクスとプロバイオティクスの違いは？",
        choices: [
            "プレバイオティクスは腸内細菌の餌、プロバイオティクスは生きた菌",
            "プレバイオティクスは生きた菌、プロバイオティクスは餌",
            "両方とも同じもの",
            "両方とも薬"
        ],
        correct_index: 0,
        explanation: "プレバイオティクスは、腸内細菌の餌となる食物繊維（イヌリン、オリゴ糖など）です。プロバイオティクスは、生きた有益な菌（乳酸菌、ビフィズス菌など）です。",
        source_id: "Gibson, G. R., et al. (2017). Expert consensus document: The International Scientific Association for Probiotics and Prebiotics."
    },
    {
        id: "health_l09_gut_14",
        type: "fill_blank",
        difficulty: "expert",
        xp: 20,
        question: "腸内細菌は、ビタミン[   ]を産生し、宿主に供給する。",
        choices: ["K", "C", "D", "A"],
        correct_index: 0,
        explanation: "腸内細菌は、ビタミンK、ビタミンB群（B12、葉酸など）を産生し、宿主の栄養状態に貢献します。",
        source_id: "LeBlanc, J. G., et al. (2013). Bacteria as vitamin suppliers to their host."
    },
    {
        id: "health_l09_gut_15",
        type: "swipe_judgment",
        difficulty: "expert",
        xp: 20,
        question: "糞便移植（FMT）",
        statement: "健康なドナーの腸内細菌を移植することで、難治性のクロストリジウム・ディフィシル感染症を治療できる。",
        is_true: true,
        explanation: "糞便移植（FMT）は、健康なドナーの腸内細菌を患者に移植する治療法で、クロストリジウム・ディフィシル感染症に対して90%以上の治癒率を示します（van Nood et al., 2013）。",
        source_id: "van Nood, E., et al. (2013). Duodenal infusion of donor feces for recurrent Clostridium difficile."
    },

    // LEVEL 10: HIIT Physiology - 15 questions
    {
        id: "health_l10_hiit_01",
        type: "swipe_judgment",
        difficulty: "expert",
        xp: 20,
        question: "HIIT（高強度インターバルトレーニング）",
        statement: "HIITは、短時間で有酸素運動と同等以上の効果を得られる。",
        is_true: true,
        explanation: "HIITは、短時間（10-20分）の高強度運動で、長時間の有酸素運動と同等以上の心肺機能向上、脂肪燃焼、インスリン感受性改善効果を得られます（Gibala, M., 2017）。",
        source_id: "Gibala, M. (2017). The One-Minute Workout."
    },
    {
        id: "health_l10_hiit_02",
        type: "multiple_choice",
        difficulty: "expert",
        xp: 20,
        question: "HIITが脂肪燃焼に効果的な理由は？",
        choices: [
            "運動後も代謝が高い状態（EPOC）が続くため",
            "運動中のカロリー消費が多いため",
            "筋肉量が急激に増えるため",
            "食欲が完全に抑制されるため"
        ],
        correct_index: 0,
        explanation: "HIITは、運動後も酸素消費量が増加する「EPOC（運動後過剰酸素消費）」を引き起こし、24-48時間代謝が高い状態が続くため、脂肪燃焼効果が高いです（Borsheim & Bahr, 2003）。",
        source_id: "Borsheim, E., & Bahr, R. (2003). Effect of exercise intensity, duration and mode on post-exercise oxygen consumption."
    },
    {
        id: "health_l10_hiit_03",
        type: "fill_blank",
        difficulty: "expert",
        xp: 20,
        question: "HIITは、ミトコンドリアの数と機能を増加させる[   ]を活性化する。",
        choices: ["PGC-1α", "mTOR", "AMPK", "IGF-1"],
        correct_index: 0,
        explanation: "HIITは、PGC-1α（ペルオキシソーム増殖因子活性化受容体γコアクチベーター1α）を活性化し、ミトコンドリアの生合成（mitochondrial biogenesis）を促進します（Little et al., 2010）。",
        source_id: "Little, J. P., et al. (2010). A practical model of low-volume high-intensity interval training induces mitochondrial biogenesis."
    },
    {
        id: "health_l10_hiit_04",
        type: "sort_order",
        difficulty: "expert",
        xp: 20,
        question: "HIITセッションの典型的な構成",
        items: [
            "ウォームアップ（5分）",
            "高強度インターバル（20-30秒）",
            "低強度リカバリー（1-2分）",
            "クールダウン（5分）"
        ],
        correct_order: [0, 1, 2, 3],
        explanation: "HIITは、ウォームアップ後、高強度運動（最大心拍数の80-95%）と低強度リカバリーを繰り返し、クールダウンで終了します。インターバルは4-8回繰り返します（Gibala, 2017）。",
        source_id: "Gibala, M. (2017). The One-Minute Workout."
    },
    {
        id: "health_l10_hiit_05",
        type: "swipe_judgment",
        difficulty: "expert",
        xp: 20,
        question: "HIITと心血管疾患",
        statement: "HIITは、心血管疾患患者にとって危険であり、推奨されない。",
        is_true: false,
        explanation: "適切に監督されたHIITは、心血管疾患患者にとっても安全で、心肺機能、血管機能、インスリン感受性を改善することが研究で示されています（Wisloff et al., 2007）。",
        source_id: "Wisloff, U., et al. (2007). Superior cardiovascular effect of aerobic interval training versus moderate continuous training."
    },
    {
        id: "health_l10_hiit_06",
        type: "multiple_choice",
        difficulty: "expert",
        xp: 20,
        question: "HIITの最適な頻度は？",
        choices: [
            "週2-3回",
            "毎日",
            "週1回",
            "月1回"
        ],
        correct_index: 0,
        explanation: "HIITは高強度のため、回復時間が必要です。週2-3回が最適で、過度なトレーニングは怪我やオーバートレーニングのリスクを高めます（Gibala, 2017）。",
        source_id: "Gibala, M. (2017). The One-Minute Workout."
    },
    {
        id: "health_l10_hiit_07",
        type: "fill_blank",
        difficulty: "expert",
        xp: 20,
        question: "HIITは、[   ]感受性を改善し、2型糖尿病のリスクを低減する。",
        choices: ["インスリン", "レプチン", "グレリン", "コルチゾール"],
        correct_index: 0,
        explanation: "HIITは、筋肉のグルコース取り込みを増加させ、インスリン感受性を改善します。これにより、2型糖尿病の予防と管理に効果的です（Little et al., 2011）。",
        source_id: "Little, J. P., et al. (2011). Low-volume high-intensity interval training reduces hyperglycemia and increases muscle mitochondrial capacity in patients with type 2 diabetes."
    },
    {
        id: "health_l10_hiit_08",
        type: "swipe_judgment",
        difficulty: "expert",
        xp: 20,
        question: "HIITと筋肉量",
        statement: "HIITは、筋肉量を増やすのに最も効果的なトレーニング方法である。",
        is_true: false,
        explanation: "HIITは心肺機能と代謝を改善しますが、筋肉量を増やすには、レジスタンストレーニング（筋力トレーニング）の方が効果的です。HIITは筋肉の質（ミトコンドリア密度）を向上させます。",
        source_id: "Gibala, M. (2017). The One-Minute Workout."
    },
    {
        id: "health_l10_hiit_09",
        type: "multiple_choice",
        difficulty: "expert",
        xp: 20,
        question: "タバタプロトコル（Tabata Protocol）の構成は？",
        choices: [
            "20秒全力運動 + 10秒休憩 × 8セット",
            "30秒全力運動 + 30秒休憩 × 10セット",
            "1分全力運動 + 1分休憩 × 5セット",
            "10秒全力運動 + 50秒休憩 × 20セット"
        ],
        correct_index: 0,
        explanation: "タバタプロトコルは、20秒の全力運動と10秒の休憩を8セット（合計4分）行うHIITの一種で、有酸素・無酸素能力を同時に向上させます（Tabata et al., 1996）。",
        source_id: "Tabata, I., et al. (1996). Effects of moderate-intensity endurance and high-intensity intermittent training."
    },
    {
        id: "health_l10_hiit_10",
        type: "sort_order",
        difficulty: "expert",
        xp: 20,
        question: "HIITによる代謝改善のメカニズム",
        items: [
            "高強度運動が筋肉にストレスを与える",
            "AMPK・PGC-1αが活性化",
            "ミトコンドリアが増加",
            "代謝能力が向上"
        ],
        correct_order: [0, 1, 2, 3],
        explanation: "HIITは、筋肉にストレスを与え、エネルギーセンサーであるAMPKとPGC-1αを活性化し、ミトコンドリアの生合成を促進し、代謝能力を向上させます（Gibala, 2017）。",
        source_id: "Gibala, M. (2017). The One-Minute Workout."
    },
    {
        id: "health_l10_hiit_11",
        type: "fill_blank",
        difficulty: "expert",
        xp: 20,
        question: "HIITは、[   ]を増加させ、心臓の健康を改善する。",
        choices: ["VO2max", "血圧", "コレステロール", "血糖値"],
        correct_index: 0,
        explanation: "VO2max（最大酸素摂取量）は、心肺機能の指標です。HIITは、VO2maxを効率的に増加させ、心臓の健康と持久力を改善します（Helgerud et al., 2007）。",
        source_id: "Helgerud, J., et al. (2007). Aerobic high-intensity intervals improve VO2max more than moderate training."
    },
    {
        id: "health_l10_hiit_12",
        type: "swipe_judgment",
        difficulty: "expert",
        xp: 20,
        question: "HIITと時間効率",
        statement: "週3回、各10分のHIITで、週150分の中強度有酸素運動と同等の健康効果を得られる。",
        is_true: true,
        explanation: "研究により、週3回、各10分（合計30分）のHIITで、週150分の中強度有酸素運動（WHOガイドライン）と同等の心肺機能、代謝、健康効果を得られることが示されています（Gibala et al., 2012）。",
        source_id: "Gibala, M. J., et al. (2012). Physiological adaptations to low-volume, high-intensity interval training in health and disease."
    },
    {
        id: "health_l10_hiit_13",
        type: "multiple_choice",
        difficulty: "expert",
        xp: 20,
        question: "HIITを始める際の注意点は？",
        choices: [
            "初心者は低強度から始め、徐々に強度を上げる",
            "初日から最大強度で行う",
            "ウォームアップは不要",
            "毎日行う"
        ],
        correct_index: 0,
        explanation: "HIITは高強度のため、初心者は低強度から始め、数週間かけて徐々に強度を上げることが推奨されます。ウォームアップとクールダウンも重要です（Gibala, 2017）。",
        source_id: "Gibala, M. (2017). The One-Minute Workout."
    },
    {
        id: "health_l10_hiit_14",
        type: "fill_blank",
        difficulty: "expert",
        xp: 20,
        question: "HIITは、[   ]を増加させ、脳の健康と認知機能を改善する。",
        choices: ["BDNF", "コルチゾール", "アドレナリン", "インスリン"],
        correct_index: 0,
        explanation: "HIIT（および運動全般）は、BDNF（脳由来神経栄養因子）を増加させ、神経細胞の成長、記憶、学習能力を向上させます（Cotman & Berchtold, 2002）。",
        source_id: "Cotman, C. W., & Berchtold, N. C. (2002). Exercise: a behavioral intervention to enhance brain health and plasticity."
    },
    {
        id: "health_l10_hiit_15",
        type: "swipe_judgment",
        difficulty: "expert",
        xp: 20,
        question: "HIITと年齢",
        statement: "HIITは若者にのみ適しており、高齢者には推奨されない。",
        is_true: false,
        explanation: "適切に調整されたHIITは、高齢者にとっても安全で効果的です。心肺機能、筋力、バランス、認知機能を改善し、転倒リスクを低減します（Hwang et al., 2016）。",
        source_id: "Hwang, C. L., et al. (2016). Novel all-extremity high-intensity interval training improves aerobic fitness, cardiac function and insulin resistance in healthy older adults."
    }
];

// Read existing health.json
const healthFilePath = '/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/data/lessons/health.json';
let existingData = [];

try {
    const fileContent = fs.readFileSync(healthFilePath, 'utf8');
    existingData = JSON.parse(fileContent);
    console.log(`📂 Loaded ${existingData.length} existing Health questions`);
} catch (error) {
    console.log(`📂 No existing Health file found, creating new one`);
}

// Merge and save
const mergedData = [...existingData, ...healthPremiumQuestions];
fs.writeFileSync(healthFilePath, JSON.stringify(mergedData, null, 2), 'utf8');

console.log(`✅ Successfully added ${healthPremiumQuestions.length} premium questions to health.json`);
console.log(`📊 Total questions in health.json: ${mergedData.length}`);
