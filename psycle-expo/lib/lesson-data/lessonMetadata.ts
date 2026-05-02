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
    lesson_job: "ストレス反応を出来事だけでなく解釈と身体反応から見分ける",
    target_shift: "焦りを性格や出来事のせいだけにせず、反応として扱える",
    done_condition: "焦った時に身体反応へラベルを貼り、次の小さい一手を選べる",
    takeaway_action: "焦りを感じたら「身体が反応している」と10秒だけラベルを貼る",
    load_score: loadScore(2, 2, 2),
    non_goals: ["慢性的な強い不安の治療", "出来事の責任を否定すること"],
  }),
  mental_l02: lessonMetadata({
    lesson_id: "mental_l02",
    lane: "core",
    lesson_job: "不安な思考と事実を切り分ける",
    target_shift: "頭に浮かんだ最悪ケースを、そのまま事実として扱わない",
    done_condition: "不安な場面で、事実・推測・次の確認を1つずつ分けられる",
    takeaway_action: "不安が強い時に「事実は何か」を1つだけ書き出す",
    load_score: loadScore(2, 2, 2),
    non_goals: ["不安をゼロにすること", "危険確認を省略すること"],
  }),
  mental_l03: lessonMetadata({
    lesson_id: "mental_l03",
    lane: "core",
    lesson_job: "焦りの立ち上がりに10秒介入を挟む",
    target_shift: "焦りを抑え込むより、短い戻り方を選べる",
    done_condition: "焦りを感じた時に、ラベリング・捉え直し・呼吸のどれかを1つ試せる",
    takeaway_action: "焦ったら10秒だけ、身体ラベルか長い息を1回使う",
    load_score: loadScore(3, 2, 3),
    non_goals: ["焦りの完全消去", "危機対応が必要な場面での先送り"],
  }),
  mental_l04: lessonMetadata({
    lesson_id: "mental_l04",
    lane: "core",
    lesson_job: "自責が始まった時に、責める前の観察へ戻る",
    target_shift: "失敗を性格の証明にせず、扱える出来事として見る",
    done_condition: "自責が出た時に、責める文と次の行動を分けて選べる",
    takeaway_action: "自責が出たら「次に直せる一手は何か」を1つだけ選ぶ",
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
    load_score: loadScore(1, 1, 1),
    non_goals: ["どの介入も必ず効くという主張", "悪化時の継続推奨"],
  }),
};

const LESSON_METADATA_BY_ID: Record<string, LessonMetadata> = {
  ...MENTAL_LESSON_METADATA,
};

export function getLessonRuntimeMetadata(lessonId: string): LessonMetadata | null {
  return LESSON_METADATA_BY_ID[lessonId] ?? null;
}
