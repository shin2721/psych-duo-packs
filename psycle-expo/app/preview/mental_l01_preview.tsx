import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import LessonScreen, { Lesson } from '../../components/LessonScreen';

// Import the lesson data directly
// In a real app, you'd fetch this from an API or load it dynamically
const mentalL01Data: Lesson = {
  "id": "mental_l01",
  "meta": {
    "theme": "メンタルスキル｜認知バイアス入門",
    "track": "mental",
    "arc": "認知バイアス基礎（Lesson 01）",
    "lessonIndex": 1,
    "totalQuestions": 15
  },
  "cards": [
    {
      "id": "mental_l01_001",
      "type": "mcq",
      "q": "自分の信念を支持する情報だけを集める傾向を何と言いますか？",
      "choices": [
        "確証バイアス",
        "正常性バイアス",
        "後知恵バイアス",
        "アンカリング効果"
      ],
      "answerIndex": 0,
      "explain": "確証バイアスは、自分の仮説や信念を確認する情報だけを集め、反証する情報を無視する傾向です。"
    },
    {
      "id": "mental_l01_002",
      "type": "mcq",
      "q": "過去の出来事を「予測できた」と感じる心理傾向は？",
      "choices": [
        "後知恵バイアス",
        "確証バイアス",
        "代表性ヒューリスティック",
        "利用可能性ヒューリスティック"
      ],
      "answerIndex": 0,
      "explain": "後知恵バイアスは、結果を知った後で「初めから分かっていた」と感じる傾向です。"
    },
    {
      "id": "mental_l01_003",
      "type": "mcq",
      "q": "最初に提示された情報に引きずられて判断する効果は？",
      "choices": [
        "アンカリング効果",
        "フレーミング効果",
        "ハロー効果",
        "バンドワゴン効果"
      ],
      "answerIndex": 0,
      "explain": "アンカリング効果は、最初の情報（アンカー）が後の判断に影響を与える現象です。"
    },
    {
      "id": "mental_l01_004",
      "type": "mcq",
      "q": "同じ情報でも表現方法で判断が変わる現象は？",
      "choices": [
        "フレーミング効果",
        "確証バイアス",
        "正常性バイアス",
        "現状維持バイアス"
      ],
      "answerIndex": 0,
      "explain": "フレーミング効果は、情報の提示方法（枠組み）によって判断や選択が変わる現象です。"
    },
    {
      "id": "mental_l01_005",
      "type": "mcq",
      "q": "一部の優れた特徴が他の評価にも影響を与える効果は？",
      "choices": [
        "ハロー効果",
        "ピグマリオン効果",
        "プラシーボ効果",
        "バンドワゴン効果"
      ],
      "answerIndex": 0,
      "explain": "ハロー効果は、ある特徴の評価が他の特徴の評価に影響を与える認知バイアスです。"
    },
    {
      "id": "mental_l01_006",
      "type": "mcq",
      "q": "多くの人が支持するものを正しいと判断する傾向は？",
      "choices": [
        "バンドワゴン効果",
        "ハロー効果",
        "確証バイアス",
        "正常性バイアス"
      ],
      "answerIndex": 0,
      "explain": "バンドワゴン効果は、多数派の意見や行動に従いやすくなる心理現象です。"
    },
    {
      "id": "mental_l01_007",
      "type": "mcq",
      "q": "危険や異常事態を過小評価してしまう傾向は？",
      "choices": [
        "正常性バイアス",
        "楽観性バイアス",
        "確証バイアス",
        "現状維持バイアス"
      ],
      "answerIndex": 0,
      "explain": "正常性バイアスは、異常事態でも「自分は大丈夫」と正常の範囲内として捉える傾向です。"
    },
    {
      "id": "mental_l01_008",
      "type": "mcq",
      "q": "変化よりも現状を維持したがる心理傾向は？",
      "choices": [
        "現状維持バイアス",
        "正常性バイアス",
        "損失回避性",
        "サンクコスト効果"
      ],
      "answerIndex": 0,
      "explain": "現状維持バイアスは、変化によるリスクを避け、現状を維持しようとする傾向です。"
    },
    {
      "id": "mental_l01_009",
      "type": "mcq",
      "q": "利益よりも損失を重く感じる心理的傾向は？",
      "choices": [
        "損失回避性",
        "現状維持バイアス",
        "サンクコスト効果",
        "リスク回避"
      ],
      "answerIndex": 0,
      "explain": "損失回避性は、同じ額の利益よりも損失を2倍程度大きく感じる心理傾向です。"
    },
    {
      "id": "mental_l01_010",
      "type": "mcq",
      "q": "既に投資したコストにこだわり続ける傾向は？",
      "choices": [
        "サンクコスト効果",
        "損失回避性",
        "現状維持バイアス",
        "埋没費用の誤謬"
      ],
      "answerIndex": 0,
      "explain": "サンクコスト効果は、回収不可能な投資（時間・お金）を理由に非合理的な選択をする傾向です。"
    },
    {
      "id": "mental_l01_011",
      "type": "mcq",
      "q": "思い出しやすい情報を重要視する傾向は？",
      "choices": [
        "利用可能性ヒューリスティック",
        "代表性ヒューリスティック",
        "確証バイアス",
        "アンカリング効果"
      ],
      "answerIndex": 0,
      "explain": "利用可能性ヒューリスティックは、記憶から取り出しやすい情報を重要視する判断の傾向です。"
    },
    {
      "id": "mental_l01_012",
      "type": "mcq",
      "q": "典型例に当てはめて判断する思考パターンは？",
      "choices": [
        "代表性ヒューリスティック",
        "利用可能性ヒューリスティック",
        "アンカリング効果",
        "ステレオタイプ"
      ],
      "answerIndex": 0,
      "explain": "代表性ヒューリスティックは、典型的なイメージに基づいて確率を判断する傾向です。"
    },
    {
      "id": "mental_l01_013",
      "type": "mcq",
      "q": "自分の能力を過大評価する傾向は？",
      "choices": [
        "過信バイアス",
        "楽観性バイアス",
        "ダニング＝クルーガー効果",
        "優越の錯覚"
      ],
      "answerIndex": 0,
      "explain": "過信バイアスは、自分の知識や能力を実際以上に評価する認知の歪みです。"
    },
    {
      "id": "mental_l01_014",
      "type": "mcq",
      "q": "未来の出来事を楽観的に予測しすぎる傾向は？",
      "choices": [
        "楽観性バイアス",
        "過信バイアス",
        "正常性バイアス",
        "希望的観測"
      ],
      "answerIndex": 0,
      "explain": "楽観性バイアスは、自分には良いことが起こると過度に楽観的に考える傾向です。"
    },
    {
      "id": "mental_l01_015",
      "type": "mcq",
      "q": "集団内で意見が極端化する現象は？",
      "choices": [
        "集団極性化",
        "集団思考",
        "バンドワゴン効果",
        "同調圧力"
      ],
      "answerIndex": 0,
      "explain": "集団極性化は、集団で議論すると意見がより極端な方向に偏る現象です。"
    }
  ]
};

export default function MentalL01Preview() {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading the lesson data
    // In production, you might fetch this from a server or load from a file
    const loadLesson = async () => {
      try {
        // Small delay to simulate async loading
        await new Promise((resolve) => setTimeout(resolve, 500));
        setLesson(mentalL01Data);
      } catch (err) {
        setError('Failed to load lesson data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading lesson...</Text>
      </View>
    );
  }

  if (error || !lesson) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Lesson not found'}</Text>
      </View>
    );
  }

  return <LessonScreen lesson={lesson} />;
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    padding: 20,
  },
});
