import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  V2_GENERALIZATION_CONTENT_VERSION,
  V2_GENERALIZATION_LESSON_IDS,
  V2_GENERALIZATION_SCHEMA_VERSION,
  V2_WALKING_CONTENT_VERSION,
  type V2GeneralizationLessonDefinition,
  type V2GeneralizationScoredStepId,
  type V2GeneralizationSnapshot,
  type V2GeneralizationStepId,
} from "../../types/v2GeneralizationPilot";
import {
  V2_GENERALIZATION_LESSONS,
  getV2GeneralizationLesson,
} from "../../lib/v2-pilot/generalization/lessons";
import {
  advanceV2GeneralizationFlow,
  createInitialV2GeneralizationSnapshot,
  getV2GeneralizationStep,
  retryV2GeneralizationStep,
  selectV2GeneralizationOption,
  validateV2GeneralizationLessonDefinition,
} from "../../lib/v2-pilot/generalization/flow";
import {
  getV2GeneralizationStorageKey,
  loadV2GeneralizationSnapshot,
  normalizeV2GeneralizationSnapshot,
  resetV2GeneralizationSnapshot,
  saveV2GeneralizationSnapshot,
} from "../../lib/v2-pilot/generalization/storage";

const NOW = "2026-07-20T04:00:00.000Z";
const LATER = "2026-07-20T04:01:00.000Z";

function requireLesson(
  lessonId: (typeof V2_GENERALIZATION_LESSON_IDS)[number]
): V2GeneralizationLessonDefinition {
  const lesson = getV2GeneralizationLesson(lessonId);
  if (!lesson) throw new Error(`Missing test lesson ${lessonId}`);
  return lesson;
}

function moveToStep(
  lesson: V2GeneralizationLessonDefinition,
  targetStep: V2GeneralizationStepId
): V2GeneralizationSnapshot {
  let snapshot = createInitialV2GeneralizationSnapshot(lesson, NOW);
  let guard = 0;
  while (snapshot.currentStep !== targetStep) {
    guard += 1;
    if (guard > 20) throw new Error(`Could not reach ${targetStep}`);
    const step = getV2GeneralizationStep(lesson, snapshot.currentStep);
    if (step.kind === "capture") {
      snapshot = selectV2GeneralizationOption(
        snapshot,
        lesson,
        step.options[0].id,
        NOW
      ).snapshot;
    } else if (step.kind === "scored") {
      snapshot = selectV2GeneralizationOption(
        snapshot,
        lesson,
        step.correctOptionId,
        NOW
      ).snapshot;
    } else if (step.kind === "complete") {
      throw new Error(`Reached completion before ${targetStep}`);
    }
    snapshot = advanceV2GeneralizationFlow(snapshot, lesson, NOW).snapshot;
  }
  return snapshot;
}

function getWrongOptionId(
  lesson: V2GeneralizationLessonDefinition,
  stepId: V2GeneralizationScoredStepId
): string {
  const step = getV2GeneralizationStep(lesson, stepId);
  if (step.kind !== "scored") throw new Error(`${stepId} is not scored`);
  const option = step.options.find(
    (candidate) => candidate.id !== step.correctOptionId
  );
  if (!option) throw new Error(`${stepId} is missing a wrong option`);
  return option.id;
}

describe("V2 generalization lesson registry", () => {
  test("walking uses five steps while L2 and L3 preserve the seven-step order", () => {
    expect(V2_GENERALIZATION_SCHEMA_VERSION).toBe(1);
    expect(V2_GENERALIZATION_LESSONS.map((lesson) => lesson.id)).toEqual(
      V2_GENERALIZATION_LESSON_IDS
    );
    V2_GENERALIZATION_LESSONS.forEach((lesson) => {
      expect(validateV2GeneralizationLessonDefinition(lesson)).toEqual([]);
      expect(lesson.steps.map((step) => step.id)).toEqual(lesson.stepOrder);
    });
    expect(requireLesson("walking-divergence-v1").stepOrder).toEqual([
      "prediction",
      "evidence",
      "update",
      "transfer",
      "complete",
    ]);
    expect(requireLesson("walking-divergence-v1").contentVersion).toBe(
      V2_WALKING_CONTENT_VERSION
    );
    const walkingPrediction = getV2GeneralizationStep(
      requireLesson("walking-divergence-v1"),
      "prediction"
    );
    if (walkingPrediction.kind !== "capture") {
      throw new Error("Walking prediction must be a capture step");
    }
    expect(walkingPrediction).toMatchObject({
      prompt: "歩くと助かるのは、どっち？",
      scene:
        "会議まで30分。今ある企画案は1つ。これから案を増やし、最後に1案を選ぶ。",
      options: [
        { id: "walking-prediction-expand", label: "案を増やすとき" },
        { id: "walking-prediction-narrow", label: "1案を選ぶとき" },
        { id: "walking-prediction-both", label: "両方とも" },
      ],
    });
    [
      requireLesson("interleaving-boundary-v1"),
      requireLesson("temptation-bundling-v1"),
    ].forEach((lesson) => {
      expect(lesson.contentVersion).toBe(V2_GENERALIZATION_CONTENT_VERSION);
      expect(lesson.stepOrder).toEqual([
        "prediction",
        "evidence",
        "update",
        "boundary",
        "retrieval",
        "transfer",
        "complete",
      ]);
    });
  });

  test("the validator rejects duplicate, mismatched, and non-interactive orders", () => {
    const walking = requireLesson("walking-divergence-v1");
    expect(
      validateV2GeneralizationLessonDefinition({
        ...walking,
        stepOrder: [
          "prediction",
          "evidence",
          "update",
          "transfer",
          "transfer",
        ],
      })
    ).toEqual(
      expect.arrayContaining([
        "duplicate stepOrder id: transfer",
        "stepOrder must end with complete",
      ])
    );
    expect(
      validateV2GeneralizationLessonDefinition({
        ...walking,
        stepOrder: ["evidence", "prediction", "update", "transfer", "complete"],
      })
    ).toEqual(
      expect.arrayContaining([
        "step 0 must be evidence, received prediction",
        "stepOrder must start with an interactive step",
      ])
    );

    const evidence = walking.steps.find((step) => step.kind === "evidence");
    const complete = walking.steps.find((step) => step.kind === "complete");
    if (!evidence || !complete) throw new Error("Walking test steps are missing");
    expect(
      validateV2GeneralizationLessonDefinition({
        ...walking,
        steps: walking.steps.map((step) =>
          step.id === "evidence" ? { ...evidence, contrast: [] } : step
        ),
      })
    ).toContain("compact evidence needs 2+ contrast rows");
    expect(
      validateV2GeneralizationLessonDefinition({
        ...walking,
        steps: walking.steps.map((step) =>
          step.id === "complete"
            ? {
                ...complete,
                actionByOptionId: { "not-an-update-option": "Do something" },
              }
            : step
        ),
      })
    ).toContain(
      "complete.actionByOptionId has unknown update option: not-an-update-option"
    );
  });

  test("option IDs are globally unique and accepted correct positions are preserved", () => {
    const optionIds = V2_GENERALIZATION_LESSONS.flatMap((lesson) =>
      lesson.steps.flatMap((step) =>
        step.kind === "capture" || step.kind === "scored"
          ? step.options.map((option) => option.id)
          : []
      )
    );
    expect(new Set(optionIds).size).toBe(optionIds.length);

    const expectedCorrectIndexes: Record<
      (typeof V2_GENERALIZATION_LESSON_IDS)[number],
      Partial<Record<V2GeneralizationScoredStepId, number>>
    > = {
      "walking-divergence-v1": { transfer: 0 },
      "interleaving-boundary-v1": { boundary: 0, retrieval: 0, transfer: 1 },
      "temptation-bundling-v1": { boundary: 1, retrieval: 1, transfer: 2 },
    };

    V2_GENERALIZATION_LESSONS.forEach((lesson) => {
      Object.entries(expectedCorrectIndexes[lesson.id]).forEach((entry) => {
        const [stepId, expectedIndex] = entry as [
          V2GeneralizationScoredStepId,
          number
        ];
        const step = getV2GeneralizationStep(lesson, stepId);
        if (step.kind !== "scored") throw new Error(`${stepId} is not scored`);
        expect(
          step.options.findIndex((option) => option.id === step.correctOptionId)
        ).toBe(expectedIndex);
        step.options.forEach((option) =>
          expect(option.feedback.trim()).not.toBe("")
        );
      });
    });
  });

  test("definitions retain the accepted primary source URLs", () => {
    expect(requireLesson("walking-divergence-v1").sources.map((s) => s.url)).toEqual([
      "https://doi.org/10.1037/a0036577",
    ]);
    expect(
      requireLesson("interleaving-boundary-v1").sources.map((s) => s.url)
    ).toEqual([
      "https://doi.org/10.1037/edu0000367",
      "https://ies.ed.gov/ncee/wwc/Study/88770",
    ]);
    expect(requireLesson("temptation-bundling-v1").sources.map((s) => s.url)).toEqual([
      "https://doi.org/10.1287/mnsc.2013.1784",
      "https://doi.org/10.1016/j.obhdp.2020.09.003",
    ]);
  });
});

describe("V2 generalization pure flow", () => {
  const lesson = requireLesson("walking-divergence-v1");

  test("the five-step walking flow skips absent universal steps cleanly", () => {
    const initial = createInitialV2GeneralizationSnapshot(lesson, NOW);
    expect(advanceV2GeneralizationFlow(initial, lesson, NOW)).toMatchObject({
      status: "blocked",
      blockReason: "selection_required",
    });

    const selected = selectV2GeneralizationOption(
      initial,
      lesson,
      "walking-prediction-expand",
      NOW
    );
    expect(selected.status).toBe("selected");
    expect(selected.snapshot.answers.prediction).toBe(
      "walking-prediction-expand"
    );

    const evidence = advanceV2GeneralizationFlow(
      selected.snapshot,
      lesson,
      NOW
    );
    expect(evidence.snapshot.currentStep).toBe("evidence");
    const update = advanceV2GeneralizationFlow(evidence.snapshot, lesson, NOW);
    expect(update.status).toBe("advanced");
    expect(update.snapshot.currentStep).toBe("update");
    expect(advanceV2GeneralizationFlow(update.snapshot, lesson, NOW)).toMatchObject({
      status: "blocked",
      blockReason: "selection_required",
    });
    const classified = selectV2GeneralizationOption(
      update.snapshot,
      lesson,
      "walking-update-ideas",
      NOW
    );
    const transfer = advanceV2GeneralizationFlow(
      classified.snapshot,
      lesson,
      NOW
    );
    expect(transfer.snapshot.currentStep).toBe("transfer");
    expect(transfer.snapshot.answers.boundary).toBeNull();
    expect(transfer.snapshot.answers.retrieval).toBeNull();
    expect(transfer.snapshot.scored.boundary.attempts).toEqual([]);
    expect(transfer.snapshot.scored.retrieval.attempts).toEqual([]);
  });

  test("the seven-step L2 flow preserves scored retry and progression", () => {
    const sevenStepLesson = requireLesson("interleaving-boundary-v1");
    let snapshot = moveToStep(sevenStepLesson, "boundary");
    const wrongOptionId = getWrongOptionId(sevenStepLesson, "boundary");
    const boundary = getV2GeneralizationStep(sevenStepLesson, "boundary");
    if (boundary.kind !== "scored") throw new Error("boundary is not scored");

    snapshot = selectV2GeneralizationOption(
      snapshot,
      sevenStepLesson,
      wrongOptionId,
      NOW
    ).snapshot;
    const incorrect = advanceV2GeneralizationFlow(
      snapshot,
      sevenStepLesson,
      NOW
    );
    expect(incorrect.status).toBe("incorrect");
    expect(incorrect.feedback).toBeTruthy();
    expect(incorrect.snapshot.currentStep).toBe("boundary");
    expect(incorrect.snapshot.scored.boundary).toMatchObject({
      firstOptionId: wrongOptionId,
      firstCorrect: false,
    });
    expect(incorrect.snapshot.scored.boundary.attempts).toHaveLength(1);

    expect(
      selectV2GeneralizationOption(
        incorrect.snapshot,
        sevenStepLesson,
        boundary.correctOptionId,
        NOW
      )
    ).toMatchObject({ status: "blocked", blockReason: "retry_required" });

    const retried = retryV2GeneralizationStep(
      incorrect.snapshot,
      sevenStepLesson,
      NOW
    );
    expect(retried.status).toBe("retried");
    expect(retried.snapshot.answers.boundary).toBeNull();
    expect(retried.snapshot.answers.prediction).not.toBeNull();
    expect(retried.snapshot.answers.update).not.toBeNull();
    expect(retried.snapshot.scored.boundary.attempts).toHaveLength(1);

    snapshot = selectV2GeneralizationOption(
      retried.snapshot,
      sevenStepLesson,
      boundary.correctOptionId,
      LATER
    ).snapshot;
    const correct = advanceV2GeneralizationFlow(
      snapshot,
      sevenStepLesson,
      LATER
    );
    expect(correct.status).toBe("advanced");
    expect(correct.snapshot.currentStep).toBe("retrieval");
    expect(correct.snapshot.scored.boundary).toMatchObject({
      firstOptionId: wrongOptionId,
      firstCorrect: false,
    });
    expect(correct.snapshot.scored.boundary.attempts.map((a) => a.correct)).toEqual([
      false,
      true,
    ]);
  });

  test("only a correct transfer attempt reaches completion", () => {
    let snapshot = moveToStep(lesson, "transfer");
    const transfer = getV2GeneralizationStep(lesson, "transfer");
    if (transfer.kind !== "scored") throw new Error("transfer is not scored");

    snapshot = selectV2GeneralizationOption(
      snapshot,
      lesson,
      getWrongOptionId(lesson, "transfer"),
      NOW
    ).snapshot;
    const incorrect = advanceV2GeneralizationFlow(snapshot, lesson, NOW);
    expect(incorrect.status).toBe("incorrect");
    expect(incorrect.snapshot.currentStep).toBe("transfer");
    expect(incorrect.snapshot.completedAt).toBeNull();

    const retried = retryV2GeneralizationStep(incorrect.snapshot, lesson, NOW);
    snapshot = selectV2GeneralizationOption(
      retried.snapshot,
      lesson,
      transfer.correctOptionId,
      LATER
    ).snapshot;
    const completed = advanceV2GeneralizationFlow(snapshot, lesson, LATER);
    expect(completed.status).toBe("completed");
    expect(completed.snapshot.currentStep).toBe("complete");
    expect(completed.snapshot.completedAt).toBe(LATER);
    expect(completed.snapshot.scored.transfer.firstCorrect).toBe(false);
  });

  test("completion is derived from the next ordered step, not a hardcoded scored ID", () => {
    const prediction = getV2GeneralizationStep(lesson, "prediction");
    const complete = getV2GeneralizationStep(lesson, "complete");
    const captureCompleteLesson: V2GeneralizationLessonDefinition = {
      ...lesson,
      stepOrder: ["prediction", "complete"],
      steps: [prediction, { ...complete, actionByOptionId: {} }],
    };
    const initial = createInitialV2GeneralizationSnapshot(
      captureCompleteLesson,
      NOW
    );
    const selected = selectV2GeneralizationOption(
      initial,
      captureCompleteLesson,
      "walking-prediction-expand",
      NOW
    );
    const completed = advanceV2GeneralizationFlow(
      selected.snapshot,
      captureCompleteLesson,
      LATER
    );
    expect(completed).toMatchObject({
      status: "completed",
      snapshot: {
        currentStep: "complete",
        completedAt: LATER,
      },
    });
  });

  test("all public transitions fail closed on snapshot identity mismatch", () => {
    const otherLesson = requireLesson("interleaving-boundary-v1");
    const initial = createInitialV2GeneralizationSnapshot(lesson, NOW);

    expect(
      selectV2GeneralizationOption(
        initial,
        otherLesson,
        "interleaving-prediction-mixed",
        NOW
      )
    ).toMatchObject({
      snapshot: initial,
      status: "blocked",
      blockReason: "snapshot_identity_mismatch",
    });
    expect(advanceV2GeneralizationFlow(initial, otherLesson, NOW)).toMatchObject({
      snapshot: initial,
      status: "blocked",
      blockReason: "snapshot_identity_mismatch",
    });

    let boundary = moveToStep(otherLesson, "boundary");
    boundary = selectV2GeneralizationOption(
      boundary,
      otherLesson,
      getWrongOptionId(otherLesson, "boundary"),
      NOW
    ).snapshot;
    boundary = advanceV2GeneralizationFlow(
      boundary,
      otherLesson,
      NOW
    ).snapshot;
    expect(
      retryV2GeneralizationStep(boundary, lesson, NOW)
    ).toMatchObject({
      snapshot: boundary,
      status: "blocked",
      blockReason: "snapshot_identity_mismatch",
    });

    const forgedSchema = {
      ...initial,
      schemaVersion: 99,
    } as unknown as V2GeneralizationSnapshot;
    const forgedContent = {
      ...initial,
      contentVersion: "other-content",
    } as unknown as V2GeneralizationSnapshot;
    expect(
      selectV2GeneralizationOption(
        forgedSchema,
        lesson,
        "walking-prediction-expand",
        NOW
      ).blockReason
    ).toBe("snapshot_identity_mismatch");
    expect(advanceV2GeneralizationFlow(forgedContent, lesson, NOW).blockReason).toBe(
      "snapshot_identity_mismatch"
    );
  });
});

describe("V2 generalization storage isolation", () => {
  const walking = requireLesson("walking-divergence-v1");
  const interleaving = requireLesson("interleaving-boundary-v1");

  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test("keys are distinct by lesson, user, and content version", () => {
    const keys = [
      getV2GeneralizationStorageKey(
        walking.id,
        "owner-1",
        walking.contentVersion
      ),
      getV2GeneralizationStorageKey(
        interleaving.id,
        "owner-1",
        interleaving.contentVersion
      ),
      getV2GeneralizationStorageKey(
        walking.id,
        "owner-2",
        walking.contentVersion
      ),
      getV2GeneralizationStorageKey(walking.id, "owner-1", "future-v2"),
    ];
    expect(new Set(keys).size).toBe(keys.length);
    keys.forEach((key) => {
      expect(key).toContain("psycle:v2-owner-pilot:generalization:v1");
      expect(key).not.toContain("ai-diversity");
    });
  });

  test("anonymous and whitespace-sensitive authenticated identities never collide", () => {
    const anonymous = getV2GeneralizationStorageKey(
      walking.id,
      null,
      walking.contentVersion
    );
    const undefinedIdentity = getV2GeneralizationStorageKey(
      walking.id,
      undefined,
      walking.contentVersion
    );
    const authenticatedKeys = [
      getV2GeneralizationStorageKey(
        walking.id,
        "local",
        walking.contentVersion
      ),
      getV2GeneralizationStorageKey(walking.id, "", walking.contentVersion),
      getV2GeneralizationStorageKey(
        walking.id,
        "empty",
        walking.contentVersion
      ),
      getV2GeneralizationStorageKey(
        walking.id,
        "owner",
        walking.contentVersion
      ),
      getV2GeneralizationStorageKey(
        walking.id,
        " owner ",
        walking.contentVersion
      ),
    ];

    expect(anonymous).toBe(undefinedIdentity);
    expect(new Set([anonymous, ...authenticatedKeys]).size).toBe(6);
    expect(anonymous).toContain(":anonymous");
    expect(authenticatedKeys[0]).toContain(":authenticated:id:local");
    expect(authenticatedKeys[1]).toContain(":authenticated:empty");
    expect(authenticatedKeys[2]).toContain(":authenticated:id:empty");
    expect(authenticatedKeys[3]).not.toBe(authenticatedKeys[4]);
  });

  test("malformed or incompatible snapshots initialize cleanly", async () => {
    const initial = createInitialV2GeneralizationSnapshot(walking, NOW);
    expect(
      normalizeV2GeneralizationSnapshot(
        { schemaVersion: 99, lessonId: walking.id },
        walking,
        NOW
      )
    ).toEqual(initial);
    expect(
      normalizeV2GeneralizationSnapshot(
        { ...initial, contentVersion: "accepted-raw-2026-07-20-v1" },
        walking,
        NOW
      )
    ).toEqual(initial);
    expect(
      normalizeV2GeneralizationSnapshot(
        {
          ...initial,
          answers: { ...initial.answers, boundary: "not-an-option" },
        },
        walking,
        NOW
      )
    ).toEqual(initial);
    expect(
      normalizeV2GeneralizationSnapshot(
        {
          ...initial,
          scored: {
            ...initial.scored,
            boundary: {
              firstOptionId: "walking-boundary-target",
              firstCorrect: true,
              attempts: [
                {
                  optionId: "walking-boundary-target",
                  correct: true,
                  attemptedAt: NOW,
                },
              ],
            },
          },
        },
        walking,
        NOW
      )
    ).toEqual(initial);

    await AsyncStorage.setItem(
      getV2GeneralizationStorageKey(
        walking.id,
        "owner-1",
        walking.contentVersion
      ),
      "{bad-json"
    );
    await expect(
      loadV2GeneralizationSnapshot(walking, "owner-1", NOW)
    ).resolves.toEqual(initial);
  });

  test("normalization rejects impossible past, current, and future step states", () => {
    const initial = createInitialV2GeneralizationSnapshot(walking, NOW);
    const evidence = moveToStep(walking, "evidence");
    const validComplete = moveToStep(walking, "complete");

    const futureAnswerDuringEvidence = {
      ...evidence,
      answers: {
        ...evidence.answers,
        update: "walking-update-ideas",
      },
    };
    expect(
      normalizeV2GeneralizationSnapshot(
        futureAnswerDuringEvidence,
        walking,
        NOW
      )
    ).toEqual(initial);

    const missingCaptureAtComplete = {
      ...validComplete,
      answers: {
        ...validComplete.answers,
        prediction: null,
      },
    };
    expect(
      normalizeV2GeneralizationSnapshot(missingCaptureAtComplete, walking, NOW)
    ).toEqual(initial);

    const mismatchedPastAnswer = {
      ...validComplete,
      answers: {
        ...validComplete.answers,
        boundary: "walking-boundary-target",
      },
    };
    expect(
      normalizeV2GeneralizationSnapshot(mismatchedPastAnswer, walking, NOW)
    ).toEqual(initial);

    const interleavingInitial = createInitialV2GeneralizationSnapshot(
      interleaving,
      NOW
    );
    const retrieval = moveToStep(interleaving, "retrieval");
    const correctAttemptWithoutAdvance = {
      ...retrieval,
      currentStep: "boundary" as const,
      answers: {
        ...retrieval.answers,
        retrieval: null,
      },
    };
    expect(
      normalizeV2GeneralizationSnapshot(
        correctAttemptWithoutAdvance,
        interleaving,
        NOW
      )
    ).toEqual(interleavingInitial);
  });

  test("save does not manufacture completion for an invalid complete snapshot", async () => {
    const invalidComplete = {
      ...createInitialV2GeneralizationSnapshot(walking, NOW),
      currentStep: "complete" as const,
    };
    const saved = await saveV2GeneralizationSnapshot(
      walking,
      "owner-1",
      invalidComplete,
      LATER
    );
    expect(saved).toEqual(createInitialV2GeneralizationSnapshot(walking, LATER));
    expect(saved.completedAt).toBeNull();
  });

  test("reset removes one lesson only and preserves AI pilot plus production keys", async () => {
    const aiPilotKey = "psycle:v2-owner-pilot:ai-diversity:v1:owner-1";
    const productionKey = "completed_lessons_owner-1";
    await AsyncStorage.setItem(aiPilotKey, "legacy-ai-pilot");
    await AsyncStorage.setItem(productionKey, "production-progress");

    await saveV2GeneralizationSnapshot(
      walking,
      "owner-1",
      createInitialV2GeneralizationSnapshot(walking, NOW),
      NOW
    );
    await saveV2GeneralizationSnapshot(
      interleaving,
      "owner-1",
      createInitialV2GeneralizationSnapshot(interleaving, NOW),
      NOW
    );

    await resetV2GeneralizationSnapshot(walking, "owner-1");
    expect(
      await AsyncStorage.getItem(
        getV2GeneralizationStorageKey(
          walking.id,
          "owner-1",
          walking.contentVersion
        )
      )
    ).toBeNull();
    expect(
      await AsyncStorage.getItem(
        getV2GeneralizationStorageKey(
          interleaving.id,
          "owner-1",
          interleaving.contentVersion
        )
      )
    ).not.toBeNull();
    expect(await AsyncStorage.getItem(aiPilotKey)).toBe("legacy-ai-pilot");
    expect(await AsyncStorage.getItem(productionKey)).toBe(
      "production-progress"
    );
  });

  test("five- and seven-step snapshots round-trip without filling absent steps", async () => {
    const completed = moveToStep(walking, "complete");
    const saved = await saveV2GeneralizationSnapshot(
      walking,
      "owner-1",
      completed,
      LATER
    );
    expect(saved.contentVersion).toBe(V2_WALKING_CONTENT_VERSION);
    expect(saved.answers.transfer).toBe("walking-transfer-expand-then-decide");
    expect(saved.answers.boundary).toBeNull();
    expect(saved.answers.retrieval).toBeNull();
    expect(saved.scored.boundary.attempts).toEqual([]);
    expect(saved.scored.retrieval.attempts).toEqual([]);
    await expect(
      loadV2GeneralizationSnapshot(walking, "owner-1", LATER)
    ).resolves.toEqual(saved);

    const sevenStepCompleted = moveToStep(interleaving, "complete");
    const sevenStepSaved = await saveV2GeneralizationSnapshot(
      interleaving,
      "owner-1",
      sevenStepCompleted,
      LATER
    );
    expect(sevenStepSaved.answers.boundary).not.toBeNull();
    expect(sevenStepSaved.answers.retrieval).not.toBeNull();
    await expect(
      loadV2GeneralizationSnapshot(interleaving, "owner-1", LATER)
    ).resolves.toEqual(sevenStepSaved);
  });
});
