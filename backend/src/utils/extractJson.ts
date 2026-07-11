function stripComments(text: string): string {
    return text
        .split("\n")
        .filter(line => {
            const trimmed = line.trim();
            return !trimmed.startsWith("#") && !trimmed.startsWith("//");
        })
        .join("\n");
}

export function repairJson(jsonStr: string): string {
    let cleaned = jsonStr.trim();
    
    // 1. Strip markdown code fences if present (e.g. ```json ... ```)
    if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
    }
    cleaned = cleaned.trim();

    // 2. Replace single quotes around keys and values with double quotes,
    // avoiding replacing apostrophes inside text.
    cleaned = cleaned.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'\s*:/g, '"$1":'); // keys
    cleaned = cleaned.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ':"$1"'); // values
    cleaned = cleaned.replace(/,\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ',"$1"'); // array item / comma delimiter
    cleaned = cleaned.replace(/\[\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, '["$1"'); // start of array
    cleaned = cleaned.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'\s*\]/g, '"$1"]'); // end of array
    cleaned = cleaned.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'\s*,/g, '"$1",'); // value before comma

    // 3. Fix unquoted keys, e.g. { name: "value" } -> { "name": "value" }
    // Handles {key: or ,key:
    cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

    // 4. Remove trailing commas before closing braces/brackets
    cleaned = cleaned.replace(/,\s*}/g, '}');
    cleaned = cleaned.replace(/,\s*\]/g, ']');

    return cleaned;
}

export function extractJson(text: string): string {
    const cleanedText = stripComments(text);
    const firstBrace = cleanedText.indexOf("{");
    const lastBrace = cleanedText.lastIndexOf("}");
    const firstBracket = cleanedText.indexOf("[");
    const lastBracket = cleanedText.lastIndexOf("]");

    let result = cleanedText;

    if (firstBracket !== -1 && lastBracket !== -1) {
        if (firstBrace === -1 || firstBracket < firstBrace) {
            result = cleanedText.substring(firstBracket, lastBracket + 1);
        } else if (firstBrace !== -1 && lastBrace !== -1) {
            result = cleanedText.substring(firstBrace, lastBrace + 1);
        }
    } else if (firstBrace !== -1 && lastBrace !== -1) {
        result = cleanedText.substring(firstBrace, lastBrace + 1);
    } else {
        throw new Error(
            "No JSON array found in AI response."
        );
    }

    return repairJson(result);
}