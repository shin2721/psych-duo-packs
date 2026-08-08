import type {
  LessonLoadScore,
  LessonMetadata,
  LessonQuestionCountRange,
} from "../../types/question";

const QUESTION_RANGE_BY_LOAD_TOTAL: Record<number, LessonQuestionCountRange> = {
  3: { min: 5, max: 6, target: 5 },
  4: { min: 5, max: 6, target: 6 },
  5: { min: 7, max: 8, target: 7 },
  6: { min: 7, max: 8, target: 8 },
  7: { min: 9, max: 10, target: 9 },
  8: { min: 9, max: 10, target: 10 },
  9: { min: 9, max: 10, target: 10 },
};

export function getQuestionCountRangeForLoadScore(loadScore: LessonLoadScore): LessonQuestionCountRange {
  return QUESTION_RANGE_BY_LOAD_TOTAL[loadScore.total] ?? QUESTION_RANGE_BY_LOAD_TOTAL[6];
}

function loadScore(
  cognitive: LessonLoadScore["cognitive"],
  emotional: LessonLoadScore["emotional"],
  behavior_change: LessonLoadScore["behavior_change"]
): LessonLoadScore {
  return {
    cognitive,
    emotional,
    behavior_change,
    total: cognitive + emotional + behavior_change,
  };
}

function lessonMetadata(
  metadata: Omit<LessonMetadata, "question_count_range"> & {
    question_count_range?: LessonQuestionCountRange;
  }
): LessonMetadata {
  return {
    ...metadata,
    question_count_range:
      metadata.question_count_range ?? getQuestionCountRangeForLoadScore(metadata.load_score),
  };
}

const MENTAL_LESSON_METADATA: Record<string, LessonMetadata> = {
  mental_l01: lessonMetadata({
    lesson_id: "mental_l01",
    lane: "core",
    sequence_policy: "authored",
    lesson_job: "研究結果を先に予想させ、実際の数字と答え合わせして直感を校正する",
    target_shift: "教わってから確認する学習から、先に賭けてから種明かしされる学習へ移る",
    done_condition: "5枚の予想カードで、自分の予想と実測のズレを最低1回は目で見る",
    takeaway_action: "今週やると決めたことに、「いつ・どこで」を1つだけ足す。",
    insight_layer: {
      surprising_question: "あなたの直感は、心理学の実験結果を何問当てられる？",
      research_finding: "対面の頼み事で必要人数を約2倍に見積もるなど、場面ごとに直感と実測のズレが報告されている",
      critical_caveat: "数値の多くは小規模な単一研究の場面固有値で、別場面や個人の能力へ移植しない",
      usable_scope: "研究の数字を予想してから確かめる、直感の校正練習として使える",
      practice_prompt: "先に賭ける → 実数字 → ただし書き → 今日の一手",
    },
    load_score: loadScore(1, 1, 1),
    non_goals: [
      "的中率で性格や能力を判定すること",
      "単一研究の数字を別の場面へ移植すること",
    ],
  }),
  mental_l02: lessonMetadata({
    lesson_id: "mental_l02",
    lane: "core",
    locale_scope: ["ja"],
    sequence_policy: "authored",
    preview_prompt: "あなたの心配は、何%当たる？",
    lesson_job: "心配の予言に採点日をつけ、体感と実測のズレを確かめる",
    target_shift: "心配を事実の予告として抱え続ける状態から、採点できる予言として扱う",
    done_condition: "自分の心配を1つ、後日○×がつく一文に直し、採点日を決められる",
    takeaway_action: "今夜の心配をひとつ、「明日の夜に○×がつく一文」に直して、採点日を決める。",
    insight_layer: {
      surprising_question: "あなたの心配は、何%当たってる？",
      research_finding: "GAD基準の29人が記録・追跡した心配のうち、91.4%は実現しなかった(小規模研究)",
      critical_caveat: "単一の小規模研究で独立追試なし。「心配は無駄」の証明ではなく、危険・締切・体の異変には使わない",
      usable_scope: "確かめようがない曖昧な心配を、採点できる形に直す練習として使う",
      practice_prompt: "心配 → ○×がつく一文 → 採点日",
    },
    load_score: loadScore(2, 1, 1),
    non_goals: [
      "不安をゼロにすること",
      "予言の採点を治療法として扱うこと",
      "確認行動を増やすこと",
      "高リスク判断や危険確認を先延ばしにすること",
    ],
  }),
  mental_l03: lessonMetadata({
    lesson_id: "mental_l03",
    lane: "core",
    locale_scope: ["ja"],
    sequence_policy: "authored",
    preview_prompt: "心臓が速いことは、失敗がもう決まった証拠？",
    lesson_job: "本番前の身体信号と結果予測を分け、安全境界の内側で最初の一手を選ぶ",
    target_shift: "動悸を失敗の確定と読む状態から、体の速報と結果の予報を分ける",
    done_condition: "同一セッションの別の低リスク場面で、身体信号と結果予測を分け、覚醒が残ったまま最初の一手を選べる",
    takeaway_action: "体は？　予報は？　最初の一手は？",
    insight_layer: {
      surprising_question: "心臓が速いことは、失敗がもう決まった証拠？",
      research_finding: "小規模なGRE研究では、覚醒が役立つ可能性を伝えた群の数学得点が追加情報なし群より高かった",
      critical_caveat: "言語得点には差がなく、落ち着く群との比較でもない。新しい強い症状や具体的な危険には使わない",
      usable_scope: "安全上の異変や具体的な故障がない、いつもの低リスクな本番前にだけ使う",
      practice_prompt: "体の速報 / 結果の予報 / 最初の一手、に分ける",
    },
    load_score: loadScore(1, 1, 1),
    non_goals: [
      "覚醒を成功や安全の証拠にすること",
      "心拍や不安を下げること",
      "GRE数学の結果を面接やプレゼンへ効果として移植すること",
      "新しい強い症状や具体的な危険への対応を遅らせること",
    ],
  }),
  mental_l04: lessonMetadata({
    lesson_id: "mental_l04",
    lane: "core",
    lesson_job: "自責が始まった時に、責める前の観察へ戻る",
    target_shift: "失敗を性格の証明にせず、扱える出来事として見る",
    done_condition: "自責が出た時に、責める文と次の行動を分けて選べる",
    takeaway_action: "自責が出たら「次に直せる一手は何か」を1つだけ選ぶ",
    insight_layer: {
      surprising_question: "自分を責めるほど、次の改善に近づける？",
      research_finding: "自責が強い時は、反省よりも行動選択が狭まりやすい",
      critical_caveat: "責任をなかったことにする lesson ではない",
      usable_scope: "小さなミスや指摘の後、次の一手に戻る時に使える",
      practice_prompt: "責める文 / 直せる一手 / 保留、に分ける",
    },
    load_score: loadScore(2, 3, 2),
    non_goals: ["責任をなかったことにすること", "反省を禁止すること"],
  }),
  mental_l05: lessonMetadata({
    lesson_id: "mental_l05",
    lane: "core",
    lesson_job: "感情が重い時に、考え続けるか休むかを選び直す",
    target_shift: "長く考えるほど前進している、という前提をゆるめる",
    done_condition: "考え続けても進まない時に、休む・外へ出す・後で戻るの1つを選べる",
    takeaway_action: "同じ考えが続く時に、いったん外界へ注意を移す",
    insight_layer: {
      surprising_question: "長く考えるほど、問題解決に近づいている？",
      research_finding: "同じ思考が回るだけの状態は、整理より反芻に近いことがある",
      critical_caveat: "考えること自体を否定する lesson ではない",
      usable_scope: "新しい情報や次の行動が増えない時の切り替え判断に使える",
      practice_prompt: "休む / 外へ出す / 後で戻る、から選ぶ",
    },
    load_score: loadScore(2, 3, 2),
    non_goals: ["問題解決の放棄", "強い症状への自己対処だけの推奨"],
  }),
  mental_l06: lessonMetadata({
    lesson_id: "mental_l06",
    lane: "core",
    lesson_job: "再発しても戻れる形で学習を閉じる",
    target_shift: "一度できなかったことを失敗扱いせず、戻るルートとして扱える",
    done_condition: "崩れた時に戻る問いを1つ持ち、次の短い再開を選べる",
    takeaway_action: "崩れた時の戻る問いを1つ保存する",
    insight_layer: {
      surprising_question: "一度崩れたら、また最初からやり直し？",
      research_finding: "継続は失敗ゼロより、戻るルートを持つほど続きやすい",
      critical_caveat: "再発や中断が重い時に自己解決だけを求めるものではない",
      usable_scope: "streak が切れた翌日や、数日ぶりに再開する時に使える",
      practice_prompt: "戻る問い / 10秒再開 / 今日は休む、から選ぶ",
    },
    load_score: loadScore(3, 3, 2),
    non_goals: ["再発ゼロの約束", "重い状態の自己解決化"],
  }),
  mental_m01: lessonMetadata({
    lesson_id: "mental_m01",
    lane: "mastery",
    lesson_job: "反芻の入口に早く気づき、戻る一手を選ぶ",
    target_shift: "反芻を消すより、巻き込まれる前の数秒に気づく",
    done_condition: "反芻に少し早く気づき、戻る一手を1つ選べる",
    takeaway_action: "「また始まった」と短く言って、外界へ注意を戻す",
    insight_layer: {
      surprising_question: "反芻は始まってから止めるしかない？",
      research_finding: "反芻は早い入口に気づくほど、戻る一手を選びやすい",
      critical_caveat: "反芻を完全に消せるという主張ではない",
      usable_scope: "同じ場面を思い出し始めた数秒に使える",
      practice_prompt: "また始まった / 整理中 / いったん戻る、から選ぶ",
    },
    load_score: loadScore(1, 1, 1),
    non_goals: ["反芻の完全消去", "強い不眠や抑うつの自己治療"],
  }),
  mental_m02: lessonMetadata({
    lesson_id: "mental_m02",
    lane: "mastery",
    lesson_job: "別場面でも反芻と整理の違いを見分ける",
    target_shift: "場面が変わっても、同じところを回る思考を整理と区別できる",
    done_condition: "別の生活場面で、整理か反芻かを判断できる",
    takeaway_action: "新しい情報や次の一歩が増えているかを確認する",
    insight_layer: {
      surprising_question: "仕事でも人間関係でも、反芻の形は同じ？",
      research_finding: "場面が違っても、新しい情報が増えない反復思考は反芻として扱えることがある",
      critical_caveat: "すべての反復思考が悪いわけではない",
      usable_scope: "複数の生活場面で、整理か反芻かを見分ける練習に使える",
      practice_prompt: "新情報あり / 次の一歩あり / 同じ所を回る、から選ぶ",
    },
    load_score: loadScore(1, 1, 1),
    non_goals: ["考えること自体の否定", "判断を急がせること"],
  }),
  mental_m03: lessonMetadata({
    lesson_id: "mental_m03",
    lane: "mastery",
    lesson_job: "戻る一手を自分に合う形へ選び替える",
    target_shift: "1つの介入に固執せず、合わなければ別の戻り方へ切り替える",
    done_condition: "反芻が強まる時に、撤退条件を見て別の戻り方を選べる",
    takeaway_action: "合わない介入をやめ、足裏・呼吸・外界注視のどれかへ替える",
    insight_layer: {
      surprising_question: "効かない対処も、続ければ効くようになる？",
      research_finding: "介入は合う場面と合わない場面があり、撤退条件を持つ方が安全に使いやすい",
      critical_caveat: "どの介入も必ず効くという話ではない",
      usable_scope: "反芻が強まった時に、別の戻り方へ切り替える判断に使える",
      practice_prompt: "続ける / 替える / 休む、から選ぶ",
    },
    load_score: loadScore(1, 1, 1),
    non_goals: ["どの介入も必ず効くという主張", "悪化時の継続推奨"],
  }),
};

const CROSS_DOMAIN_LESSON_METADATA: Record<string, LessonMetadata> = {
  money_l01: lessonMetadata({
    lesson_id: "money_l01",
    lane: "core",
    lesson_job: "ストレス買いを意志の弱さではなく、商品に自己回復プレミアムが乗っている状態として見分ける",
    target_shift: "欲しい物を責める状態から、商品価値と今夜だけの上乗せ価値を切り分ける状態へ移る",
    done_condition: "カートに入れた瞬間に、明日の昼でも商品だけで欲しいかを10秒だけ見て、保留か購入判断を選べる",
    takeaway_action: "カートに入れた後、10秒だけ手を止めて「明日の昼、商品だけでも欲しい？」を見る",
    insight_layer: {
      surprising_question: "欲しい物を買っているのか、今夜だけ商品に自己回復プレミアムが乗っているのか？",
      research_finding: "孤独感やストレスが、穴埋め買い・見せる消費・依存っぽい買い方と関連することがある",
      critical_caveat: "観察研究の関連なので、全員の買い物原因とは断定しない",
      usable_scope: "オンラインショッピングでカートに入れた直後に、商品価値と自己回復プレミアムを切り分ける時には使える",
      practice_prompt: "商品価値 / 自己回復プレミアム / 見られたい価値、から選ぶ",
    },
    load_score: loadScore(3, 2, 3),
    non_goals: ["家計診断", "投資判断", "必要な購入の過度な先送り"],
  }),
  work_l01: lessonMetadata({
    lesson_id: "work_l01",
    lane: "core",
    lesson_job: "先延ばしを意志の弱さではなく始め方の問題として扱う",
    target_shift: "やる気が出るまで待つ状態から、最小着手を選ぶ状態へ移る",
    done_condition: "先延ばししたい時に、5分版か10秒の最小動作を1つ選べる",
    takeaway_action: "重いタスクを見たら、最初の5分版を1つだけ書き出す",
    insight_layer: {
      surprising_question: "先延ばしは、やる気不足が原因？",
      research_finding: "目標だけでなく、いつ・どこで・何を始めるかを決めると着手しやすくなる",
      critical_caveat: "疲労や過労まで意志で突破する lesson ではない",
      usable_scope: "重いタスクの最初の5分版を決める時に使える",
      practice_prompt: "5分版 / 10秒動作 / 今日は休む、から選ぶ",
    },
    load_score: loadScore(2, 2, 2),
    non_goals: ["過労時の作業継続", "休息が必要な状態の否定", "完璧な生産性管理"],
  }),
  work_l02: lessonMetadata({
    lesson_id: "work_l02",
    lane: "core",
    lesson_job: "完璧主義で止まる前に物理的な一歩を作る",
    target_shift: "完璧な準備を待つ状態から、ファイルを開くような最小動作へ移る",
    done_condition: "着手抵抗が高い時に、10秒でできる物理動作を1つ選べる",
    takeaway_action: "動けない時は、PCを開くか作業ファイルを1つ開く",
    insight_layer: {
      surprising_question: "完璧に準備してから始める方が、質は上がる？",
      research_finding: "着手の摩擦は、抽象的な決意より物理的な最初の動作で下げやすい",
      critical_caveat: "質が必要な作業の準備を軽視する話ではない",
      usable_scope: "ファイルを開く、タイトルを書くなど、10秒の開始動作に使える",
      practice_prompt: "PCを開く / ファイルを開く / 1行だけ書く、から選ぶ",
    },
    load_score: loadScore(2, 2, 3),
    non_goals: ["質が必要な仕事の軽視", "疲労や体調不良の無視", "長時間作業の強制"],
  }),
  health_l01: lessonMetadata({
    lesson_id: "health_l01",
    lane: "core",
    lesson_job: "眠れない焦りを覚醒ループとして見分ける",
    target_shift: "眠ろうと努力して焦る状態から、覚醒を下げる小さい選択へ移る",
    done_condition: "眠れない夜に、受容・スマホ距離・呼吸のどれかを1つ試せる",
    takeaway_action: "眠れない時は「眠れなくてもOK」と10秒だけ呟くか、スマホを遠ざける",
    insight_layer: {
      surprising_question: "眠れない時は、もっと眠ろうと努力すべき？",
      research_finding: "不眠への行動療法では、刺激制御やリラックスなど場面に応じた介入が重視される",
      critical_caveat: "慢性不眠の治療や睡眠制限を自己判断で行う lesson ではない",
      usable_scope: "寝る前の焦りを下げる短い選択には使える",
      practice_prompt: "受容 / スマホ距離 / 長い息、から選ぶ",
    },
    load_score: loadScore(2, 3, 2),
    non_goals: ["慢性不眠の自己治療", "医療相談の代替", "睡眠時間の保証"],
  }),
  social_l01: lessonMetadata({
    lesson_id: "social_l01",
    lane: "core",
    lesson_job: "断りにくい依頼を相手への否定と切り分ける",
    target_shift: "即答して後悔する状態から、依頼だけを保留・調整する状態へ移る",
    done_condition: "断りにくい時に、保留フレーズか依頼との切り分けを1つ使える",
    takeaway_action: "断りにくい時は「今は決められない、後で返すね」と保留する",
    insight_layer: {
      surprising_question: "断ることは、相手を否定すること？",
      research_finding: "依頼への返答は、相手そのものと依頼内容を分けると調整しやすい",
      critical_caveat: "危険な関係や強い上下関係を一人で解決する lesson ではない",
      usable_scope: "軽い依頼や予定調整で、即答前に保留する時に使える",
      practice_prompt: "保留する / 条件を出す / 断る、から選ぶ",
    },
    load_score: loadScore(2, 3, 2),
    non_goals: ["関係性の断絶推奨", "文化や上下関係の無視", "危険な場面での単独対応"],
  }),
  social_l02: lessonMetadata({
    lesson_id: "social_l02",
    lane: "core",
    lesson_job: "即答プレッシャーから10秒だけ距離を取る",
    target_shift: "その場で答えなければと思う状態から、確認時間を取る状態へ移る",
    done_condition: "即答したくなる場面で、手を止めるか確認フレーズを1つ選べる",
    takeaway_action: "DMや依頼が来たら、指を離して「確認させて」と返す",
    insight_layer: {
      surprising_question: "早く返すほど、関係は良くなる？",
      research_finding: "即答圧が強い時ほど、短い保留フレーズが後悔する返答を減らしやすい",
      critical_caveat: "緊急連絡や安全確認を遅らせる lesson ではない",
      usable_scope: "DMや依頼通知を見た直後の10秒停止に使える",
      practice_prompt: "指を離す / 確認させてと言う / すぐ返す、から選ぶ",
    },
    load_score: loadScore(2, 2, 2),
    non_goals: ["相手の無視", "緊急連絡の遅延", "境界線設定の万能化"],
  }),
  study_l01: lessonMetadata({
    lesson_id: "study_l01",
    lane: "core",
    lesson_job: "夜に安く見える決定を、情報と契約に分けて扱う",
    target_shift: "夜の結論をそのまま信じる状態から、情報だけ受け取り契約の見積もりを明日に回す状態へ移る",
    done_condition: "買う・送る・採用する前に、今ある情報と今結ぼうとしている契約を10秒で分けられる",
    takeaway_action: "夜に強い気持ちが来たら、10秒だけ「情報は何？ 契約は何？」を分ける",
    insight_layer: {
      surprising_question: "夜だけ、買う・送る・決めるが「今やるべき」に見えるのはなぜ？",
      research_finding: "疲れた状態では解釈や価値づけが強まり、情報と契約が一体化しやすい",
      critical_caveat: "夜の感情を嘘扱いせず、情報として受け取った上で契約の見積もりだけ延期する",
      usable_scope: "夜の買い物、LINE、AI計画、進路や仕事の大きな判断の直前に使える",
      practice_prompt: "情報 / 契約 / 明日に回す、から選ぶ",
    },
    load_score: loadScore(2, 2, 2),
    non_goals: ["緊急対応の先送り", "夜の感情の否定", "強い症状の自己解決化"],
  }),
};

const LESSON_METADATA_BY_ID: Record<string, LessonMetadata> = {
  ...MENTAL_LESSON_METADATA,
  ...CROSS_DOMAIN_LESSON_METADATA,
};

export function getLessonRuntimeMetadata(lessonId: string): LessonMetadata | null {
  return LESSON_METADATA_BY_ID[lessonId] ?? null;
}
