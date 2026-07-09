export function extractJson(text: string): string {
    const first = text.indexOf("[");
    const last = text.lastIndexOf("]");

    if (first === -1 || last === -1) {
        throw new Error(
            "No JSON array found in AI response."
        );
    }

    return text.substring(first, last + 1);
}