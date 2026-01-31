import json
import os

DATA_DIR = '/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/data/lessons'
FILES = ['health.json', 'study.json', 'money.json', 'social.json']

def generate_report():
    report = "# Content Source Verification Report\n\n"
    report += "This report lists the academic source for every generated question to ensure scientific validity.\n\n"
    
    for filename in FILES:
        filepath = os.path.join(DATA_DIR, filename)
        if not os.path.exists(filepath):
            continue
            
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        report += f"## {filename} ({len(data)} Questions)\n\n"
        report += "| ID | Question (Stem) | Source ID (Theory/Researcher) |\n"
        report += "| :--- | :--- | :--- |\n"
        
        for item in data:
            q_text = item.get('question', 'N/A')[:50] + "..."
            source = item.get('source_id', 'N/A')
            item_id = item.get('id', 'N/A')
            report += f"| `{item_id}` | {q_text} | **{source}** |\n"
        
        report += "\n"
        
    return report

if __name__ == "__main__":
    report_content = generate_report()
    output_path = '/Users/mashitashinji/.gemini/antigravity/brain/d4a58a6a-6c36-436f-a648-d4d7a2f30638/source_verification_report.md'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(report_content)
    print(f"✅ Report generated at: {output_path}")
