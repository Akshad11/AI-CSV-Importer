export class CsvGenerator {
    /**
     * Generates a CSV data string dynamically based on row count and type.
     */
    public static generate(rowsCount: number, type: "valid" | "duplicate" | "unicode" = "valid"): string {
        const headers = ["first_name", "last_name", "email", "company"];
        const lines: string[] = [headers.join(",")];

        for (let i = 0; i < rowsCount; i++) {
            let row = ["John", `Doe-${i}`, `john.doe.${i}@example.com`, "Acme Corp"];
            if (type === "unicode") {
                row = ["André", `Döe-${i}`, `andre.${i}@ëxample.com`, "Acmé Corp"];
            } else if (type === "duplicate" && i > 0) {
                row = ["John", "Doe-0", "john.doe.0@example.com", "Acme Corp"];
            }
            lines.push(row.join(","));
        }

        return lines.join("\n");
    }
}
