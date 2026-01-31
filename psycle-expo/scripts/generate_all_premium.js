const fs = require('fs');

// Knowledge base for each genre
const GENRE_KNOWLEDGE = {
    health: {
        levels: {
            7: { topic: 'sleep_architecture', source: 'Walker, M. (2017). Why We Sleep.' },
            8: { topic: 'circadian_rhythms', source: 'Roenneberg, T. (2012). Internal Time.' },
            9: { topic: 'gut_brain_axis', source: 'Mayer, E. (2016). The Mind-Gut Connection.' },
            10: { topic: 'hiit_physiology', source: 'Gibala, M. (2017). The One-Minute Workout.' }
        }
    },
    work: {
        levels: {
            7: { topic: 'flow_state', source: 'Csikszentmihalyi, M. (1990). Flow.' },
            8: { topic: 'cognitive_load', source: 'Sweller, J. (1988). Cognitive Load Theory.' },
            9: { topic: 'burnout_prevention', source: 'Maslach, C. (1982). Burnout: The Cost of Caring.' },
            10: { topic: 'deep_work', source: 'Newport, C. (2016). Deep Work.' }
        }
    },
    money: {
        levels: {
            7: { topic: 'behavioral_economics', source: 'Kahneman, D. (2011). Thinking, Fast and Slow.' },
            8: { topic: 'loss_aversion', source: 'Thaler, R. H. (2015). Misbehaving.' },
            9: { topic: 'temporal_discounting', source: 'Ainslie, G. (1975). Specious reward.' },
            10: { topic: 'compounding_psychology', source: 'Housel, M. (2020). The Psychology of Money.' }
        }
    },
    social: {
        levels: {
            7: { topic: 'attachment_theory', source: 'Bowlby, J. (1969). Attachment and Loss.' },
            8: { topic: 'social_baseline', source: 'Coan, J. A., & Sbarra, D. A. (2015). Social Baseline Theory.' },
            9: { topic: 'oxytocin_dynamics', source: 'Uvnäs-Moberg, K. (2003). The Oxytocin Factor.' },
            10: { topic: 'conflict_resolution', source: 'Rosenberg, M. B. (2003). Nonviolent Communication.' }
        }
    },
    study: {
        levels: {
            7: { topic: 'spaced_repetition', source: 'Ebbinghaus, H. (1885). Memory: A Contribution to Experimental Psychology.' },
            8: { topic: 'metacognition', source: 'Dunlosky, J., et al. (2013). Improving Students\' Learning.' },
            9: { topic: 'dual_coding', source: 'Paivio, A. (1971). Imagery and Verbal Processes.' },
            10: { topic: 'interleaved_practice', source: 'Rohrer, D., & Taylor, K. (2007). The shuffling of mathematics problems.' }
        }
    }
};

// Generate questions for a specific genre and level
function generateQuestionsForLevel(genre, level, topic, source) {
    const questions = [];
    const questionTypes = ['swipe_judgment', 'multiple_choice', 'fill_blank', 'sort_order'];

    for (let i = 1; i <= 15; i++) {
        const typeIndex = (i - 1) % 4;
        const type = questionTypes[typeIndex];
        const difficulty = level >= 9 ? 'expert' : 'hard';
        const xp = level >= 9 ? 20 : 15;

        const questionId = `${genre}_l${String(level).padStart(2, '0')}_${topic}_${String(i).padStart(2, '0')}`;

        questions.push({
            id: questionId,
            type: type,
            difficulty: difficulty,
            xp: xp,
            question: `${genre.charAt(0).toUpperCase() + genre.slice(1)} L${level} Question ${i}: ${topic}`,
            source_id: source,
            // Type-specific fields will be added by the actual content generation
            ...(type === 'swipe_judgment' && {
                statement: `Statement about ${topic}`,
                is_true: i % 2 === 0
            }),
            ...(type === 'multiple_choice' && {
                choices: [`Option A for ${topic}`, `Option B for ${topic}`, `Option C for ${topic}`, `Option D for ${topic}`],
                correct_index: 0
            }),
            ...(type === 'fill_blank' && {
                choices: [`Answer A`, `Answer B`, `Answer C`, `Answer D`],
                correct_index: 0
            }),
            ...(type === 'sort_order' && {
                items: [`Step 1 of ${topic}`, `Step 2 of ${topic}`, `Step 3 of ${topic}`, `Step 4 of ${topic}`],
                correct_order: [0, 1, 2, 3]
            }),
            explanation: `Explanation for ${topic} based on ${source}`
        });
    }

    return questions;
}

// Generate all premium content for a genre
function generateGenrePremiumContent(genre) {
    console.log(`\n🎯 Generating premium content for: ${genre.toUpperCase()}`);

    const knowledge = GENRE_KNOWLEDGE[genre];
    if (!knowledge) {
        console.error(`❌ No knowledge base found for genre: ${genre}`);
        return;
    }

    const allQuestions = [];

    // Generate questions for levels 7-10
    for (let level = 7; level <= 10; level++) {
        const levelInfo = knowledge.levels[level];
        console.log(`  📝 Level ${level}: ${levelInfo.topic} (${levelInfo.source})`);

        const questions = generateQuestionsForLevel(genre, level, levelInfo.topic, levelInfo.source);
        allQuestions.push(...questions);
    }

    // Read existing genre JSON
    const genreFilePath = `/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/data/lessons/${genre}.json`;
    let existingData = [];

    try {
        const fileContent = fs.readFileSync(genreFilePath, 'utf8');
        existingData = JSON.parse(fileContent);
        console.log(`  📂 Loaded ${existingData.length} existing questions`);
    } catch (error) {
        console.log(`  📂 No existing file found, creating new one`);
    }

    // Merge and save
    const mergedData = [...existingData, ...allQuestions];
    fs.writeFileSync(genreFilePath, JSON.stringify(mergedData, null, 2), 'utf8');

    console.log(`  ✅ Added ${allQuestions.length} questions (Total: ${mergedData.length})`);

    return allQuestions.length;
}

// Main execution
console.log('🚀 Starting Premium Content Generation for All Genres\n');
console.log('='.repeat(60));

const genres = ['health', 'work', 'money', 'social', 'study'];
let totalGenerated = 0;

for (const genre of genres) {
    const count = generateGenrePremiumContent(genre);
    totalGenerated += count;
}

console.log('\n' + '='.repeat(60));
console.log(`\n✨ COMPLETE! Generated ${totalGenerated} premium questions across ${genres.length} genres`);
console.log(`📊 Total questions per genre: 60 (15 per level × 4 levels)`);
