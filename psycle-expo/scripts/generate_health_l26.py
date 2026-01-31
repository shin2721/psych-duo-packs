#!/usr/bin/env python3
import json

# Health Level 2: Advanced Sleep (Chronotypes, Napping)
health_l02 = [
    {
        "id": "health_l02_001",
        "type": "multiple_choice",
        "question": "🦉 「社会的ジェットラグ」とは？",
        "choices": ["平日と休日の睡眠時間のズレ", "海外旅行の時差ボケ", "夜更かしすること"],
        "correct_index": 0,
        "explanation": "【社会的ジェットラグ】\n平日は6時起き、休日は10時起き...この「4時間のズレ」は、海外旅行の時差ボケと同じ負担を脳と体にかけ、肥満やうつ病のリスクを高めます。\n\n💡 Try this: 休日の起床時間を、平日と「プラスマイナス2時間以内」に収めましょう。",
        "source_id": "social_jetlag_roenneberg_2006",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l02_002",
        "type": "true_false",
        "question": "☕ コーヒーナップ（昼寝前のカフェイン）は効果的である",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【コーヒーナップ】\nカフェインの効果が出るのは摂取20分後。昼寝（15-20分）の直前に飲むと、起きる頃にカフェインが効き始め、スッキリ目覚められます。\n\n💡 Try this: 午後の眠気対策に「コーヒーを飲んでから20分寝る」を試してみましょう。",
        "source_id": "coffee_nap_research_2003",
        "difficulty": "easy",
        "xp": 5
    },
    {
        "id": "health_l02_003",
        "type": "multiple_choice",
        "question": "🌡️ 深い睡眠（徐波睡眠）を増やすのに最適な入浴タイミングは？",
        "choices": ["寝る90分前", "寝る直前", "朝"],
        "correct_index": 0,
        "explanation": "【深部体温のリズム】\nお風呂で体温を上げると、その後急激に下がります。この「体温の落差」が深い眠りを誘います。90分前がベストタイミングです。\n\n💡 Try this: 寝る90分前に、40度のお湯に15分浸かってみましょう。",
        "source_id": "bath_sleep_timing_2019",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l02_004",
        "type": "multiple_choice",
        "question": "🍷 寝酒（アルコール）が睡眠に与える影響は？",
        "choices": ["入眠は早くなるが、睡眠の質は下がる", "睡眠の質が上がる", "影響はない"],
        "correct_index": 0,
        "explanation": "【アルコールと睡眠】\nアルコールは寝つきを良くしますが、後半の睡眠を浅くし、利尿作用で脱水を招きます。結果、疲れが取れません。\n\n💡 Try this: 寝る3-4時間前にはアルコールを切り上げましょう。",
        "source_id": "alcohol_sleep_review_2013",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l02_005",
        "type": "true_false",
        "question": "🛌 ベッドでスマホをいじっても、眠れれば問題ない",
        "choices": ["正しい", "誤り"],
        "correct_index": 1,
        "explanation": "【条件付け】\nベッドでスマホを見ると、脳が「ベッド＝スマホを見る場所（覚醒）」と学習してしまいます。ベッドは「寝るためだけの場所」にするのが鉄則です。\n\n💡 Try this: 眠れない時は一度ベッドを出て、眠くなってから戻りましょう（刺激制御療法）。",
        "source_id": "stimulus_control_therapy_1972",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "health_l02_006",
        "type": "multiple_choice",
        "question": "🌞 朝起きてすぐに日光を浴びるべき理由は？",
        "choices": ["体内時計をリセットし、夜のメラトニン予約をするため", "ビタミンDを作るため", "目を覚ますため"],
        "correct_index": 0,
        "explanation": "【概日リズム】\n朝の光を浴びてから約14-16時間後に、眠気ホルモン（メラトニン）が分泌されます。朝の光が「夜の眠り」を作っているのです。\n\n💡 Try this: 起きたらすぐにカーテンを開け、窓際で1分間日光を浴びましょう。",
        "source_id": "circadian_rhythm_light_2008",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l02_007",
        "type": "multiple_choice",
        "question": "💤 理想的な昼寝の長さは？",
        "choices": ["15-20分", "60分", "90分"],
        "correct_index": 0,
        "explanation": "【パワーナップ】\n20分を超えると深い睡眠に入り、起きた時に「睡眠慣性（ぼーっとする）」が起きます。15-20分が認知機能回復に最適です。\n\n💡 Try this: アラームを20分後にセットして昼寝しましょう。",
        "source_id": "power_nap_duration_2009",
        "difficulty": "easy",
        "xp": 5
    },
    {
        "id": "health_l02_008",
        "type": "true_false",
        "question": "🧠 睡眠中、脳は老廃物を洗い流している",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【グリンパティック・システム】\n睡眠中、脳細胞が縮んで隙間ができ、脳脊髄液がアミロイドベータなどの老廃物を洗い流します。睡眠不足は「脳のゴミ」を溜め込みます。\n\n💡 Try this: 「睡眠は脳の掃除時間」と意識し、7時間睡眠を確保しましょう。",
        "source_id": "glymphatic_system_2013",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "health_l02_009",
        "type": "multiple_choice",
        "question": "🌡️ 寝室の最適温度は？",
        "choices": ["18-20度（少し涼しい）", "25度（暖かい）", "15度（寒い）"],
        "correct_index": 0,
        "explanation": "【睡眠環境】\n人間は深部体温が下がる時に眠くなります。少し涼しい室温（18-20度）が、放熱を助け、入眠をスムーズにします。\n\n💡 Try this: 寝る前にエアコンで室温を調整し、通気性の良いパジャマを選びましょう。",
        "source_id": "sleep_temperature_2012",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l02_010",
        "type": "multiple_choice",
        "question": "🍽️ 寝る前の食事は、睡眠の質をどう変える？",
        "choices": ["消化活動で深部体温が下がらず、質が悪化する", "満腹でよく眠れる", "関係ない"],
        "correct_index": 0,
        "explanation": "【食事と睡眠】\n消化にはエネルギーが必要で、体温が上がります。寝る直前に食べると、体温が下がらず、深い睡眠に入れません。\n\n💡 Try this: 夕食は就寝の3時間前までに済ませましょう。",
        "source_id": "meal_timing_sleep_2020",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l02_011",
        "type": "true_false",
        "question": "🏃 夕方の軽い運動は睡眠に良い",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【運動と体温】\n夕方（16-19時）の運動は体温を一時的に上げ、その後の体温低下を促進するため、入眠を助けます。ただし寝る直前の激しい運動は逆効果です。\n\n💡 Try this: 夕方にウォーキングや軽いジョギングを取り入れましょう。",
        "source_id": "exercise_timing_sleep_2014",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l02_012",
        "type": "multiple_choice",
        "question": "🧘 「4-7-8呼吸法」の目的は？",
        "choices": ["副交感神経を優位にし、リラックスする", "肺活量を増やす", "集中力を高める"],
        "correct_index": 0,
        "explanation": "【4-7-8呼吸法】\n4秒吸って、7秒止めて、8秒かけて吐く。このリズムが強制的に副交感神経を活性化させ、寝つきを良くします。\n\n💡 Try this: 布団に入って目が冴えている時、これを3セット行ってみましょう。",
        "source_id": "weil_478_breathing",
        "difficulty": "easy",
        "xp": 5
    },
    {
        "id": "health_l02_013",
        "type": "multiple_choice",
        "question": "🛌 「睡眠圧」とは？",
        "choices": ["起きている間に溜まる「眠気のもと」", "布団の重さ", "ストレスによる圧力"],
        "correct_index": 0,
        "explanation": "【アデノシン】\n覚醒中は脳内にアデノシン（睡眠圧）が蓄積し、眠気を引き起こします。昼寝をしすぎると、この圧が減ってしまい、夜眠れなくなります。\n\n💡 Try this: 夜ぐっすり眠りたいなら、昼寝は20分以内に抑えて「睡眠圧」を温存しましょう。",
        "source_id": "adenosine_sleep_pressure",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "health_l02_014",
        "type": "true_false",
        "question": "⏰ アラームのスヌーズ機能（二度寝）は脳に良い",
        "choices": ["正しい", "誤り"],
        "correct_index": 1,
        "explanation": "【睡眠慣性】\nスヌーズで断片的に眠ると、深い睡眠サイクルに入りかけたところで起こされるため、強い睡眠慣性（だるさ）が残ります。\n\n💡 Try this: アラームは「起きる時間」に1回だけセットし、スヌーズはオフにしましょう。",
        "source_id": "snooze_button_effects_2014",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l02_015",
        "type": "multiple_choice",
        "question": "🌙 「レム睡眠」の特徴は？",
        "choices": ["脳が活発に動き、記憶の整理や感情処理を行う", "脳が完全に休んでいる", "成長ホルモンが出る"],
        "correct_index": 0,
        "explanation": "【レム睡眠】\n体は休んでいますが、脳は動いています。ここで記憶の定着や、嫌な記憶の感情処理（忘却）が行われます。\n\n💡 Try this: 嫌なことがあった日こそ、しっかり寝てレム睡眠を取りましょう。",
        "source_id": "rem_sleep_emotion_2011",
        "difficulty": "hard",
        "xp": 15
    }
]

# Health Level 3: Nutrition Psychology (Gut-Brain Axis)
health_l03 = [
    {
        "id": "health_l03_001",
        "type": "multiple_choice",
        "question": "🦠 「脳腸相関」（Gut-Brain Axis）とは？",
        "choices": ["脳と腸が迷走神経などで影響し合っていること", "脳が腸を支配していること", "腸が脳より賢いこと"],
        "correct_index": 0,
        "explanation": "【脳腸相関】\n腸は「第二の脳」と呼ばれ、セロトニン（幸せホルモン）の90%は腸で作られます。腸内環境が悪化すると、不安やうつリスクが高まります。\n\n💡 Try this: メンタル不調を感じたら、発酵食品（ヨーグルト、納豆）を意識的に摂ってみましょう。",
        "source_id": "gut_brain_axis_review_2015",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l03_002",
        "type": "true_false",
        "question": "🐟 オメガ3脂肪酸（魚の油）は、うつ症状の改善に効果がある",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【抗炎症作用】\nオメガ3（DHA/EPA）には脳の炎症を抑える効果があり、うつ病の補助療法としても推奨されています。\n\n💡 Try this: 週に2-3回は青魚（サバ、イワシ、サケ）を食べるか、サプリを活用しましょう。",
        "source_id": "omega3_depression_meta_2019",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l03_003",
        "type": "multiple_choice",
        "question": "📉 「血糖値スパイク」がメンタルに与える影響は？",
        "choices": ["急激な眠気、イライラ、集中力低下", "テンションが上がり続ける", "特にない"],
        "correct_index": 0,
        "explanation": "【反応性低血糖】\n糖質を摂りすぎて血糖値が急上昇すると、インスリンが出て急降下します。この時、脳がエネルギー不足になり、イライラや不安が生じます。\n\n💡 Try this: ランチは「野菜→タンパク質→炭水化物」の順で食べ（ベジファースト）、スパイクを防ぎましょう。",
        "source_id": "glucose_fluctuation_mood_2018",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l03_004",
        "type": "multiple_choice",
        "question": "💧 水分不足が脳に与える影響は？",
        "choices": ["わずか1-2%の不足で認知機能と気分が低下する", "5%減るまで影響はない", "喉が渇かなければ大丈夫"],
        "correct_index": 0,
        "explanation": "【脱水と脳】\n脳の約80%は水です。軽度の脱水でも、集中力低下、頭痛、疲労感、不安感を引き起こします。\n\n💡 Try this: 仕事中はデスクに水を置き、「喉が渇く前に」こまめに飲みましょう。",
        "source_id": "mild_dehydration_cognition_2011",
        "difficulty": "easy",
        "xp": 5
    },
    {
        "id": "health_l03_005",
        "type": "true_false",
        "question": "🥦 「地中海式ダイエット」はメンタルヘルスに良い",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【SMILES試験】\n野菜、果物、全粒穀物、魚、オリーブオイル中心の地中海式食事が、うつ症状を改善することがランダム化比較試験で実証されました。\n\n💡 Try this: 今日の食事に「色の濃い野菜」と「オリーブオイル」を追加してみましょう。",
        "source_id": "smiles_trial_diet_depression_2017",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "health_l03_006",
        "type": "multiple_choice",
        "question": "🦠 プロバイオティクス（善玉菌）とプレバイオティクス（餌）の違いは？",
        "choices": ["プロ＝菌そのもの、プレ＝菌の餌（食物繊維など）", "プロ＝餌、プレ＝菌", "同じもの"],
        "correct_index": 0,
        "explanation": "【シンバイオティクス】\n菌（ヨーグルトなど）と餌（食物繊維、オリゴ糖）を一緒に摂ることで、腸内環境が効果的に改善します。\n\n💡 Try this: ヨーグルト（プロ）にバナナやハチミツ（プレ）を入れて食べましょう。",
        "source_id": "probiotics_prebiotics_mental_2018",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l03_007",
        "type": "multiple_choice",
        "question": "☕ カフェインの半減期（体内から半分減る時間）は？",
        "choices": ["約5-8時間", "約1時間", "約24時間"],
        "correct_index": 0,
        "explanation": "【カフェインの代謝】\n個人差はありますが、昼12時に飲んだコーヒーのカフェインは、夜中まで体内に残ります。これが睡眠の質を下げる原因です。\n\n💡 Try this: カフェイン摂取は「午後2時まで」に切り上げましょう。",
        "source_id": "caffeine_half_life_sleep_2013",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l03_008",
        "type": "true_false",
        "question": "🍫 高カカオチョコレートはストレス軽減に役立つ",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【カカオポリフェノール】\nカカオに含まれる成分が、ストレスホルモン（コルチゾール）を抑制し、BDNF（脳由来神経栄養因子）を増やす可能性があります。\n\n💡 Try this: 休憩時間にカカオ70%以上のチョコをひとかけら食べてリラックスしましょう。",
        "source_id": "dark_chocolate_stress_2014",
        "difficulty": "easy",
        "xp": 5
    },
    {
        "id": "health_l03_009",
        "type": "multiple_choice",
        "question": "🍺 アルコールが「うつ」に与える影響は？",
        "choices": ["中枢神経抑制作用があり、長期的にはうつを悪化させる", "気分を高揚させ、うつを治す", "関係ない"],
        "correct_index": 0,
        "explanation": "【アルコールとうつ】\n一時的に気分が晴れても、アルコールは脳の抑制系に働き、長期的にはセロトニン枯渇を招き、うつリスクを高めます。\n\n💡 Try this: ストレス発散のための飲酒は避け、運動や趣味など別の方法を見つけましょう。",
        "source_id": "alcohol_depression_link_2011",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "health_l03_010",
        "type": "multiple_choice",
        "question": "🧂 加工食品（超加工食品）の過剰摂取リスクは？",
        "choices": ["炎症を引き起こし、うつ病リスクを高める", "便利で栄養価が高い", "特にない"],
        "correct_index": 0,
        "explanation": "【超加工食品】\nスナック菓子、カップ麺などの超加工食品の摂取量が多い人は、うつ病リスクが高いという研究結果があります。添加物や質の悪い油が炎症の原因になります。\n\n💡 Try this: 「原材料名を見て、知らない成分が多いもの」は避け、原型に近い食品を選びましょう。",
        "source_id": "ultra_processed_food_depression_2019",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l03_011",
        "type": "true_false",
        "question": "🥚 タンパク質（アミノ酸）は、メンタルヘルスに重要である",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【神経伝達物質の材料】\nセロトニン（トリプトファン）やドーパミン（チロシン）などの神経伝達物質は、タンパク質（アミノ酸）から作られます。不足するとメンタルが不安定になります。\n\n💡 Try this: 毎食、手のひら一枚分のタンパク質（肉、魚、卵、豆）を摂りましょう。",
        "source_id": "amino_acids_neurotransmitters",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l03_012",
        "type": "multiple_choice",
        "question": "🌞 ビタミンD不足がメンタルに与える影響は？",
        "choices": ["季節性情動障害（冬季うつ）のリスクが高まる", "特にない", "視力が下がる"],
        "correct_index": 0,
        "explanation": "【サンシャインビタミン】\nビタミンDは脳内でセロトニン合成に関与します。日光不足になる冬場にうつっぽくなるのは、ビタミンD不足が一因です。\n\n💡 Try this: 冬場は意識的に日光浴をするか、ビタミンDサプリメントを活用しましょう。",
        "source_id": "vitamin_d_depression_meta_2013",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l03_013",
        "type": "multiple_choice",
        "question": "🍵 緑茶に含まれる「テアニン」の効果は？",
        "choices": ["リラックス効果と集中力向上", "興奮作用", "眠気誘発"],
        "correct_index": 0,
        "explanation": "【テアニン】\nテアニンはカフェインの興奮作用を和らげ、リラックスしながら集中できる状態（α波）を作ります。\n\n💡 Try this: 集中したいがイライラしたくない時は、コーヒーではなく緑茶を選びましょう。",
        "source_id": "theanine_stress_cognition_2016",
        "difficulty": "easy",
        "xp": 5
    },
    {
        "id": "health_l03_014",
        "type": "true_false",
        "question": "🕰️ 「断続的断食」（16時間断食など）は脳に良い可能性がある",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【オートファジー】\n空腹時間が続くと、細胞内の浄化作用（オートファジー）が働き、BDNF（脳の栄養）が増えることが動物実験などで示唆されています。\n\n💡 Try this: 無理のない範囲で、夕食から翌日の朝食までの時間を12時間空けてみましょう。",
        "source_id": "intermittent_fasting_bdnf_2019",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "health_l03_015",
        "type": "multiple_choice",
        "question": "🌶️ 辛い食べ物（カプサイシン）の効果は？",
        "choices": ["エンドルフィン（快楽物質）を分泌させる", "ストレスを増やす", "記憶力を下げる"],
        "correct_index": 0,
        "explanation": "【カプサイシン】\n辛味は「痛み」として脳に伝わり、鎮痛作用としてエンドルフィンが分泌され、一時的な高揚感（ランナーズハイに近い）をもたらします。\n\n💡 Try this: 元気を出したい時、適度な辛さの料理を楽しんでみましょう。",
        "source_id": "capsaicin_endorphin",
        "difficulty": "easy",
        "xp": 5
    }
]

# Health Level 4: Exercise & Cognition
health_l04 = [
    {
        "id": "health_l04_001",
        "type": "multiple_choice",
        "question": "🧠 運動が「脳の肥料」と呼ばれる理由は？",
        "choices": ["BDNF（脳由来神経栄養因子）を増やすから", "脳の血流が減るから", "頭が揺れるから"],
        "correct_index": 0,
        "explanation": "【BDNF】\n有酸素運動は、海馬でのBDNF分泌を促し、新しい神経細胞の成長と記憶形成を助けます。まさに「脳の肥料」です。\n\n💡 Try this: 勉強や仕事の前に、20分の早歩きをしてみましょう。記憶力と集中力が上がります。",
        "source_id": "ratey_spark_2008",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l04_002",
        "type": "true_false",
        "question": "🏋️ 筋トレ（レジスタンス運動）は不安軽減に効果がある",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【筋トレとメンタル】\nメタ分析により、筋トレは健常者および精神疾患患者の不安症状を有意に軽減することが示されています。\n\n💡 Try this: 不安を感じたら、スクワットや腕立て伏せを10回やってみましょう。",
        "source_id": "resistance_training_anxiety_meta_2017",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l04_003",
        "type": "multiple_choice",
        "question": "🚶 「スタンディングデスク」の効果は？",
        "choices": ["座りすぎによる健康リスクを減らし、認知機能を維持する", "足が疲れて集中できない", "特にない"],
        "correct_index": 0,
        "explanation": "【座りすぎの害】\n長時間の座位は血流を悪化させ、脳への酸素供給を減らします。立つことで血流が改善し、覚醒度が上がります。\n\n💡 Try this: 1時間に1回は立ち上がり、5分間立って作業するかストレッチしましょう。",
        "source_id": "sedentary_behavior_cognition_2018",
        "difficulty": "easy",
        "xp": 5
    },
    {
        "id": "health_l04_004",
        "type": "multiple_choice",
        "question": "🌲 「グリーン・エクササイズ」とは？",
        "choices": ["自然の中で運動すること", "緑色の服を着て運動すること", "野菜を食べながら運動すること"],
        "correct_index": 0,
        "explanation": "【自然の効果】\n公園や森など、自然の中で運動すると、ジムでの運動以上にストレスホルモンが減少し、自尊心が向上します。\n\n💡 Try this: 休日はジムではなく、近くの公園や河川敷を散歩・ランニングしましょう。",
        "source_id": "green_exercise_review_2011",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l04_005",
        "type": "true_false",
        "question": "🧘 ヨガはGABA（リラックス物質）を増やす",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【ヨガと脳】\n研究では、1時間のヨガセッション後に脳内のGABAレベルが有意に上昇することが確認されています。これは抗不安薬と同様の作用機序です。\n\n💡 Try this: 寝る前に10分間、簡単なヨガやストレッチを行いましょう。",
        "source_id": "yoga_gaba_levels_2010",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "health_l04_006",
        "type": "multiple_choice",
        "question": "🏃 「HIIT」（高強度インターバルトレーニング）の時短効果は？",
        "choices": ["短時間でミトコンドリア機能を高め、脳機能も向上させる", "長時間やらないと意味がない", "体に悪すぎる"],
        "correct_index": 0,
        "explanation": "【HIIT】\n「20秒全力＋10秒休憩」などを繰り返すHIITは、短時間で心肺機能とBDNFレベルを向上させます。忙しい人に最適です。\n\n💡 Try this: 時間がない日は、4分間の「タバタ式トレーニング」を試してみましょう。",
        "source_id": "hiit_bdnf_cognitive_2019",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "health_l04_007",
        "type": "multiple_choice",
        "question": "💃 ダンスが脳に良い特別な理由は？",
        "choices": ["有酸素運動＋認知的負荷（振付を覚える）の二重課題だから", "音楽が楽しいから", "仲間がいるから"],
        "correct_index": 0,
        "explanation": "【デュアルタスク】\n体を動かしながら、リズムに合わせ、振付を記憶するダンスは、脳の複数領域を同時に使い、認知症予防にも効果的です。\n\n💡 Try this: 好きな音楽に合わせて、即興で体を動かしてみましょう。",
        "source_id": "dance_neuroplasticity_2017",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l04_008",
        "type": "true_false",
        "question": "🚶 散歩は「拡散的思考」（アイデア出し）を促進する",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【歩行と創造性】\nスタンフォード大の研究で、座っている時より歩いている時の方が、創造的アイデアの数が60%増加しました。\n\n💡 Try this: アイデアに詰まったら、PCを置いて外を歩きながら考えましょう。",
        "source_id": "walking_creativity_oppezzo_2014",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l04_009",
        "type": "multiple_choice",
        "question": "🧠 運動直後に記憶力が上がるタイミングは？",
        "choices": ["学習の直後または直前", "学習の10時間後", "いつでも同じ"],
        "correct_index": 0,
        "explanation": "【運動と記憶】\n学習の直後に軽い運動をすると、記憶の定着（固定化）が促進されます。また、直前の運動は覚醒度を高め、学習準備を整えます。\n\n💡 Try this: 暗記科目の勉強をした後、軽く体を動かして記憶を定着させましょう。",
        "source_id": "exercise_memory_consolidation_2012",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "health_l04_010",
        "type": "multiple_choice",
        "question": "🧘 「NEAT」（非運動性熱産生）とは？",
        "choices": ["日常生活での活動（階段、掃除など）によるカロリー消費", "ジムでの運動", "寝ている時の代謝"],
        "correct_index": 0,
        "explanation": "【NEAT】\nジムに行かなくても、階段を使う、立って話す、掃除するなど、日常の活動量を増やすだけで、肥満や生活習慣病リスクが下がります。\n\n💡 Try this: エレベーターではなく階段を使うことを「毎日のルール」にしましょう。",
        "source_id": "neat_levine_2002",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l04_011",
        "type": "true_false",
        "question": "💪 運動は「自己効力感」（自分ならできるという感覚）を高める",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【達成体験】\n「5km走れた」「重量が上がった」という身体的な達成感は、精神的な自信（自己効力感）に直結し、仕事や生活の他の分野にも波及します。\n\n💡 Try this: 小さな運動目標（例：毎日腕立て10回）を立て、達成記録をつけましょう。",
        "source_id": "exercise_self_efficacy_review",
        "difficulty": "easy",
        "xp": 5
    },
    {
        "id": "health_l04_012",
        "type": "multiple_choice",
        "question": "🧠 「海馬」はストレスで萎縮するが、運動でどうなる？",
        "choices": ["大きくなる（再生する）", "変わらない", "さらに萎縮する"],
        "correct_index": 0,
        "explanation": "【神経新生】\n海馬は生涯を通じて新しい神経細胞を生み出せる数少ない脳領域です。有酸素運動はこの神経新生を強力に促進し、ストレスによるダメージを修復します。\n\n💡 Try this: ストレスを感じる時期こそ、意識的に有酸素運動を取り入れましょう。",
        "source_id": "exercise_hippocampus_volume_2011",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "health_l04_013",
        "type": "multiple_choice",
        "question": "🤝 「ソーシャル・エクササイズ」（チームスポーツ）の利点は？",
        "choices": ["運動効果＋社会的つながりによるオキシトシン分泌", "競争心がストレスになる", "一人の方が集中できる"],
        "correct_index": 0,
        "explanation": "【社会的つながり】\n誰かと一緒に運動すると、幸福ホルモン（オキシトシン）が分泌され、運動の継続率も上がります。\n\n💡 Try this: 友人を誘ってウォーキングやスポーツをしてみましょう。",
        "source_id": "group_exercise_quality_life_2017",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l04_014",
        "type": "true_false",
        "question": "🏃 運動不足は、喫煙と同じくらい健康リスクが高い",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【座りすぎの死亡リスク】\n「Sitting is the new smoking」と言われるように、運動不足は心疾患や糖尿病のリスクを高め、世界的な死亡原因の上位に位置します。\n\n💡 Try this: 「運動は薬」と考え、毎日少しでも体を動かすことを優先しましょう。",
        "source_id": "inactivity_mortality_lancet_2012",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "health_l04_015",
        "type": "multiple_choice",
        "question": "🧘 運動後の「クールダウン」の心理的効果は？",
        "choices": ["副交感神経への切り替えをスムーズにし、リラックスを促す", "筋肉痛を防ぐだけ", "特にない"],
        "correct_index": 0,
        "explanation": "【自律神経の調整】\n急に運動を止めると交感神経が高ぶったままになります。徐々に強度を落とすことで、心身をリラックスモードへ安全に移行させます。\n\n💡 Try this: 運動の最後は、深呼吸しながらゆっくりストレッチをして終わりましょう。",
        "source_id": "cooldown_autonomic_recovery",
        "difficulty": "medium",
        "xp": 10
    }
]

# Health Level 5: Stress Physiology
health_l05 = [
    {
        "id": "health_l05_001",
        "type": "multiple_choice",
        "question": "⚡ ストレスホルモン「コルチゾール」の役割は？",
        "choices": ["血糖値を上げ、闘争・逃走反応を準備する", "眠気を誘う", "筋肉をリラックスさせる"],
        "correct_index": 0,
        "explanation": "【コルチゾール】\n朝に分泌されて目覚めを促し、ストレス時にはエネルギーを動員します。しかし、夜に高いままだと不眠や脳の萎縮を招きます。\n\n💡 Try this: 夜のリラックスタイムを作り、コルチゾールを下げてから眠りにつきましょう。",
        "source_id": "cortisol_function_review",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l05_002",
        "type": "true_false",
        "question": "💓 HRV（心拍変動）が高いほど、ストレス状態である",
        "choices": ["正しい", "誤り"],
        "correct_index": 1,
        "explanation": "【HRVと自律神経】\nHRV（心拍の間隔のゆらぎ）は「高い」方が良い状態です。リラックス（副交感神経優位）していると心拍はゆらぎ、ストレス（交感神経優位）だと一定になります。\n\n💡 Try this: スマートウォッチなどでHRVを計測し、自分のストレス状態を客観視してみましょう。",
        "source_id": "hrv_stress_index_review",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "health_l05_003",
        "type": "multiple_choice",
        "question": "🧠 「HPA軸」とは？",
        "choices": ["視床下部-下垂体-副腎によるストレス応答システム", "脳と腸のつながり", "睡眠のリズム"],
        "correct_index": 0,
        "explanation": "【HPA軸】\nストレスを感じると、脳（視床下部）から指令が出て、最終的に副腎からコルチゾールが出ます。慢性ストレスはこの軸を暴走させます。\n\n💡 Try this: 慢性ストレスを感じたら、マインドフルネスや自然接触でHPA軸を鎮静化させましょう。",
        "source_id": "hpa_axis_stress_2011",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "health_l05_004",
        "type": "multiple_choice",
        "question": "🔥 「慢性炎症」が万病の元と言われる理由は？",
        "choices": ["免疫系が常に攻撃状態になり、組織を傷つけるから", "体温が上がりすぎるから", "痛みが続くから"],
        "correct_index": 0,
        "explanation": "【慢性炎症】\nストレス、肥満、睡眠不足は体内で弱い炎症（ボヤ）を続かせます。これがうつ病、心疾患、認知症などの根本原因になります。\n\n💡 Try this: 抗炎症作用のある生活（十分な睡眠、運動、野菜摂取）を心がけましょう。",
        "source_id": "chronic_inflammation_disease_2012",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "health_l05_005",
        "type": "true_false",
        "question": "😭 涙を流す（情動的な涙）とストレス解消になる",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【涙の効用】\n感情による涙には、ACTH（ストレスホルモンの材料）が含まれており、泣くことで物理的にストレス物質を体外へ排出している説があります。\n\n💡 Try this: 辛い時は我慢せず、泣ける映画などを観て思いっきり泣く「涙活」をしましょう。",
        "source_id": "crying_stress_relief_theory",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l05_006",
        "type": "multiple_choice",
        "question": "🧘 「迷走神経」を刺激するとどうなる？",
        "choices": ["副交感神経が活性化し、即座にリラックスする", "心拍数が上がる", "不安になる"],
        "correct_index": 0,
        "explanation": "【迷走神経】\n脳から内臓に伸びる最大の神経。ゆっくり吐く呼吸や、冷たい水で顔を洗うことで刺激でき、心拍を下げて落ち着きを取り戻せます。\n\n💡 Try this: パニックになりそうな時は、冷たい水を顔にかけるか、首筋を冷やしてみましょう（潜水反射）。",
        "source_id": "vagus_nerve_stimulation_review",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "health_l05_007",
        "type": "multiple_choice",
        "question": "🌲 「森林浴」の科学的効果は？",
        "choices": ["フィトンチッド（樹木の香り）がNK細胞を活性化し、ストレスを下げる", "ただの気分転換", "虫に刺されるだけ"],
        "correct_index": 0,
        "explanation": "【フィトンチッド】\n樹木が発散する化学物質には、人間の免疫機能を高め、コルチゾールを下げる効果が実証されています。\n\n💡 Try this: 月に1回は自然豊かな場所に行き、五感で森を感じましょう。",
        "source_id": "forest_bathing_immunity_2010",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l05_008",
        "type": "true_false",
        "question": "🤝 オキシトシン（愛情ホルモン）はストレスを打ち消す",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【バッファー効果】\nオキシトシンはコルチゾールの分泌を抑制し、扁桃体の活動を鎮めます。スキンシップや親切な行動で分泌されます。\n\n💡 Try this: ペットを撫でたり、家族とハグしたり、誰かに親切にすることでオキシトシンを増やしましょう。",
        "source_id": "oxytocin_stress_buffering_2003",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l05_009",
        "type": "multiple_choice",
        "question": "🧠 「アロスタティック負荷」とは？",
        "choices": ["慢性ストレスによる心身の摩耗・蓄積ダメージ", "一時的なストレス反応", "筋肉の負荷"],
        "correct_index": 0,
        "explanation": "【アロスタシス】\n体は環境に適応しようと頑張りますが（アロスタシス）、それが長く続くと負荷（ロード）がかかり、病気になります。\n\n💡 Try this: 「まだ頑張れる」と思っても、定期的に完全な休息（ダウンタイム）を取り、負荷をリセットしましょう。",
        "source_id": "allostatic_load_mcewen_1998",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "health_l05_010",
        "type": "multiple_choice",
        "question": "🌬️ 口呼吸より「鼻呼吸」が良い理由は？",
        "choices": ["一酸化窒素が産生され、酸素摂取効率が上がり、副交感神経が働く", "口が乾かないからだけ", "特に違いはない"],
        "correct_index": 0,
        "explanation": "【鼻呼吸のメリット】\n鼻腔で産生される一酸化窒素は血管を拡張し、酸素の取り込みを助けます。また、鼻呼吸は脳を冷却し、リラックス効果もあります。\n\n💡 Try this: 日中も寝る時も、意識的に口を閉じ、鼻呼吸を心がけましょう（マウステープも有効）。",
        "source_id": "nasal_breathing_benefits_review",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l05_011",
        "type": "true_false",
        "question": "🔥 サウナ（温熱療法）はうつ症状を改善する可能性がある",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【温熱療法】\n深部体温を上げることで、抗うつ効果やリラックス効果が得られるという研究があります。サウナ後の「整う」感覚は自律神経のリセットです。\n\n💡 Try this: 週1回サウナに行き、温冷交代浴で自律神経を整えてみましょう（無理は禁物）。",
        "source_id": "sauna_depression_study_2016",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l05_012",
        "type": "multiple_choice",
        "question": "🧘 「プログレッシブ筋弛緩法」のやり方は？",
        "choices": ["筋肉にわざと力を入れて緊張させ、一気に脱力する", "ずっと力を抜く", "マッサージを受ける"],
        "correct_index": 0,
        "explanation": "【筋弛緩法】\n「緊張→弛緩」の落差を作ることで、強制的に筋肉を緩め、リラックス状態を作ります。肩こりや不眠に有効です。\n\n💡 Try this: 肩を耳に近づけるようにギュッと力を入れ、ストンと落とす。これを3回繰り返しましょう。",
        "source_id": "progressive_muscle_relaxation_jacobson",
        "difficulty": "easy",
        "xp": 5
    },
    {
        "id": "health_l05_013",
        "type": "multiple_choice",
        "question": "🧠 ストレスで「前頭前野」が機能不全になるとどうなる？",
        "choices": ["衝動的になり、感情コントロールができなくなる", "計算が速くなる", "記憶力が良くなる"],
        "correct_index": 0,
        "explanation": "【理性の脳】\n前頭前野は「司令塔」ですが、ストレスに弱いです。強いストレス下では、原始的な脳（扁桃体など）に乗っ取られ、冷静な判断ができなくなります。\n\n💡 Try this: イライラして判断できない時は、「今は前頭前野がダウンしている」と自覚し、重要な決定を先送りしましょう。",
        "source_id": "pfc_stress_arnsten_2009",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "health_l05_014",
        "type": "true_false",
        "question": "🗣️ 独り言（セルフトーク）で自分を励ますのは効果がある",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【サードパーソン・セルフトーク】\n自分に対して「私はできる」ではなく、「〇〇（自分の名前）、君ならできる」と三人称で語りかけると、客観性が生まれ、ストレスが下がります。\n\n💡 Try this: プレッシャーがかかる場面で、自分の名前を使って心の中で励ましてみましょう。",
        "source_id": "third_person_self_talk_2014",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l05_015",
        "type": "multiple_choice",
        "question": "🛌 「睡眠不足」と「不安」の関係は？",
        "choices": ["睡眠不足は、脳の「不安ブレーキ（前頭前野）」を弱める", "関係ない", "睡眠不足だと不安を感じなくなる"],
        "correct_index": 0,
        "explanation": "【睡眠と感情制御】\nカリフォルニア大学の研究で、睡眠不足の脳は、不安誘発画像に対して扁桃体が過剰反応し、前頭前野がそれを抑えられないことが示されました。\n\n💡 Try this: 不安が強い時こそ、何よりも「睡眠確保」を最優先事項にしましょう。",
        "source_id": "sleep_loss_anxiety_walker_2019",
        "difficulty": "hard",
        "xp": 15
    }
]

# Health Level 6: Longevity & Habits
health_l06 = [
    {
        "id": "health_l06_001",
        "type": "multiple_choice",
        "question": "🌍 長寿地域「ブルーゾーン」の共通点は？",
        "choices": ["適度な運動、腹八分目、植物中心、強い社会的つながり", "高価なサプリメント", "激しいトレーニング"],
        "correct_index": 0,
        "explanation": "【ブルーゾーン】\n沖縄やサルデーニャ島などの長寿地域では、ジムではなく「生活の中での動き」、満腹まで食べない、孤独でないことなどが共通しています。\n\n💡 Try this: 「Power 9（健康長寿の9つのルール）」を参考に、生活の中に自然な運動とコミュニティを取り入れましょう。",
        "source_id": "blue_zones_buettner",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l06_002",
        "type": "true_false",
        "question": "🧬 テロメア（染色体の端）は、生活習慣で伸び縮みする",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【細胞の老化】\nテロメアは老化とともに短くなりますが、ストレス管理、運動、良い食事によって短縮を防いだり、酵素（テロメラーゼ）活性化で修復できる可能性があります。\n\n💡 Try this: 健康的な生活は「遺伝子のスイッチ」を変えると信じ、良い習慣を続けましょう。",
        "source_id": "telomere_lifestyle_blackburn_2009",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "health_l06_003",
        "type": "multiple_choice",
        "question": "🧠 「神経可塑性」（ニューロプラスティシティ）とは？",
        "choices": ["脳は何歳になっても変化・成長できる性質", "脳は子供の時しか成長しない", "脳は硬い"],
        "correct_index": 0,
        "explanation": "【脳の可塑性】\nかつて脳細胞は減る一方と考えられていましたが、適切な刺激（学習、運動、新しい経験）があれば、高齢になっても回路を組み替えられます。\n\n💡 Try this: 「もう年だから」と言わず、新しいスキル（楽器、語学など）に挑戦し続けましょう。",
        "source_id": "neuroplasticity_adult_review",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l06_004",
        "type": "multiple_choice",
        "question": "🔄 習慣化にかかる平均日数は？",
        "choices": ["約66日", "21日", "3日"],
        "correct_index": 0,
        "explanation": "【習慣化の期間】\nロンドン大学の研究では、行動が自動化するまで平均66日かかりました（幅は18〜254日）。「三日坊主」で諦めるのは早すぎます。\n\n💡 Try this: 少なくとも2ヶ月は「意識的な努力」が必要だと覚悟し、淡々と続けましょう。",
        "source_id": "habit_formation_66days_lally_2010",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l06_005",
        "type": "true_false",
        "question": "📉 「20秒ルール」は悪い習慣を減らすのに役立つ",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【ショーン・エイカー】\n悪い習慣（スマホなど）を始める手間を20秒増やすだけで、実行頻度が激減します。逆に良い習慣は手間を20秒減らします。\n\n💡 Try this: スマホを別の部屋に置く、アプリをフォルダの奥に入れるなど、アクセスを面倒にしましょう。",
        "source_id": "happiness_advantage_anchor_2010",
        "difficulty": "easy",
        "xp": 5
    },
    {
        "id": "health_l06_006",
        "type": "multiple_choice",
        "question": "🧘 「マインドフル・イーティング」（食べる瞑想）の効果は？",
        "choices": ["過食を防ぎ、食事の満足度を高める", "味がしなくなる", "早食いになる"],
        "correct_index": 0,
        "explanation": "【マインドフル・イーティング】\nスマホを見ながらではなく、味、香り、食感に集中して食べることで、脳が「食べた」と認識しやすくなり、自然に量が減ります。\n\n💡 Try this: 最初の一口だけでも、目を閉じて30回噛み、素材の味を完全に感じ取ってみましょう。",
        "source_id": "mindful_eating_review_2017",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l06_007",
        "type": "multiple_choice",
        "question": "🤝 「孤独」の健康リスクは？",
        "choices": ["1日タバコ15本分に相当し、死亡率を高める", "特にない", "一人が一番健康的"],
        "correct_index": 0,
        "explanation": "【孤独の害】\n社会的なつながりの欠如は、肥満や運動不足よりも死亡リスクが高いことがメタ分析で示されています。人間は社会的な動物です。\n\n💡 Try this: 週に1回は友人や家族と連絡を取り、質の高い会話（雑談ではなく感情の共有）をしましょう。",
        "source_id": "loneliness_mortality_meta_2010",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "health_l06_008",
        "type": "true_false",
        "question": "🧠 「認知予備能」が高いと、認知症の発症を遅らせられる",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【認知予備能】\n教育、知的活動、社会参加などで脳のネットワークを豊かにしておくと、脳に病変があっても機能を維持できます（予備タンクがある状態）。\n\n💡 Try this: 読書、パズル、新しい趣味など、脳に汗をかく活動を生涯続けましょう。",
        "source_id": "cognitive_reserve_stern_2002",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "health_l06_009",
        "type": "multiple_choice",
        "question": "🔥 「ホルミシス効果」とは？",
        "choices": ["微量の毒やストレスが、逆に体に良い刺激となること", "毒は毒である", "完全にストレスゼロが良い"],
        "correct_index": 0,
        "explanation": "【ホルミシス】\n適度な運動、断食、サウナ、野菜の苦味成分などは、体に軽いストレスを与え、防御機能を活性化させて健康にします。\n\n💡 Try this: 「楽なこと」ばかりでなく、あえて少しキツイこと（運動など）をして細胞を鍛えましょう。",
        "source_id": "hormesis_aging_review",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "health_l06_010",
        "type": "multiple_choice",
        "question": "🎯 「アイデンティティ・ベース」の習慣形成とは？",
        "choices": ["「私は健康な人だ」という自己像から行動を変える", "目標（5kg痩せる）だけを追う", "ご褒美で釣る"],
        "correct_index": 0,
        "explanation": "【ジェームズ・クリアー】\n「タバコを辞めようとしている人」ではなく「私は非喫煙者だ」と思うこと。行動はアイデンティティの投票です。\n\n💡 Try this: 「私はランナーだ」「私は読書家だ」と自分にラベルを貼り、それにふさわしい行動を選びましょう。",
        "source_id": "atomic_habits_identity",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l06_011",
        "type": "true_false",
        "question": "🛌 睡眠薬は自然な睡眠と同じ効果がある",
        "choices": ["正しい", "誤り"],
        "correct_index": 1,
        "explanation": "【睡眠薬の限界】\n多くの睡眠薬は「鎮静（Sedation）」状態を作るもので、自然な睡眠の複雑な修復プロセス（特に深い睡眠やレム睡眠）を完全には再現しません。\n\n💡 Try this: 薬に頼る前に、CBT-I（睡眠のための認知行動療法）のアプローチを試してみましょう。",
        "source_id": "sleep_medication_vs_cbti",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "health_l06_012",
        "type": "multiple_choice",
        "question": "🧘 「コンパッション（慈悲）」が健康に良い理由は？",
        "choices": ["迷走神経を活性化し、炎症を抑えるから", "良い人に見えるから", "特にない"],
        "correct_index": 0,
        "explanation": "【慈悲と生理学】\n他者への思いやりや、自分への優しさ（セルフコンパッション）を持つと、オキシトシンが出て、心拍数が落ち着き、免疫系が整います。\n\n💡 Try this: 1日1回、誰かの幸せを心の中で願う「慈悲の瞑想」を1分間行ってみましょう。",
        "source_id": "compassion_vagus_nerve_2010",
        "difficulty": "hard",
        "xp": 15
    },
    {
        "id": "health_l06_013",
        "type": "multiple_choice",
        "question": "🌳 「バイオフィリア仮説」とは？",
        "choices": ["人間は本能的に自然を愛し、自然の中にいると健康になる", "人間は機械が好き", "人間は都会が好き"],
        "correct_index": 0,
        "explanation": "【E.O.ウィルソン】\n人類史の99.9%は自然の中で過ごしました。だから脳は自然環境でリラックスするようにできています。都会の喧騒は脳に負担です。\n\n💡 Try this: 部屋に観葉植物を置いたり、PCの壁紙を自然の風景にするだけでも効果があります。",
        "source_id": "biophilia_hypothesis_1984",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l06_014",
        "type": "true_false",
        "question": "🧠 「主観的年齢」（自分を何歳だと思うか）は寿命に影響する",
        "choices": ["正しい", "誤り"],
        "correct_index": 0,
        "explanation": "【気の持ちよう】\n実年齢より「自分は若い」と思っている人は、死亡率が低く、脳も若いという研究があります。ネガティブなエイジング・ステレオタイプは健康を害します。\n\n💡 Try this: 年齢を言い訳にせず、「今の自分が一番若い」と思って活動的に過ごしましょう。",
        "source_id": "subjective_age_mortality_2018",
        "difficulty": "medium",
        "xp": 10
    },
    {
        "id": "health_l06_015",
        "type": "multiple_choice",
        "question": "🌟 「イキガイ（Ikigai）」の健康効果は？",
        "choices": ["人生の目的を持つ人は、心血管疾患リスクが低く長生きする", "日本だけの迷信", "お金持ちになる"],
        "correct_index": 0,
        "explanation": "【生きがい】\n日本の「生きがい」概念は世界中で注目されています。朝起きる理由（目的）があることは、強力な健康因子です。\n\n💡 Try this: 小さなことでもいいので、自分の「生きがい（好きなこと×得意なこと×人の役に立つこと）」を探してみましょう。",
        "source_id": "ikigai_longevity_study_2008",
        "difficulty": "medium",
        "xp": 10
    }
]

# Combine all levels
all_questions = health_l02 + health_l03 + health_l04 + health_l05 + health_l06

print(json.dumps(all_questions, ensure_ascii=False, indent=2))
