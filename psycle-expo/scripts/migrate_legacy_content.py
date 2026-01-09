import json
import os

DATA_DIR = '/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/data/lessons'
FILES_TO_MIGRATE = ['money.json', 'social.json']

def migrate_item(item):
    # Check if it's a legacy item (has 'stem' but no 'question')
    if 'stem' in item and 'question' not in item:
        print(f"Migrating ID: {item.get('id', 'unknown')}")
        
        # 1. Map basic fields
        item['question'] = item['stem']
        item['correct_index'] = item.get('answer_index', 0)
        item['type'] = 'multiple_choice' # Default to multiple choice
        
        # 2. Construct Explanation from what/why/how
        explanation_parts = []
        if 'what' in item:
            explanation_parts.append(f"{item['what']}")
        if 'why' in item:
            explanation_parts.append(f"{item['why']}")
        if 'how' in item:
            explanation_parts.append(f"{item['how']}")
        
        item['explanation'] = "\n\n".join(explanation_parts)
        
        # 3. Handle Source ID
        # Legacy content doesn't have source_id, so we use a placeholder or derive it
        item['source_id'] = "legacy_content_v1"
        
        # 4. Remove legacy fields to clean up
        for field in ['stem', 'answer_index', 'what', 'why', 'how', 'real_example', 'action', 'fun_fact', 'tip', 'incorrect_feedback', 'emoji_hint']:
            if field in item:
                del item[field]
                
        return True
    return False

def process_file(filename):
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            print(f"Error decoding JSON: {filepath}")
            return

    migrated_count = 0
    for item in data:
        if migrate_item(item):
            migrated_count += 1

    if migrated_count > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ Migrated {migrated_count} items in {filename}")
    else:
        print(f"No items needed migration in {filename}")

if __name__ == "__main__":
    print("🚀 Starting Legacy Content Migration...")
    for filename in FILES_TO_MIGRATE:
        process_file(filename)
    print("Done.")
