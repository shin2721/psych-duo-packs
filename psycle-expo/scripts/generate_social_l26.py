#!/usr/bin/env python3
import json

# Social Level 2: Non-verbal Communication
social_l02 = [
    {
        "id": "social_l02_001",
        "type": "multiple_choice",
        "question": "👀 会話中の「アイコンタクト」の黄金比率は？",
        "choices": ["相手の目を見る時間は全体の50-70%", "100%ずっと見つめる", "10%以下"],
        "correct_index": 0,
        "explanation": "【視線の心理学】\nずっと見つめると「威圧感」、見ないと「無関心」を与えます。話す時は50%、聞く時は70%くらいが、最も好感度が高いとされています。\n\n💡 Try this: 相手の目を見るのが苦手な人は、相手の「眉間」や「鼻」あたりを見るようにしましょう。",
        "source_id": "eye_contact_ratio_communication",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l02_002",
        "type": "true_false",
        "question": "👐 「オープン・ポスチャー」（開いた姿勢）は、相手に安心感を与える",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【姿勢の効果】\n腕組みや足組みを解き、手のひらを見せるような姿勢は、「私は敵ではない（武器を持っていない）」という原始的な信号を送り、信頼関係を築きやすくします。\n\n💡 Try this: 会話中は腕を組まず、体の正面を相手に向けましょう（へそを向ける）。",
        "source_id": "open_posture_trust",
        "difficulty": "easy",
        "xp": 5
    },
    {
        "id": "social_l02_003",
        "type": "multiple_choice",
        "question": "🗣️ 「メラビアンの法則」によると、第一印象で最も影響力が大きいのは？",
        "choices": ["視覚情報（見た目、表情）が55%", "聴覚情報（声のトーン）が38%", "言語情報（話す内容）が7%"],
        "correct_index": 0,
        "explanation": "【非言語の力】\n「ありがとう」と言葉で言っても、怒った顔（視覚）や怒鳴り声（聴覚）なら、相手は「怒っている」と判断します。非言語メッセージと言語メッセージを一致させることが重要です。\n\n💡 Try this: 謝る時は、言葉だけでなく「申し訳なさそうな表情と声」を作ることを意識しましょう。",
        "source_id": "mehrabian_rule_7_38_55",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l02_004",
        "type": "multiple_choice",
        "question": "👂 「傾聴」（アクティブ・リスニング）の基本スキル「バックトラッキング」とは？",
        "choices": ["相手の言った言葉をオウム返しする", "後ろに下がる", "自分の話をする"],
        "correct_index": 0,
        "explanation": "【オウム返し】\n「昨日、映画に行ったんだ」「へえ、映画に行ったんだ」と繰り返すだけで、相手は「話を聞いてくれている」「理解してくれている」と強く感じます。\n\n💡 Try this: 相手の話の「キーワード」や「感情を表す言葉」を拾って、そのまま返してみましょう。",
        "source_id": "active_listening_backtracking",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l02_005",
        "type": "true_false",
        "question": "😊 「作り笑い」でも、脳は楽しいと勘違いする",
        "choices": ["正しい（顔面フィードバック仮説）", "誤り"],
        "correct_index": 0,
        "explanation": "【表情と感情】\n表情筋の動きが脳にフィードバックされ、感情が生まれます。口角を上げて箸をくわえるだけでも、ドーパミンが出ることが実験で示されています。\n\n💡 Try this: 緊張する場面や落ち込んだ時こそ、意識的に口角を上げてみましょう。",
        "source_id": "facial_feedback_hypothesis",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l02_006",
        "type": "multiple_choice",
        "question": "🤝 「ミラーリング」の効果は？",
        "choices": ["相手と同じ動作をすることで、無意識の親近感（ラポール）を生む", "相手を不快にさせる", "特にない"],
        "correct_index": 0,
        "explanation": "【同調効果】\n仲の良い人たちは自然と動作がシンクロします。これを意図的に行う（相手が水を飲んだら自分も飲むなど）ことで、心理的な距離を縮められます。\n\n💡 Try this: 会話中、相手の姿勢やテンポ、声の大きさをさりげなく真似してみましょう。",
        "source_id": "mirroring_rapport_building",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l02_007",
        "type": "multiple_choice",
        "question": "🛑 相手が「嘘」をついている時の典型的なサインは？",
        "choices": ["特定のサインはないが、普段の行動との「変化」に注目する", "必ず目を逸らす", "必ず鼻を触る"],
        "correct_index": 0,
        "explanation": "【ベースライン】\n「嘘をつくと右を見る」などは俗説です。重要なのは「普段と違う動き（急に早口になる、急に静かになる）」を見つけることです。\n\n💡 Try this: 嘘を見抜こうとするより、相手がリラックスして話せる雰囲気を作る方が、真実を引き出せます。",
        "source_id": "deception_detection_baseline",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "social_l02_008",
        "type": "true_false",
        "question": "👔 服装（身だしなみ）は、能力の評価に影響を与える",
        "choices": ["正しい（ハロー効果）", "誤り（中身が全て）"],
        "correct_index": 0,
        "explanation": "【外見の力】\n清潔感のある服装をしているだけで、「仕事ができそう」「信頼できそう」というポジティブな評価が、能力や性格にまで波及します。\n\n💡 Try this: 重要なプレゼンの日は、自分の中で「一番自信が持てる服」を着ていきましょう。",
        "source_id": "halo_effect_appearance",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l02_009",
        "type": "multiple_choice",
        "question": "📏 「パーソナルスペース」を侵された時の反応は？",
        "choices": ["不快感や恐怖を感じ、防衛的になる", "嬉しくなる", "何も感じない"],
        "correct_index": 0,
        "explanation": "【対人距離】\n親密でない人が45cm以内（密接距離）に入ると、脳の扁桃体が「脅威」と判断します。適切な距離感（1.2m程度）を保つことが礼儀です。\n\n💡 Try this: 相手が後ろに下がったら、それは「近づきすぎ」のサインです。一歩下がりましょう。",
        "source_id": "proxemics_hall_1966",
        "difficulty": "easy",
        "xp": 5
    },
    {
        "id": "social_l02_010",
        "type": "multiple_choice",
        "question": "🤐 「沈黙」が怖い時の対処法は？",
        "choices": ["沈黙を「相手が思考を整理している時間」とポジティブに捉える", "慌てて喋りまくる", "帰る"],
        "correct_index": 0,
        "explanation": "【沈黙の共有】\n沈黙は会話の失敗ではありません。無理に埋めようとせず、ニコニコして待つ余裕が、相手に安心感を与えます。\n\n💡 Try this: 沈黙が訪れたら、心の中で「3秒」数えてから、ゆっくり話し始めましょう。",
        "source_id": "silence_in_communication",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l02_011",
        "type": "true_false",
        "question": "🦶 足の向きは、相手への関心度を表す",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【足の言葉】\n顔や体は嘘をつけますが、足は無意識が出やすいです。つま先が出口を向いていたら、「帰りたい」「会話を終わらせたい」サインです。\n\n💡 Try this: 立ち話をする時、相手のつま先が自分に向いているかチェックしてみましょう。",
        "source_id": "feet_direction_body_language",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l02_012",
        "type": "multiple_choice",
        "question": "👐 手のひらを隠す（ポケットに入れる、机の下に隠す）心理は？",
        "choices": ["何かを隠している、または不安を感じている", "リラックスしている", "寒がり"],
        "correct_index": 0,
        "explanation": "【手の開示】\n手が見えないと、相手は本能的に警戒します。手を見せることは「隠し事がない」という証明であり、信頼度を上げます。\n\n💡 Try this: プレゼンや会話では、手を机の上に出し、ジェスチャーを交えて話しましょう。",
        "source_id": "hand_gestures_trust",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l02_013",
        "type": "multiple_choice",
        "question": "🗣️ 声のトーンが低いと、どのような印象を与える？",
        "choices": ["権威、信頼、落ち着き", "興奮、未熟", "嘘つき"],
        "correct_index": 0,
        "explanation": "【低い声の効果】\nリーダーや政治家は、重要なことを話す時にあえて声のトーンを下げます。低い声は説得力を高めます。\n\n💡 Try this: 重要な提案をする時は、深呼吸をして、普段より少し低い声でゆっくり話しましょう。",
        "source_id": "voice_pitch_perception",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l02_014",
        "type": "true_false",
        "question": "👀 瞬き（まばたき）が多い人は、緊張やストレスを感じている可能性が高い",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【瞬きの頻度】\n通常は1分間に15-20回ですが、緊張や嘘をついている時は回数が急増します。脳の情報処理負荷が上がっているサインです。\n\n💡 Try this: 自分が緊張していると感じたら、意識的にゆっくり瞬きをして、脳を落ち着かせましょう。",
        "source_id": "blinking_rate_stress",
        "difficulty": "easy",
        "xp": 5
    },
    {
        "id": "social_l02_015",
        "type": "multiple_choice",
        "question": "🧠 「パワーポーズ」（仁王立ちなど）の効果は？",
        "choices": ["自信を感じさせ、テストステロンを増やす可能性がある（議論あり）", "筋肉痛になる", "背が伸びる"],
        "correct_index": 0,
        "explanation": "【エイミー・カディ】\n体を大きく広げるポーズを2分間とるだけで、自信が湧いてくるという研究があります（再現性には議論がありますが、主観的な自信向上効果は認められています）。\n\n💡 Try this: 面接やプレゼンの直前に、トイレの個室でガッツポーズをして自分を鼓舞しましょう。",
        "source_id": "power_posing_cuddy",
        "difficulty": "hard",
        "xp": 15
    }
]

# Social Level 3: Conflict Resolution
social_l03 = [
    {
        "id": "social_l03_001",
        "type": "multiple_choice",
        "question": "🔥 怒っている相手を鎮める最初のステップは？",
        "choices": ["相手の言い分を否定せず、感情に共感する（ガス抜き）", "論理的に反論する", "「落ち着いて」と言う"],
        "correct_index": 0,
        "explanation": "【感情の受容】\n「落ち着いて」は逆効果です。「それは腹が立ちますよね」と感情を受け止めることで、相手は「分かってもらえた」と感じ、怒りのボルテージが下がります。\n\n💡 Try this: クレーム対応では、まず「不快な思いをさせて申し訳ありません」と感情に対して謝罪しましょう。",
        "source_id": "conflict_deescalation_empathy",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l03_002",
        "type": "true_false",
        "question": "🗣️ 「I（アイ）メッセージ」を使うと、対立が起きにくい",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【主語の変換】\n「あなたは遅刻ばかりだ（Youメッセージ）」は攻撃に聞こえますが、「私はあなたが遅れると心配だ（Iメッセージ）」は自分の感情の開示なので、相手は素直に受け取れます。\n\n💡 Try this: 文句を言いたい時は、主語を「私」に変えて伝えてみましょう。",
        "source_id": "i_message_gordon",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l03_003",
        "type": "multiple_choice",
        "question": "🧠 「根本的帰属の誤り」とは？",
        "choices": ["他人の失敗を「性格のせい」にし、自分の失敗を「環境のせい」にすること", "根本的な解決をすること", "誤りを認めないこと"],
        "correct_index": 0,
        "explanation": "【ダブルスタンダード】\n相手が遅刻したら「ルーズな人だ」と思い、自分が遅刻したら「電車が遅れたから」と言い訳します。このバイアスを知れば、他人にも寛容になれます。\n\n💡 Try this: 相手がミスをした時、「何か事情があったのかも？」と環境要因を探してみましょう。",
        "source_id": "fundamental_attribution_error_ross",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "social_l03_004",
        "type": "multiple_choice",
        "question": "🤝 「アサーション」（自己主張）とは？",
        "choices": ["自分も相手も大切にする、誠実で対等なコミュニケーション", "自分の意見を押し通すこと（攻撃的）", "我慢すること（非主張的）"],
        "correct_index": 0,
        "explanation": "【爽やかな自己主張】\nアサーションは「ドラえもん」のしずかちゃんタイプです（ジャイアンは攻撃的、のび太は非主張的）。NOと言うべき時は、相手を尊重しつつハッキリNOと言います。\n\n💡 Try this: 断る時は「誘ってくれてありがとう（感謝）。でも都合が悪いんだ（拒否）。また誘ってね（代替案）」のサンドイッチ法を使いましょう。",
        "source_id": "assertiveness_training",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l03_005",
        "type": "true_false",
        "question": "🤐 議論に勝つことは、人間関係においてプラスになる",
        "choices": ["誤り（恨みを買うだけ）", "正しい"],
        "correct_index": 0,
        "explanation": "【カーネギー】\n「議論に勝つ唯一の方法は、議論を避けることだ」。論破して相手を打ち負かしても、相手の自尊心を傷つけ、敵を作るだけです。\n\n💡 Try this: 意見が食い違ったら、「そういう考え方もあるね」と認め、勝ち負けの土俵から降りましょう。",
        "source_id": "how_to_win_friends_argument",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l03_006",
        "type": "multiple_choice",
        "question": "🧠 「認知的不協和」を使って敵を味方にする方法は？",
        "choices": ["相手に小さなお願いをして、助けてもらう（ベンジャミン・フランクリン効果）", "相手にお金をあげる", "相手を褒める"],
        "correct_index": 0,
        "explanation": "【フランクリン効果】\n嫌いな人を助けてしまった時、脳は矛盾を解消するために「助けたということは、私は彼が好きなんだ」と感情を書き換えます。\n\n💡 Try this: 苦手な人に「ペン貸して」など、断りにくい小さなお願いをしてみましょう。",
        "source_id": "benjamin_franklin_effect",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "social_l03_007",
        "type": "multiple_choice",
        "question": "🛡️ 「心理的安全性」が高いチームの特徴は？",
        "choices": ["「無知やミスをさらけ出しても、馬鹿にされない」という安心感がある", "みんな仲良しで喧嘩がない", "ミスが許されない緊張感がある"],
        "correct_index": 0,
        "explanation": "【Googleの研究】\n生産性が高いチームの共通点は、能力の高さではなく「心理的安全性」でした。安心して発言できる環境が、学習とイノベーションを生みます。\n\n💡 Try this: リーダーなら、まず自分の失敗談を話し、「完璧でなくていい」という空気を作りましょう。",
        "source_id": "psychological_safety_google",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l03_008",
        "type": "true_false",
        "question": "👂 「要約して返す」ことは、誤解を防ぐ最強の方法である",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【確認の技術】\n「つまり、あなたの言いたいことは〇〇ということですね？」と要約して確認することで、認識のズレを修正し、相手に「話が通じた」という満足感を与えます。\n\n💡 Try this: 議論が複雑になったら、「一旦整理させてください」と言って要約を入れましょう。",
        "source_id": "summarizing_communication_skill",
        "difficulty": "easy",
        "xp": 5
    },
    {
        "id": "social_l03_009",
        "type": "multiple_choice",
        "question": "🧠 「アンガーマネジメント」の「6秒ルール」とは？",
        "choices": ["怒りのピークは6秒しか続かないので、その間やり過ごせば爆発を防げる", "6秒以内に怒る", "6回深呼吸する"],
        "correct_index": 0,
        "explanation": "【理性の起動時間】\n怒りを感じてから、理性の脳（前頭前野）が働き始めるまで約6秒かかります。この6秒間、反射的に言い返さなければ勝ちです。\n\n💡 Try this: カッとなったら、心の中で「1, 2, 3...」とゆっくり数を数えましょう。",
        "source_id": "anger_management_6seconds",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l03_010",
        "type": "multiple_choice",
        "question": "🤝 「DESC法」を使った伝え方の順序は？",
        "choices": ["Describe（事実）→Express（感情）→Suggest（提案）→Consequence（結果）", "Do→Eat→Sleep→Call", "Dream→Enjoy→Smile→Cry"],
        "correct_index": 0,
        "explanation": "【問題解決の型】\n1.事実を客観的に述べ、2.自分の気持ちを伝え、3.解決策を提案し、4.そのメリットを伝える。この順序なら感情的にならずに建設的な議論ができます。\n\n💡 Try this: 言いにくいことを伝える時、事前にDESCの4項目を紙に書き出してから話しましょう。",
        "source_id": "desc_method_assertion",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "social_l03_011",
        "type": "true_false",
        "question": "🤐 批判をする時は「サンドイッチ法」が良い",
        "choices": ["正しい（褒める→批判→褒める）", "誤り（批判は単刀直入が良い）"],
        "correct_index": 0,
        "explanation": "【フィードバック】\nいきなり批判すると相手は心を閉じます。まず肯定的な点を伝え、次に改善点を伝え、最後は期待で締めることで、相手は批判を受け入れやすくなります。\n\n💡 Try this: ダメ出しをする前に、必ず一つ「良いところ」を見つけて伝えましょう。",
        "source_id": "sandwich_feedback_method",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l03_012",
        "type": "multiple_choice",
        "question": "🧠 「敵意帰属バイアス」とは？",
        "choices": ["相手の何気ない行動を「自分への悪意」だと解釈してしまう傾向", "敵を味方と思うこと", "全員を敵だと思うこと"],
        "correct_index": 0,
        "explanation": "【被害妄想】\nメールの返信が遅いだけで「嫌われている」と思ったり、目が合っただけで「睨まれた」と思ったりする認知の歪みです。攻撃的な行動の原因になります。\n\n💡 Try this: ネガティブな解釈が浮かんだら、「他の可能性（忙しいだけ、視力が悪いだけ）」を3つ考えてみましょう。",
        "source_id": "hostile_attribution_bias",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "social_l03_013",
        "type": "multiple_choice",
        "question": "🤝 「妥協」と「協力」の違いは？",
        "choices": ["妥協は「両方が少しずつ損をする」、協力は「両方が得をする」", "同じ意味", "妥協の方が良い"],
        "correct_index": 0,
        "explanation": "【コンフリクト・マネジメント】\n妥協（50:50）は手っ取り早いですが、不満が残ります。協力（Win-Win）は時間はかかりますが、創造的な解決策で両者の満足度を最大化します。\n\n💡 Try this: 安易に「間を取ろう」とせず、「両方の希望を100%叶える方法はないか？」と粘りましょう。",
        "source_id": "thomas_kilmann_conflict_mode",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l03_014",
        "type": "true_false",
        "question": "🗣️ 謝罪する時は「言い訳（理由）」を先に言った方が良い",
        "choices": ["誤り（言い訳は火に油を注ぐ）", "正しい"],
        "correct_index": 0,
        "explanation": "【謝罪の鉄則】\n「遅れてすみません、電車が...」と言うと、相手は「反省していない」と感じます。まず全面的に非を認め、理由は聞かれたら答えるのが正解です。\n\n💡 Try this: 謝罪の言葉の後に「でも」「だって」という接続詞を使わないようにしましょう。",
        "source_id": "apology_psychology_no_excuses",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l03_015",
        "type": "multiple_choice",
        "question": "🧠 「透明性の錯覚」とは？",
        "choices": ["「自分の感情や考えは、相手に伝わっているはずだ」と思い込むこと", "自分が透明人間になったと思うこと", "嘘がバレること"],
        "correct_index": 0,
        "explanation": "【言わなきゃ分からない】\n自分の中では明白でも、相手には全く伝わっていません。「察してほしい」という期待は、すれ違いと失望の元です。\n\n💡 Try this: 重要なことは、「言葉にしなくても分かるよね」と思わず、あえて言葉にして伝えましょう。",
        "source_id": "illusion_of_transparency_gilovich",
        "difficulty": "hard",
        "xp": 15
    }
]

# Social Level 4: Persuasion (Cialdini's 6 Principles)
social_l04 = [
    {
        "id": "social_l04_001",
        "type": "multiple_choice",
        "question": "🎁 チャルディーニの「返報性（Reciprocity）」とは？",
        "choices": ["何かをもらうと、お返しをせずにはいられなくなる心理", "復讐すること", "無視すること"],
        "correct_index": 0,
        "explanation": "【恩の力】\nスーパーの試食や無料サンプルはこれを利用しています。小さな「借り」を作らせることで、購入という大きな「返し」を引き出します。\n\n💡 Try this: お願い事をする前に、まず自分から相手に小さな親切（情報提供やお菓子など）をしましょう。",
        "source_id": "cialdini_reciprocity",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l04_002",
        "type": "true_false",
        "question": "👍 「一貫性（Consistency）」の原理により、一度宣言した目標は達成しやすくなる",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【コミットメント】\n人は「自分の言動を一致させたい」という強い欲求があります。公言（パブリック・コミットメント）すると、引くに引けなくなり、行動が強化されます。\n\n💡 Try this: 目標を紙に書き、SNSや友人に宣言して、自分を追い込みましょう。",
        "source_id": "cialdini_consistency_commitment",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l04_003",
        "type": "multiple_choice",
        "question": "👥 「社会的証明（Social Proof）」が働く状況は？",
        "choices": ["「一番人気」「みんな使っている」と言われると安心する", "誰も使っていないものが欲しくなる", "証明書をもらう"],
        "correct_index": 0,
        "explanation": "【同調行動】\n判断に迷った時、人は「他人の行動」を正解とみなします。行列ができている店がさらに行列を呼ぶのはこのためです。\n\n💡 Try this: 自分の意見を通したい時、「多くの人が賛成している」というデータや事例を添えましょう。",
        "source_id": "cialdini_social_proof",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l04_004",
        "type": "multiple_choice",
        "question": "❤️ 「好意（Liking）」を獲得する最も簡単な方法は？",
        "choices": ["相手との「共通点」を見つけて話題にする", "お金をあげる", "自慢話をする"],
        "correct_index": 0,
        "explanation": "【類似性】\n人は自分と似ている人（出身地、趣味、価値観など）に無条件で好意を持ち、その人の頼みを聞きやすくなります。\n\n💡 Try this: 初対面の人とは、まず天気や出身地などの話題で「共通点探し」ゲームをしましょう。",
        "source_id": "cialdini_liking_similarity",
        "difficulty": "easy",
        "xp": 5
    },
    {
        "id": "social_l04_005",
        "type": "true_false",
        "question": "👮 「権威（Authority）」には、中身がなくても「見た目」だけで従ってしまう",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【制服効果】\n警備員の制服を着ているだけで、理不尽な命令でも人が従う実験結果があります。肩書きや服装は強力な説得ツールです。\n\n💡 Try this: 説得力を上げたいなら、専門用語を適切に使ったり、スーツを着たりして「専門家らしさ」を演出しましょう。",
        "source_id": "cialdini_authority_symbols",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l04_006",
        "type": "multiple_choice",
        "question": "⏳ 「希少性（Scarcity）」をアピールするフレーズは？",
        "choices": ["「残り3個です」「今だけ半額です」", "「いつでも買えます」", "「在庫は山ほどあります」"],
        "correct_index": 0,
        "explanation": "【失う恐怖】\n人は「手に入れる喜び」より「失う恐怖」に敏感です。「機会を逃す」と思わせることで、決断を迫ることができます。\n\n💡 Try this: デートに誘う時、「いつでもいいよ」ではなく「今週末しか空いてないんだ」と限定性を出してみましょう。",
        "source_id": "cialdini_scarcity_loss_aversion",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l04_007",
        "type": "multiple_choice",
        "question": "🗣️ 「カチッ・サー効果」（Click, Whirr）とは？",
        "choices": ["特定のトリガー（理由づけ）があると、自動的に承諾してしまう現象", "機械が壊れる音", "写真を撮る音"],
        "correct_index": 0,
        "explanation": "【理由の力】\nコピー機の実験で、「急いでいるので先にコピーさせて」と言うと94%が譲ってくれましたが、単に「先にコピーさせて」だと60%でした。「〜ので（理由）」という言葉がトリガーになります。\n\n💡 Try this: お願いする時は、どんな些細なことでも「〜なので」と理由を付け加えましょう。",
        "source_id": "langer_copy_machine_study",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "social_l04_008",
        "type": "true_false",
        "question": "🎁 お世辞（おべっか）は、バレていても効果がある",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【好意の返報性】\n人は自分を褒めてくれる人が好きです。たとえそれが下心のあるお世辞だと分かっていても、無意識レベルで好感度は上がります。\n\n💡 Try this: 恥ずかしがらずに、相手の良いところを言葉にして褒めましょう。",
        "source_id": "flattery_effectiveness_study",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l04_009",
        "type": "multiple_choice",
        "question": "🧠 「ロー・ボール・テクニック」（特典除去法）とは？",
        "choices": ["好条件で承諾させた後で、条件を悪くしても、承諾が撤回されにくい心理", "低いボールを投げる", "相手を低く見る"],
        "correct_index": 0,
        "explanation": "【一貫性の罠】\n一度「買います」と決断すると、後から「実はオプション料金がかかります」と言われても、人は自分の決断を正当化しようとして、そのまま買ってしまいます。\n\n💡 Try this: 条件が後から変わったら、一度白紙に戻して「最初の条件でなくても買ったか？」と冷静に考え直しましょう。",
        "source_id": "low_ball_technique_cialdini",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "social_l04_010",
        "type": "multiple_choice",
        "question": "👥 「バンドワゴン効果」を避けるには？",
        "choices": ["「みんな」ではなく「自分」にとっての価値を考える", "流行に乗る", "行列に並ぶ"],
        "correct_index": 0,
        "explanation": "【批判的思考】\n多数派が常に正しいとは限りません。バブルや集団パニックは社会的証明の暴走です。自分の頭で考える癖をつけましょう。\n\n💡 Try this: 「みんなが言っている」という言葉を聞いたら、「具体的に誰？」と問い返してみましょう。",
        "source_id": "bandwagon_effect_avoidance",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l04_011",
        "type": "true_false",
        "question": "🤝 自分の弱みを見せる（自己開示）と、信頼関係が深まる",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【返報性】\nあなたが心を開いて弱みを見せると、相手も「信頼されている」と感じ、自分の弱みを見せてくれるようになります。これが深い絆の始まりです。\n\n💡 Try this: 完璧な自分を演じるのをやめ、失敗談や悩みを少し話してみましょう。",
        "source_id": "self_disclosure_reciprocity",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l04_012",
        "type": "multiple_choice",
        "question": "🧠 「コントラストの原理」（知覚の対比）とは？",
        "choices": ["高いスーツを見せた後に安いネクタイを見せると、すごく安く感じる", "色がはっきり見える", "音が大きく聞こえる"],
        "correct_index": 0,
        "explanation": "【比較の罠】\n3万円のネクタイは高いですが、20万円のスーツを買った直後なら安く感じます。基準値（アンカー）を操作されると、金銭感覚が狂います。\n\n💡 Try this: オプション品を買う時は、本体価格との比較ではなく、単体での価値を考えましょう。",
        "source_id": "contrast_principle_cialdini",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l04_013",
        "type": "multiple_choice",
        "question": "🗣️ 「イエス・セット」話法とは？",
        "choices": ["「天気いいですね」「はい」など、何度もYESと言わせることで、本題もYESと言いやすくする", "YESしか言わない", "NOと言わせる"],
        "correct_index": 0,
        "explanation": "【一貫性の慣性】\n肯定的な返事を繰り返すと、脳が「肯定モード」になり、拒否への抵抗感が下がります。\n\n💡 Try this: お願い事をする前に、相手が確実に同意できる話題（天気や共通の事実）を2-3個振りましょう。",
        "source_id": "yes_set_erickson",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l04_014",
        "type": "true_false",
        "question": "🎁 頼み事をする時、「〜してくれませんか？」より「〜してほしい」と言う方が良い",
        "choices": ["誤り（選択権を与える方が良い）", "正しい"],
        "correct_index": 0,
        "explanation": "【BYAF法】\n「But You Are Free（断るのもあなたの自由ですが）」と付け加えると、相手は「強制されていない（自律性がある）」と感じ、逆に承諾率が2倍になるという研究があります。\n\n💡 Try this: 頼み事の最後に「もちろん、無理なら断ってくれて大丈夫だよ」と一言添えましょう。",
        "source_id": "but_you_are_free_technique",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "social_l04_015",
        "type": "multiple_choice",
        "question": "🧠 「接種理論」とは？",
        "choices": ["弱い反論をあえて提示し、それを論破しておくことで、将来の強い反論への耐性（免疫）をつける", "予防接種を受ける", "相手を攻撃する"],
        "correct_index": 0,
        "explanation": "【説得の予防接種】\n「競合他社は安いですが、品質はうちが上です」と先にデメリットに触れておくことで、後で他社の営業が来ても「ああ、安いだけの商品ね」と説得されなくなります。\n\n💡 Try this: 自分の意見を通す時は、予想される反論を自分から挙げ、それに答えておきましょう。",
        "source_id": "inoculation_theory_mcguire",
        "difficulty": "hard",
        "xp": 15
    }
]

# Social Level 5: Empathy & Compassion
social_l05 = [
    {
        "id": "social_l05_001",
        "type": "multiple_choice",
        "question": "🧠 「認知的共感」と「情動的共感」の違いは？",
        "choices": ["認知的＝相手の視点を理解する（頭）、情動的＝相手と同じ感情になる（心）", "同じもの", "認知的の方が偉い"],
        "correct_index": 0,
        "explanation": "【共感の種類】\nサイコパスは「認知的共感」は高いが「情動的共感」が欠如していると言われます。バランスの良い共感には両方が必要です。\n\n💡 Try this: 相手の話を聞く時、「どう考えているか（視点）」と「どう感じているか（感情）」の両方を想像しましょう。",
        "source_id": "cognitive_vs_emotional_empathy",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l05_002",
        "type": "true_false",
        "question": "🧘 「共感疲労」（コンパッション・ファティーグ）を防ぐには、共感を止めるしかない",
        "choices": ["誤り（共感から慈悲へ切り替える）", "正しい"],
        "correct_index": 0,
        "explanation": "【共感の罠】\n相手の痛みを自分の痛みとして感じ続けると燃え尽きます。「痛み」ではなく「助けたいという願い（慈悲/コンパッション）」に変換することで、脳の回路が変わり、元気が出ます。\n\n💡 Try this: 辛い話を聞いて苦しくなったら、「その苦しみがなくなりますように」と心の中で祈りましょう。",
        "source_id": "empathy_vs_compassion_singer",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "social_l05_003",
        "type": "multiple_choice",
        "question": "🧠 「心の理論」とは？",
        "choices": ["他者には自分とは違う心（信念、意図、知識）があると理解する能力", "心を操る理論", "心理学の別名"],
        "correct_index": 0,
        "explanation": "【メタ認知】\n4歳頃から発達します。「私はこれを知っているが、彼は知らないはずだ」と推測できる能力です。これがコミュニケーションの基礎です。\n\n💡 Try this: 説明が伝わらない時、「相手の頭の中には、どんな前提知識がないのか？」と考えてみましょう。",
        "source_id": "theory_of_mind_development",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l05_004",
        "type": "multiple_choice",
        "question": "🤝 「ラポール」（信頼関係）を築くのに最も重要なのは？",
        "choices": ["相手を尊重し、無条件の肯定的関心を向けること", "面白い話をすること", "プレゼントをすること"],
        "correct_index": 0,
        "explanation": "【ロジャーズ】\nテクニックではなく、「あなたのことを大切に思っています」という態度が伝わった時、心と心の架け橋（ラポール）がかかります。\n\n💡 Try this: 会話中、スマホをしまい、体ごと相手に向け、「あなたに関心がある」というサインを送り続けましょう。",
        "source_id": "rapport_building_rogers",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l05_005",
        "type": "true_false",
        "question": "🧠 ナルシスト（自己愛性人格障害）は共感能力が高い",
        "choices": ["誤り（極端に低い）", "正しい"],
        "correct_index": 0,
        "explanation": "【自己中心性】\nナルシストは他者を「自分を賞賛するための道具」としか見ていないため、相手の感情に関心がなく、利用しようとします。\n\n💡 Try this: 自分の話ばかりして、こちらの質問に答えない人とは、適度な距離を保ちましょう。",
        "source_id": "narcissism_lack_of_empathy",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l05_006",
        "type": "multiple_choice",
        "question": "🗣️ 「バリデーション」（妥当性確認）とは？",
        "choices": ["相手の感情を「それはもっともだ」と認め、正当化すること", "相手の間違いを指摘すること", "無視すること"],
        "correct_index": 0,
        "explanation": "【受容の技術】\nたとえ同意できなくても、「その状況なら、そう感じるのも無理はないね」と感情の存在を認めるだけで、相手は救われます。\n\n💡 Try this: アドバイスする前に、「辛かったね」「大変だったね」と感情にバリデーションを行いましょう。",
        "source_id": "emotional_validation_linehan",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "social_l05_007",
        "type": "multiple_choice",
        "question": "🧠 「ミラーニューロン」の働きは？",
        "choices": ["他者の行動を見ただけで、自分も同じ行動をしているかのように脳が反応する", "鏡を見る神経", "光を反射する"],
        "correct_index": 0,
        "explanation": "【共感の脳科学】\n誰かが泣いているのを見ると自分も悲しくなるのは、脳内で相手の体験をシミュレーションしているからです。これが共感の正体です。\n\n💡 Try this: 映画や小説で様々な人生を疑似体験することは、ミラーニューロンを鍛え、共感力を高めます。",
        "source_id": "mirror_neurons_empathy_rizzolatti",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l05_008",
        "type": "true_false",
        "question": "🤝 「セルフ・コンパッション」が高い人は、他者への共感力も高い",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【自分への優しさ】\n自分の欠点を受け入れ、優しくできる人は、他人の欠点にも寛容になれます。自分に厳しい人は、他人にも厳しくなりがちです。\n\n💡 Try this: 他人を批判したくなったら、まず自分自身を許し、受け入れることから始めましょう。",
        "source_id": "self_compassion_empathy_link",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l05_009",
        "type": "multiple_choice",
        "question": "🧠 「内集団バイアス」が共感を阻害する理由は？",
        "choices": ["「身内（内集団）」には共感するが、「よそ者（外集団）」には冷淡になる本能がある", "身内が嫌いになるから", "全員に優しくなるから"],
        "correct_index": 0,
        "explanation": "【分断の心理】\n脳は「敵と味方」を瞬時に分けます。人種差別や派閥争いは、相手を「人間」ではなく「外集団の記号」として見ることで、共感スイッチを切る現象です。\n\n💡 Try this: 苦手な相手との「共通の所属（同じ人間、同じ親など）」を見つけ、内集団の枠を広げましょう。",
        "source_id": "ingroup_bias_empathy_gap",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "social_l05_010",
        "type": "multiple_choice",
        "question": "🗣️ 「NVC」（非暴力コミュニケーション）の4要素は？",
        "choices": ["観察、感情、ニーズ、リクエスト", "批判、軽蔑、防御、逃避", "無視、否定、命令、服従"],
        "correct_index": 0,
        "explanation": "【マーシャル・ローゼンバーグ】\n評価を交えずに事実を観察し、自分の感情と、その奥にあるニーズ（願い）を伝え、具体的な行動をリクエストする。これで対立が消えます。\n\n💡 Try this: 「部屋を片付けて（命令）」ではなく、「散らかっていると（観察）、落ち着かないから（感情）、片付けてくれると嬉しい（リクエスト）」と言い換えましょう。",
        "source_id": "nvc_rosenberg",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "social_l05_011",
        "type": "true_false",
        "question": "🧠 アレキシサイミア（失感情症）の人は、他人の感情を読むのも苦手である",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【感情の理解】\n自分の感情に気づけない（言語化できない）人は、他人の感情を推測する手がかりも持てないため、共感性が低くなります。\n\n💡 Try this: 「今、自分は何を感じている？」と問いかけ、感情に名前をつける練習（感情ラベリング）をしましょう。",
        "source_id": "alexithymia_empathy_deficit",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l05_012",
        "type": "multiple_choice",
        "question": "🤝 「愛着スタイル」（アタッチメント）が安定している人の特徴は？",
        "choices": ["自分も他人も信頼でき、親密な関係を恐れない", "常に不安で束縛する", "人と関わらない"],
        "correct_index": 0,
        "explanation": "【安全基地】\n幼少期の養育者との関係で形成されます。安定型の人は、困った時に素直に助けを求められ、相手が困っていたら助けることができます。\n\n💡 Try this: 自分が「不安型」や「回避型」だと感じたら、安定型の人と付き合うことで、愛着スタイルを修正（獲得安定）できます。",
        "source_id": "attachment_theory_bowlby",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "social_l05_013",
        "type": "multiple_choice",
        "question": "🧠 「パースペクティブ・テイキング」（視点取得）のトレーニング法は？",
        "choices": ["「もし自分が相手の立場だったら、どう感じ、どう行動するか？」を具体的に想像する", "自分の意見を言う", "相手を観察する"],
        "correct_index": 0,
        "explanation": "【靴を履く】\n相手の靴を履いて歩く（In someone's shoes）想像力です。これは生まれつきの才能ではなく、意識的な努力で鍛えられるスキルです。\n\n💡 Try this: ニュースで犯罪者の記事を見たら、批判する前に「なぜ彼はそうせざるを得なかったのか？」と背景を想像してみましょう。",
        "source_id": "perspective_taking_exercises",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l05_014",
        "type": "true_false",
        "question": "🎁 「利他行動」は、した本人にも健康上のメリットがある",
        "choices": ["正しい（ヘルパーズ・ハイ）", "誤り（自己犠牲で消耗するだけ）"],
        "correct_index": 0,
        "explanation": "【情けは人の為ならず】\nボランティアや親切を行うと、脳内でエンドルフィンやオキシトシンが分泌され、免疫力が高まり、死亡率が下がることが分かっています。\n\n💡 Try this: 自分の健康のために、週に1回は「誰かの役に立つこと」をしましょう。",
        "source_id": "altruism_health_benefits",
        "difficulty": "easy",
        "xp": 5
    },
    {
        "id": "social_l05_015",
        "type": "multiple_choice",
        "question": "🧠 「エモーショナル・インテリジェンス（EQ）」の構成要素は？",
        "choices": ["自己認識、自己制御、動機づけ、共感、社会的スキル", "IQ、学歴、年収", "暗記力、計算力"],
        "correct_index": 0,
        "explanation": "【ダニエル・ゴールマン】\n人生の成功の80%はEQで決まると言われます。自分の感情を理解・制御し、他者の感情に共感して関係を築く能力です。\n\n💡 Try this: 感情的になった時こそEQを鍛えるチャンスです。「今、自分は怒っているな」と客観視することから始めましょう。",
        "source_id": "emotional_intelligence_goleman",
        "difficulty": "hard",
        "xp": 15
    }
]

# Social Level 6: Leadership & Influence
social_l06 = [
    {
        "id": "social_l06_001",
        "type": "multiple_choice",
        "question": "👑 「サーバント・リーダーシップ」とは？",
        "choices": ["リーダーは「支配者」ではなく「奉仕者」であり、メンバーの成長を支援する", "部下を召使いにする", "何もしない"],
        "correct_index": 0,
        "explanation": "【支援型リーダー】\n「俺についてこい」ではなく「君たちが成功するために、私は何ができるか？」と問うスタイル。現代の複雑な組織で最も成果を上げるとされています。\n\n💡 Try this: 部下に指示する代わりに、「何か困っていることはない？」と聞いて障害を取り除きましょう。",
        "source_id": "servant_leadership_greenleaf",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l06_002",
        "type": "true_false",
        "question": "🧠 「ダニング＝クルーガー効果」により、能力の低いリーダーほど自信満々に見える",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【無知の無知】\n能力が低い人は「自分に何が分からないか」も分からないため、根拠のない自信を持ちます。逆に賢い人は慎重になります。\n\n💡 Try this: 自信満々な人の言葉を鵜呑みにせず、実績と論理を確認しましょう。また、自分も謙虚さを保ちましょう。",
        "source_id": "dunning_kruger_effect",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l06_003",
        "type": "multiple_choice",
        "question": "🎯 「ピグマリオン効果」をマネジメントに活かすには？",
        "choices": ["部下に「君ならできる」と高い期待をかけると、実際に成績が上がる", "期待しない", "厳しく叱る"],
        "correct_index": 0,
        "explanation": "【教師期待効果】\n人は他者からの期待に合わせて行動を変えます。上司が「優秀だ」と信じて接すれば、部下はその期待に応えようと成長します。\n\n💡 Try this: 部下の可能性を信じ、言葉に出して「期待している」と伝えましょう。",
        "source_id": "pygmalion_effect_rosenthal",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l06_004",
        "type": "multiple_choice",
        "question": "🧠 「集団思考（グループシンク）」の危険性は？",
        "choices": ["「空気を読む」圧力が働き、愚かな決定（全会一致の幻想）をしてしまう", "素晴らしいアイデアが出る", "仲良くなれる"],
        "correct_index": 0,
        "explanation": "【アビリーンのパラドックス】\n誰も反対意見を言えない雰囲気の中では、全員が心の中で「反対」と思っていても、破滅的な決定がなされます（例：チャレンジャー号爆発事故）。\n\n💡 Try this: 会議では、あえて「悪魔の代弁者（批判役）」を指名し、異論を歓迎する空気を作りましょう。",
        "source_id": "groupthink_janis",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "social_l06_005",
        "type": "true_false",
        "question": "🗣️ 優れたリーダーは「WHY（なぜやるか）」から語る",
        "choices": ["正しい（ゴールデンサークル）", "誤り（HOWから語るべき）"],
        "correct_index": 0,
        "explanation": "【サイモン・シネック】\n人は「何を（WHAT）」ではなく「なぜ（WHY）」に動かされます。信念や目的を語ることで、人々の感情脳（大脳辺縁系）に訴えかけ、熱狂を生みます。\n\n💡 Try this: 指示を出す時は、「これをやって」の前に「なぜなら、これが世界を変えるからだ」と意義を語りましょう。",
        "source_id": "start_with_why_sinek",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l06_006",
        "type": "multiple_choice",
        "question": "🧠 「変革型リーダーシップ」の特徴は？",
        "choices": ["ビジョンを掲げ、部下の価値観を変え、期待以上の成果を引き出す", "アメとムチで管理する（交換型）", "放置する"],
        "correct_index": 0,
        "explanation": "【カリスマ性】\n現状維持ではなく、組織を変革するリーダーです。知的刺激を与え、個別に配慮し、理想的な影響力（ロールモデル）を行使します。\n\n💡 Try this: 「今の仕事のやり方は、本当にベストか？」と常に問いかけ、新しいビジョンを示し続けましょう。",
        "source_id": "transformational_leadership_bass",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "social_l06_007",
        "type": "multiple_choice",
        "question": "🤝 「リンゲルマン効果」（社会的手抜き）を防ぐには？",
        "choices": ["個人の責任と貢献を明確にし、評価する", "人数を増やす", "「頑張れ」と言う"],
        "correct_index": 0,
        "explanation": "【綱引き実験】\n集団で作業すると、無意識に「誰かがやるだろう」と手を抜きます（1人だと100%の力が、8人だと49%になる）。\n\n💡 Try this: タスクは「チーム全体」に投げず、「〇〇さん、これをお願い」と個人指名で依頼しましょう。",
        "source_id": "ringelmann_effect_social_loafing",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l06_008",
        "type": "true_false",
        "question": "🧠 「マキャベリズム」は、現代のリーダーシップにおいても有効な場合がある",
        "choices": ["正しい（政治力が必要な場面など）", "誤り（絶対悪である）"],
        "correct_index": 0,
        "explanation": "【君主論】\n目的のために手段を選ばない冷徹さは批判されますが、組織の危機や変革期には、感情に流されない断固とした決断（ハードパワー）が必要な場面もあります。\n\n💡 Try this: 優しさだけでなく、時には嫌われる勇気を持って「非情な決断」を下す覚悟を持ちましょう。",
        "source_id": "machiavellianism_leadership",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "social_l06_009",
        "type": "multiple_choice",
        "question": "🌐 「異文化理解」（カルチュラル・インテリジェンス）の鍵は？",
        "choices": ["自分の文化の「当たり前」を疑い、相手の文脈（コンテキスト）を読み解く柔軟性", "英語力", "自国の文化を押し付ける"],
        "correct_index": 0,
        "explanation": "【ハイコンテクストとローコンテクスト】\n「言わなくても分かる（日本）」と「言わなきゃ分からない（欧米）」など、文化によるルールの違いを理解し、スタイルを適応させる能力です。\n\n💡 Try this: 異文化の人と接する時は、「自分の常識は、彼らの非常識かもしれない」と常に仮説を持ちましょう。",
        "source_id": "cultural_intelligence_cq",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "social_l06_010",
        "type": "multiple_choice",
        "question": "🧠 「ゴーレム効果」とは？",
        "choices": ["上司が「こいつはダメだ」と思うと、実際に部下の成績が下がる現象", "ピグマリオン効果の逆", "石になること"],
        "correct_index": 0,
        "explanation": "【負の期待】\nネガティブなレッテル貼りは、相手の自尊心を奪い、パフォーマンスを低下させます。ダメな部下を作るのは、ダメな上司の思い込みかもしれません。\n\n💡 Try this: 成績が悪い部下に対しても、過去の失敗ではなく「未来の可能性」に目を向け、リセットして接しましょう。",
        "source_id": "golem_effect_education",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l06_011",
        "type": "true_false",
        "question": "🗣️ フィードバックは「性格」ではなく「行動」に対して行うべき",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【行動変容】\n「君はだらしない（性格）」と言われても直せませんが、「締め切りを1日過ぎている（行動）」なら直せます。人格攻撃は百害あって一利なしです。\n\n💡 Try this: 叱る時は「You（あなた）」ではなく「It（その行動）」を主語にしましょう。",
        "source_id": "feedback_behavior_vs_personality",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l06_012",
        "type": "multiple_choice",
        "question": "🧠 「状況的リーダーシップ」（SL理論）とは？",
        "choices": ["部下の成熟度に合わせて、指示型→コーチ型→支援型→委任型とスタイルを変える", "常に先頭に立つ", "常に任せる"],
        "correct_index": 0,
        "explanation": "【柔軟性】\n新入社員には「具体的な指示」が必要ですが、ベテランにそれをやると「マイクロマネジメント」になります。相手に合わせて関わり方を変えるのがプロです。\n\n💡 Try this: 部下一人一人のスキルと意欲を見極め、任せるべきか、教えるべきかを判断しましょう。",
        "source_id": "situational_leadership_hersey_blanchard",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "social_l06_013",
        "type": "multiple_choice",
        "question": "🤝 「信頼（Trust）」の方程式における分母（信頼を下げる要素）は？",
        "choices": ["自己志向（自分の利益ばかり考えていること）", "専門性", "親密さ"],
        "correct_index": 0,
        "explanation": "【信頼の方程式】\n信頼 ＝ (専門性 ＋ 信頼性 ＋ 親密さ) ÷ 自己志向。どんなに能力があっても、「自分のことしか考えていない」と思われたら、信頼はゼロになります。\n\n💡 Try this: 自分の利益よりも、チームや顧客の利益を優先する姿勢を、行動で示し続けましょう。",
        "source_id": "trust_equation_maister",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "social_l06_014",
        "type": "true_false",
        "question": "🧠 優れたチームには「ダイバーシティ（多様性）」が必要だが、それだけでは不十分である",
        "choices": ["正しい（インクルージョンが必要）", "誤り（多様性があれば勝手にうまくいく）"],
        "correct_index": 0,
        "explanation": "【D&I】\n多様な人がいるだけでは、対立が起きるだけです。その多様性が受け入れられ、活かされる「包摂（インクルージョン）」があって初めて、集合知が発揮されます。\n\n💡 Try this: 自分と違う意見が出た時、「間違っている」ではなく「面白い視点だ」と歓迎しましょう。",
        "source_id": "diversity_and_inclusion_performance",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "social_l06_015",
        "type": "multiple_choice",
        "question": "🌟 「オーセンティック・リーダーシップ」とは？",
        "choices": ["自分らしさ（価値観や弱み）を偽らず、誠実に行動することで信頼を得る", "完璧なリーダーを演じる", "嘘をつかない"],
        "correct_index": 0,
        "explanation": "【真正性】\n現代の部下は、作られたカリスマよりも「人間らしいリーダー」を求めています。自分の信念に基づき、言行一致で生きる姿が、人を惹きつけます。\n\n💡 Try this: リーダー像を演じるのをやめ、自分の言葉で、自分の信じることを語りましょう。",
        "source_id": "authentic_leadership_george",
        "difficulty": "medium",
        "xp": 10
    }
]

# Combine all levels
all_questions = social_l02 + social_l03 + social_l04 + social_l05 + social_l06

print(json.dumps(all_questions, ensure_ascii=False, indent=2))
