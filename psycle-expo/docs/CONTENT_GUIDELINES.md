# Psycle Content Design System (Ver 2.0)

These guidelines standardize the "Duolingo Quality" & "High Trust" refinements established in the Social Unit pilot.

## 1. The Trust Architecture (3-Layer Mode)
Scientific evidence must be handled carefully to avoid "preaching" or "fake authority".

*   **Layer 1: The Lesson (Experience)**
    *   **Rule**: NO citations in question flow.
    *   **Rule**: Use soft phrases like "Research suggests..." (`実は…`, `研究では…`) instead of "Psychologically..." (`心理学的には…`).
*   **Layer 2: The Breakdown (Context & Judgment)**
    *   **Place**: Unit Completion Screen only.
    *   **Rule**: **Disclaimer First** (`※一般的な傾向であり…`) at the very top.
    *   **Rule**: **Context Note must include Time Axis & Scope**.
        *   ❌ "This is a standard theory."
        *   ⭕ "Born in clinics, **used for decades without denial**. A **safe basic skill**, not a quick cure."
        *   **Key Elements**:
            1.  **Time/Survivorship**: "How long has it lasted?"
            2.  **Scope**: "What does it do?" (e.g. Understanding)
            3.  **Limit**: "What does it NOT do?" (e.g. Not a standalone cure)
*   **Layer 3: The Library (Detail)**
    *   (Future) Deep dive links for Pro users.

## 2. Pacing & Tone (Duolingo Standard)
*   **Lesson Volume**: Strictly **10 questions** per lesson.
*   **Success Granularity (One Day Rule)**:
    *   **Rule**: Success states must be limited to "**Usable once tomorrow**".
    *   ❌ "Life changing", "Cures depression", "Drastically improves relationships"
    *   ⭕ "Less guilt", "Smoother conversation", "Less regret after refusing"
*   **"Correct" Redefinition (Context-Dependent Rules)**:
    *   **Phase 3 (Knowledge/Why)**:
        *   **Rule**: Explicit Correct/Incorrect is allowed.
    *   **Phase 4 (Action/How)** & **Ethics/Relationships**:
        *   **STRICT RULE**: **NO absolute "Correct" UI allowed.**
        *   **Banned**: "Correct!", "Wrong!", Red/Green judgment colors, Maru/Batsu (○/×).
        *   **Required**: "Better Choice", "Recommended", "This reduces friction".
    *   **Goal**: Distinguish between *Cognitive Alignment* (Logic) and *Behavioral Simulation* (Real World).

## 3. Actionable Advice Strategy
*   **Frequency Cap**: **Max 40%** (3-4 questions per 10-question lesson).
*   **Placement**:
    *   ✅ **Heavy Questions**: Core insights, major mindset shifts.
    *   ❌ **Light Questions**: Quick reflexes, surveys, simple knowledge checks. (Remove advice here).
*   **Granularity**: Keep actions "Light" (Mental checks, 30s tasks) rather than "Full" (Homework).

## 4. Question Design Principles (The Psycle Standard)

We use a **"Semi-Fixed Rotation"** model: Fixed Sequence x Flexible Roles.

### **The 5-Phase Structure (The Backbone)**
*Note: A single lesson does not need all 5 phases. typically choose 3-5 phases based on the goal (e.g., Warm-up, Gap, Success).*

| Phase | Goal (Role) | Recommended Types (Choose 1) |
| :--- | :--- | :--- |
| **1. Warm-up** | **Intuition**. Open the brain with low friction. | `select_all`, `swipe_judgment` |
| **2. Gap** | **Awareness**. "Oh, I do this!" (Realization). | `swipe_judgment`, `sort_order`, `quick_reflex` |
| **3. Why** | **Understanding**. Deepen logic & mechanism. | `matching`, `fill_blank`, `fill_blank_tap` |
| **4. How** | **Practice**. Simulation. **(Mandatory Phase)** | `conversation`, `consequence_scenario`, `interactive_practice` |
| **5. Wrap-up** | **Success**. End on a high, confident note. | `select_all`, `term_card`, `true_false` |

### **Rules**
*   **Sequence**: Must always follow Phase 1 → 5 flow. No backtracking.
*   **Diversity**: Do not use the same Question Type twice in a row.
*   **Action First**: Phase 4 (How) is the core of Psycle. Do not omit it.
*   **Load Balancing**: Avoid stacking logic-heavy types (Phase 3) consecutively. Mix in lighter types.

## 5. UI & Feedback Rules (Implementation Details)
*   **Survey Mode**:
    *   **Definition**: `select_all` question without `correct_answers`.
    *   **Rule**: NEVER show Correct/Incorrect feedback (⭕️/❌). Use neutral result screen.
    *   **Rule**: Must display an explicit "Confirm" button (Submit).
*   **Soft Feedback System**:
    *   **Tone**: Empathetic Navigation, not Judgment.
    *   **Messages**: Randomize phrases like "Interesting choice", "Common pitfall", "Spot on".
    *   **Visual**: Avoid harsh red colors for "incorrect" where possible.
*   **Sensory Feedback**:
    *   **Haptics**: Required on EVERY answer selection (`success` or `error` pattern).
    *   **Sound**: Subtle positive/negative chimes (Standard: Clang/Beep).
*   **Combo System**:
    *   **Goal**: Maintain cognitive rhythm.
    *   **Rule**: Display combo counter on consecutive correct answers. Hide after 2s.

## 6. Evidence Display (Layer 2)
### **Strict Rules for Evidence Templates**
You MUST use these exact templates based on the Grade. Do not improvise.

#### **🥇 Meta-Analyses (Gold)**
> 複数の研究結果をまとめた分析で、
> 一貫した傾向が確認されています。
>
> 個人差はありますが、
> 現時点で最も信頼度が高い知見です。

#### **🥈 Standard Theory (Silver)**
*Most used category. Default choice.*
> この知見は、
> ・最初は実践や臨床の現場で使われ
> ・その後、同様の効果が何度も確認され
> ・今も心理支援の現場で使われています。
>
> 万能ではありませんが、
> 「安全に使える基本スキル」として信頼されています。

#### **🥉 Emerging/Hypothesis (Bronze)**
> まだ研究数は多くありませんが、
> 同様の結果が報告されています。
>
> 確定ではありませんが、
> 参考として知っておく価値があります。

### **Presentation**
*   **Rule**: Keep badges subtle (small, grey/white). Do not make them look like "Power-ups".
*   **Tap Action**: Show detailed context in a modal/alert, not inline.

## 7. Multimedia Guidelines
*   **Purpose**: Use media only when it enhances understanding or immersion (not just for decoration).
*   **Images**:
    *   **Usage**: Recommended for `sort_order` (process visualization) and `matching` (concept visualization).
    *   **Accessibility**: ALWAYS provide `imageCaption` for screen readers.
*   **Audio**:
    *   **Usage**: Optional for immersion (e.g., situational sounds in scenarios).
    *   **Rule**: Must not be required to answer the question (support silent mode).

## 8. Localization Strategy
*   **Base Language**: Japanese (`ja`). Create content in Japanese first using `.ja.json`.
*   **Structure**:
    *   `questions`: Array of Question objects.
    *   **Keys**: Use English keys for IDs (`mental_l01_q01`) but Japanese text for content.
    *   **Translation**: Future expansion will map these to `en`, `pt`, etc. via `i18n` files.

## 9. Deprecated Features (Do Not Use)
*   **Animated Explanation**: Removed due to redundancy. Use standard `explanation` text or `consequence_scenario` instead.
*   **Commitment Question**: Removed to reduce friction. Use `actionable_advice` for behavioral nudges.
*   **Swipe Choice**: Merged into `swipe_judgment`. Use `swipe_judgment` for all left/right decisions.

## 10. Source Collection Standards (The Input)
**The Hybrid Lane Strategy**:
*   **Lane 1: Automated Patrol (Discovery)**
    *   **Process**: AI daily scans aggregators (ScienceDaily) -> Filters for relevance -> Extracts Seeds.
    *   **Role**: Maximizing quantity and freshness.
*   **Lane 2: Strategic Selection (Verification)**
    *   **Process**: Human selects specific Classic/Gold topics -> Manual verification against Primary Sources.
    *   **Role**: Ensuring "Psycle Quality" and branding.

*   **Authorized Sources (The Psycle Standard)**:
    1.  **Meta-Analyses / Systematic Reviews** (Highest Priority)
        *   *Cochrane Library, PubMed (Filter: Review)*
    2.  **Trusted Academic Aggregators** (For Discovery)
        *   *The Decision Lab, ScienceDaily (Psychology/Neuroscience)*
    3.  **High-Impact Journals (Primary Sources)** (For Verification)
        *   *Nature Human Behaviour, Psychological Science, JPSP (Journal of Personality and Social Psychology)*
    4.  **Classical Studies**
        *   Must be replicated. Check "Replication Crisis" status.

*   **Exclusion Criteria**:
    *   ❌ Single studies with small sample sizes (<100).
    *   ❌ Studies with major failed replications (e.g., Power Posing).
    *   ❌ Non-peer-reviewed pop-psychology books.
    *   Always verify if the finding is still considered valid in the 2020s. Consistently check for "Replication Crisis" flags.

## 11. Automated Quality Control & AI Infrastructure
*   **AI Model Policy**:
    *   **Generator (`generator.ts`)**: Uses **Gemini 3.0 Flash** for maximum creative quality.
    *   **Critic & Extractor**: Uses **Gemini 2.5 Flash** for high-speed processing and auditing.

*   **Critic System (`critic.ts`)**:
    *   **Rule-Based Audit AI**: Evaluates generated questions (using **Gemini 2.5 Flash**) on **Strict Rule Violations** (Yes/No).
    *   **Violation Checks (Fail Condition)**:
        *   **Scientific Integrity**: Does it claim "Absolute Truth"? Does it contradict the source?
        *   **UX Standards**: Does Phase 4 use "Correct/Incorrect" UI? (Must be "Better Choice").
        *   **Success Granularity**: Is the promise too big? (Must be "Usable tomorrow").
        *   **Evidence Template**: Does it deviate from the Gold/Silver/Bronze fixed text?
    *   **Result**: Any single violation = **NEEDS_REVIEW**.
*   **Pipeline**: `Discovery (Source) -> Generation (Draft) -> Critic (Audit) -> Human Approval`.

## 12. Psycle Progression Principles (Ver 1.0)
*Determines how users move through the app.*

### 0. Core Philosophy (The Premise)
Psycle is **NOT** an app for "learning psychology".
Psycle is **an experience engine to reduce life's judgment errors, one by one.**

*   **Goal**: Not to systematize knowledge, but to update behavior and judgment.

### 1. Progression Unit Principles (Lesson-Based)
*   **Rule 1-1: Daily Unit = 1 Lesson**
    *   Users do **1 lesson (10 questions / 2-3 mins)** per day.
    *   Continuity is secured by "Dates", not "Learning Stages".
    *   👉 **Strict adherence to Duolingo-style "Daily Bite".**
*   **Rule 1-2: 1 Lesson = 1 Life Scene**
    *   Each lesson must address **a single sticking point in life**.
    *   **Abstract themes are BANNED.**
        *   ❌ "The Principle of Reciprocity"
        *   ❌ "The Science of Sleep"
        *   ✅ "Drinking parties you can't refuse"
        *   ✅ "The moment you can't stop using your smartphone at night"

### 2. Theme Design Principles (Life-Scene First)
*   **Rule 2-1: Genres are "Shelves", not "Curriculum"**
    *   Social / Mental / Money / Health / Work / Study are for classification.
    *   Users **DO NOT** have to proceed in genre order.
    *   👉 **Progression order is NOT fixed.**
*   **Rule 2-2: Themes are built from "Wavering Moments"**
    *   All lessons must be reducible to this form:
    *   **"The moment I do △△ even though I know I shouldn't do ◯◯."**
        *   **Social**: Can't refuse.
        *   **Mental**: Blaming myself.
        *   **Health**: Doing it even though I want to quit.
        *   **Money**: Spending even though I don't want to.
        *   **Work**: Can't say it.
        *   **Study**: Can't get started.

### 3. Psychology Principle (Seed) Usage
*   **Rule 3-1: One Lesson ≠ One Principle**
    *   Lessons are **Experience-based**, not Principle-based.
    *   Multiple principles may be mixed in one lesson.
    *   👉 **Principles are backend design resources, not learning units.**
*   **Rule 3-2: Reuse Seeds Infinitely**
    *   The same Seed (e.g., Loss Aversion) may appear in:
        *   Money
        *   Health
        *   Social
    *   👉 **Internalization through repetition is the goal.**

### 4. Level Design Principles (No Explicit Leveling)
*   **Rule 4-1: NO Explicit Level Progression**
    *   "Lv1 → Lv2 → Lv3" sequential learning is **BANNED**.
    *   Difficulty increases should happen **as a result**.
*   **Rule 4-2: Levels exist only as "Trailing Indicators"**
    *   Internally, you may track:
        *   Number of principles covered.
        *   Number of practice simulations.
    *   **NEVER** show this to the user as an "Academic Level".
    *   👉 **"Sense of Growth" must be secured through UI/Streaks, not Levels.**

### 5. Internal Lesson Flow (Fixed)
*   **Rule 5-1: All lessons follow the 5-Phase Structure**
    1.  **Warm-up**: Intuition/Voting (No correct answer).
    2.  **Gap**: Surprise/Gap.
    3.  **Why**: Reason/Mechanism.
    4.  **How**: Practice Simulation (**Mandatory**).
    5.  **Wrap-up**: End with success.
    *   👉 **Structure does not change across genres.**

### 6. Sustainability Principles (Why this doesn't run out)
*   **Rule 6-1: Content = Seed × Context**
    *   **seeds (Principles)**: Finite (~100).
    *   **Contexts (Life Scenes)**: Infinite.
    *   👉 **Do not consume Seeds. Spin them as the core.**
*   **Rule 6-2: Stacking "Life", not "System"**
    *   Today's lesson does not need to relate to yesterday's.
    *   What accumulates is not knowledge, but **Judgment Patterns**.

### 7. Consistency with Vision (dLab × Duolingo)
*   **Rule 7-1: dLab-like "Depth" is Backend**
    *   Front: Life talk.
    *   Back: Principles, Research, Audit.
*   **Rule 7-2: Duolingo-like "Lightness" is Experience-only**
    *   Do not create a "Learning" or "Lecture" feel.
    *   Create a "Done!" feeling in 2-3 minutes.

### Final Principle
**Psycle proceeds to "Give users an experience that makes one life judgment slightly better every day."**
**The system will form itself later.**

---

## Engine-Agnostic Principle (Structural Guarantee)

> **Whether the generation engine is human (Antigravity) or API, the output must satisfy the same JSON contract and pass Critic audit before distribution.**

This ensures seamless migration between manual and automated generation without breaking content quality or user experience.

