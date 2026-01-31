
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCES_PATH = "psycle-expo/data/sources.json";

const CANONICAL_SOURCES = [
    {
        "id": "book:deep_work",
        "type": "Book",
        "title": "Deep Work: Rules for Focused Success in a Distracted World",
        "authors": ["Cal Newport"],
        "year": 2016,
        "venue": "Grand Central Publishing",
        "url": "https://www.calnewport.com/books/deep-work/",
        "abstract": "Deep work is the ability to focus without distraction on a cognitively demanding task. It's a skill that allows you to quickly master complicated information and produce better results in less time.",
        "tags": ["Productivity", "Focus", "Work"]
    },
    {
        "id": "book:pomodoro",
        "type": "Book",
        "title": "The Pomodoro Technique",
        "authors": ["Francesco Cirillo"],
        "year": 2006,
        "venue": "Cirillo Company",
        "url": "https://francescocirillo.com/products/the-pomodoro-technique",
        "abstract": "The Pomodoro Technique is a time management method that uses a timer to break work into intervals, traditionally 25 minutes in length, separated by short breaks.",
        "tags": ["Time Management", "Productivity"]
    },
    {
        "id": "book:checklist",
        "type": "Book",
        "title": "The Checklist Manifesto: How to Get Things Right",
        "authors": ["Atul Gawande"],
        "year": 2009,
        "venue": "Metropolitan Books",
        "url": "http://atulgawande.com/book/the-checklist-manifesto/",
        "abstract": "The checklist is a simple tool to address the complexity of modern professional practice, reducing errors and improving outcomes.",
        "tags": ["Safety", "Management", "Quality"]
    },
    {
        "id": "book:remote",
        "type": "Book",
        "title": "Remote: Office Not Required",
        "authors": ["Jason Fried", "David Heinemeier Hansson"],
        "year": 2013,
        "venue": "Crown Business",
        "url": "https://basecamp.com/books/remote",
        "abstract": "Remote work increases productivity and happiness by allowing people to work where they are most effective, emphasizing asynchronous communication.",
        "tags": ["Remote Work", "Communication"]
    },
    {
        "id": "book:kanban",
        "type": "Book",
        "title": "Kanban: Successful Evolutionary Change for Your Technology Business",
        "authors": ["David J. Anderson"],
        "year": 2010,
        "venue": "Blue Hole Press",
        "url": "https://www.amazon.com/Kanban-Successful-Evolutionary-Technology-Business/dp/0984521402",
        "abstract": "Kanban is a method for managing knowledge work with an emphasis on just-in-time delivery while not overloading the team members (WIP limits).",
        "tags": ["Agile", "Management"]
    },
    {
        "id": "book:smart",
        "type": "Article",
        "title": "There's a S.M.A.R.T. way to write management's goals and objectives",
        "authors": ["George T. Doran"],
        "year": 1981,
        "venue": "Management Review",
        "url": "",
        "abstract": "Goals should be Specific, Measurable, Assignable, Realistic, and Time-related.",
        "tags": ["Management", "Goal Setting"]
    },
    {
        "id": "book:seci",
        "type": "Book",
        "title": "The Knowledge-Creating Company",
        "authors": ["Ikujiro Nonaka", "Hirotaka Takeuchi"],
        "year": 1995,
        "venue": "Oxford University Press",
        "url": "https://global.oup.com/academic/product/the-knowledge-creating-company-9780195092691",
        "abstract": "The SECI model (Socialization, Externalization, Combination, Internalization) describes how tacit knowledge is converted into explicit knowledge and back.",
        "tags": ["Knowledge Management", "Innovation"]
    },
    {
        "id": "book:sre",
        "type": "Book",
        "title": "Site Reliability Engineering: How Google Runs Production Systems",
        "authors": ["Betsy Beyer", "Chris Jones", "Jennifer Petoff", "Niall Richard Murphy"],
        "year": 2016,
        "venue": "O'Reilly Media",
        "url": "https://sre.google/books/",
        "abstract": "Blameless post-mortems are essential for learning from failure without fear of punishment, focusing on process improvement rather than individual blame.",
        "tags": ["Engineering", "Management", "Culture"]
    },
    {
        "id": "book:ia",
        "type": "Book",
        "title": "Information Architecture for the World Wide Web",
        "authors": ["Louis Rosenfeld", "Peter Morville"],
        "year": 1998,
        "venue": "O'Reilly Media",
        "url": "https://shop.oreilly.com/product/9780596527341.do",
        "abstract": "Information architecture is the art and science of organizing and labeling websites, intranets, online communities and software to support usability and findability.",
        "tags": ["Design", "UX"]
    },
    {
        "id": "book:mythical",
        "type": "Book",
        "title": "The Mythical Man-Month",
        "authors": ["Frederick P. Brooks Jr."],
        "year": 1975,
        "venue": "Addison-Wesley",
        "url": "https://en.wikipedia.org/wiki/The_Mythical_Man-Month",
        "abstract": "Adding manpower to a late software project makes it later. Discusses communication overhead and the 'Bus Factor' concept.",
        "tags": ["Software Engineering", "Management"]
    }
];

async function main() {
    const sourcesPath = path.resolve(process.cwd(), SOURCES_PATH);
    console.log(`📖 Reading sources from ${sourcesPath}...`);

    try {
        const raw = await readFile(sourcesPath, "utf8");
        const sources = JSON.parse(raw);

        let addedCount = 0;
        for (const newSource of CANONICAL_SOURCES) {
            if (!sources.find(s => s.id === newSource.id)) {
                sources.push(newSource);
                addedCount++;
                console.log(`   ➕ Added: ${newSource.title}`);
            } else {
                console.log(`   ⚠️ Skipped (Exists): ${newSource.title}`);
            }
        }

        if (addedCount > 0) {
            await writeFile(sourcesPath, JSON.stringify(sources, null, 2));
            console.log(`✅ Successfully added ${addedCount} new sources.`);
        } else {
            console.log("✨ No new sources to add.");
        }

    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
    }
}

main();
