import React, { useEffect, useMemo, useState } from "react";

/**
 * Psycle MCQ Runner — single-file React component
 * ------------------------------------------------
 * - Fetches tracks & packs from GitHub Pages (catalog.json → <track>/manifest.json)
 * - Loads a selected pack (<track>/<packId>.json) and runs a 10-question session
 * - Shows correctness, explanation, progress bar, and final score
 * - Persists progress & results in localStorage per (track, pack)
 *
 * How to use:
 *   - Drop this file into your React app and render <PsycleApp />.
 *   - Update OWNER/REPO if needed (defaults below).
 *   - JSON schema expected: { id, cards: [{type:"mcq", q, choices[], answerIndex, explain}] }
 */

const OWNER = "shin2721"; // ← change if you fork
const REPO = "psych-duo-packs"; // ← change if you fork
const BASE = `https://${OWNER}.github.io/${REPO}`;
const TRACKS_DEFAULT = ["mental", "money", "work"] as const;

type Track = (typeof TRACKS_DEFAULT)[number];

type McqCard = {
  type: "mcq";
  q: string;
  choices: string[];
  answerIndex: number;
  explain?: string;
};

type PackJson = {
  id?: string;
  cards?: McqCard[];
};

type ManifestJson = {
  packIds: string[];
};

type CatalogJson = {
  tracks?: { id: string; title?: string }[];
};

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? (JSON.parse(s) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue] as const;
}

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

export default function PsycleApp() {
  const [tracks, setTracks] = useState<Track[]>([...TRACKS_DEFAULT]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [manifest, setManifest] = useState<string[]>([]);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [pack, setPack] = useState<PackJson | null>(null);

  // session state
  const lsKey = useMemo(() => {
    return selectedTrack && selectedPack
      ? `psycle:progress:${OWNER}/${REPO}:${selectedTrack}:${selectedPack}`
      : "psycle:progress:anon";
  }, [selectedTrack, selectedPack]);

  const [session, setSession] = useLocalStorage(lsKey, {
    index: 0,
    answers: [] as { choice: number; correct: boolean }[],
    score: 0,
    finished: false,
    startedAt: 0,
    finishedAt: 0,
  });

  const qCount = pack?.cards?.length ?? 0;
  const progressPct = qCount > 0 ? Math.min(100, (session.index / qCount) * 100) : 0;

  // --- bootstrap: try to read catalog.json for tracks
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE}/catalog.json?ts=${Date.now()}`);
        if (res.ok) {
          const cat = (await res.json()) as CatalogJson;
          if (cat?.tracks?.length) {
            const ids = cat.tracks
              .map((t) => t.id)
              .filter((t): t is Track => TRACKS_DEFAULT.includes(t as Track));
            if (ids.length) setTracks(ids);
          }
        }
      } catch {
        // ignore, fallback to defaults
      }
    })();
  }, []);

  // --- when track changes: fetch manifest
  useEffect(() => {
    if (!selectedTrack) return;
    setSelectedPack(null);
    setPack(null);
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BASE}/${selectedTrack}/manifest.json?ts=${Date.now()}`);
        if (!res.ok) throw new Error(`manifest ${res.status}`);
        const data = (await res.json()) as ManifestJson;
        setManifest(data.packIds ?? []);
      } catch (e: any) {
        setError(`Failed to load manifest: ${e?.message ?? e}`);
        setManifest([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedTrack]);

  // --- when pack changes: fetch pack JSON
  useEffect(() => {
    if (!selectedTrack || !selectedPack) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${BASE}/${selectedTrack}/${selectedPack}.json?ts=${Date.now()}`
        );
        if (!res.ok) throw new Error(`pack ${res.status}`);
        const data = (await res.json()) as PackJson;
        if (!data.cards?.length) throw new Error("empty pack");
        setPack(data);
        // initialize new session if switching pack
        setSession((s) =>
          s.startedAt && !s.finished && s.index > 0
            ? s
            : { index: 0, answers: [], score: 0, finished: false, startedAt: 0, finishedAt: 0 }
        );
      } catch (e: any) {
        setError(`Failed to load pack: ${e?.message ?? e}`);
        setPack(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedTrack, selectedPack]);

  function startSession() {
    if (!pack?.cards?.length) return;
    setSession({ index: 0, answers: [], score: 0, finished: false, startedAt: Date.now(), finishedAt: 0 });
  }

  function answer(choiceIndex: number) {
    if (!pack?.cards) return;
    const i = session.index;
    if (i >= pack.cards.length) return;
    const card = pack.cards[i];
    const correct = choiceIndex === card.answerIndex;
    const answers = [...session.answers, { choice: choiceIndex, correct }];
    const score = answers.filter((a) => a.correct).length;
    const nextIndex = i + 1;
    const finished = nextIndex >= pack.cards.length;
    setSession({
      ...session,
      index: nextIndex,
      answers,
      score,
      finished,
      finishedAt: finished ? Date.now() : 0,
    });
  }

  function resetSession() {
    setSession({ index: 0, answers: [], score: 0, finished: false, startedAt: 0, finishedAt: 0 });
  }

  const currentCard: McqCard | null = useMemo(() => {
    if (!pack?.cards) return null;
    return pack.cards[Math.min(session.index, pack.cards.length - 1)] ?? null;
  }, [pack, session.index]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">Ψ</span>
            <h1 className="text-xl font-semibold">Psycle MCQ Runner</h1>
          </div>
          <a className="text-xs text-neutral-500 hover:text-neutral-700" href={BASE} target="_blank" rel="noreferrer">{BASE}</a>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 p-4 md:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-4">
          <section className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-neutral-700">1. トラックを選択</h2>
            <div className="flex flex-wrap gap-2">
              {tracks.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTrack(t)}
                  className={cx(
                    "rounded-xl border px-3 py-1.5 text-sm",
                    selectedTrack === t
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-neutral-300 bg-white hover:bg-neutral-50"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-neutral-700">2. 週(パック)を選択</h2>
            {!selectedTrack && <p className="text-sm text-neutral-500">トラックを選ぶと manifest から候補が表示されます。</p>}
            {selectedTrack && (
              <div className="flex flex-wrap gap-2">
                {manifest.map((pid) => (
                  <button
                    key={pid}
                    onClick={() => setSelectedPack(pid)}
                    className={cx(
                      "rounded-xl border px-3 py-1.5 text-sm",
                      selectedPack === pid
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-neutral-300 bg-white hover:bg-neutral-50"
                    )}
                  >
                    {pid.replace(/^.*_w/, "w")}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-neutral-700">3. セッション</h2>
            <div className="space-y-2 text-sm">
              <div>問題数: <b>{qCount || "-"}</b></div>
              <div>正解数: <b>{session.score}</b></div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={startSession}
                  disabled={!pack?.cards?.length}
                  className={cx(
                    "rounded-xl px-3 py-1.5 text-sm font-medium",
                    pack?.cards?.length
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-neutral-200 text-neutral-500"
                  )}
                >開始 / 再開</button>
                <button
                  onClick={resetSession}
                  className="rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50"
                >リセット</button>
              </div>
            </div>
          </section>
        </aside>

        {/* Runner */}
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          {loading && <div className="text-sm text-neutral-500">読み込み中…</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}

          {!loading && !pack && (
            <div className="text-sm text-neutral-500">左のステップでトラックと週を選択してください。</div>
          )}

          {pack && !session.finished && session.startedAt === 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">{selectedPack}</h3>
              <p className="text-sm text-neutral-600">問題数: {pack.cards?.length}</p>
              <button
                onClick={startSession}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
              >セッション開始</button>
            </div>
          )}

          {pack && session.startedAt > 0 && !session.finished && currentCard && (
            <QuestionView
              key={session.index}
              index={session.index}
              total={pack.cards!.length}
              card={currentCard}
              onAnswer={answer}
            />
          )}

          {pack && session.finished && (
            <ResultView
              score={session.score}
              total={pack.cards!.length}
              answers={session.answers}
              cards={pack.cards!}
              onRetry={resetSession}
            />
          )}
        </section>
      </main>

      <footer className="mx-auto max-w-6xl p-6 text-center text-xs text-neutral-400">
        Powered by GitHub Pages · {OWNER}/{REPO}
      </footer>
    </div>
  );
}

function QuestionView({
  index,
  total,
  card,
  onAnswer,
}: {
  index: number;
  total: number;
  card: McqCard;
  onAnswer: (choiceIndex: number) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-500">Q{index + 1} / {total}</div>
        <div className="h-2 w-40 overflow-hidden rounded-full bg-neutral-200">
          <div className="h-full bg-emerald-500" style={{ width: `${((index) / total) * 100}%` }} />
        </div>
      </div>

      <h3 className="text-lg font-semibold leading-relaxed">{card.q}</h3>

      <div className="grid gap-3">
        {card.choices.map((c, i) => (
          <button
            key={i}
            onClick={() => onAnswer(i)}
            className="rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-left hover:border-neutral-400 hover:bg-neutral-50"
          >
            <span className="mr-2 inline-block rounded-lg bg-neutral-100 px-2 py-0.5 text-xs">{String.fromCharCode(65 + i)}</span>
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultView({
  score,
  total,
  answers,
  cards,
  onRetry,
}: {
  score: number;
  total: number;
  answers: { choice: number; correct: boolean }[];
  cards: McqCard[];
  onRetry: () => void;
}) {
  const percent = Math.round((score / total) * 100);
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-emerald-50 p-4">
        <div className="text-sm text-neutral-600">セッション終了</div>
        <div className="mt-1 text-3xl font-semibold text-emerald-700">{score} / {total} ({percent}%)</div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold text-neutral-700">復習</h4>
        <ol className="space-y-2">
          {cards.map((c, i) => {
            const a = answers[i];
            const isCorrect = a?.correct;
            return (
              <li key={i} className={cx(
                "rounded-2xl border p-3",
                isCorrect ? "border-emerald-300 bg-emerald-50" : "border-rose-300 bg-rose-50"
              )}>
                <div className="mb-1 text-sm font-medium">Q{i + 1}. {c.q}</div>
                <div className="text-sm">
                  あなたの回答: <b>{typeof a?.choice === 'number' ? c.choices[a.choice] : "-"}</b>
                  <span className={cx("ml-2 rounded px-1.5 text-xs",
                    isCorrect ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                  )}>{isCorrect ? "正解" : "不正解"}</span>
                </div>
                <div className="mt-1 text-sm text-neutral-600">正解: {c.choices[c.answerIndex]}</div>
                {c.explain && <div className="mt-1 text-sm text-neutral-500">解説: {c.explain}</div>}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex gap-2">
        <button onClick={onRetry} className="rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">もう一度</button>
      </div>
    </div>
  );
}
